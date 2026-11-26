import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test as base, type BrowserContext, expect, type Page, type Request, type Response } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { routing } from '../src/i18n/routing';
import { events } from '../src/modules/analytics/catalog';
import { goalOf, proxyPaths, scriptTags } from '../src/modules/analytics/plausible';
import { confirmTtlMs, sealToken } from '../src/modules/waitlist/token';
import { testTokenKey } from './fixtures';
import { pathFor } from './pages';

// Our real per-site script, on real requests. The browser believes it is on the production host, so the server must be the local one:
// Chromium connects directly and maps the test hosts to it and every other name to nothing, every lab first proves that on a name only the
// mapping resolves, and each navigation checks where its document came from.
// Never route.fetch, page.request, the request fixture or Node's fetch here: Node's network ignores the browser's resolver rules

const messages = { es, en };
const site = 'http://www.rutaopta.org';
// Chromium preloads HSTS for the whole .app TLD, so a real preview name (deploy123--rutaopta.netlify.app) is upgraded to HTTPS, which the
// local server cannot answer. The snippet compares the exact host name, so the same name on the reserved .test TLD proves the same
const preview = 'http://deploy123--rutaopta.netlify.test';
const testOrigins = [site, preview];
const localServer = { ipAddress: '127.0.0.1', port: 3100 };
const resolverRules = [
  ...testOrigins.map((origin) => `MAP ${new URL(origin).hostname} ${localServer.ipAddress}:${localServer.port}`),
  'MAP * ~NOTFOUND',
  'EXCLUDE localhost',
  'EXCLUDE 127.0.0.1',
].join(',');
// Direct connections only: through a proxy, the proxy resolves the names and the mapping never runs. Both browsers launch with these
const chromiumArgs = ['--proxy-server=direct://', `--host-resolver-rules=${resolverRules}`];
// The first page of every lab: no public resolver knows the name, so it loads only if the mapping is in force, before a live name is requested.
// A text file runs no script, and nothing is recorded yet
const gate = `${preview}/robots.txt`;

const adapter = scriptTags(proxyPaths.script, new URL(site).hostname);
if (!adapter) throw new Error('The adapter renders no tags for the first-party script path');
// The adapter's own stub with no transformRequest: what would be sent without the sanitiser
const stubEnd = adapter.init.indexOf('plausible.init({');
if (stubEnd < 1) throw new Error('The init snippet no longer starts with the stub');
const bareInit = `${adapter.init.slice(0, stubEnd)}plausible.init(${JSON.stringify({ endpoint: proxyPaths.event })})`;
const pinned = readFileSync(join(__dirname, 'vendor', 'plausible-site-script.js.txt'), 'utf8');
const builtInConfig = 'endpoint:"https://plausible.io/api/event",domain:"rutaopta.org"';
const automatic = ['Outbound Link: Click', 'File Download', 'Form: Submission'];

type Payload = { n: string; u: string; r?: string | null; p?: { url?: string } };
type Seen = { method: string; url: string; headers: Record<string, string>; body: string };
type Tracker = ((name: string, options: { callback: (result?: { status: number }) => void }) => void) & { l?: boolean };
type Tracked = { plausible?: Tracker };

const isVendor = (hostname: string) => hostname === 'plausible.io' || hostname.endsWith('.plausible.io');
const analyticsPaths = new Set<string>(Object.values(proxyPaths));
const isAnalytics = (address: string) => {
  const url = new URL(address);
  return isVendor(url.hostname) || (testOrigins.includes(url.origin) && analyticsPaths.has(url.pathname));
};
const isEvent = ({ method, url }: Seen) => method === 'POST' && testOrigins.includes(new URL(url).origin) && new URL(url).pathname === proxyPaths.event;
const pathOf = (address: string) => new URL(address).pathname;
const slow = expect.configure({ timeout: 30_000 });

// args: what the browser was launched with, which a Browser object cannot tell
const makeLab = async (page: Page, context: BrowserContext, args: readonly string[]) => {
  // Before any navigation: only Chromium reads these switches
  if (context.browser()?.browserType().name() !== 'chromium') throw new Error('This spec needs Chromium: it reads the resolver rules');
  const missing = chromiumArgs.filter((arg) => !args.includes(arg));
  if (missing.length > 0) throw new Error(`The browser was launched without ${missing.join(' ')}`);

  const vendorRequests: string[] = [];
  const pageErrors: string[] = [];
  const requests: Request[] = [];
  const documents: Request[] = [];
  const vetted = new Set<Request>();
  const payloads: Payload[] = [];

  context.on('request', (request) => {
    if (isVendor(new URL(request.url()).hostname)) vendorRequests.push(request.url());
  });
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });
  // Nothing leaves the test hosts, localhost included, so a request the spec forgot to aim reaches nothing
  await context.route('**/*', (route) => (testOrigins.includes(new URL(route.request().url()).origin) ? route.continue() : route.abort()));

  const isTestPath = (path: string) => (url: URL) => testOrigins.includes(url.origin) && url.pathname === path;

  const inject = async ({ init = adapter.init, script = pinned }: { init?: string; script?: string } = {}) => {
    await page.route(isTestPath(adapter.src), (route) => route.fulfill({ contentType: 'application/javascript', body: script }));
    await page.route(isTestPath(proxyPaths.event), (route) => {
      payloads.push(JSON.parse(route.request().postData() ?? '') as Payload);
      return route.fulfill({ status: 202 });
    });
    // What production renders, before the page's own scripts; __plausible lifts the tracker's automation check
    await page.addInitScript({ content: `window.__plausible = true;\n${init}` });
    await page.addInitScript((src) => {
      const append = (head: HTMLHeadElement) => head.append(Object.assign(document.createElement('script'), { async: true, src }));
      const head = document.querySelector('head');
      if (head) return append(head);
      const observer = new MutationObserver(() => {
        const parsed = document.querySelector('head');
        if (!parsed) return;
        observer.disconnect();
        append(parsed);
      });
      observer.observe(document, { childList: true, subtree: true });
    }, adapter.src);
  };

  // The only way a test opens a page: its document must come from the local server before anything is done on it
  const open = async (address: string): Promise<Response> => {
    const response = await page.goto(address, { waitUntil: 'commit' });
    if (!response) throw new Error(`No response for ${address}`);
    expect(await response.serverAddr(), `the server that answered ${address}`).toEqual(localServer);
    vetted.add(response.request());
    expect(response.status(), address).toBe(200);
    await page.waitForLoadState('load');
    return response;
  };

  // Fails closed: with no mapping, or a proxy in the way, this throws before anything asks for a live name
  await open(gate);
  context.on('request', (request) => requests.push(request));

  const expectVetted = () =>
    expect(documents.filter((request) => !vetted.has(request)).map((request) => request.url()), 'documents opened without the address check').toEqual([]);

  const seen = () =>
    Promise.all(
      requests.map(async (request) => ({ method: request.method(), url: request.url(), headers: await request.allHeaders(), body: request.postData() ?? '' })),
    );

  const verify = () => {
    expect(vendorRequests, 'requests to the vendor').toEqual([]);
    expect(pageErrors, 'page errors').toEqual([]);
    expectVetted();
  };

  return { inject, open, expectVetted, seen, verify, payloads: () => payloads };
};

type Lab = Awaited<ReturnType<typeof makeLab>>;

// Automatic, so every test's browser passes the gate before its body runs, whether or not it asks for the lab
const test = base.extend<{ lab: Lab }>({
  lab: [
    async ({ page, context, launchOptions, connectOptions }, provide) => {
      if (connectOptions) throw new Error('A remote browser ignores the launch switches this spec depends on');
      const lab = await makeLab(page, context, launchOptions.args ?? []);
      await provide(lab);
      lab.verify();
    },
    { auto: true },
  ],
});

test.use({ baseURL: site, launchOptions: { args: chromiumArgs } });

// The DOM and the requests are the same under high contrast
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name.endsWith('-hc')));
test.describe.configure({ timeout: 120_000 });

const seal = (locale: keyof typeof messages) =>
  sealToken(
    'confirm',
    { email: 'ana@example.com', name: 'Ana', locale, consentAt: 0, policyVersion: 'test' },
    { current: Buffer.from(testTokenKey, 'base64') },
    confirmTtlMs,
  );

const arrived = (lab: Lab, name: string, path: string) =>
  slow.poll(() => lab.payloads().some(({ n, u }) => n === name && pathOf(u) === path), { message: `${name} for ${path}` }).toBe(true);

const initialised = (page: Page) => page.evaluate(() => (window as unknown as Tracked).plausible?.l === true);

// The tracker answers every call: undefined when transformRequest dropped the event, { status } once it was sent
const probe = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ status: number } | undefined>((resolve) => {
        const { plausible } = window as unknown as Tracked;
        if (!plausible) throw new Error('The tracker is not loaded');
        plausible('Probe', { callback: resolve });
      }),
  );

// The tab goes to the background and comes back, as when a person switches apps: the tracker sends an engagement
const hide = (page: Page) =>
  page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });

const languageLink = (page: Page, from: keyof typeof messages, to: keyof typeof messages) =>
  page
    .getByRole('navigation', { name: messages[from].SiteShell.languageNav, exact: true })
    .getByRole('link', { name: `${to.toUpperCase()} ${messages[from].SiteShell.languages[to]}`, exact: true });

// Every analytics request is read whole, and every request's Referer. The page's own requests carry the token in their address or body by
// design (the switch keeps it, the form posts it), so only their Referer is read
const inspect = (requests: Seen[], token: string) => {
  const checked = requests.filter(isEvent).map(({ body }) => JSON.parse(body) as Payload);
  const leaks = requests.flatMap(({ method, url, headers, body }) => {
    const request = `${method} ${url}`;
    if (!isAnalytics(url)) return (headers.referer ?? '').includes(token) ? [`the Referer of ${request} holds the token`] : [];
    return [
      ...(url.includes(token) ? [`the address of ${request} holds the token`] : []),
      ...Object.entries(headers)
        .filter(([, value]) => value.includes(token))
        .map(([name]) => `the ${name} header of ${request} holds the token`),
      ...(body.includes(token) ? [`the body of ${request} holds the token`] : []),
    ];
  });
  // Parsed, not searched: a search for t= also finds utm_content=
  const withT = checked.flatMap(({ n, u, r, p }) =>
    Object.entries({ u, r, 'p.url': p?.url })
      .filter(([, address]) => typeof address === 'string' && URL.parse(address, site)?.searchParams.has('t'))
      .map(([field]) => `${field} of "${n}" has a t parameter`),
  );
  return { checked, leaks: [...leaks, ...withT] };
};

const expectNothingStored = async (page: Page) => {
  expect(await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]), 'stored keys').toEqual([]);
  expect((await page.context().cookies()).map(({ name }) => name).filter((name) => name !== 'NEXT_LOCALE'), 'cookies').toEqual([]);
};

test('smoke: the confirm page comes from the local server with its own referrer header, the script initialises, a pageview is captured', async ({
  page,
  lab,
}) => {
  await lab.inject();
  const confirm = pathFor('es', '/confirm');
  const response = await lab.open(`${confirm}?t=${seal('es')}&utm_source=email`);

  expect(response.headers()['referrer-policy']).toBe('no-referrer');
  await slow.poll(() => initialised(page)).toBe(true);
  await arrived(lab, 'pageview', confirm);
});

// What Zoho appends when it redirects here after an unsubscribe is unknown: a made-up value stands in for it
for (const locale of routing.locales) {
  const unsubscribed = pathFor(locale, '/unsubscribed');
  const home = pathFor(locale, '/');

  test(`no Referer from ${unsubscribed} carries what its address holds, and ${home}, with the sign-up, keeps the default policy`, async ({
    page,
    lab,
  }) => {
    const appended = `appended-${crypto.randomUUID()}`;
    await lab.inject();
    const response = await lab.open(`${unsubscribed}?contact=${appended}`);

    // Soft, so that a missing header still shows which requests would carry the address
    expect.soft(response.headers()['referrer-policy']).toBe('no-referrer');
    await arrived(lab, 'pageview', unsubscribed);
    await hide(page);
    await arrived(lab, 'engagement', unsubscribed);
    expect(inspect(await lab.seen(), appended).leaks).toEqual([]);

    expect((await lab.open(`${home}?utm_source=email`)).headers()['referrer-policy']).toBeUndefined();
  });
}

for (const locale of routing.locales) {
  const other = routing.locales.find((candidate) => candidate !== locale) ?? locale;
  const confirm = pathFor(locale, '/confirm');
  const switched = pathFor(other, '/confirm');
  const confirmed = pathFor(other, '/confirmed');
  const home = pathFor(locale, '/');

  test.describe(`from ${confirm}`, () => {
    test(`the token never reaches analytics, confirming counts a pageview of ${confirmed}, and nothing is stored`, async ({ page, lab }) => {
      const token = seal(locale);
      await lab.inject();
      const response = await lab.open(`${confirm}?t=${token}&utm_source=email`);
      // The server's own header, not one the test wrote
      expect(response.headers()['referrer-policy']).toBe('no-referrer');
      await arrived(lab, 'pageview', confirm);
      await page.evaluate(() => Object.assign(window, { stays: true }));

      // A client-side navigation whose address carries the token; it sends the engagement for the page it leaves
      await languageLink(page, locale, other).click();
      await arrived(lab, 'pageview', switched);
      await arrived(lab, 'engagement', confirm);
      await hide(page);
      await arrived(lab, 'engagement', switched);

      lab.expectVetted();
      await page.getByRole('button', { name: messages[other].Confirm.submit }).click();
      await arrived(lab, 'pageview', confirmed);
      expect(await page.evaluate(() => 'stays' in window), 'the confirm redirect is a client-side navigation').toBe(true);

      const { checked, leaks } = inspect(await lab.seen(), token);
      expect(leaks).toEqual([]);
      const landing = checked.find(({ n, u }) => n === 'pageview' && pathOf(u) === confirm);
      expect(landing && Object.fromEntries(new URL(landing.u).searchParams)).toEqual({ utm_source: 'email' });
      expect(checked.filter(({ n, u }) => n === 'engagement' && [confirm, switched].includes(pathOf(u))).length).toBeGreaterThan(0);
      await expectNothingStored(page);
    });

    test('the same check reports the token when the init has no transformRequest', async ({ lab }) => {
      const token = seal(locale);
      await lab.inject({ init: bareInit });
      await lab.open(`${confirm}?t=${token}&utm_source=email`);
      await arrived(lab, 'pageview', confirm);

      const { leaks } = inspect(await lab.seen(), token);
      expect(leaks).toEqual(
        expect.arrayContaining([expect.stringMatching(/^the body of POST .*\/o\/e holds the token$/), 'u of "pageview" has a t parameter']),
      );
    });

    // Playwright 1.65 sees no keepalive request sent while a document unloads (not its routes, not its request events): it goes straight to the
    // network. So this test runs its own browser with Chromium's NetLog, which records every request and the bytes written on each socket
    test('the event sent while the page leaves carries no token, read on the wire', async ({ playwright }, testInfo) => {
      const netlog = testInfo.outputPath('netlog.json');
      const token = seal(locale);
      const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use;
      const args = [...chromiumArgs, `--log-net-log=${netlog}`, '--net-log-capture-mode=Everything'];
      const browser = await playwright.chromium.launch({ args });
      const intercepted = await (async () => {
        try {
          const context = await browser.newContext({ baseURL: site, viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });
          const page = await context.newPage();
          const lab = await makeLab(page, context, args);
          await lab.inject();
          await lab.open(`${confirm}?t=${token}&utm_source=email`);
          await arrived(lab, 'pageview', confirm);
          await lab.open(home);
          await arrived(lab, 'pageview', home);
          lab.verify();
          const requests = await lab.seen();
          await context.close();
          return requests;
        } finally {
          await browser.close();
        }
      })();

      const { addresses, sockets, requests: wire } = readNetLog(netlog);
      // The context route cannot abort what interception never sees: here the resolver rules are what keep every request local
      expect(addresses.length, 'requests started').toBeGreaterThan(0);
      expect(addresses.filter((address) => !testOrigins.includes(URL.parse(address)?.origin ?? address)), 'requests started elsewhere').toEqual([]);
      expect(sockets.filter((address) => address !== `${localServer.ipAddress}:${localServer.port}`), 'connections elsewhere').toEqual([]);
      // Whichever way it was caught, the engagement for the page left is among the requests checked
      const { checked, leaks } = inspect([...intercepted, ...wire], token);
      expect(checked.filter(({ n, u }) => n === 'engagement' && pathOf(u) === confirm).length, 'the engagement sent while leaving').toBe(1);
      expect(leaks).toEqual([]);
    });
  });

  test(`every tag on ${home} is read by the vendor's parser from each of its innermost nodes`, async ({ page, lab }) => {
    await lab.inject();
    await lab.open(home);
    await arrived(lab, 'pageview', home);

    const all = await page.evaluateHandle(() => [...document.querySelectorAll('*')]);
    const classes = await all.evaluate((elements) => elements.map((element) => ({ tagName: element.tagName, className: element.getAttribute('class') ?? '' })));
    const tagged = classes.flatMap(({ tagName, className }, index) => {
      const goal = goalOf({ class: className });
      return goal === undefined || tagName === 'FORM' ? [] : [{ index, goal }];
    });
    const leaves = await all.evaluateHandle(
      (elements, indices) =>
        indices.map((index) => {
          const inner = [...elements[index].querySelectorAll('*')].filter((node) => node.childElementCount === 0);
          return inner.length > 0 ? inner : [elements[index]];
        }),
      tagged.map(({ index }) => index),
    );
    const leafTags = await leaves.evaluate((lists) => lists.map((list) => list.map((node) => node.tagName.toLowerCase())));
    // Runs after the tracker's listener on document, and keeps the page where it is
    await page.evaluate(() => window.addEventListener('click', (event) => event.preventDefault()));

    const named = () => lab.payloads().filter(({ n }) => n !== 'pageview' && n !== 'engagement');
    const heard: { goal: string; leaf: string; name: string }[] = [];
    for (const [element, { goal }] of tagged.entries()) {
      for (const [position, leaf] of leafTags[element].entries()) {
        const before = named().length;
        await leaves.evaluate(
          (lists, [list, item]) => {
            const node = lists[list][item];
            if (node instanceof HTMLElement) node.click();
            else node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          },
          [element, position] as const,
        );
        await slow.poll(() => named().length, { message: `"${goal}" from a click on its <${leaf}>` }).toBeGreaterThan(before);
        heard.push({ goal, leaf, name: named()[before].n });
      }
    }

    expect(heard.filter(({ goal, name }) => goal !== name)).toEqual([]);
    // Answered after the last click's event: one event per click, no more
    expect(await probe(page)).toEqual({ status: 202 });
    expect(named().length).toBe(heard.length + 1);
    const signup = events['signup-submit'].goal;
    expect([...new Set(heard.map(({ name }) => name))].sort()).toEqual(
      Object.values(events)
        .map(({ goal }) => goal)
        .filter((goal) => goal !== signup)
        .sort(),
    );
  });

  test(`a sign-up on ${home} still completes with the script loaded, counted once, and nothing typed is sent`, async ({ page, lab }) => {
    const { Waitlist } = messages[locale];
    const name = 'Quorvantine';
    const email = `requests.${crypto.randomUUID()}@example.com`;
    await lab.inject();
    await lab.open(home);
    await arrived(lab, 'pageview', home);

    lab.expectVetted();
    await page.getByLabel(Waitlist.name.label).fill(name);
    await page.getByLabel(Waitlist.email.label, { exact: true }).fill(email);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: Waitlist.submit }).click();
    await expect(page.getByRole('status')).toContainText(Waitlist.sent.text);

    expect(await probe(page)).toEqual({ status: 202 });
    expect(lab.payloads().filter(({ n }) => n === events['signup-submit'].goal)).toHaveLength(1);
    const typed = [name, email, encodeURIComponent(email)];
    const carried = (await lab.seen())
      .filter(({ url }) => isAnalytics(url))
      .flatMap(({ method, url, headers, body }) =>
        typed.filter((value) => [url, body, ...Object.values(headers)].some((part) => part.includes(value))).map((value) => `${method} ${url} carries ${value}`),
      );
    expect(carried).toEqual([]);
    await expectNothingStored(page);
  });
}

test.describe('with the automatic measurements switched on in the script', () => {
  const hostile = pinned.replace(builtInConfig, `${builtInConfig},outboundLinks:!0,fileDownloads:!0,formSubmissions:!0`);
  const confirm = pathFor('es', '/confirm');

  for (const { label, init, expected } of [
    { label: "the adapter's snippet sends none of them", init: adapter.init, expected: [] },
    { label: 'a bare init sends all three (control)', init: bareInit, expected: automatic },
  ]) {
    test(label, async ({ page, lab }) => {
      expect(pinned.split(builtInConfig).length - 1, 'the built-in config in the pinned script').toBe(1);
      await lab.inject({ init, script: hostile });
      await lab.open(`${confirm}?t=${seal('es')}`);
      await arrived(lab, 'pageview', confirm);

      // Untagged links, clicked where they cannot navigate
      await page.evaluate(() => {
        const stay = (event: Event) => event.preventDefault();
        window.addEventListener('click', stay);
        for (const href of ['https://example.com/elsewhere', '/files/guide.pdf']) {
          const link = Object.assign(document.createElement('a'), { href, textContent: href });
          document.body.append(link);
          link.click();
        }
        window.removeEventListener('click', stay);
      });
      lab.expectVetted();
      await page.getByRole('button', { name: es.Confirm.submit }).click();
      await arrived(lab, 'pageview', pathFor('es', '/confirmed'));

      await slow.poll(() => automatic.filter((name) => lab.payloads().some(({ n }) => n === name))).toEqual(expected);
    });
  }
});

test('on any other host the script loads and sends nothing', async ({ page, lab }) => {
  await lab.inject();
  await lab.open(`${preview}${pathFor('es', '/')}`);
  await slow.poll(() => initialised(page)).toBe(true);

  expect(await probe(page)).toBeUndefined();
  expect((await lab.seen()).filter(isEvent).map(({ url }) => url)).toEqual([]);
});

type NetLog = {
  constants: { logEventTypes: Record<string, number> };
  events: { type: number; source: { id: number }; params?: { bytes?: string; remote_address?: string; url?: string } }[];
};

// HTTP/1.1 requests, one after another on a kept-alive socket
const parseRequests = (stream: Buffer): Seen[] => {
  const end = stream.indexOf('\r\n\r\n');
  if (end < 0) return [];
  const [line = '', ...fields] = stream.subarray(0, end).toString('latin1').split('\r\n');
  const headers = Object.fromEntries(fields.map((field) => [field.slice(0, field.indexOf(':')).toLowerCase(), field.slice(field.indexOf(':') + 1).trim()]));
  const next = end + 4 + Number(headers['content-length'] ?? 0);
  const [method = '', target = ''] = line.split(' ');
  const request = { method, url: new URL(target, `http://${headers.host}`).href, headers, body: stream.subarray(end + 4, next).toString('utf8') };
  return [request, ...parseRequests(stream.subarray(next))];
};

// Every address Chromium started a request for, even one that never got a socket; what it wrote on each socket; where each socket connected
const readNetLog = (file: string) => {
  const { constants, events: entries } = JSON.parse(readFileSync(file, 'utf8')) as NetLog;
  const { URL_REQUEST_START_JOB: started, SOCKET_BYTES_SENT: sent, TCP_CONNECT: connect } = constants.logEventTypes;
  const streams = new Map<number, Buffer[]>();
  for (const { type, source, params } of entries) {
    if (type === sent && params?.bytes) streams.set(source.id, [...(streams.get(source.id) ?? []), Buffer.from(params.bytes, 'base64')]);
  }
  return {
    addresses: entries.flatMap(({ type, params }) => (type === started && params?.url ? [params.url] : [])),
    sockets: entries.flatMap(({ type, params }) => (type === connect && params?.remote_address ? [params.remote_address] : [])),
    requests: [...streams.values()].flatMap((chunks) => parseRequests(Buffer.concat(chunks))),
  };
};
