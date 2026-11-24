import { expect, type Page, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';

const messages = { es, en };
const locales = ['es', 'en'] as const;
const ogLocales = { es: 'es_CO', en: 'en_US' };
// The site URL the server was built with (src/shared/env.ts reads the same variable); the run itself serves on its own port
const site = new URL(process.env.URL ?? 'http://localhost:3000');
const meta = (page: Page, selector: string) => page.locator(selector).getAttribute('content');

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

    test('has its own title, canonical and social card', async ({ page, request }) => {
      await page.goto(`/${locale}`);

      await expect(page).toHaveTitle(Prelaunch.metaTitle);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', Prelaunch.metaDescription);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${site.origin}/${locale}`);
      expect(await meta(page, 'meta[property="og:title"]')).toBe(Prelaunch.metaTitle);
      expect(await meta(page, 'meta[property="og:description"]')).toBe(Prelaunch.metaDescription);
      expect(await meta(page, 'meta[property="og:locale"]')).toBe(ogLocales[locale]);
      expect(await meta(page, 'meta[property="og:locale:alternate"]')).toBe(ogLocales[locale === 'es' ? 'en' : 'es']);
      expect(await meta(page, 'meta[property="og:image:alt"]')).toBe(Prelaunch.ogAlt);
      expect(await meta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
      const image = await meta(page, 'meta[property="og:image"]');
      expect(image).toMatch(new RegExp(`^${site.origin}/`));
      // The absolute URL points at the baked-in site URL, not this run's port: ask this run's server for the same path
      const response = await request.get(new URL(image ?? '').pathname);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/jpeg');
    });

    test('every hreflang alternate answers 200', async ({ page, request }) => {
      await page.goto(`/${locale}`);
      const hrefs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

      expect(hrefs).toHaveLength(3);
      for (const href of hrefs) expect((await request.get(new URL(href).pathname)).status(), href).toBe(200);
    });

    test('the structured data parses and names the organization once', async ({ page, request }) => {
      await page.goto(`/${locale}`);
      const scripts = page.locator('script[type="application/ld+json"]');

      await expect(scripts).toHaveCount(1);
      const data = JSON.parse((await scripts.textContent()) ?? '');
      const organization = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'Organization');
      expect(data['@context']).toBe('https://schema.org');
      expect(organization.name).toBe('Ruta Opta');
      expect(organization.legalName).toBe(Prelaunch.who.legalName);
      expect(organization.url).toBe(`${site.origin}/${locale}`);
      expect(data['@graph'].find((node: { '@type': string }) => node['@type'] === 'WebSite').inLanguage).toBe(locale);
      expect((await request.get(new URL(organization.logo).pathname)).status()).toBe(200);
    });
  });
}
