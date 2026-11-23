import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const dir = join(import.meta.dirname, '../apps/landing/src/modules/waitlist');
const { createWaitlist } = await import(join(dir, 'use-cases.ts'));
const { createMemoryStore } = await import(join(dir, 'store.ts'));
const { createThrottle, defaultLimits } = await import(join(dir, 'throttle.ts'));
const { createFakeMailer } = await import(join(dir, 'mailer-fake.ts'));
const { createFakeAudience } = await import(join(dir, 'audience-fake.ts'));
const { buildConfirmEmail } = await import(join(dir, 'confirm-email.ts'));
const { sealToken, openToken, confirmTtlMs } = await import(join(dir, 'token.ts'));

const keys = { current: new Uint8Array(32).fill(7) };
const start = Date.UTC(2026, 0, 10, 10, 0, 0);
const values = { name: 'Ana Pérez', email: 'ana@example.com', consent: true };
const ip = '203.0.113.7';
const copy = { sender: 'Ruta Opta', subject: 'Confirm your subscription', preheader: 'One step left', heading: 'Confirm', paragraphs: ['Click the button.'], action: 'Confirm' };

const setup = (overrides = {}) => {
  const clock = { now: start };
  const mailer = createFakeMailer();
  const audience = createFakeAudience();
  const logs = [];
  const throttle = createThrottle(createMemoryStore(), new Uint8Array(32).fill(5), defaultLimits, () => clock.now);
  const waitlist = createWaitlist({
    mailer, audience, throttle, keys, policyVersion: '2026-01', now: () => clock.now, reference: () => 'ref-1',
    confirmEmail: (locale, url) => buildConfirmEmail(copy, locale, url),
    confirmUrl: (locale, token) => `https://x/${locale}/confirm?t=${token}`,
    log: (event, detail) => logs.push({ event, detail }),
    ...overrides,
  });
  return { clock, mailer, audience, logs, waitlist, throttle };
};

const tokenOf = (mailer) => new URL(/https:\/\/x\/es\/confirm\?t=[\w-]+/.exec(mailer.sent[0].text)[0]).searchParams.get('t');

test('a valid signup sends one email to the address with no name anywhere in it', async () => {
  const { mailer, waitlist } = setup();
  assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'sent');
  assert.equal(mailer.sent.length, 1);
  const [email] = mailer.sent;
  assert.deepEqual(email.to, { address: values.email });
  assert.equal(email.reference, 'ref-1');
  for (const part of [email.html, email.text, email.subject, email.senderName]) assert.ok(!part.includes(values.name) && !part.includes(values.email));
});

test('the emailed link round-trips', async () => {
  const { mailer, waitlist } = setup();
  await waitlist.requestConfirmation({ ...values, name: 'Ana' }, 'es', ip);
  assert.deepEqual(waitlist.readConfirmation(tokenOf(mailer)), { status: 'valid', name: 'Ana', locale: 'es' });
});

test("confirmation subscribes to the token's locale with source and policy", async () => {
  const calls = [];
  const { mailer, audience, waitlist } = setup();
  const subscribe = audience.subscribe;
  audience.subscribe = async (...args) => (calls.push(args), subscribe(...args));
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer)), { status: 'subscribed', locale: 'es' });
  assert.deepEqual(audience.contacts.get(values.email), { name: values.name, locale: 'es' });
  assert.deepEqual(calls, [[{ email: values.email, name: values.name }, 'es', 'rutaopta.org/es · 2026-01']]);
});

test('the token payload carries consent time and policy version, sealed for 7 days', async () => {
  const { mailer, waitlist, clock } = setup();
  await waitlist.requestConfirmation(values, 'es', ip);
  const token = tokenOf(mailer);
  assert.deepEqual(openToken('confirm', token, keys, start), {
    status: 'valid', payload: { email: values.email, name: values.name, locale: 'es', consentAt: start, policyVersion: '2026-01' },
  });
  clock.now = start + confirmTtlMs - 1;
  assert.equal(waitlist.readConfirmation(token).status, 'valid');
  clock.now = start + confirmTtlMs;
  assert.equal(waitlist.readConfirmation(token).status, 'expired');
});

test('confirming twice is subscribed twice', async () => {
  const { mailer, waitlist } = setup();
  await waitlist.requestConfirmation(values, 'es', ip);
  const token = tokenOf(mailer);
  assert.equal((await waitlist.confirmSubscription(token)).status, 'subscribed');
  assert.equal((await waitlist.confirmSubscription(token)).status, 'subscribed');
});

test('a skipped repeat still answers sent and sends nothing', async () => {
  const { mailer, waitlist } = setup();
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'sent');
  assert.equal(mailer.sent.length, 1);
});

const leaks = (logs) => logs.flatMap(({ detail }) => Object.values(detail)).some((v) => [values.email, values.name, ip].some((s) => v.includes(s)));

test('a refused submission answers unavailable and logs its reason without personal data', async () => {
  for (const reason of ['ip', 'cap']) {
    const { mailer, logs, waitlist } = setup({ throttle: { admit: async () => ({ verdict: 'refuse', reason }) } });
    assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
    assert.equal(mailer.sent.length, 0);
    assert.deepEqual(logs, [{ event: 'waitlist:throttle-refused', detail: { reason } }]);
    assert.ok(!leaks(logs));
  }
});

test('a throttle that throws answers unavailable and logs without personal data', async () => {
  const { logs, waitlist } = setup({ throttle: { admit: async () => { throw new Error(`store down for ${values.email}`); } } });
  assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(logs, [{ event: 'waitlist:throttle-failed', detail: {} }]);
});

test('a failed send answers unavailable and logs the provider code and reference', async () => {
  const { logs, waitlist } = setup({ mailer: { send: async () => ({ ok: false, code: 'TM_4001' }) } });
  assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(logs, [{ event: 'waitlist:send-failed', detail: { code: 'TM_4001', reference: 'ref-1' } }]);
  assert.ok(!leaks(logs));
});

// A mailer that fails the first time and works after, over the real throttle
const flaky = (failure) => {
  const mailer = createFakeMailer();
  let calls = 0;
  return { sent: mailer.sent, send: async (email) => (++calls === 1 ? failure() : mailer.send(email)) };
};

test('after a failed send, an immediate retry for the same address sends', async () => {
  const failures = { 'a provider error': () => ({ ok: false, code: 'TM_4001' }), 'a throw': () => { throw new Error('down'); } };
  for (const [name, failure] of Object.entries(failures)) {
    const mailer = flaky(failure);
    const { waitlist } = setup({ mailer });
    assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'unavailable', name);
    assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'sent', name);
    assert.equal(mailer.sent.length, 1, name);
  }
});

test('a release that fails is logged and the answer stays unavailable', async () => {
  const release = async () => { throw new Error(`store down for ${values.email}`); };
  const { logs, waitlist } = setup({
    throttle: { admit: async () => ({ verdict: 'send', release }) },
    mailer: { send: async () => ({ ok: false, code: 'TM_4001' }) },
  });
  assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(logs.map((l) => l.event), ['waitlist:send-failed', 'waitlist:release-failed']);
  assert.ok(!leaks(logs));
});

test('a send that works keeps its claims', async () => {
  let released = 0;
  const { waitlist } = setup({ throttle: { admit: async () => ({ verdict: 'send', release: async () => { released++; } }) } });
  assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'sent');
  assert.equal(released, 0);
});

test('a mailer or email builder that throws answers unavailable and logs where', async () => {
  const mailerThrows = setup({ mailer: { send: async () => { throw new Error(values.email); } } });
  assert.equal(await mailerThrows.waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(mailerThrows.logs, [{ event: 'waitlist:unexpected', detail: { where: 'request' } }]);
  const builderThrows = setup({ confirmEmail: async () => { throw new Error('boom'); } });
  assert.equal(await builderThrows.waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(builderThrows.logs, [{ event: 'waitlist:unexpected', detail: { where: 'request' } }]);
});

test('expired and invalid tokens are reported, not thrown', async () => {
  const { waitlist, audience, clock } = setup();
  const payload = { email: values.email, name: values.name, locale: 'es', consentAt: start, policyVersion: '2026-01' };
  const token = sealToken('confirm', payload, keys, confirmTtlMs, start);
  clock.now = start + confirmTtlMs + 1;
  assert.deepEqual(waitlist.readConfirmation(token), { status: 'expired' });
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'expired' });
  assert.deepEqual(waitlist.readConfirmation('garbage'), { status: 'invalid' });
  assert.deepEqual(await waitlist.confirmSubscription('garbage'), { status: 'invalid' });
  assert.equal(audience.contacts.size, 0);
});

test('blocked passes through', async () => {
  const { mailer, waitlist } = setup({ audience: { subscribe: async () => ({ status: 'blocked' }) } });
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer)), { status: 'blocked' });
});

test('an unavailable audience logs the code and answers unavailable', async () => {
  const { mailer, logs, waitlist } = setup({ audience: { subscribe: async () => ({ status: 'unavailable', code: 'Z_1' }) } });
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer)), { status: 'unavailable' });
  assert.deepEqual(logs, [{ event: 'waitlist:subscribe-failed', detail: { code: 'Z_1' } }]);
});

test('an audience that throws answers unavailable and logs where', async () => {
  const { mailer, logs, waitlist } = setup({ audience: { subscribe: async () => { throw new Error('x'); } } });
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer)), { status: 'unavailable' });
  assert.deepEqual(logs, [{ event: 'waitlist:unexpected', detail: { where: 'confirm' } }]);
});

test("the source records the policy version sealed in the token, not the current one", async () => {
  const { mailer, audience, waitlist } = setup();
  await waitlist.requestConfirmation(values, 'es', ip);
  const calls = [];
  const later = setup({ policyVersion: '2027-02', audience: { subscribe: async (...args) => (calls.push(args), { status: 'subscribed' }) } });
  await later.waitlist.confirmSubscription(tokenOf(mailer));
  assert.equal(calls[0][2], 'rutaopta.org/es · 2026-01');
  assert.equal(audience.contacts.size, 0);
});
