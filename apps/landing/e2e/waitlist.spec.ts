import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import es from '../messages/es.json';
import { confirmTtlMs, sealToken } from '../src/modules/waitlist/token';
import { testTokenKey } from './fixtures';

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

// Links sealed with the key the e2e server runs with, as the confirmation email would carry them
const seal = (now?: number) =>
  sealToken(
    'confirm',
    { email: 'ana@example.com', name: 'Ana', locale: 'es', consentAt: 0, policyVersion: 'test' },
    { current: Buffer.from(testTokenKey, 'base64') },
    confirmTtlMs,
    now,
  );

test.describe('the confirm page on /es/confirmar', () => {
  test('a valid link greets by name and confirming lands on /es/confirmado', async ({ page }) => {
    await page.goto(`/es/confirmar?t=${seal()}`);
    await expect(page.getByText(es.Confirm.greeting.replace('{name}', 'Ana'))).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations).toEqual([]);

    await page.getByRole('button', { name: es.Confirm.submit }).click();
    await expect(page).toHaveURL('/es/confirmado');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Confirmed.title);
  });

  test('an expired link says so and offers to sign up again', async ({ page }) => {
    // Sealed at the epoch, so it expired long ago
    await page.goto(`/es/confirmar?t=${seal(0)}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Confirm.expired.title);
    await expect(page.getByRole('link', { name: es.Confirm.again })).toHaveAttribute('href', '/es');
  });

  test('a broken link is invalid, not an error', async ({ page }) => {
    for (const query of ['?t=', '?t=abc', `?t=${seal().slice(0, -5)}`]) {
      const response = await page.goto(`/es/confirmar${query}`);
      expect(response?.status(), query).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Confirm.invalid.title);
    }
  });

  test('the page is not indexed and sends no referrer', async ({ page }) => {
    await page.goto(`/es/confirmar?t=${seal()}`);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    // The token is in the URL: no Referer header may carry it to another site
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  });
});
