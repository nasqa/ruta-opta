import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const landing = join(import.meta.dirname, '../apps/landing');

// The app's TypeScript is resolved by Next's bundler: imports without extensions, JSON without import attributes, and
// next/* subpaths without an exports map. These hooks give plain Node the same resolution, so the tests run the real modules.
registerHooks({
  resolve: (specifier, context, nextResolve) => {
    if (/^next\/[\w-]+$/.test(specifier)) return nextResolve(`${specifier}.js`, context);
    if (specifier.endsWith('.json')) return { ...nextResolve(specifier, context), importAttributes: { type: 'json' } };
    const extensionless = /^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier);
    const resolved = nextResolve(extensionless && context.parentURL?.endsWith('.ts') ? `${specifier}.ts` : specifier, context);
    // apps/landing/package.json declares no "type", so name the format instead of letting Node guess and warn
    return resolved.url.endsWith('.ts') ? { ...resolved, format: 'module-typescript' } : resolved;
  },
});

const { routing } = await import(join(landing, 'src/i18n/routing.ts'));
const { localesFor, localesWith } = await import(join(landing, 'src/i18n/coverage.ts'));
const { alternates } = await import(join(landing, 'src/i18n/alternates.ts'));
const { getPathname } = await import(join(landing, 'src/i18n/navigation.ts'));
const { createNavigation } = await import('next-intl/navigation');
const { default: createMiddleware } = await import('next-intl/middleware');
const { NextRequest } = await import('next/server');

// A translated slug: the internal pathname /about-opta is /conoce-opta in Spanish
const translatedPathnames = { ...routing.pathnames, '/about-opta': { es: '/conoce-opta', en: '/about-opta' } };
const translated = createNavigation({ ...routing, pathnames: translatedPathnames });

// The hreflang links next-intl's proxy emits itself when alternateLinks is on (the app turns them off in favor of metadata)
const proxyLinks = (pathnames, path) => {
  const proxy = createMiddleware({ ...routing, pathnames, alternateLinks: true });
  const link = proxy(new NextRequest(new URL(path, 'http://localhost'))).headers.get('link');
  return Object.fromEntries([...link.matchAll(/<([^>]+)>; rel="alternate"; hreflang="([^"]+)"/g)].map(([, url, hreflang]) => [hreflang, new URL(url).pathname]));
};

test('a namespace exists in the locales whose messages have it', () => {
  // The pre-launch pages are Spanish-only, so English has none of their namespaces
  assert.deepEqual(localesWith('Prelaunch'), ['es']);
  assert.ok(!('Prelaunch' in en));
  assert.deepEqual(localesWith('Prelaunch', { es, en: { Prelaunch: es.Prelaunch } }), ['es', 'en']);
});

test('every route has its namespace in Spanish, the source of the types', () => {
  for (const href of Object.keys(routing.pathnames)) assert.ok(localesFor(href).includes('es'), `${href} has no Spanish namespace`);
});

test('alternates list the covered locales and x-default, the unprefixed path where the proxy negotiates the locale', () => {
  // A page that exists in both locales, here the home as if it were translated
  const home = alternates('/', ['es', 'en']).languages;
  assert.deepEqual(home, { es: '/es', en: '/en', 'x-default': '/' });
  assert.deepEqual(home, proxyLinks(routing.pathnames, '/es'));
  // Off home, x-default is the default locale's translated pathname without its prefix, as in the proxy's own links
  const aboutOpta = alternates('/about-opta', ['es', 'en'], translated.getPathname).languages;
  assert.deepEqual(aboutOpta, { es: '/es/conoce-opta', en: '/en/about-opta', 'x-default': '/conoce-opta' });
  assert.deepEqual(aboutOpta, proxyLinks(translatedPathnames, '/es/conoce-opta'));
});

test('the pre-launch home lists only Spanish, with no x-default', () => {
  assert.deepEqual(alternates('/').languages, { es: '/es' });
});

test('a Spanish-only page lists only Spanish, with no x-default', () => {
  // The proxy would send an English browser from the unprefixed path to /en/..., which is a 404 for this page
  assert.deepEqual(alternates('/about-opta', ['es'], translated.getPathname), { languages: { es: '/es/conoce-opta' } });
});

test('Lighthouse budgets every route in each locale that has it', async () => {
  const { url: urls } = JSON.parse(await readFile(join(landing, 'lighthouserc.json'), 'utf8')).ci.collect;
  const origin = new URL(urls[0]).origin;
  for (const href of Object.keys(routing.pathnames)) {
    for (const locale of localesFor(href)) {
      const url = new URL(getPathname({ locale, href }), origin).href;
      assert.ok(urls.includes(url), `lighthouserc.json collect.url is missing ${url}: add it so the JS budget covers the route`);
    }
  }
});
