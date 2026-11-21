import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/es', '/en']) {
  test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
    const response = await page.goto(path);
    // Without this, axe would happily audit a 404 page
    expect(response?.status()).toBe(200);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(violations).toEqual([]);
  });
}
