import { expect, test } from '@playwright/test';
import en from '../messages/en.json';
import { renderEmail } from '../src/modules/waitlist/email-layout';

// The email is HTML, not a page: rendered straight into the browser at reading-pane widths. The webServer serves public/email, so the logo and the
// font load from it and nothing reaches production
const widths = [320, 375, 600, 1024, 1440];

test.describe('the confirmation email', () => {
  test('fits every width: 600 px at most, the whole width under 480 px', async ({ page, baseURL }, testInfo) => {
    // One desktop and one mobile browser are enough; the high-contrast projects change nothing an email reads
    test.skip(testInfo.project.name.endsWith('-hc'));
    const origin = baseURL ?? '';
    const { html } = await renderEmail({
      locale: 'en',
      subject: en.ConfirmEmail.subject,
      preheader: en.ConfirmEmail.preheader,
      heading: 'Confirm your signup to the newsletter of a programme with a rather long name',
      paragraphs: [en.ConfirmEmail.p1, en.ConfirmEmail.p2, en.ConfirmEmail.p3],
      action: { label: en.ConfirmEmail.action, url: `${origin}/en/confirm?t=${'x'.repeat(160 - origin.length - '/en/confirm?t='.length)}` },
      chrome: { ...en.EmailLayout, logoUrl: new URL('/email/opta-horizontal-plate@2x.png', origin).href, privacyUrl: new URL('/en/privacy', origin).href },
    });

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(html);
      await expect(page.locator('img')).toHaveJSProperty('complete', true);

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const card = await page.locator('.card').boundingBox();
      expect(card?.width).toBeLessThanOrEqual(600);
      if (width < 480) {
        const button = await page.locator('.button').boundingBox();
        expect(button?.width).toBeGreaterThanOrEqual((card?.width ?? Infinity) * 0.9);
      }
      await test.info().attach(`email-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    }
  });
});
