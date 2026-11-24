import { expect, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';

const messages = { es, en };
const locales = ['es', 'en'] as const;

for (const locale of locales) {
  const { Prelaunch } = messages[locale];

  test.describe(`/${locale} home`, () => {
    test('the hero art band is 16:9 and carries exactly one sun', async ({ page }) => {
      await page.goto(`/${locale}`);
      const hero = page.locator('section[aria-labelledby="hero-title"]');
      const sun = hero.locator('img[src*="sun"]');

      await expect(sun).toHaveCount(1);
      const box = await sun.locator('xpath=..').boundingBox();
      if (!box) throw new Error('the hero art band has no box');
      expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
    });

    test('has one h1 and the sections in order', async ({ page }) => {
      await page.goto(`/${locale}`);

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(Prelaunch.title);
      await expect(page.getByRole('heading', { level: 2 })).toHaveText([
        Prelaunch.thesis.title,
        Prelaunch.methodTitle,
        Prelaunch.tourism.title,
        Prelaunch.who.title,
        Prelaunch.allies.title,
        Prelaunch.listTitle,
      ]);
    });

    test('the method is three steps in an ordered list', async ({ page }) => {
      await page.goto(`/${locale}`);
      const steps = page.locator('section[aria-labelledby="method-title"] ol > li');

      await expect(steps).toHaveCount(3);
      await expect(steps.getByRole('heading', { level: 3 })).toHaveText([Prelaunch.stages.grow.name, Prelaunch.stages.create.name, Prelaunch.stages.connect.name]);
    });

    test('names the five territories in order', async ({ page }) => {
      await page.goto(`/${locale}`);
      const territories = page.getByRole('list', { name: Prelaunch.thesis.territoriesLabel, exact: true }).getByRole('listitem');

      await expect(territories).toHaveText(['Quindío', 'Risaralda', 'Caldas', 'Valle del Cauca', 'Chocó']);
    });

    test('the hero button jumps to the sign-up form', async ({ page }) => {
      await page.goto(`/${locale}`);

      await expect(page.getByRole('link', { name: Prelaunch.cta, exact: true })).toHaveAttribute('href', '#lista');
      await expect(page.locator('#lista')).toHaveCount(1);
    });

    test('the allies reach Ruta Opta by WhatsApp and by email', async ({ page }) => {
      await page.goto(`/${locale}`);
      const whatsapp = page.getByRole('link', { name: Prelaunch.allies.whatsapp.label, exact: true });
      const email = page.getByRole('link', { name: Prelaunch.allies.email.label, exact: true });

      await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/573105874657\?text=/);
      await expect(whatsapp).toHaveAttribute('target', '_blank');
      await expect(whatsapp).toHaveAttribute('rel', /noopener/);
      await expect(email).toHaveAttribute('href', /^mailto:info@rutaopta\.org\?subject=/);
    });

    test('names the foundation and links the data policy', async ({ page }) => {
      await page.goto(`/${locale}`);
      const who = page.locator('section[aria-labelledby="who-title"]');

      await expect(who).toContainText(Prelaunch.who.legalName);
      await expect(who.getByRole('link', { name: Prelaunch.privacyLink, exact: true })).toHaveAttribute('href', /\/privacy|\/privacidad/);
    });
  });
}
