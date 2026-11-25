import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const landing = join(import.meta.dirname, '../apps/landing');
const read = (path) => readFile(join(landing, path), 'utf8');

const { proxyPaths, vendorEventUrl } = await import(join(landing, 'src/modules/analytics/plausible.ts'));
const { config } = await import(join(landing, 'src/proxy.ts'));

// Netlify runs the proxy before the rewrites: a path it matched would be redirected to a locale and never reach the vendor
test('the proxy matches the pages and leaves the analytics paths to the rewrites', () => {
  const matcher = new RegExp(`^${config.matcher}$`);
  for (const path of ['/', '/es', '/es/confirmar', '/privacidad', '/en/privacy', '/ofertas']) assert.match(path, matcher);
  for (const path of [proxyPaths.event, proxyPaths.script]) assert.doesNotMatch(path, matcher);
});

// Read line by line, so a commented-out key never counts; what comes before the first block is not a redirect
const redirects = (await read('netlify.toml'))
  .split(/^\[\[redirects\]\]/m)
  .slice(1)
  .map((block) => {
    const value = (key) => new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`, 'm').exec(block)?.[1];
    const text = (key) => value(key)?.replace(/^"(.*)"$/, '$1');
    return { from: text('from'), to: text('to'), writtenTo: value('to'), status: value('status'), force: value('force'), headers: value('headers') };
  });

const rewriteFrom = (from) => {
  const found = redirects.filter((redirect) => redirect.from === from);
  assert.equal(found.length, 1, `one redirect from ${from}`);
  return found[0];
};

// A rewrite passes the browser's headers on: neither the site's cookie nor a page's full address is the vendor's to see
const assertFirstPartyRewrite = ({ from, status, force, headers }) => {
  assert.equal(status, '200', from);
  assert.equal(force, 'true', from);
  assert.equal(headers, '{ Cookie = "", Referer = "https://www.rutaopta.org/" }', from);
};

test('the event path is rewritten to the vendor event endpoint', () => {
  assert.equal(vendorEventUrl, 'https://plausible.io/api/event');
  const rewrite = rewriteFrom(proxyPaths.event);
  assert.equal(rewrite.to, vendorEventUrl);
  assertFirstPartyRewrite(rewrite);
});

// Only the per-site script: an older one ignores the options of plausible.init, so the sanitiser would never run
test('the script path is rewritten to the per-site vendor script', () => {
  const rewrite = rewriteFrom(proxyPaths.script);
  assert.match(rewrite.to, /^https:\/\/plausible\.io\/js\/pa-[\w-]+\.js$/);
  assertFirstPartyRewrite(rewrite);
});

// TOML has other spellings of a string, and one this file does not unquote would hide its host from the next test
test('every redirect target is written as a double-quoted string', () => {
  for (const { from, writtenTo } of redirects) assert.match(writtenTo ?? '', /^"[^"]*"$/, `the target of the redirect from ${from}`);
});

test('nothing else is sent to the vendor', () => {
  const toVendor = redirects.filter(({ to }) => URL.parse(to)?.hostname === 'plausible.io');
  assert.ok(toVendor.length > 0);
  for (const { from } of toVendor) assert.ok(Object.values(proxyPaths).includes(from), from);
});

// server.ts is server-only, so its source is read. Next inlines the variable only where it is read as a direct member
test('the server entry reads the inlined script address and names the production host', async () => {
  const source = await read('src/modules/analytics/server.ts');
  assert.match(source, /scriptTags\(process\.env\.ANALYTICS_SCRIPT_SRC, 'www\.rutaopta\.org'\)/);
});

test('the layout renders the analytics script inside <head>', async () => {
  const source = await read('src/app/[locale]/layout.tsx');
  const head = source.slice(source.indexOf('<head>'), source.indexOf('</head>'));
  assert.ok(head.includes('<AnalyticsScript />'), 'no <AnalyticsScript /> between <head> and </head>');
});
