import { expect, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';

// localeDetection is off while the pages are Spanish-only: every browser lands on /es
const detections = [
  { browserLocale: 'es-CO', path: '/es' },
  { browserLocale: 'en-US', path: '/es' },
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

test('/en answers the localized 404 because the pre-launch pages are Spanish-only', async ({ page }) => {
  const response = await page.goto('/en');
  expect(response?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.NotFound.title);
});

test('/es declares an absolute hreflang alternate for Spanish only', async ({ page }) => {
  await page.goto('/es');
  // A Spanish-only page has no English alternate and no x-default: the proxy could send an English browser to a 404
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
    links.map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]),
  );
  expect(alternates).toHaveLength(1);
  const [hreflang, href] = alternates[0] ?? [];
  expect(hreflang).toBe('es');
  expect(href).toMatch(/^https?:\/\//);
  // The origin is the site URL baked in at build time, not the port this run serves on
  expect(new URL(href ?? '').pathname).toBe('/es');
});

test.describe('an unknown locale', () => {
  test.use({ locale: 'en-US' });

  test('ends in a localized 404', async ({ page }) => {
    // The proxy treats /fr/... as unprefixed and, without locale detection, redirects it to /es/fr/...; the catch-all route answers 404
    const response = await page.goto('/fr/anything');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.NotFound.title);
  });
});
