import { expect, test } from '@playwright/test';

const locales = ['es', 'en'] as const;

for (const locale of locales) {
  test.describe(`/${locale} home`, () => {
    test('the hero art band is 16:9 and carries exactly one sun', async ({ page }) => {
      await page.goto(`/${locale}`);
      const hero = page.locator('section[aria-labelledby="hero-title"]');
      const sun = hero.locator('img[src*="sun"]');

      await expect(sun).toHaveCount(1);
      const box = await sun.locator('xpath=..').boundingBox();
      if (!box) throw new Error('the hero art band has no box');
      expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
    });
  });
}
