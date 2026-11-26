import { expect, type Page, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { routing } from '../src/i18n/routing';
import { type EventId, events } from '../src/modules/analytics/catalog';
import { goalOf } from '../src/modules/analytics/plausible';
import { violation } from '../src/modules/analytics/policy';
import { confirmTtlMs, sealToken } from '../src/modules/waitlist/token';
import { testTokenKey } from './fixtures';
import { pages, pathFor } from './pages';

const messages = { es, en };
const eventsByGoal = new Map<string, (typeof events)[EventId]>(Object.values(events).map((event) => [event.goal, event]));
const activeGoals = [...eventsByGoal.keys()];
// The footer and the floating button are the site's frame, so their goals are owed by every page, not just by one of them
const frameGoals = Object.values(events)
  .filter(({ placement }) => placement === 'footer' || placement === 'floating')
  .map(({ goal }) => goal);

const localeOf = (address: string) => {
  const prefix = new URL(address).pathname.split('/')[1];
  const locale = routing.locales.find((candidate) => candidate === prefix);
  if (!locale) throw new Error(`No locale in ${address}`);
  return locale;
};

// The WhatsApp text or the e-mail subject an event's link must carry, or null for none at all
const writtenFor = (event: (typeof events)[EventId], locale: keyof typeof messages) => {
  const { Prelaunch, SiteShell } = messages[locale];
  const whatsapp = event.channel === 'whatsapp';
  if (event.placement === 'floating') return SiteShell.whatsappFloat.message;
  if (!('allyRoute' in event)) return null;
  if (event.allyRoute === 'other') return whatsapp ? Prelaunch.allies.whatsapp.message : Prelaunch.allies.email.subject;
  const route = Prelaunch.allies.routes[event.allyRoute];
  return whatsapp ? route.message : route.subject;
};

// Whether a goal sits where its catalog entry says, judged by the element as written and the messages, never by page positions.
// A page-channel goal is judged only by the section its link leads to. So a swap of Hero Follow and Tourism Follow passes, and so does an
// extra one of the two on another #lista link, or an extra Hero Ally on another #allies link, if its page does not carry that goal already
const misplacement = (event: (typeof events)[EventId], { tagName, href }: { tagName: string; href?: string }, locale: keyof typeof messages) => {
  const link = href ?? '';
  const fits = {
    page: () => new URL(link, 'https://page.invalid').hash === (event.intent === 'follow' ? '#lista' : '#allies'),
    whatsapp: () => link.startsWith('https://wa.me/'),
    email: () => link.startsWith('mailto:'),
    instagram: () => link === messages[locale].SiteShell.footer.instagramUrl,
    form: () => tagName === 'FORM',
    copy: () => tagName === 'BUTTON' && href === undefined,
  };
  if (!fits[event.channel]()) return `is on the wrong element for intent "${event.intent}", channel "${event.channel}".`;
  if (event.channel !== 'whatsapp' && event.channel !== 'email') return undefined;
  const expected = writtenFor(event, locale);
  const written = new URL(link).searchParams.get(event.channel === 'whatsapp' ? 'text' : 'subject');
  return written === expected ? undefined : `is on a link that says ${JSON.stringify(written)}, not ${JSON.stringify(expected)}.`;
};

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
    // Next's route announcer is an alert too, so the form's is picked by its text
    await expect(page.getByRole('alert').filter({ hasText: Confirm.expired.text })).toBeVisible();
    await expect(page.getByRole('link', { name: Confirm.again })).toBeVisible();
    await visit(`${confirm} (expired after opening)`);
  }
};

// Raw attributes only, as written: policy.ts judges the written href, and an SVG element's className is not a string
const elementsOf = (page: Page) =>
  page.locator('*').evaluateAll((elements) =>
    elements.map((element) => ({
      html: (element.cloneNode(false) as Element).outerHTML,
      tagName: element.tagName,
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

    test('every rendered page follows the event policy, and each active goal is seen where it belongs', async ({ page }) => {
      const problems: string[] = [];
      const seen = new Set<string>();

      await walk(page, enabled, async (state) => {
        const onPage = new Set<string>();
        const locale = localeOf(page.url());
        for (const { html, isLink, attributes, ...element } of await elementsOf(page)) {
          const goal = goalOf(attributes);
          if (!isLink && goal === undefined) continue;
          const report = (reason: string) => problems.push(`${state}: ${reason} ${html}`);
          const reason = violation({ ...element, goal });
          if (reason) report(reason);
          if (goal === undefined) continue;
          const event = eventsByGoal.get(goal);
          const misplaced = event ? misplacement(event, element, locale) : 'is not an active goal.';
          if (misplaced) report(`"${goal}" ${misplaced}`);
          if (onPage.has(goal)) report(`"${goal}" is on the page twice.`);
          onPage.add(goal);
          seen.add(goal);
        }
        for (const goal of frameGoals.filter((name) => !onPage.has(name))) problems.push(`${state}: "${goal}" is missing.`);
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
