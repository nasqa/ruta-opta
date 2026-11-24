import { expect, type Page, test } from '@playwright/test';
import en from '../messages/en.json';
import { renderEmail } from '../src/modules/waitlist/email-layout';

// The email is HTML, not a page: rendered straight into the browser at reading-pane widths. The webServer serves public/email, so the logo and the
// font load from it and nothing reaches production
const widths = [320, 375, 600, 1024, 1440];

const renderAt = async (origin: string) =>
  (
    await renderEmail({
      locale: 'en',
      subject: en.ConfirmEmail.subject,
      preheader: en.ConfirmEmail.preheader,
      heading: 'Confirm your signup to the newsletter of a programme with a rather long name',
      paragraphs: [en.ConfirmEmail.p1, en.ConfirmEmail.p2, en.ConfirmEmail.p3],
      action: { label: en.ConfirmEmail.action, url: `${origin}/en/confirm?t=${'x'.repeat(160 - origin.length - '/en/confirm?t='.length)}` },
      chrome: { ...en.EmailLayout, logoUrl: new URL('/email/opta-horizontal-plate@2x.png', origin).href, privacyUrl: new URL('/en/privacy', origin).href },
    })
  ).html;

// Sizes the viewport, loads the email and waits for the logo to be a real image (complete is also true for a 404)
const open = async (page: Page, html: string, width: number) => {
  await page.setViewportSize({ width, height: 900 });
  await page.setContent(html);
  await expect(page.locator('img')).toHaveJSProperty('complete', true);
  expect(await page.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth), `logo at ${width}px`).toBeGreaterThan(0);
};

test.describe('the confirmation email', () => {
  // One desktop and one mobile browser are enough; the high-contrast projects change nothing an email reads
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name.endsWith('-hc')));

  test('the email fits 320 px without horizontal overflow', async ({ page, baseURL }) => {
    await open(page, await renderAt(baseURL ?? ''), 320);

    expect(await page.evaluate(() => document.documentElement.scrollWidth), 'at 320px').toBeLessThanOrEqual(320);
  });

  test('fits every width: 600 px at most, the whole width under 480 px', async ({ page, baseURL }) => {
    const html = await renderAt(baseURL ?? '');

    for (const width of widths) {
      await open(page, html, width);

      expect(await page.evaluate(() => document.documentElement.scrollWidth), `at ${width}px`).toBeLessThanOrEqual(width);
      const card = await page.locator('.card').boundingBox();
      expect(card?.width, `card at ${width}px`).toBeLessThanOrEqual(600);
      if (width < 480) {
        // Full width means the card's content box: the card's inner width less its padding
        const button = await page.locator('.button').boundingBox();
        const inner = await page.locator('.card-body').evaluate((cell) => {
          const { paddingLeft, paddingRight } = getComputedStyle(cell);
          return cell.getBoundingClientRect().width - parseFloat(paddingLeft) - parseFloat(paddingRight);
        });
        expect(Math.abs((button?.width ?? 0) - inner), `button at ${width}px`).toBeLessThanOrEqual(1);
      }
      await test.info().attach(`email-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    }
  });
});
