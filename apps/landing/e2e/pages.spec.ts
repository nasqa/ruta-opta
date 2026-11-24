import { expect, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { routing } from '../src/i18n/routing';
import { pathFor } from './pages';

const messages = { es, en };

for (const locale of routing.locales) {
  const { Unsubscribed, Privacy } = messages[locale];
  const unsubscribedPath = pathFor(locale, '/unsubscribed');
  const privacyPath = pathFor(locale, '/privacy');

  test(`${unsubscribedPath} is calm: title, lead and one link home, no button`, async ({ page }) => {
    await page.goto(unsubscribedPath);
    const main = page.getByRole('main');

    await expect(main.getByRole('heading', { level: 1 })).toHaveText(Unsubscribed.title);
    await expect(main.getByText(Unsubscribed.lead, { exact: true })).toBeVisible();
    // The valley band is the only image: decorative, with no ring and no sun
    await expect(main.locator('img')).toHaveCount(1);
    await expect(main.locator('img')).toHaveAttribute('alt', '');
    const links = main.getByRole('link');
    await expect(links).toHaveCount(1);
    await expect(main.getByRole('link', { name: Unsubscribed.home, exact: true })).toHaveAttribute('href', `/${locale}`);
    await expect(page.getByRole('button')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test(`${privacyPath}: every privacy contents link targets a section on the page`, async ({ page }) => {
    await page.goto(privacyPath);
    const keys = Object.keys(Privacy.sections) as (keyof typeof Privacy.sections)[];
    const links = page.getByRole('navigation', { name: Privacy.toc, exact: true }).getByRole('link');

    await expect(links).toHaveCount(keys.length);
    for (const [index, key] of keys.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', `#${key}`);
      await expect(links.nth(index)).toHaveText(Privacy.sections[key].title);
      await expect(page.locator(`section#${key}`).getByRole('heading', { level: 2 })).toHaveText(Privacy.sections[key].title);
    }

    await links.last().click();
    await expect(page).toHaveURL(new RegExp(`#${keys.at(-1)}$`));
    await expect(page.locator(`section#${keys.at(-1)}`)).toBeInViewport();
  });

  test(`${privacyPath} shows the controller and both contact addresses`, async ({ page }) => {
    await page.goto(privacyPath);
    const main = page.getByRole('main');

    await expect(main.getByText(Privacy.overline, { exact: true })).toBeVisible();
    await expect(main.getByText(Privacy.effective, { exact: true })).toBeVisible();
    await expect(main.locator('section#controller')).toContainText('Fundación Embajadores de la Paz');
    await expect(main.locator('section#controller')).toContainText('Armenia');

    // The accent card, found through its heading: the privacy address, then the English one, in both locales
    const card = main.getByRole('heading', { level: 2, name: Privacy.questions, exact: true }).locator('..');
    const emails = [Privacy.emailEs, Privacy.emailEn];
    const contacts = card.getByRole('link');
    await expect(contacts).toHaveCount(emails.length);
    for (const [index, email] of emails.entries()) await expect(contacts.nth(index)).toHaveAttribute('href', `mailto:${email}`);

    await expect(main.getByRole('link', { name: Privacy.home, exact: true })).toHaveAttribute('href', `/${locale}`);
  });
}
