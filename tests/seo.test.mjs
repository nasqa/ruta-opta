import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

// env.ts imports server-only, which throws outside a server bundle
registerHooks({ resolve: (specifier, context, nextResolve) => (specifier === 'server-only' ? { url: 'data:text/javascript,', shortCircuit: true } : nextResolve(specifier, context)) });
process.env.SITE_URL = 'https://www.example.org';

const landing = join(import.meta.dirname, '../apps/landing/src');
const { routing } = await import(join(landing, 'i18n/routing.ts'));
const { alternates } = await import(join(landing, 'i18n/alternates.ts'));
const { indexable, noindex } = await import(join(landing, 'i18n/indexing.ts'));
const { default: sitemap } = await import(join(landing, 'app/sitemap.ts'));
const { default: robots } = await import(join(landing, 'app/robots.ts'));

const origin = 'https://www.example.org';
const absolute = (path) => `${origin}${path}`;

test('every route is classified as indexable or noindex, once', () => {
  assert.deepEqual([...indexable, ...noindex].sort(), Object.keys(routing.pathnames).sort());
});

test('the sitemap lists exactly the four localized URLs, absolute', () => {
  assert.deepEqual(sitemap().map(({ url }) => url), [absolute('/es'), absolute('/en'), absolute('/es/privacidad'), absolute('/en/privacy')]);
});

test('each entry carries the absolute form of the pages own hreflang set', () => {
  for (const { url, alternates: { languages } } of sitemap()) {
    const href = url.endsWith('/es') || url.endsWith('/en') ? '/' : '/privacy';
    assert.deepEqual(languages, Object.fromEntries(Object.entries(alternates(href).languages).map(([language, path]) => [language, absolute(path)])));
    assert.deepEqual(Object.keys(languages), ['es', 'en', 'x-default']);
  }
  assert.equal(sitemap()[0].alternates.languages['x-default'], absolute('/'));
});

test('entries have no lastModified, changeFrequency or priority', () => {
  for (const entry of sitemap()) assert.deepEqual(Object.keys(entry).sort(), ['alternates', 'url']);
});

test('no noindex page appears, in any locale', () => {
  const listed = JSON.stringify(sitemap());
  for (const href of noindex) for (const path of Object.values(routing.pathnames[href])) assert.ok(!listed.includes(path), `${path} is listed`);
});

test('robots allows everything, disallows nothing and names the sitemap', () => {
  assert.deepEqual(robots(), { rules: { userAgent: '*', allow: '/' }, sitemap: absolute('/sitemap.xml') });
});
