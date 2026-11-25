import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };
import './support/next-resolution.mjs';

const landing = join(import.meta.dirname, '../apps/landing');

const { routing } = await import(join(landing, 'src/i18n/routing.ts'));
const { localesFor, localesWith } = await import(join(landing, 'src/i18n/coverage.ts'));
const { alternates } = await import(join(landing, 'src/i18n/alternates.ts'));
const { getPathname } = await import(join(landing, 'src/i18n/navigation.ts'));
const { createNavigation } = await import('next-intl/navigation');
const { default: createMiddleware } = await import('next-intl/middleware');
const { default: proxy } = await import(join(landing, 'src/proxy.ts'));
const { NextRequest } = await import('next/server');

// A translated slug: the internal pathname /about-opta is /conoce-opta in Spanish
const translatedPathnames = { ...routing.pathnames, '/about-opta': { es: '/conoce-opta', en: '/about-opta' } };
const translated = createNavigation({ ...routing, pathnames: translatedPathnames });

test('a namespace exists in the locales whose messages have it', () => {
  assert.deepEqual(localesWith('Prelaunch', { es, en: { Prelaunch: es.Prelaunch } }), ['es', 'en']);
  assert.deepEqual(localesWith('Prelaunch', { es, en: {} }), ['es']);
});

test('every route exists in both locales', () => {
  for (const href of Object.keys(routing.pathnames)) assert.deepEqual(localesFor(href), ['es', 'en']);
});

test('every route has its namespace in Spanish, the source of the types', () => {
  for (const href of Object.keys(routing.pathnames)) assert.ok(localesFor(href).includes('es'), `${href} has no Spanish namespace`);
});

test('alternates list the covered locales and x-default, the page in the default locale', () => {
  // Not the unprefixed path of next-intl's own links: / serves the Spanish home with /es as its canonical, so it cannot be the x-default
  assert.deepEqual(alternates('/', ['es', 'en']).languages, { es: '/es', en: '/en', 'x-default': '/es' });
  // Off home, x-default is the default locale's translated pathname with its prefix
  assert.deepEqual(alternates('/about-opta', ['es', 'en'], translated.getPathname).languages, { es: '/es/conoce-opta', en: '/en/about-opta', 'x-default': '/es/conoce-opta' });
});

test('the home lists both locales and x-default', () => {
  assert.deepEqual(alternates('/').languages, { es: '/es', en: '/en', 'x-default': '/es' });
});

test('a single-locale page lists only its locale, with no x-default', () => {
  assert.deepEqual(alternates('/about-opta', ['es'], translated.getPathname), { languages: { es: '/es/conoce-opta' } });
});

const visit = (path, headers = {}) => proxy(new NextRequest(new URL(path, 'http://localhost'), { headers }));
const rewriteOf = (response) => {
  const target = response.headers.get('x-middleware-rewrite');
  return target && `${new URL(target).pathname}${new URL(target).search}`;
};
const english = { 'accept-language': 'en-US,en;q=0.9' };

test('the bare domain answers 200 with the Spanish home, for any browser that does not negotiate English', () => {
  for (const headers of [{}, { 'accept-language': 'es-CO,es;q=0.9' }, { 'accept-language': 'fr-FR' }, { 'user-agent': 'WhatsApp/2.23.20.0' }]) {
    const response = visit('/', headers);
    assert.equal(response.status, 200, JSON.stringify(headers));
    assert.equal(response.headers.get('location'), null);
    assert.equal(rewriteOf(response), '/es');
  }
  assert.equal(rewriteOf(visit('/?utm_source=whatsapp')), '/es?utm_source=whatsapp');
});

test('an English browser at the bare domain still gets the 307 to /en, so / never serves English', () => {
  for (const response of [visit('/', english), visit('/', { 'accept-language': 'es-CO', cookie: 'NEXT_LOCALE=en' })]) {
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location')).pathname, '/en');
    assert.equal(rewriteOf(response), null);
  }
});

test('every other path gets exactly what next-intl answers', () => {
  const handleI18nRouting = createMiddleware(routing);
  const request = (path, headers) => new NextRequest(new URL(path, 'http://localhost'), { headers });
  for (const path of ['/es', '/en', '/privacidad', '/privacy', '/es/privacidad', '/en/privacy', '/fr/anything', '/es/confirmado']) {
    for (const headers of [{}, english]) {
      const ours = proxy(request(path, headers));
      const theirs = handleI18nRouting(request(path, headers));
      assert.equal(ours.status, theirs.status, path);
      assert.deepEqual([...ours.headers], [...theirs.headers], path);
    }
  }
});

// The confirm page's address carries the signed token. The proxy sets the policy because it sees the address the browser asked for: on Netlify,
// next.config headers are matched after next-intl's rewrite, so a rule for /es/confirmar never applied
test('only the confirm pages answer with Referrer-Policy: no-referrer', () => {
  for (const locale of routing.locales) {
    const path = `/${locale}${routing.pathnames['/confirm'][locale]}?t=x`;
    assert.equal(visit(path).headers.get('referrer-policy'), 'no-referrer', path);
  }
  // A policy for the whole site would drop the Referer the waitlist reads utm_source from
  for (const path of ['/', '/es', '/en', '/es?utm_source=instagram', '/es/confirmado', '/en/confirmed', '/es/baja', '/es/privacidad']) {
    assert.equal(visit(path).headers.get('referrer-policy'), null, path);
  }
});

const unmirroredMarkers = (source, target, path = '') =>
  Object.entries(source).flatMap(([key, value]) =>
    typeof value === 'object'
      ? unmirroredMarkers(value, target?.[key], `${path}${key}.`)
      : value.includes('[PENDIENTE') && !String(target?.[key]).includes('[PENDIENTE')
        ? [`${path}${key}`]
        : [],
  );

test('English messages mirror every Spanish [PENDIENTE] marker', () => {
  assert.deepEqual(unmirroredMarkers(es, en), []);
  // The walk is real: it reports a marker the English string dropped or a key English lacks
  assert.deepEqual(unmirroredMarkers({ A: { b: 'x [PENDIENTE: y]', c: 'z [PENDIENTE]', d: 'ok' } }, { A: { b: 'x', c: 'z [PENDIENTE]' } }), ['A.b']);
  assert.deepEqual(unmirroredMarkers({ A: { b: '[PENDIENTE]' } }, {}), ['A.b']);
});

test('every Spanish namespace exists in English', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort());
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

test('the confirmation link keeps its token in the query of the localized /confirm path', () => {
  // server.ts builds the email's link this way; a dropped query would send every subscriber a dead link
  assert.equal(getPathname({ locale: 'es', href: { pathname: '/confirm', query: { t: 'AQ_-x9' } } }), '/es/confirmar?t=AQ_-x9');
});
