import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { getStore } from '@netlify/blobs';
import './support/next-resolution.mjs';

const { blobsTimeoutMs, bufferedFetch, createBlobsStore, createMemoryStore } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/store.ts'));

const never = () => new Promise(() => {});
const operations = (store) => ({
  getJSON: () => store.getJSON('k'),
  setJSON: () => store.setJSON('k', 1),
  claim: () => store.claim('k', 1),
  delete: () => store.delete('k'),
});

const timesOut = async (operation, limit) => {
  const started = performance.now();
  await assert.rejects(operation(), { name: 'TimeoutError' });
  return performance.now() - started < limit;
};

test('a Blobs operation is cut at 2 seconds', () => {
  assert.equal(blobsTimeoutMs, 2_000);
});

test('every Blobs operation that never answers rejects at the timeout', async () => {
  const store = createBlobsStore('waitlist', { open: () => ({ get: never, setJSON: never, delete: never }), timeoutMs: 20 });
  for (const [name, operation] of Object.entries(operations(store))) assert.ok(await timesOut(operation, 1_000), name);
});

// The real client over a fetch that hangs: @netlify/blobs sets no request timeout of its own and retries failed requests for 25 s or more
test('the real Blobs client is cut at the timeout too', async () => {
  const calls = [];
  const fetch = (url) => (calls.push(url), never());
  const open = () =>
    getStore({ name: 'waitlist', consistency: 'strong', siteID: 'site', token: 'token', edgeURL: 'https://edge.invalid', uncachedEdgeURL: 'https://uncached.invalid', fetch });
  const store = createBlobsStore('waitlist', { open, timeoutMs: 20 });
  for (const [name, operation] of Object.entries(operations(store))) assert.ok(await timesOut(operation, 1_000), name);
  assert.equal(calls.length, 4);
});

test('a Blobs operation that answers in time passes its value through', async () => {
  const store = createBlobsStore('waitlist', {
    open: () => ({ get: async () => ({ count: 2 }), setJSON: async () => ({ modified: false }), delete: async () => undefined }),
  });
  assert.deepEqual(await store.getJSON('k'), { count: 2 });
  assert.equal(await store.claim('k', 1), false);
  assert.equal(await store.delete('k'), undefined);
});

test('the memory store deletes, and deleting a missing key is fine', async () => {
  const store = createMemoryStore();
  await store.setJSON('k', 1);
  await store.delete('k');
  await store.delete('k');
  assert.equal(await store.getJSON('k'), undefined);
  assert.equal(await store.claim('k', 1), true);
});

// Production finding: inside the Next.js runtime, body.cancel() on a fetch response never settles, and @netlify/blobs cancels the body of every 404.
// So reading a key that does not exist yet hung until the deadline. These responses reproduce that: a body whose cancel() never settles
const stuckBody = () => new ReadableStream({ start: (controller) => { controller.enqueue(new TextEncoder().encode('<Error>NoSuchKey</Error>')); controller.close(); }, cancel: () => new Promise(() => {}) });
const stuckFetch = async () => new Response(stuckBody(), { status: 404 });
const edge = { siteID: 'site', token: 'token', edgeURL: 'https://edge.example', uncachedEdgeURL: 'https://edge-uncached.example' };
const within = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`still pending after ${ms} ms`)), ms))]);

test('the stuck 404 really hangs the plain client, so the tests below prove the fix', async () => {
  await assert.rejects(within(getStore({ name: 'waitlist', consistency: 'strong', ...edge, fetch: stuckFetch }).get('missing'), 200), /still pending/);
});

test('through the buffered fetch, a missing key reads as missing at once', async () => {
  assert.equal(await within(getStore({ name: 'waitlist', consistency: 'strong', ...edge, fetch: bufferedFetch(stuckFetch) }).get('missing'), 500), null);
});

test('the buffered fetch keeps status, headers and body, and allows null-body statuses', async () => {
  const ok = await bufferedFetch(async () => new Response('{"a":1}', { status: 200, headers: { etag: '"x"' } }))('https://edge.example/k');
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('etag'), '"x"');
  assert.deepEqual(await ok.json(), { a: 1 });
  const empty = await bufferedFetch(async () => new Response(null, { status: 204 }))('https://edge.example/k');
  assert.equal(empty.status, 204);
});

test('the default Blobs store reads a missing key as undefined in the Next.js runtime conditions', async () => {
  const saved = { context: globalThis.netlifyBlobsContext, fetch: globalThis.fetch };
  globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify(edge)).toString('base64');
  globalThis.fetch = stuckFetch;
  try {
    assert.equal(await within(createBlobsStore('waitlist').getJSON('missing'), 1_000), undefined);
  } finally {
    globalThis.netlifyBlobsContext = saved.context;
    globalThis.fetch = saved.fetch;
  }
});
