import { expect, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';

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
  expect(pathnames).toEqual({ es: '/es', en: '/en', 'x-default': '/' });
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
