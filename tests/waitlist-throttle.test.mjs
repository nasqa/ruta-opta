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
  const throttle = createThrottle(store, key, limits, () => clock.now);
  // Most tests need only the verdict
  const admit = async (email, address) => (await throttle.admit(email, address)).verdict;
  return { clock, store, throttle, admit };
};

test('first submission sends', async () => {
  const { admit } = setup();
  assert.equal(await admit('ana@example.com', ip), 'send');
});

test('same address within 2 minutes is skipped, after 2 minutes it sends', async () => {
  const { admit, clock } = setup();
  assert.equal(await admit('ana@example.com', ip), 'send');
  clock.now += minute;
  assert.equal(await admit('ana@example.com', ip), 'skip');
  clock.now += 3 * minute;
  assert.equal(await admit('ana@example.com', ip), 'send');
});

test('case and spaces are one address', async () => {
  const { admit } = setup();
  assert.equal(await admit('Ana@Example.com', ip), 'send');
  assert.equal(await admit(' ana@example.com', ip), 'skip');
});

test('aliases of one mailbox share its limit', async () => {
  const { admit } = setup();
  assert.equal(await admit('victim@gmail.com', ip), 'send');
  for (const alias of ['victim+1@gmail.com', 'v.i.c.t.i.m@gmail.com', 'victim@googlemail.com', 'V.ictim+news@GoogleMail.com']) {
    assert.equal(await admit(alias, ip), 'skip', alias);
  }
  assert.equal(await admit('a@example.com', ip), 'send');
  assert.equal(await admit('a+x@example.com', ip), 'skip');
});

test('dots count outside Gmail, and the tag is cut at the last @ only', async () => {
  const { admit } = setup();
  assert.equal(await admit('ab@example.com', ip), 'send');
  assert.equal(await admit('a.b@example.com', ip), 'send');
  assert.equal(await admit('ab@gmail.com.example', ip), 'send');
});

test('IPv6 addresses count per /64, IPv4 per address', async () => {
  const { admit } = setup({ ...defaultLimits, ipPerHour: 1 });
  assert.equal(await admit('a@example.com', '2001:db8:1:2::1'), 'send');
  // The same /64 written differently: leading zeros, case and a different interface id
  assert.equal(await admit('b@example.com', '2001:0DB8:0001:0002:ffff::9'), 'refuse');
  assert.equal(await admit('c@example.com', '2001:db8:1:3::1'), 'send');
  assert.equal(await admit('d@example.com', '2001:db8::1:2:0:0:1'), 'send');
  assert.equal(await admit('e@example.com', '203.0.113.7'), 'send');
  assert.equal(await admit('f@example.com', '203.0.113.8'), 'send');
  // An IPv4-mapped address is its IPv4 address, not the shared ::ffff:0:0/96
  assert.equal(await admit('g@example.com', '::ffff:198.51.100.1'), 'send');
  assert.equal(await admit('h@example.com', '::ffff:198.51.100.2'), 'send');
  assert.equal(await admit('i@example.com', '198.51.100.1'), 'refuse');
  // Live mode's bucket for a missing header passes through as is
  assert.equal(await admit('j@example.com', 'unknown'), 'send');
  assert.equal(await admit('k@example.com', 'unknown'), 'refuse');
});

test('fourth send of the UTC day is skipped, next UTC day sends', async () => {
  const { admit, clock } = setup();
  for (let i = 0; i < 3; i++) {
    assert.equal(await admit('ana@example.com', undefined), 'send');
    clock.now += 4 * minute;
  }
  assert.equal(await admit('ana@example.com', undefined), 'skip');
  clock.now = Date.UTC(2026, 0, 11, 0, 5, 0);
  assert.equal(await admit('ana@example.com', undefined), 'send');
});

test('31st submission from one IP in the hour is refused', async () => {
  const { admit, clock } = setup();
  for (let i = 0; i < 30; i++) assert.equal(await admit(`user${i}@example.com`, ip), 'send');
  assert.equal(await admit('user30@example.com', ip), 'refuse');
  clock.now += hour;
  assert.equal(await admit('user30@example.com', ip), 'send');
});

test('no IP skips the IP rule', async () => {
  const { admit } = setup();
  for (let i = 0; i < 40; i++) assert.equal(await admit(`user${i}@example.com`, undefined), 'send');
});

test('daily total refuses at the cap', async () => {
  const { admit } = setup({ ...defaultLimits, totalPerDay: 2 });
  assert.equal(await admit('a@example.com', ip), 'send');
  assert.equal(await admit('b@example.com', ip), 'send');
  assert.equal(await admit('c@example.com', ip), 'refuse');
});

test('nothing stored contains the address or IP', async () => {
  const { admit, store, clock } = setup();
  await admit('Ana@Example.com', ip);
  clock.now += 4 * minute;
  await admit('ana@example.com', ip);
  const stored = store.entries();
  assert.ok(stored.length > 0);
  const text = JSON.stringify(stored).toLowerCase();
  assert.ok(!text.includes('ana'));
  assert.ok(!text.includes('203.0.113.7'));
});

test('concurrent submissions for one address send at most once', async () => {
  const { admit } = setup();
  const verdicts = await Promise.all(Array.from({ length: 10 }, (_, i) => admit('ana@example.com', `198.51.100.${i}`)));
  assert.equal(verdicts.filter((verdict) => verdict === 'send').length, 1);
});

test('concurrent submissions never exceed 3 a day', async () => {
  const { admit, clock } = setup();
  const sendsPerSlot = [];
  for (let slot = 0; slot < 5; slot++) {
    const verdicts = await Promise.all(Array.from({ length: 5 }, () => admit('ana@example.com', undefined)));
    sendsPerSlot.push(verdicts.filter((verdict) => verdict === 'send').length);
    clock.now += 2 * defaultLimits.addressGapMs;
  }
  assert.deepEqual(sendsPerSlot, [1, 1, 1, 0, 0]);
});

test('two sends never land closer than the gap, even across a slot edge', async () => {
  const { admit, clock } = setup();
  const gap = defaultLimits.addressGapMs;
  clock.now = start + gap - 100;
  assert.equal(await admit('ana@example.com', undefined), 'send');
  clock.now = start + gap + 100;
  assert.equal(await admit('ana@example.com', undefined), 'skip');
  clock.now = start + 2 * gap;
  assert.equal(await admit('ana@example.com', undefined), 'send');
});

test('a refusal names its reason: the IP or the daily cap', async () => {
  const byIp = setup({ ...defaultLimits, ipPerHour: 1 });
  await byIp.admit('a@example.com', ip);
  assert.deepEqual(await byIp.throttle.admit('b@example.com', ip), { verdict: 'refuse', reason: 'ip' });
  const byCap = setup({ ...defaultLimits, totalPerDay: 1 });
  await byCap.admit('a@example.com', ip);
  assert.deepEqual(await byCap.throttle.admit('b@example.com', ip), { verdict: 'refuse', reason: 'cap' });
});

test('releasing a send frees its gap, so an immediate retry sends', async () => {
  const { throttle, admit } = setup();
  const first = await throttle.admit('ana@example.com', ip);
  assert.equal(first.verdict, 'send');
  await first.release();
  assert.equal(await admit('ana@example.com', ip), 'send');
  assert.equal(await admit('ana@example.com', ip), 'skip');
});

test('releasing a send keeps its day claim, so failed sends still count toward the 3 a day', async () => {
  const { throttle, admit } = setup();
  // A timeout or a 5xx may still have delivered the email, so every attempt counts; only the gap is given back
  for (let i = 0; i < 3; i++) {
    const admission = await throttle.admit('ana@example.com', undefined);
    assert.equal(admission.verdict, 'send', `attempt ${i + 1}`);
    await admission.release();
  }
  assert.equal(await admit('ana@example.com', undefined), 'skip');
});

test('release deletes only the gap claims its send took, and keeps the day claim and the counters', async () => {
  const { throttle, store, clock } = setup();
  await throttle.admit('ana@example.com', ip);
  clock.now += 2 * defaultLimits.addressGapMs;
  const before = store.entries().map(([entry]) => entry);
  await (await throttle.admit('ana@example.com', ip)).release();
  const added = store.entries().map(([entry]) => entry).filter((entry) => !before.includes(entry));
  assert.equal(added.length, 1);
  assert.match(added[0], /^day:[0-9a-f]+:\d{8}:2$/);
  assert.ok(before.every((entry) => store.entries().some(([kept]) => kept === entry)));
  const counts = store.entries().filter(([entry]) => /^(ip|total):/.test(entry)).map(([, value]) => value.count);
  assert.deepEqual(counts, [2, 2]);
});

test('release tries both gap claims and rejects when one delete fails', async () => {
  const { store, clock } = setup();
  const deleted = [];
  const failing = { ...store, delete: async (entry) => { deleted.push(entry); if (deleted.length === 1) throw new Error('down'); } };
  const admission = await createThrottle(failing, key, defaultLimits, () => clock.now).admit('ana@example.com', ip);
  await assert.rejects(admission.release());
  assert.equal(deleted.length, 2);
  assert.ok(deleted.every((entry) => entry.startsWith('gap:')));
});
