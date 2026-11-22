import { expect, type Page, test } from '@playwright/test';
import es from '../messages/es.json';
import { pagePaths } from './pages';

const watchProblems = (page: Page) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || /hydrat/i.test(message.text())) problems.push(message.text());
  });
  // Production React reports hydration failures through reportError, which surfaces here
  page.on('pageerror', (error) => problems.push(error.message));
  return problems;
};

test.describe('smoke page on /es', () => {
  test('renders the light theme in Spanish', async ({ page }) => {
    await page.goto('/es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('[data-territory="quindio"] section')).toBeVisible();
  });

  test('loads the display font from the theme package', async ({ page }) => {
    const fonts: { url: string; status: number }[] = [];
    page.on('response', (response) => {
      if (response.url().endsWith('.woff2')) fonts.push({ url: response.url(), status: response.status() });
    });
    await page.goto('/es');

    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /Comfortaa/);
    // fonts.check() is true for a family with no @font-face at all, so read the loaded faces instead
    const loadedFamilies = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter(({ status }) => status === 'loaded').map(({ family }) => family);
    });
    expect(loadedFamilies).toContain('Comfortaa Variable');
    const comfortaaServed = fonts.some(({ url, status }) => /comfortaa/i.test(url) && status < 400);
    expect(comfortaaServed, `woff2 responses: ${JSON.stringify(fonts)}`).toBe(true);
    expect(fonts.filter(({ status }) => status >= 400)).toEqual([]);
  });

  test('paints the Mantine button with the Opta action color', async ({ page }) => {
    await page.goto('/es');
    const [background, actionFilled] = await page
      .getByRole('button', { name: es.Home.cta })
      .evaluate((button) => {
        // A probe next to the button resolves the variable in the same cascade
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--mantine-color-action-filled)';
        button.after(probe);
        const colors = [getComputedStyle(button).backgroundColor, getComputedStyle(probe).backgroundColor];
        probe.remove();
        return colors;
      });

    expect(background).toBe(actionFilled);
    // Mantine's default blue: the theme did not reach Mantine
    expect(background).not.toBe('rgb(34, 139, 230)');
  });
});

for (const path of pagePaths) {
  test(`${path} hydrates without console errors or hydration warnings`, async ({ page }) => {
    const problems = watchProblems(page);
    // networkidle lets hydration and late font loads finish before asserting that nothing went wrong
    await page.goto(path, { waitUntil: 'networkidle' });

    expect(problems).toEqual([]);
  });
}

test('hydrates cleanly when the host injects a comment into <head>', async ({ page }) => {
  const problems = watchProblems(page);
  const charset = '<meta charSet="utf-8"/>';
  let injected = false;
  // What Netlify's free plan adds to every *.netlify.app page, right after <meta charset>
  await page.route('/es', async (route) => {
    const html = await (await route.fetch()).text();
    injected = html.includes(charset);
    await route.fulfill({ contentType: 'text/html; charset=utf-8', body: html.replace(charset, `${charset}\n\n<!-- Injected by the host -->\n`) });
  });
  await page.goto('/es', { waitUntil: 'networkidle' });

  expect(injected).toBe(true);
  expect(problems).toEqual([]);
});

test.describe('under a dark color-scheme preference', () => {
  test.use({ colorScheme: 'dark' });

  for (const path of pagePaths) {
    test(`${path} stays light and hydrates cleanly`, async ({ page }) => {
      const problems = watchProblems(page);
      // Every scheme <html> takes, from Mantine's inline script through hydration: a dark flash would end light anyway
      await page.addInitScript(() => {
        const schemes: string[] = [];
        Object.assign(window, { schemes });
        new MutationObserver(() => schemes.push(document.documentElement.dataset.mantineColorScheme ?? '')).observe(document, {
          subtree: true,
          attributeFilter: ['data-mantine-color-scheme'],
        });
      });
      await page.goto(path, { waitUntil: 'networkidle' });

      // mantineHtmlProps suppresses hydration warnings on <html>, so a scheme flipped before hydration shows only in these attributes
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-mantine-color-scheme', 'light');
      await expect(html).toHaveAttribute('data-theme', 'light');
      const schemes = await page.evaluate(() => (window as unknown as { schemes: string[] }).schemes);
      expect(schemes.filter((scheme) => scheme !== 'light')).toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});
