import { expect, type Page, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { routing } from '../src/i18n/routing';
import { events } from '../src/modules/analytics/catalog';
import { goalOf } from '../src/modules/analytics/plausible';
import { violation } from '../src/modules/analytics/policy';
import { confirmTtlMs, sealToken } from '../src/modules/waitlist/token';
import { testTokenKey } from './fixtures';
import { pages, pathFor } from './pages';

const messages = { es, en };
const activeGoals: string[] = Object.values(events).map(({ goal }) => goal);

const seal = (locale: keyof typeof messages, now?: number) =>
  sealToken(
    'confirm',
    { email: 'ana@example.com', name: 'Ana', locale, consentAt: 0, policyVersion: 'test' },
    { current: Buffer.from(testTokenKey, 'base64') },
    confirmTtlMs,
    now,
  );

// Every page, and every state that offers a way on. Each state is asserted before it is read, so none passes by not rendering
const walk = async (page: Page, javaScript: boolean, visit: (state: string) => Promise<void>) => {
  const open = async (path: string) => {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
  };
  const heading = page.getByRole('heading', { level: 1 });

  for (const { path } of pages) {
    await open(path);
    await visit(path);
  }

  for (const locale of routing.locales) {
    const { Confirm, Waitlist } = messages[locale];
    const confirm = pathFor(locale, '/confirm');
    const greeting = page.getByText(Confirm.greeting.replace('{name}', 'Ana'));

    await open(`${confirm}?t=${seal(locale)}`);
    await expect(greeting).toBeVisible();
    await visit(`${confirm} (valid token)`);
    await open(`${confirm}?t=${seal(locale, 0)}`);
    await expect(heading).toHaveText(Confirm.expired.title);
    await visit(`${confirm} (expired token)`);
    await open(`${confirm}?t=broken`);
    await expect(heading).toHaveText(Confirm.invalid.title);
    await visit(`${confirm} (broken token)`);

    const home = pathFor(locale, '/');
    await open(home);
    await page.getByLabel(Waitlist.name.label).fill('Ana');
    // A new address each time: the throttle counts attempts per address
    await page.getByLabel(Waitlist.email.label, { exact: true }).fill(`analytics.${crypto.randomUUID()}@example.com`);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: Waitlist.submit }).click();
    await expect(page.getByRole('status')).toContainText(Waitlist.sent.text);
    await visit(`${home} (signed up)`);

    // Only the island's answer: without JavaScript the same expiry renders the expired page, walked above
    if (!javaScript) continue;
    // Valid when the page opens, expired by the time the button is clicked
    const expiresAt = Date.now() + 10_000;
    await open(`${confirm}?t=${seal(locale, expiresAt - confirmTtlMs)}`);
    await expect(greeting).toBeVisible();
    await page.waitForTimeout(Math.max(0, expiresAt - Date.now() + 500));
    await page.getByRole('button', { name: Confirm.submit }).click();
    await expect(page.getByRole('link', { name: Confirm.again })).toBeVisible();
    await visit(`${confirm} (expired after opening)`);
  }
};

// Raw attributes only, as written: policy.ts judges the written href, and an SVG element's className is not a string
const elementsOf = (page: Page) =>
  page.locator('*').evaluateAll((elements) =>
    elements.map((element) => ({
      html: (element.cloneNode(false) as Element).outerHTML,
      isLink: element.matches('a[href]'),
      href: element.getAttribute('href') ?? undefined,
      inNav: element.closest('nav') !== null,
      optedOut: element.hasAttribute('data-no-event'),
      attributes: Object.fromEntries(
        [...element.attributes].filter(({ name }) => name === 'class' || name.startsWith('data-')).map(({ name, value }) => [name, value]),
      ),
    })),
  );

const isAnalytics = ({ hostname, pathname }: URL) => hostname === 'plausible.io' || hostname.endsWith('.plausible.io') || pathname.startsWith('/o/');

// The DOM is the same under high contrast
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name.endsWith('-hc')));

// Nothing leaves the test server
test.beforeEach(async ({ context, baseURL }) => {
  const { origin } = new URL(String(baseURL));
  await context.route('**/*', (route) => (new URL(route.request().url()).origin === origin ? route.continue() : route.abort()));
});

// A walk waits twice for a link to expire
test.describe.configure({ timeout: 120_000 });

for (const enabled of [true, false]) {
  test.describe(`with JavaScript ${enabled ? 'on' : 'off'}`, () => {
    test.use({ javaScriptEnabled: enabled });

    test('every rendered page follows the event policy, and the walk sees every active goal', async ({ page }) => {
      const problems: string[] = [];
      const seen = new Set<string>();

      await walk(page, enabled, async (state) => {
        const onPage = new Set<string>();
        for (const { html, isLink, attributes, ...element } of await elementsOf(page)) {
          const goal = goalOf(attributes);
          if (!isLink && goal === undefined) continue;
          const report = (reason: string) => problems.push(`${state}: ${reason} ${html}`);
          const reason = violation({ ...element, goal });
          if (reason) report(reason);
          if (goal === undefined) continue;
          if (!activeGoals.includes(goal)) report(`"${goal}" is not an active goal.`);
          if (onPage.has(goal)) report(`"${goal}" is on the page twice.`);
          onPage.add(goal);
          seen.add(goal);
        }
      });

      expect({ problems, unseen: activeGoals.filter((goal) => !seen.has(goal)) }).toEqual({ problems: [], unseen: [] });
    });

    test('outside production nothing is measured: no script, no request, no cookie or stored key', async ({ page, context }) => {
      const problems: string[] = [];
      context.on('request', (request) => {
        if (isAnalytics(new URL(request.url()))) problems.push(`requested ${request.url()}`);
      });

      await walk(page, enabled, async (state) => {
        const { scripts, keys } = await page.evaluate(() => ({
          scripts: Array.from(document.scripts, (script) => ({ src: script.getAttribute('src'), text: script.textContent })),
          keys: [...Object.keys(localStorage), ...Object.keys(sessionStorage)],
        }));
        for (const { src, text } of scripts) {
          if (src !== null && isAnalytics(new URL(src, page.url()))) problems.push(`${state}: script ${src}`);
          if (text.includes('plausible.init')) problems.push(`${state}: an inline script calls plausible.init`);
        }
        for (const key of keys.filter((name) => name.includes('plausible'))) problems.push(`${state}: stored key ${key}`);
      });

      expect(problems).toEqual([]);
      expect((await context.cookies()).map(({ name }) => name).filter((name) => name !== 'NEXT_LOCALE')).toEqual([]);
    });
  });
}
