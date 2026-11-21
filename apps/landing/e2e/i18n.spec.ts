import { expect, test } from '@playwright/test';
import en from '../messages/en.json';

const detections = [
  { browserLocale: 'es-CO', path: '/es' },
  { browserLocale: 'en-US', path: '/en' },
];

for (const { browserLocale, path } of detections) {
  test.describe(`a browser in ${browserLocale}`, () => {
    test.use({ locale: browserLocale });

    test(`is redirected from / to ${path}`, async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(path);
    });
  });
}

test('/en renders in English', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.Home.title);
});

test('/es declares absolute hreflang alternates', async ({ page, baseURL }) => {
  await page.goto('/es');
  // x-default is the root, where the proxy negotiates the locale
  const alternates = { es: '/es', en: '/en', 'x-default': '/' };
  for (const [hreflang, path] of Object.entries(alternates)) {
    const href = await page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`).getAttribute('href');
    expect(href).toMatch(/^https?:\/\//);
    // Compared as parsed URLs: Next writes the root without its trailing slash
    expect(new URL(href ?? '').href).toBe(new URL(path, baseURL).href);
  }
});

test.describe('an unknown locale', () => {
  test.use({ locale: 'en-US' });

  test('ends in a localized 404', async ({ page }) => {
    // The proxy treats /fr/... as unprefixed and redirects it to /en/fr/...; the catch-all route answers 404
    const response = await page.goto('/fr/anything');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.NotFound.title);
  });
});
