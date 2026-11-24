import resolved from '@nasqa/trama-theme-opta/tokens.resolved.json' with { type: 'json' };
import { expect, test } from '@playwright/test';
import es from '../messages/es.json';

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
  // x-default is the Spanish page itself: the unprefixed / serves it too, but with /es as its canonical
  expect(xml).toMatch(/hreflang="x-default" href="https?:\/\/[^/"]+\/es"/);
  expect(xml).not.toMatch(/href="https?:\/\/[^/"]+\/"/);
  const paths = [...xml.matchAll(/(?:<loc>|href=")([^<"]+)/g)].map(([, url]) => new URL(url).pathname);
  for (const path of noindexPaths) expect(paths).not.toContain(path);
  for (const path of noindexPaths) expect(paths.some((listed) => listed.startsWith(`${path}/`))).toBe(false);
});

test('the pages link a PNG icon, an apple-touch-icon, the manifest and the theme colour, and each answers', async ({ page, request }) => {
  const canvas = resolved.light['color.surface.canvas'].hex;
  await page.goto('/es');
  const href = async (selector: string) => (await page.locator(selector).getAttribute('href')) ?? '';

  for (const [selector, sizes] of [['link[rel="icon"][type="image/png"]', '512x512'], ['link[rel="apple-touch-icon"]', '180x180']]) {
    await expect(page.locator(selector)).toHaveAttribute('sizes', sizes);
    const response = await request.get(await href(selector));
    expect(response.status(), selector).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
  }
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', canvas);

  const manifest = await (await request.get(await href('link[rel="manifest"]'))).json();
  expect(manifest).toMatchObject({ name: es.Site.name, start_url: '/es', display: 'browser', theme_color: canvas, background_color: canvas });
  for (const { src } of manifest.icons) expect((await request.get(src)).status(), src).toBe(200);
});
