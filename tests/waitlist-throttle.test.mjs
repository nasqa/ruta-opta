import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const waitlist = join(import.meta.dirname, '../apps/landing/src/modules/waitlist');
const { createMemoryStore } = await import(join(waitlist, 'store.ts'));
const { createThrottle, defaultLimits } = await import(join(waitlist, 'throttle.ts'));

const key = new Uint8Array(32).fill(5);
const ip = '203.0.113.7';
const minute = 60_000;
const hour = 60 * minute;
const start = Date.UTC(2026, 0, 10, 10, 0, 0);

const setup = (limits = defaultLimits) => {
  const clock = { now: start };
  const store = createMemoryStore();
  return { clock, store, throttle: createThrottle(store, key, limits, () => clock.now) };
};

test('first submission sends', async () => {
  const { throttle } = setup();
  assert.equal(await throttle.admit('ana@example.com', ip), 'send');
});

test('same address within 2 minutes is skipped, after 2 minutes it sends', async () => {
  const { throttle, clock } = setup();
  assert.equal(await throttle.admit('ana@example.com', ip), 'send');
  clock.now += minute;
  assert.equal(await throttle.admit('ana@example.com', ip), 'skip');
  clock.now += minute;
  assert.equal(await throttle.admit('ana@example.com', ip), 'send');
});

test('case and spaces are one address', async () => {
  const { throttle } = setup();
  assert.equal(await throttle.admit('Ana@Example.com', ip), 'send');
  assert.equal(await throttle.admit(' ana@example.com', ip), 'skip');
});

test('fourth send of the UTC day is skipped, next UTC day sends', async () => {
  const { throttle, clock } = setup();
  for (let i = 0; i < 3; i++) {
    assert.equal(await throttle.admit('ana@example.com', undefined), 'send');
    clock.now += 3 * minute;
  }
  assert.equal(await throttle.admit('ana@example.com', undefined), 'skip');
  clock.now = Date.UTC(2026, 0, 11, 0, 5, 0);
  assert.equal(await throttle.admit('ana@example.com', undefined), 'send');
});

test('31st submission from one IP in the hour is refused', async () => {
  const { throttle, clock } = setup();
  for (let i = 0; i < 30; i++) assert.equal(await throttle.admit(`user${i}@example.com`, ip), 'send');
  assert.equal(await throttle.admit('user30@example.com', ip), 'refuse');
  clock.now += hour;
  assert.equal(await throttle.admit('user30@example.com', ip), 'send');
});

test('no IP skips the IP rule', async () => {
  const { throttle } = setup();
  for (let i = 0; i < 40; i++) assert.equal(await throttle.admit(`user${i}@example.com`, undefined), 'send');
});

test('daily total refuses at the cap', async () => {
  const { throttle } = setup({ ...defaultLimits, totalPerDay: 2 });
  assert.equal(await throttle.admit('a@example.com', ip), 'send');
  assert.equal(await throttle.admit('b@example.com', ip), 'send');
  assert.equal(await throttle.admit('c@example.com', ip), 'refuse');
});

test('nothing stored contains the address or IP', async () => {
  const { throttle, store, clock } = setup();
  await throttle.admit('Ana@Example.com', ip);
  clock.now += 3 * minute;
  await throttle.admit('ana@example.com', ip);
  const stored = store.entries();
  assert.ok(stored.length > 0);
  const text = JSON.stringify(stored).toLowerCase();
  assert.ok(!text.includes('ana'));
  assert.ok(!text.includes('203.0.113.7'));
});
