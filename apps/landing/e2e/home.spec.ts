import { expect, type Page, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { contrastRatio, type Rgb } from './contrast';

const messages = { es, en };
const locales = ['es', 'en'] as const;
const ogLocales = { es: 'es_CO', en: 'en_US' };
// The site URL the server was built with (next.config.ts bakes it from URL when the build is not a Netlify preview); the run itself serves on its own port
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
      const whatsapp = page.getByRole('link', { name: new RegExp(`^${Prelaunch.allies.whatsapp.label}`) });
      const email = page.getByRole('link', { name: Prelaunch.allies.email.label, exact: true });

      await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/573105874657\?text=/);
      await expect(whatsapp).toHaveAttribute('target', '_blank');
      await expect(whatsapp).toHaveAttribute('rel', /noopener/);
      // The new tab is announced, and the visible label stays inside the accessible name (WCAG 2.5.3)
      await expect(whatsapp).toHaveAttribute('aria-label', new RegExp(`^${Prelaunch.allies.whatsapp.label} \\(.+\\)$`));
      await expect(page.locator('section[aria-labelledby="allies-title"]').getByText(Prelaunch.allies.email.address, { exact: true })).toBeVisible();
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
      expect(await meta(page, 'meta[property="og:site_name"]')).toBe(messages[locale].Site.name);
      expect(await meta(page, 'meta[property="og:title"]')).toBe(Prelaunch.ogTitle);
      expect(await meta(page, 'meta[property="og:description"]')).toBe(Prelaunch.ogDescription);
      expect(await meta(page, 'meta[name="twitter:title"]')).toBe(Prelaunch.ogTitle);
      expect(await meta(page, 'meta[name="twitter:description"]')).toBe(Prelaunch.ogDescription);
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
      for (const href of hrefs) {
        const { pathname } = new URL(href);
        // x-default is the Spanish page itself, so every alternate is a page, never a redirect
        expect((await request.get(pathname, { maxRedirects: 0 })).status(), href).toBe(200);
      }
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

test('contrastRatio follows WCAG: black on white is 21, equal colours are 1', () => {
  expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
  expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
  expect(contrastRatio([118, 118, 118], [118, 118, 118])).toBe(1);
  expect(contrastRatio([118, 118, 118], [255, 255, 255])).toBeCloseTo(4.54, 2);
});

// The colour a CSS colour resolves to in sRGB, whatever space the theme wrote it in
const textColor = (page: Page, selector: string) =>
  page.locator(selector).evaluate((element): Rgb => {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('no canvas');
    context.fillStyle = getComputedStyle(element).color;
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return [red, green, blue];
  });

// Every distinct colour painted in the element's box once its text is hidden: the real pixels the text sits on
const backdrop = async (page: Page, selector: string): Promise<Rgb[]> => {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} has no box`);
  const base64 = (await page.screenshot({ clip: box })).toString('base64');
  const packed = await page.evaluate(async (data) => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const context = new OffscreenCanvas(image.width, image.height).getContext('2d');
    if (!context) throw new Error('no canvas');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const seen = new Set<number>();
    for (let index = 0; index < pixels.length; index += 4) seen.add(((pixels[index] ?? 0) << 16) | ((pixels[index + 1] ?? 0) << 8) | (pixels[index + 2] ?? 0));
    return [...seen];
  }, base64);
  return packed.map((value): Rgb => [(value >> 16) & 255, (value >> 8) & 255, value & 255]);
};

const widths = [375, 768, 1440];

for (const locale of locales) {
  test.describe(`/${locale} hero text contrast on the real pixels`, () => {
    for (const width of widths) {
      test(`the headline and the lead keep 7:1 at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`);
        await page.evaluate(() => document.fonts.ready);

        const targets = ['#hero-title', '#hero-title + p'];
        const colors = await Promise.all(targets.map((selector) => textColor(page, selector)));
        await page.addStyleTag({ content: '#hero-title, #hero-title + p { color: transparent !important; }' });
        for (const [index, selector] of targets.entries()) {
          const text = colors[index];
          if (!text) throw new Error(`no colour for ${selector}`);
          const worst = Math.min(...(await backdrop(page, selector)).map((pixel) => contrastRatio(text, pixel)));
          expect(worst, `${selector} worst pixel contrast`).toBeGreaterThanOrEqual(7);
        }
      });
    }
  });
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of locales) {
    test(`/${locale} renders the whole page and the hero button reaches the form`, async ({ page }) => {
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });

      // The context really runs no scripts: Next's client runtime never started
      expect(await page.evaluate(() => Reflect.get(window, 'next'))).toBeUndefined();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(messages[locale].Prelaunch.title);
      await expect(page.locator('section[aria-labelledby="method-title"] ol > li')).toHaveCount(3);
      await page.getByRole('link', { name: messages[locale].Prelaunch.cta, exact: true }).click();
      await expect(page).toHaveURL(/#lista$/);
      await expect(page.locator('#lista')).toBeInViewport();
    });
  }
});

type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };

const watchLayoutShift = (page: Page) =>
  page.addInitScript(() => {
    Object.assign(window, { shift: 0 });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShift[]) if (!entry.hadRecentInput) Object.assign(window, { shift: Number(Reflect.get(window, 'shift')) + entry.value });
    }).observe({ type: 'layout-shift', buffered: true });
  });

const layoutShift = (page: Page) => page.evaluate(() => Number(Reflect.get(window, 'shift')));

for (const locale of locales) {
  test.describe(`/${locale} with the hero image blocked`, () => {
    test('the text stays readable and nothing moves when the image never arrives', async ({ page }) => {
      await watchLayoutShift(page);
      await page.route(/\/_next\/(image|static\/media\/home-hero)/, (route) => route.abort());
      await page.goto(`/${locale}`, { waitUntil: 'domcontentloaded' });
      const before = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const art = page.locator('section[aria-labelledby="hero-title"] img:not([src*="sun"])');
      expect(await art.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth), 'the hero image really failed').toBe(0);
      const placeholder = await page.locator('section[aria-labelledby="hero-title"] > div:last-child').evaluate((element) => getComputedStyle(element).backgroundImage);
      expect(placeholder, 'a quiet fill sits behind the art while it loads').not.toBe('none');
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before);
      expect(await layoutShift(page)).toBeLessThanOrEqual(0.1);
    });

    test('the layout shift with the image is within the 0.1 budget', async ({ page }) => {
      await watchLayoutShift(page);
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      expect(await layoutShift(page)).toBeLessThanOrEqual(0.1);
    });
  });
}

for (const locale of locales) {
  test(`/${locale} keeps every section in its column and every label in its button at 320 px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);

    // The page inset is 24 px a side: a long word must not stretch a section past it
    const rights = await page.locator('main > *').evaluateAll((sections) => sections.map((section) => section.getBoundingClientRect().right));
    for (const right of rights) expect(right).toBeLessThanOrEqual(296.01);
    const clipped = await page.locator('h1, .mantine-Button-label').evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth).map((element) => element.textContent));
    expect(clipped, 'text wider than its box').toEqual([]);
  });
}

for (const locale of locales) {
  const { Prelaunch } = messages[locale];

  test.describe(`/${locale} reading and keyboard`, () => {
    test('the territory list keeps its list role and the paragraphs keep a readable measure', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}`);

      await expect(page.locator('ul[role="list"][aria-label]')).toHaveCount(1);
      for (const selector of ['thesis-title', 'tourism-title', 'who-title', 'allies-title']) {
        const paragraph = await page.locator(`section[aria-labelledby="${selector}"] > p`).first().boundingBox();
        if (!paragraph) throw new Error(`${selector} has no paragraph`);
        // 36em of the paragraph's own 18 px type is 648 px: about 70 characters a line (it was 48em, 864 px)
        expect(paragraph.width, selector).toBeLessThanOrEqual(649);
      }
    });

    test('tab goes from the hero button to the policy, WhatsApp and email in order, with a visible focus ring', async ({ page }) => {
      await page.goto(`/${locale}`);
      const cta = page.getByRole('link', { name: Prelaunch.cta, exact: true });
      await cta.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(cta).toBeFocused();

      const ring = await cta.evaluate((element) => {
        const { outlineWidth, outlineStyle, outlineColor } = getComputedStyle(element);
        const probe = (color: string) => {
          const context = document.createElement('canvas').getContext('2d');
          if (!context) throw new Error('no canvas');
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
          return [red, green, blue] satisfies Rgb;
        };
        return { width: Number.parseFloat(outlineWidth), style: outlineStyle, color: probe(outlineColor), page: probe(getComputedStyle(document.body).backgroundColor) };
      });
      expect(ring.style).not.toBe('none');
      expect(ring.width).toBeGreaterThanOrEqual(2);
      expect(contrastRatio(ring.color, ring.page)).toBeGreaterThanOrEqual(3);

      const order: string[] = [];
      for (let step = 0; step < 4; step++) {
        await page.keyboard.press('Tab');
        order.push(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? document.activeElement?.tagName ?? ''));
      }
      expect(order.map((href) => (href.startsWith('https://wa.me') ? 'whatsapp' : href.startsWith('mailto:') ? 'email' : /privacy|privacidad/.test(href) ? 'policy' : href))).toEqual(['policy', 'whatsapp', 'email', 'INPUT']);
    });
  });
}
