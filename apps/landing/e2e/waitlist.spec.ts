import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import es from '../messages/es.json';

// next start runs with WAITLIST_ADAPTER=fake (playwright.config.ts): the form answers as if Zoho accepted the signup
test.describe('the waitlist form on /es', () => {
  test('asks for what is missing and keeps what was typed', async ({ page }) => {
    await page.goto('/es');
    await page.getByLabel(es.Waitlist.email.label, { exact: true }).fill('no-es-un-correo');
    await page.getByRole('button', { name: es.Waitlist.submit }).click();

    await expect(page.getByText(es.Waitlist.name.error)).toBeVisible();
    await expect(page.getByText(es.Waitlist.email.error)).toBeVisible();
    await expect(page.getByText(es.Waitlist.consent.error)).toBeVisible();
    await expect(page.getByLabel(es.Waitlist.email.label, { exact: true })).toHaveValue('no-es-un-correo');

    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations).toEqual([]);
  });

  test('tells the person to confirm their email', async ({ page }) => {
    await page.goto('/es');
    await page.getByLabel(es.Waitlist.name.label).fill('Ana');
    await page.getByLabel(es.Waitlist.email.label, { exact: true }).fill('ana@example.com');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: es.Waitlist.submit }).click();

    await expect(page.getByRole('status')).toContainText(es.Waitlist.sent.title.replace('{name}', 'Ana'));
    await expect(page.getByRole('status')).toContainText(es.Waitlist.sent.text);
  });
});
