import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';
import './support/next-resolution.mjs';

const modules = join(import.meta.dirname, '../apps/landing/src/modules');
const { proxyPaths, goalAttributes, goalOf, initSnippet, scriptTags } = await import(join(modules, 'analytics/plausible.ts'));
const { events } = await import(join(modules, 'analytics/catalog.ts'));
const { sealToken, confirmTtlMs } = await import(join(modules, 'waitlist/token.ts'));

const host = 'www.rutaopta.org';
const origin = `https://${host}`;
// A real token: it travels as ?t=, so looking for the word "token" would prove nothing
const token = sealToken('confirm', { email: 'ana@example.com' }, { current: new Uint8Array(32).fill(7) }, confirmTtlMs);
const confirmPage = `${origin}/es/confirmar?t=${token}`;

// The exact string the page runs, in a fresh context whose window is itself
const load = ({ hostname = host, href = confirmPage, endpoint } = {}) => {
  const context = { URL, URLSearchParams, location: { hostname, href } };
  context.window = context;
  runInContext(initSnippet({ host, endpoint }), createContext(context));
  return context.plausible.o;
};

// Every payload goes through here: whatever the case, nothing that comes out may hold the token.
// The JSON round trip also brings the result out of the vm's realm, which strict deepEqual would reject
const send = (payload, options) => {
  const sent = JSON.stringify(load(options).transformRequest({ n: 'pageview', u: confirmPage, ...payload }));
  assert.ok(!sent.includes(token), `the token left in ${sent}`);
  return JSON.parse(sent);
};

// The DOM calls it class, the markup calls it className
const asDom = ({ className, ...data }) => ({ ...data, class: className });

test('the snippet is the vendor stub and an init call, with an endpoint only when given', () => {
  const stub =
    'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};';
  assert.ok(initSnippet({ host }).startsWith(stub));
  assert.equal(Object.hasOwn(load(), 'endpoint'), false);
  assert.equal(load({ endpoint: proxyPaths.event }).endpoint, '/o/e');
});

test('the confirm page address leaves without its token, in both languages', () => {
  for (const path of ['/es/confirmar', '/en/confirm']) {
    const href = `${origin}${path}?t=${token}`;
    assert.equal(send({ u: href }, { href }).u, `${origin}${path}`);
  }
});

test('the allowed query names survive with their values and order', () => {
  const first = 'utm_term=e&utm_source=whatsapp';
  const rest = 'ref=a&utm_medium=grupo&source=b&utm_campaign=diplomado-2026-11&utm_content=d';
  assert.equal(send({ u: `${origin}/es?${first}&t=${token}&${rest}#lista` }).u, `${origin}/es?${first}&${rest}`);
});

test('the token does not survive under another name, another casing or in a fragment', () => {
  for (const [start, name] of [['?', 'T'], ['?', 'token'], ['?', 'utm_token'], ['?', 'UTM_SOURCE'], ['#', 't']]) {
    assert.equal(send({ u: `${origin}/es${start}${name}=${token}` }).u, `${origin}/es`, `${start}${name}`);
  }
});

test('a referrer loses its query and fragment, and one that is not a web page survives', () => {
  assert.equal(send({ r: `${confirmPage}#x` }).r, `${origin}/es/confirmar`);
  assert.equal(send({ r: 'android-app://com.google.android.gm/' }).r, 'android-app://com.google.android.gm/');
});

test('an event with no referrer and no props passes', () => {
  assert.deepEqual(send({ r: null }), { n: 'pageview', u: `${origin}/es/confirmar`, r: null });
  assert.deepEqual(send({}), { n: 'pageview', u: `${origin}/es/confirmar` });
});

test('the address of a clicked link loses its query and fragment, resolved against the page', () => {
  const cases = {
    'mailto:info@rutaopta.org?subject=Hi': 'mailto:info@rutaopta.org',
    'https://wa.me/573105874657?text=x': 'https://wa.me/573105874657',
    // A language switch on the confirm page builds an address like this one
    [`${origin}/en/confirm?t=${token}`]: `${origin}/en/confirm`,
    [`?t=${token}#lista`]: `${origin}/es/confirmar`,
  };
  for (const [url, expected] of Object.entries(cases)) {
    assert.deepEqual(send({ p: { url, other: 'kept' } }).p, { url: expected, other: 'kept' });
  }
});

test('an event from any host but the canonical one is dropped', () => {
  for (const hostname of ['deploy123--rutaopta.netlify.app', 'rutaopta.org']) {
    assert.equal(send({}, { hostname }), null, hostname);
  }
});

test('an event that cannot be sanitised is dropped', () => {
  const unreadable = [{ u: 'not a url' }, { u: '/es/confirmar' }, { u: undefined }, { r: `not a url ${token}` }, { p: { url: 'https://[' } }];
  for (const payload of unreadable) assert.equal(send(payload), null, Object.keys(payload).join());
});

test('every goal of the catalog reads back from the attributes that tag it', () => {
  assert.deepEqual(goalAttributes('Ally Train WhatsApp'), { className: 'plausible-event-name=Ally+Train+WhatsApp' });
  for (const { goal } of Object.values(events)) assert.equal(goalOf(asDom(goalAttributes(goal))), goal);
});

test('a goal is read among other classes, and an element without one has none', () => {
  assert.equal(goalOf({ class: 'a b plausible-event-name=Hero+Follow c' }), 'Hero Follow');
  assert.equal(goalOf({ class: 'a b' }), undefined);
  assert.equal(goalOf({}), undefined);
});

test('without a script address there is no script', () => {
  assert.equal(scriptTags(undefined, host), undefined);
  assert.equal(scriptTags('', host), undefined);
});

test('a first-party path sends through the proxy, and the vendor address sends straight to the vendor', () => {
  assert.deepEqual(scriptTags(proxyPaths.script, host), { src: '/o/s.js', init: initSnippet({ host, endpoint: proxyPaths.event }) });
  const direct = 'https://plausible.io/js/pa-XXXXX.js';
  assert.deepEqual(scriptTags(direct, host), { src: direct, init: initSnippet({ host }) });
});

test('any other script address is refused', () => {
  const others = [
    '//host/x',
    // Browsers read a backslash as a slash, so this one names a host too
    '/\\host/x',
    'o/s.js',
    'https://example.com/js/a.js',
    'https://plausible.io.example.com/js/a.js',
    'http://plausible.io/js/a.js',
  ];
  for (const src of others) assert.equal(scriptTags(src, host), undefined, src);
});
