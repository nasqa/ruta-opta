import { expect, test } from '@playwright/test';
import es from '../messages/es.json';

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
    const comfortaaLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('16px "Comfortaa Variable"');
    });
    expect(comfortaaLoaded).toBe(true);
    expect(fonts.length).toBeGreaterThan(0);
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

  test('hydrates without console errors or hydration warnings', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || /hydrat/i.test(message.text())) problems.push(message.text());
    });
    // Production React reports hydration failures through reportError, which surfaces here
    page.on('pageerror', (error) => problems.push(error.message));
    // networkidle lets hydration and late font loads finish before asserting that nothing went wrong
    await page.goto('/es', { waitUntil: 'networkidle' });

    expect(problems).toEqual([]);
  });
});
