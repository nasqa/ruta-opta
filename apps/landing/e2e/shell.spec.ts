import { expect, type Locator, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { routing } from '../src/i18n/routing';
import { pages, pathFor } from './pages';

const messages = { es, en };
type Language = (typeof routing.locales)[number];
const footerSections = ['places', 'method', 'tourism', 'allies', 'faq'] as const;

// A language link's accessible name: its visible code first (WCAG 2.5.3), then the language named in itself
const languageName = (locale: Language, language: Language) => `${language.toUpperCase()} ${messages[locale].SiteShell.languages[language]}`;

// Whether the element painted at the centre of the locator's box belongs to the locator (null when the centre is off screen)
const hitAtCentre = (locator: Locator) =>
  locator.evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    const hit = document.elementFromPoint(left + width / 2, top + height / 2);
    return hit && element.contains(hit);
  });

for (const { locale, href, path } of pages) {
  const { SiteShell } = messages[locale];

  test(`${path} has the shell header`, async ({ page }) => {
    await page.goto(path);
    const header = page.getByRole('banner');

    await expect(header.getByRole('link', { name: SiteShell.home, exact: true })).toHaveAttribute('href', `/${locale}`);
    const switcher = header.getByRole('navigation', { name: SiteShell.languageNav, exact: true });
    for (const language of routing.locales) {
      const link = switcher.getByRole('link', { name: languageName(locale, language), exact: true });
      await expect(link).toHaveText(language.toUpperCase());
      await expect(link).toHaveAttribute('lang', language);
      await expect(link).toHaveAttribute('hreflang', language);
      if (language === locale) await expect(link).toHaveAttribute('aria-current', 'true');
      else await expect(link).not.toHaveAttribute('aria-current');
    }
  });

  test(`${path} switches language to the same page`, async ({ page }) => {
    await page.goto(path);
    const switcher = page.getByRole('navigation', { name: SiteShell.languageNav, exact: true });

    for (const other of routing.locales.filter((language) => language !== locale)) {
      await expect(switcher.getByRole('link', { name: languageName(locale, other), exact: true })).toHaveAttribute('href', pathFor(other, href));
    }
  });

  test(`${path} footer names the foundation and links privacy`, async ({ page }) => {
    await page.goto(path);
    const footer = page.getByRole('contentinfo');

    await expect(footer.getByText(SiteShell.footer.initiative)).toBeVisible();
    await expect(footer.getByRole('link', { name: SiteShell.footer.privacy, exact: true })).toHaveAttribute('href', pathFor(locale, '/privacy'));
    await expect(footer.getByRole('link', { name: SiteShell.footer.email, exact: true })).toHaveAttribute('href', `mailto:${SiteShell.footer.email}`);
  });

  test(`${path} footer links the home's sections and the contacts, and dates the rights line`, async ({ page }) => {
    await page.goto(path);
    const footer = page.getByRole('contentinfo');
    const explore = footer.getByRole('navigation', { name: SiteShell.footer.explore, exact: true });

    // Plain anchors to the home's sections, from every page
    for (const section of footerSections) {
      await expect(explore.getByRole('link', { name: SiteShell.sections[section], exact: true })).toHaveAttribute('href', `${pathFor(locale, '/')}#${section}`);
    }
    await expect(footer.getByRole('link', { name: SiteShell.footer.whatsapp, exact: true })).toHaveAttribute('href', `https://wa.me/${SiteShell.footer.whatsappNumber}`);
    await expect(footer.getByRole('link', { name: SiteShell.footer.infoEmail, exact: true })).toHaveAttribute('href', `mailto:${SiteShell.footer.infoEmail}`);
    // The round WhatsApp button floats over every page: a plain link to the same number with its own written message, in a new tab
    const floating = page.getByRole('link', { name: SiteShell.whatsappFloat.label, exact: true });
    await expect(floating).toHaveAttribute('href', `https://wa.me/${SiteShell.footer.whatsappNumber}?text=${encodeURIComponent(SiteShell.whatsappFloat.message)}`);
    await expect(floating).toHaveAttribute('target', '_blank');
    await expect(floating).toHaveAttribute('rel', /noopener/);
    await expect(floating).toBeInViewport();
    await expect(footer.getByRole('link', { name: SiteShell.footer.instagram, exact: true })).toHaveAttribute('href', SiteShell.footer.instagramUrl);
    await expect(footer.getByText(SiteShell.footer.place, { exact: true })).toBeVisible();
    await expect(footer.getByText(SiteShell.footer.rights.replace('{year}', String(new Date().getFullYear())), { exact: true })).toBeVisible();
  });
}

test('the language switch on /confirm keeps the token', async ({ page }) => {
  await page.goto('/es/confirmar?t=abc');
  const switcher = page.getByRole('navigation', { name: es.SiteShell.languageNav, exact: true });

  await expect(switcher.getByRole('link', { name: languageName('es', 'en'), exact: true })).toHaveAttribute('href', '/en/confirm?t=abc');
});

for (const { locale, path } of pages) {
  test(`${path} keeps header B on one line at 320 px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const header = page.getByRole('banner');

    // The label stays (ruling 10), on the same line as the language switch, and the switch ends inside the viewport
    const label = await header.getByText(messages[locale].SiteShell.product, { exact: true }).boundingBox();
    const switcher = await header.getByRole('navigation').boundingBox();
    expect(label && switcher && label.y < switcher.y + switcher.height && switcher.y < label.y + label.height).toBe(true);
    expect(switcher && switcher.x + switcher.width).toBeLessThanOrEqual(320);
  });
}

test.describe('no page scrolls sideways at 320 px', () => {
  for (const { path } of pages) {
    test(path, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);

      const scrollWidth = await page.evaluate(async () => {
        await document.fonts.ready;
        return document.documentElement.scrollWidth;
      });
      expect(scrollWidth).toBeLessThanOrEqual(320);
    });
  }
});

// The curtain is kept only where the whole footer fits the window: a taller one would keep its top under the content for good
for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [768, 1024],
]) {
  test(`at ${width}x${height} the whole footer fits, is covered until the end of the scroll and uncovered at the bottom`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/es/privacidad');
    const footer = page.getByRole('contentinfo');

    expect(await footer.evaluate((element) => getComputedStyle(element).position)).toBe('sticky');
    expect((await footer.boundingBox())?.height).toBeLessThanOrEqual(height);
    // The footer waits at the bottom of the viewport, under the content
    expect(await hitAtCentre(footer)).toBe(false);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => hitAtCentre(footer)).toBe(true);
  });
}

for (const [width, height] of [
  [320, 568],
  [375, 667],
]) {
  test(`at ${width}x${height} the footer is taller than the window, so it follows the page and every link can be reached`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/es/privacidad');
    const footer = page.getByRole('contentinfo');

    expect(await footer.evaluate((element) => getComputedStyle(element).position)).toBe('static');
    expect((await footer.boundingBox())?.height).toBeGreaterThan(height);
    for (const link of await footer.getByRole('link').all()) {
      await link.scrollIntoViewIfNeeded();
      expect(await hitAtCentre(link)).toBe(true);
    }
  });
}

test('a focused footer link is on top', async ({ page }) => {
  await page.goto('/es/privacidad');
  const footer = page.getByRole('contentinfo');
  const focusInFooter = () => footer.evaluate((element) => element.contains(document.activeElement));

  for (let presses = 0; presses < 50 && !(await focusInFooter()); presses++) await page.keyboard.press('Tab');
  expect(await focusInFooter()).toBe(true);
  expect(await hitAtCentre(page.locator(':focus'))).toBe(true);
});
