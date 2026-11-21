import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import es from '../messages/es.json';
import { pagePaths } from './pages';

const wcagViolations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations;

for (const path of pagePaths) {
  test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
    const response = await page.goto(path);
    // Without this, axe would happily audit a 404 page
    expect(response?.status()).toBe(200);
    expect(await wcagViolations(page)).toEqual([]);
  });
}

test('the 404 page has no WCAG 2.2 AA violations and a title', async ({ page }) => {
  const response = await page.goto('/es/missing-page');
  expect(response?.status()).toBe(404);
  // Next sends an error shell; the localized page renders once it hydrates
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.NotFound.title);
  expect(await wcagViolations(page)).toEqual([]);
  await expect(page).toHaveTitle(es.Site.name);
});
