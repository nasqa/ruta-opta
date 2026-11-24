import { expect, type Page, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { contrastRatio, type Rgb } from './contrast';

const messages = { es, en };
const locales = ['es', 'en'] as const;
const ogLocales = { es: 'es_CO', en: 'en_US' };
// The site URL the server was built with (src/shared/env.ts reads the same variable); the run itself serves on its own port
const site = new URL(process.env.URL ?? 'http://localhost:3000');
const meta = (page: Page, selector: string) => page.locator(selector).getAttribute('content');
// The sections the header and the footer link to, in page order, and the FAQ's questions
const sections = ['places', 'method', 'tourism', 'allies', 'faq'] as const;
const questions = ['what', 'how', 'tourism', 'book', 'allies', 'data'] as const;
const privacyPaths = { es: '/es/privacidad', en: '/en/privacy' };

for (const locale of locales) {
  const { Prelaunch, SiteShell } = messages[locale];

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
      // The footer's column titles are h2 too, outside main
      await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
        Prelaunch.thesis.title,
        Prelaunch.places.title,
        Prelaunch.methodTitle,
        Prelaunch.tourism.title,
        Prelaunch.allies.title,
        Prelaunch.faq.title,
        Prelaunch.listTitle,
      ]);
    });

    test('every section the header and the footer link to is on the page, in order', async ({ page }) => {
      await page.goto(`/${locale}`);

      expect(await page.locator('main > section[id]').evaluateAll((elements) => elements.map(({ id }) => id))).toEqual([...sections, 'lista']);
    });

    test('the sticky header links to the sections from 62em, lands them below itself, and drops the links on phones', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${locale}`);
      const header = page.getByRole('banner');
      const nav = header.getByRole('navigation', { name: SiteShell.sections.label, exact: true });

      await expect(nav.getByRole('link')).toHaveText(sections.map((section) => SiteShell.sections[section]));
      for (const section of sections) await expect(nav.getByRole('link', { name: SiteShell.sections[section], exact: true })).toHaveAttribute('href', `#${section}`);
      // Targets of at least 44 px (WCAG 2.5.5, well over 2.5.8's 24)
      for (const height of await nav.getByRole('link').evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height))) expect(height).toBeGreaterThanOrEqual(44);

      await nav.getByRole('link', { name: SiteShell.sections.faq, exact: true }).click();
      await expect(page).toHaveURL(/#faq$/);
      const bar = await header.boundingBox();
      const title = await page.locator('#faq-title').boundingBox();
      if (!bar || !title) throw new Error('no header or FAQ title box');
      expect(bar.y, 'the header stays at the top').toBe(0);
      expect(title.y, 'the title lands below the header').toBeGreaterThanOrEqual(bar.y + bar.height);

      await page.setViewportSize({ width: 375, height: 667 });
      await expect(header.locator(`nav[aria-label="${SiteShell.sections.label}"]`)).toBeHidden();
    });

    test('the method is three steps in an ordered list, each with its piece', async ({ page }) => {
      await page.goto(`/${locale}`);
      const steps = page.locator('section[aria-labelledby="method-title"] ol > li');

      await expect(steps).toHaveCount(3);
      await expect(steps.getByRole('heading', { level: 3 })).toHaveText([Prelaunch.stages.grow.name, Prelaunch.stages.create.name, Prelaunch.stages.connect.name]);
      await expect(steps.locator('img')).toHaveCount(3);
    });

    test('names the five territories in order, each with its piece and its line', async ({ page }) => {
      await page.goto(`/${locale}`);
      const territories = page.getByRole('list', { name: Prelaunch.thesis.territoriesLabel, exact: true });

      await expect(territories.getByRole('listitem')).toHaveCount(5);
      await expect(territories.getByRole('heading', { level: 3 })).toHaveText(['Quindío', 'Risaralda', 'Caldas', 'Valle del Cauca', 'Chocó']);
      await expect(territories.locator('p')).toHaveText((['quindio', 'risaralda', 'caldas', 'valle', 'choco'] as const).map((key) => Prelaunch.places[key]));
      await expect(territories.locator('img')).toHaveCount(5);
    });

    test('only the hero art is fetched first; every other piece is lazy, decorative and sized before it loads', async ({ page }) => {
      await page.goto(`/${locale}`);
      const hero = page.locator('section[aria-labelledby="hero-title"] img:not([src*="sun"])');

      await expect(hero).toHaveAttribute('fetchpriority', 'high');
      await expect(hero).not.toHaveAttribute('loading', 'lazy');
      const art = await page.locator('main img, footer img').evaluateAll((images) =>
        images
          .filter((image) => !image.closest('section[aria-labelledby="hero-title"]'))
          .map((image) => ({ loading: image.getAttribute('loading'), alt: image.getAttribute('alt'), width: image.getAttribute('width'), height: image.getAttribute('height') })),
      );
      // Five territories, three steps and Turismo Vivo; the footer's horizon and mark
      expect(art).toHaveLength(11);
      for (const image of art) expect(image).toMatchObject({ loading: 'lazy', alt: '', width: expect.stringMatching(/^\d+$/), height: expect.stringMatching(/^\d+$/) });
    });

    test('the hero buttons jump to the sign-up form and to the allies', async ({ page }) => {
      await page.goto(`/${locale}`);

      await expect(page.getByRole('link', { name: Prelaunch.cta, exact: true })).toHaveAttribute('href', '#lista');
      await expect(page.getByRole('link', { name: Prelaunch.ctaAllies, exact: true })).toHaveAttribute('href', '#allies');
      await expect(page.getByRole('link', { name: Prelaunch.tourismLink, exact: true })).toHaveAttribute('href', '#lista');
      await expect(page.locator('#lista')).toHaveCount(1);
      await expect(page.locator('#allies')).toHaveCount(1);
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
      await expect(page.getByRole('button', { name: Prelaunch.copyEmail, exact: true })).toBeVisible();
    });

    test('the copy button puts the address on the clipboard and says so, politely', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      const allies = page.locator('section[aria-labelledby="allies-title"]');

      await allies.getByRole('button', { name: Prelaunch.copyEmail, exact: true }).click();
      await expect(allies.getByRole('button', { name: Prelaunch.copiedEmail, exact: true })).toBeVisible();
      await expect(allies.locator('[aria-live="polite"]')).toHaveText(Prelaunch.copiedEmail);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(Prelaunch.allies.email.address);
    });

    test('the FAQ answers its six questions as an accordion, and the data answer links the policy', async ({ page }) => {
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      const faq = page.locator('#faq');

      await expect(faq.getByRole('heading', { level: 3 })).toHaveText(questions.map((question) => Prelaunch.faq[question].q));
      const data = faq.getByRole('button', { name: Prelaunch.faq.data.q, exact: true });
      await expect(data).toHaveAttribute('aria-expanded', 'false');
      await data.click();
      await expect(data).toHaveAttribute('aria-expanded', 'true');
      const answer = faq.getByRole('region', { name: Prelaunch.faq.data.q });
      await expect(answer).toContainText(Prelaunch.faq.data.a);
      await expect(answer.getByRole('link', { name: Prelaunch.privacyLink, exact: true })).toHaveAttribute('href', privacyPaths[locale]);
    });

    // The Who section folded into the FAQ's first answer and the footer
    test('names the foundation in the FAQ and in the footer', async ({ page }) => {
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      const faq = page.locator('#faq');

      await faq.getByRole('button', { name: Prelaunch.faq.what.q, exact: true }).click();
      await expect(faq.getByRole('region', { name: Prelaunch.faq.what.q })).toContainText(Prelaunch.who.legalName);
      await expect(page.getByRole('contentinfo')).toContainText(Prelaunch.who.legalName);
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
      for (const href of hrefs) {
        const { pathname } = new URL(href);
        const response = await request.get(pathname, { maxRedirects: 0 });
        // x-default is the unprefixed root: the proxy answers a 307 to the browser's language (a post-launch item with the shell's owner)
        if (pathname === '/') {
          expect(response.status(), href).toBe(307);
          expect(['/es', '/en']).toContain(new URL(response.headers().location ?? '', site).pathname);
        } else expect(response.status(), href).toBe(200);
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
  test.describe(`/${locale} text contrast on the real pixels`, () => {
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

      // Text beside the art (Turismo Vivo), under it (a territory) and on the footer's dark band, whose tokens re-resolve there
      test(`the text beside and under the art, and on the dark footer, keeps 7:1 at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);

        const groups = [
          ['#tourism-title ~ p.t-body-lg', '#places li:first-child p', '#places li:last-child h3'],
          ['footer p.t-body-lg', 'footer nav li:first-child a'],
        ];
        for (const [index, targets] of groups.entries()) {
          // The footer waits under the curtain until the end of the scroll
          if (index === 1) await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          for (const selector of targets) {
            await page.locator(selector).scrollIntoViewIfNeeded();
            const text = await textColor(page, selector);
            await page.addStyleTag({ content: `${selector} { color: transparent !important; }` });
            const worst = Math.min(...(await backdrop(page, selector)).map((pixel) => contrastRatio(text, pixel)));
            expect(worst, `${selector} worst pixel contrast`).toBeGreaterThanOrEqual(7);
          }
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

    test(`/${locale} shows every FAQ answer as a plain list, to people and to assistive technology`, async ({ page }) => {
      const { Prelaunch } = messages[locale];
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      const faq = page.locator('#faq');
      const list = faq.locator('dl');

      // The accordion cannot open without scripts, so it gives way to the list
      await expect(faq.locator('.mantine-Accordion-root')).toBeHidden();
      await expect(list.locator('dt')).toHaveText(questions.map((question) => Prelaunch.faq[question].q));
      for (const question of questions) {
        const answer = list.getByText(Prelaunch.faq[question].a, { exact: true });
        await expect(answer).toBeVisible();
        // Visible is not enough: a closed panel's text is also aria-hidden, inert and transparent
        expect(await answer.evaluate((element) => ({ hidden: !!element.closest('[aria-hidden="true"], [inert]'), opacity: getComputedStyle(element).opacity }))).toEqual({ hidden: false, opacity: '1' });
      }
      await expect(list.getByRole('link', { name: Prelaunch.privacyLink, exact: true })).toHaveAttribute('href', privacyPaths[locale]);
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

// Down the page half a window at a time, so every lazy piece is requested, then back to the top
const scrollThrough = (page: Page) =>
  page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo(0, 0);
  });

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

    test('every lazy piece keeps its box when its image never arrives', async ({ page }) => {
      await watchLayoutShift(page);
      await page.route(/\/_next\/image/, (route) => route.abort());
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const before = await page.evaluate(() => document.documentElement.scrollHeight);
      await scrollThrough(page);
      await page.waitForLoadState('networkidle');

      const pieces = await page.locator('main img[loading="lazy"], footer img[src*="/_next/image"]').evaluateAll((images) =>
        (images as HTMLImageElement[]).map((image) => ({ failed: image.complete && image.naturalWidth === 0, height: image.getBoundingClientRect().height })),
      );
      // Nine pieces in main and the footer's horizon (its mark is a static SVG, not an optimised image)
      expect(pieces).toHaveLength(10);
      for (const { failed, height } of pieces) {
        expect(failed, 'the piece really failed').toBe(true);
        expect(height, 'a failed piece keeps the height its file gives it').toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before);
      expect(await layoutShift(page)).toBeLessThanOrEqual(0.1);
    });

    test('the layout shift stays within 0.1 while the lazy art arrives', async ({ page }) => {
      await watchLayoutShift(page);
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await scrollThrough(page);
      await page.waitForLoadState('networkidle');

      expect(await page.locator('main img, footer img').evaluateAll((images) => (images as HTMLImageElement[]).filter((image) => !image.complete).length)).toBe(0);
      expect(await layoutShift(page)).toBeLessThanOrEqual(0.1);
    });
  });
}

for (const locale of locales) {
  test(`/${locale} keeps every section in its column and every label in its button at 320 px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);

    // The page inset is 24 px a side: no text and no control may run past it, whatever a long word does. The bands' surfaces and
    // the hero art are full-bleed on purpose, so the check reads what sits in them
    const rights = await page
      .locator('main :is(h1, h2, h3, p, li, dt, dd, label, a, button, input)')
      .evaluateAll((elements) => elements.filter((element) => element.getClientRects().length > 0).map((element) => [element.textContent?.slice(0, 40), element.getBoundingClientRect().right] as const));
    for (const [text, right] of rights) expect(right, text ?? '').toBeLessThanOrEqual(296.01);
    const clipped = await page.locator('h1, .mantine-Button-label').evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth).map((element) => element.textContent));
    expect(clipped, 'text wider than its box').toEqual([]);
  });
}

for (const locale of locales) {
  const { Prelaunch } = messages[locale];

  test.describe(`/${locale} reading and keyboard`, () => {
    test('the verbs and the territories keep their list roles and the paragraphs keep a readable measure', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}`);

      await expect(page.getByRole('main').locator('ul[role="list"][aria-label]')).toHaveCount(2);
      await expect(page.getByRole('list', { name: Prelaunch.thesis.verbsLabel, exact: true }).getByRole('listitem')).toHaveText(
        (['listen', 'recognize', 'connect', 'build'] as const).map((verb) => Prelaunch.thesis.verbs[verb]),
      );
      const leads = ['#hero-title + p', '#thesis-title + p', '#places-title + p', '#method-title + p', '#tourism-title ~ p.t-body-lg', '#allies-title + p', '#list-title + p'];
      for (const selector of leads) {
        const paragraph = await page.locator(selector).first().boundingBox();
        if (!paragraph) throw new Error(`${selector} has no paragraph`);
        // 36em of the paragraph's own 18 px type is 648 px: about 70 characters a line (it was 48em, 864 px)
        expect(paragraph.width, selector).toBeLessThanOrEqual(649);
      }
    });

    test('tab goes from the hero button through the allies, the copy control and the FAQ to the form, with a visible focus ring', async ({ page }) => {
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

      // Closed FAQ panels are inert: their policy link is skipped until its question opens
      const order: string[] = [];
      for (let step = 0; step < 12; step++) {
        await page.keyboard.press('Tab');
        order.push(
          await page.evaluate(() => {
            const element = document.activeElement;
            return element?.getAttribute('href') ?? (element?.tagName === 'BUTTON' ? `button:${element.textContent?.trim()}` : (element?.tagName ?? ''));
          }),
        );
      }
      expect(order.map((href) => (href.startsWith('https://wa.me') ? 'whatsapp' : href.startsWith('mailto:') ? 'email' : href))).toEqual([
        '#allies',
        '#lista',
        'whatsapp',
        'email',
        `button:${Prelaunch.copyEmail}`,
        ...questions.map((question) => `button:${Prelaunch.faq[question].q}`),
        'INPUT',
      ]);
    });
  });
}
