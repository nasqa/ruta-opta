import { expect, test } from '@playwright/test';

const noindexPaths = ['/confirm', '/confirmed', '/unsubscribed', '/confirmar', '/confirmado', '/baja'];
const locs = ['/es', '/en', '/es/privacidad', '/en/privacy'];

test('robots.txt allows everything and names the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  const body = await response.text();
  expect(body).toMatch(/^User-Agent: \*\nAllow: \/$/m);
  expect(body).toMatch(/^Sitemap: https?:\/\/[^/\s]+\/sitemap\.xml$/m);
  expect(body).not.toContain('Disallow');
});

test('sitemap.xml lists the four localized pages with their hreflang alternates', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('xml');
  const xml = await response.text();
  expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  const urls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname);
  expect(urls).toEqual(locs);
  for (const language of ['es', 'en', 'x-default']) expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="${language}"`);
  expect(xml).toMatch(/hreflang="x-default" href="https?:\/\/[^/"]+\/"/);
  const paths = [...xml.matchAll(/(?:<loc>|href=")([^<"]+)/g)].map(([, url]) => new URL(url).pathname);
  for (const path of noindexPaths) expect(paths).not.toContain(path);
  for (const path of noindexPaths) expect(paths.some((listed) => listed.startsWith(`${path}/`))).toBe(false);
});
