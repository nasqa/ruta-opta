import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { getStore } from '@netlify/blobs';
import './support/next-resolution.mjs';

const { blobsTimeoutMs, createBlobsStore, createMemoryStore } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/store.ts'));

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
