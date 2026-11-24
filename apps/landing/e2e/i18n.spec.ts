import { type APIRequestContext, expect, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';

test.describe('a browser in es-CO', () => {
  test.use({ locale: 'es-CO' });

  test('gets the Spanish home at / itself, with /es as its canonical', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(response?.request().redirectedFrom()).toBeNull();
    await expect(page).toHaveURL('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Prelaunch.title);
    expect(new URL((await page.locator('link[rel="canonical"]').getAttribute('href')) ?? '').pathname).toBe('/es');
  });
});

test.describe('a browser in en-US', () => {
  test.use({ locale: 'en-US' });

  test('is redirected from / to /en', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/en');
  });
});

// A plain GET with no script and no redirect followed, as WhatsApp's and other scrapers' previews fetch it
const rootStatus = async (request: APIRequestContext, headers: Record<string, string>) => {
  const response = await request.get('/', { headers, maxRedirects: 0 });
  return { status: response.status(), location: response.headers().location, body: await response.text() };
};

test('/ answers 200 with the Spanish card to a scraper, and 307 to /en only when it negotiates English', async ({ request }) => {
  const spanish: Record<string, string>[] = [{ 'accept-language': 'es-CO,es;q=0.9' }, { 'user-agent': 'WhatsApp/2.23.20.0', 'accept-language': 'es' }];
  for (const headers of spanish) {
    const { status, body } = await rootStatus(request, headers);
    expect(status, JSON.stringify(headers)).toBe(200);
    expect(body).toContain('<html lang="es"');
    expect(body).toMatch(/<meta property="og:image" content="https?:\/\/[^"]+"/);
  }
  const english = await rootStatus(request, { 'accept-language': 'en-US,en;q=0.9' });
  expect(english.status).toBe(307);
  expect(new URL(english.location ?? '', 'http://localhost').pathname).toBe('/en');
});

test('/en answers 200 in English with the English home heading', async ({ page }) => {
  const response = await page.goto('/en');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.Prelaunch.title);
});

test('/es declares absolute hreflang alternates for es, en and x-default', async ({ page }) => {
  await page.goto('/es');
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
    links.map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]),
  );
  expect(alternates.map(([hreflang]) => hreflang).sort()).toEqual(['en', 'es', 'x-default']);
  for (const [, href] of alternates) expect(href).toMatch(/^https?:\/\//);
  // The origin is the site URL baked in at build time, not the port this run serves on
  const pathnames = Object.fromEntries(alternates.map(([hreflang, href]) => [hreflang, new URL(href ?? '').pathname]));
  expect(pathnames).toEqual({ es: '/es', en: '/en', 'x-default': '/es' });
});

test.describe('an unknown locale', () => {
  test.use({ locale: 'en-US' });

  test('ends in the English 404', async ({ page }) => {
    // The proxy treats /fr/... as unprefixed and redirects it to /en/fr/... for an English browser; the catch-all route answers 404
    const response = await page.goto('/fr/anything');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.NotFound.title);
  });
});

test.describe('an unknown locale from a Spanish browser', () => {
  test.use({ locale: 'es-CO' });

  test('ends in the Spanish 404', async ({ page }) => {
    const response = await page.goto('/fr/anything');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.NotFound.title);
  });
});
