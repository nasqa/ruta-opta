import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const dir = join(import.meta.dirname, '../apps/landing/src/modules/waitlist');
const { createWaitlist } = await import(join(dir, 'use-cases.ts'));
const { createMemoryStore } = await import(join(dir, 'store.ts'));
const { createThrottle, defaultLimits } = await import(join(dir, 'throttle.ts'));
const { createConfirmGuard } = await import(join(dir, 'confirm-guard.ts'));
const { createFakeMailer } = await import(join(dir, 'mailer-fake.ts'));
const { createFakeAudience } = await import(join(dir, 'audience-fake.ts'));
const { buildConfirmEmail } = await import(join(dir, 'confirm-email.ts'));
const { sealToken, openToken, confirmTtlMs } = await import(join(dir, 'token.ts'));

const keys = { current: new Uint8Array(32).fill(7) };
const start = Date.UTC(2026, 0, 10, 10, 0, 0);
const values = { name: 'Ana Pérez', email: 'ana@example.com', consent: true };
const ip = '203.0.113.7';
const copy = { sender: 'Ruta Opta', subject: 'Confirm your subscription', preheader: 'One step left', heading: 'Confirm', paragraphs: ['Click the button.'], action: 'Confirm' };
const chrome = {
  logoUrl: 'https://x/email/opta-horizontal-plate@2x.png', logoAlt: 'Opta', privacyUrl: 'https://x/en/privacy', privacyLabel: 'Privacy',
  reason: 'Why you got this.', organization: 'Who sent it.', fallback: 'Copy this link:',
};

const setup = (overrides = {}) => {
  const clock = { now: start };
  const mailer = createFakeMailer();
  const audience = createFakeAudience();
  const logs = [];
  const store = createMemoryStore();
  const hashKey = new Uint8Array(32).fill(5);
  const throttle = createThrottle(store, hashKey, defaultLimits, () => clock.now);
  const guard = createConfirmGuard(store, hashKey, () => clock.now);
  const waitlist = createWaitlist({
    mailer, audience, throttle, guard, keys, policyVersion: '2026-01', now: () => clock.now, reference: () => 'ref-1',
    confirmEmail: (locale, url) => buildConfirmEmail(copy, locale, url, chrome),
    confirmUrl: (locale, token) => `https://x/${locale}/confirm?t=${token}`,
    log: (event, detail) => logs.push({ event, detail }),
    ...overrides,
  });
  return { clock, mailer, audience, logs, waitlist, throttle, store };
};

// Counts the audience's subscribe calls and passes them on
const counted = (audience) => {
  const calls = [];
  const subscribe = audience.subscribe;
  audience.subscribe = async (...args) => (calls.push(args), subscribe(...args));
  return calls;
};

// The token of the nth email, whatever its locale
const tokenOf = (mailer, nth = 0) => new URL(/https:\/\/x\/[a-z]{2}\/confirm\?t=[\w-]+/.exec(mailer.sent[nth].text)[0]).searchParams.get('t');

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

test('an English signup round-trips to the English list, link to confirmation', async () => {
  const { mailer, audience, waitlist } = setup();
  const calls = counted(audience);
  assert.equal(await waitlist.requestConfirmation(values, 'en', ip), 'sent');
  assert.match(mailer.sent[0].text, /https:\/\/x\/en\/confirm\?t=/);
  const token = tokenOf(mailer);
  assert.deepEqual(waitlist.readConfirmation(token), { status: 'valid', name: values.name, locale: 'en' });
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'subscribed', locale: 'en' });
  assert.deepEqual(calls, [[{ email: values.email, name: values.name }, 'en', 'rutaopta.org/en · 2026-01']]);
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

test('a replayed token answers subscribed from its marker, with no second audience call', async () => {
  const { mailer, audience, waitlist, clock } = setup();
  const calls = counted(audience);
  await waitlist.requestConfirmation(values, 'es', ip);
  const token = tokenOf(mailer);
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'subscribed', locale: 'es' });
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'subscribed', locale: 'es' });
  clock.now += 60 * 60_000;
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'subscribed', locale: 'es' });
  assert.equal(calls.length, 1);
});

test('a token written another way is the same token', async () => {
  const { mailer, audience, waitlist } = setup();
  const calls = counted(audience);
  await waitlist.requestConfirmation(values, 'es', ip);
  const token = tokenOf(mailer);
  await waitlist.confirmSubscription(token);
  // base64url decoding skips these, so each one opens as the same token
  for (const variant of [`${token}=`, `${token.slice(0, 10)}!${token.slice(10)}`, `${token} `]) {
    assert.deepEqual(await waitlist.confirmSubscription(variant), { status: 'subscribed', locale: 'es' }, variant);
  }
  assert.equal(calls.length, 1);
});

test('a second try of one token within the minute is unavailable with no audience call', async () => {
  const outcomes = [{ status: 'unavailable', code: 'Z_1' }, { status: 'subscribed' }];
  const calls = [];
  const { mailer, logs, waitlist, clock } = setup({ audience: { subscribe: async (...args) => (calls.push(args), outcomes[calls.length - 1]) } });
  await waitlist.requestConfirmation(values, 'es', ip);
  const token = tokenOf(mailer);
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'unavailable' });
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'unavailable' });
  assert.equal(calls.length, 1);
  assert.deepEqual(logs.map((l) => l.event), ['waitlist:subscribe-failed', 'waitlist:confirm-throttled']);
  clock.now += 60_000;
  assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'subscribed', locale: 'es' });
  assert.equal(calls.length, 2);
});

test('a new token for the same email still reaches the audience', async () => {
  const { mailer, audience, waitlist, clock } = setup();
  const calls = counted(audience);
  await waitlist.requestConfirmation(values, 'es', ip);
  await waitlist.confirmSubscription(tokenOf(mailer));
  clock.now += 2 * defaultLimits.addressGapMs;
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.equal(mailer.sent.length, 2);
  assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer, 1)), { status: 'subscribed', locale: 'es' });
  assert.equal(calls.length, 2);
});

test('a guard that fails answers unavailable with no audience call', async () => {
  const down = async () => { throw new Error('store down'); };
  for (const guard of [{ alreadyConfirmed: down, admit: async () => true }, { alreadyConfirmed: async () => false, admit: down }]) {
    const { mailer, audience, logs, waitlist } = setup({ guard: { ...guard, markConfirmed: async () => {} } });
    const calls = counted(audience);
    await waitlist.requestConfirmation(values, 'es', ip);
    assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer)), { status: 'unavailable' });
    assert.equal(calls.length, 0);
    assert.deepEqual(logs, [{ event: 'waitlist:guard-failed', detail: {} }]);
  }
});

test('a marker that cannot be written is logged and the confirmation still counts', async () => {
  const guard = { alreadyConfirmed: async () => false, admit: async () => true, markConfirmed: async () => { throw new Error('store down'); } };
  const { mailer, logs, waitlist } = setup({ guard });
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer)), { status: 'subscribed', locale: 'es' });
  assert.deepEqual(logs, [{ event: 'waitlist:mark-failed', detail: {} }]);
});

test('the guard stores no token', async () => {
  const { mailer, store, waitlist } = setup();
  await waitlist.requestConfirmation(values, 'es', ip);
  const token = tokenOf(mailer);
  await waitlist.confirmSubscription(token);
  const keysStored = store.entries().map(([entry]) => entry);
  assert.ok(keysStored.some((entry) => entry.startsWith('confirmed:')));
  assert.ok(!JSON.stringify(store.entries()).includes(token.slice(0, 16)));
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

test('failed sends still count toward the 3 a day: after 3 failures the 4th attempt sends nothing', async () => {
  let failing = true;
  const sent = [];
  const { waitlist } = setup({ mailer: { send: async (email) => (failing ? { ok: false, code: 'timeout' } : (sent.push(email), { ok: true })) } });
  for (let i = 0; i < 3; i++) assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'unavailable', `attempt ${i + 1}`);
  failing = false;
  // skipped, so it answers sent like any repeat
  assert.equal(await waitlist.requestConfirmation(values, 'es', ip), 'sent');
  assert.equal(sent.length, 0);
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

test('a mailer or email builder that throws answers unavailable and logs where and the error name, never its message', async () => {
  const mailerThrows = setup({ mailer: { send: async () => { throw new TypeError(values.email); } } });
  assert.equal(await mailerThrows.waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(mailerThrows.logs, [{ event: 'waitlist:unexpected', detail: { where: 'request', name: 'TypeError' } }]);
  assert.ok(!leaks(mailerThrows.logs));
  const builderThrows = setup({ confirmEmail: async () => { throw new Error('boom'); } });
  assert.equal(await builderThrows.waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(builderThrows.logs, [{ event: 'waitlist:unexpected', detail: { where: 'request', name: 'Error' } }]);
  // A thrown value that is not an Error is named by its type
  const stringThrows = setup({ mailer: { send: async () => { throw values.email; } } });
  assert.equal(await stringThrows.waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.deepEqual(stringThrows.logs, [{ event: 'waitlist:unexpected', detail: { where: 'request', name: 'string' } }]);
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
  const { mailer, logs, waitlist } = setup({ audience: { subscribe: async () => { throw new RangeError(values.email); } } });
  await waitlist.requestConfirmation(values, 'es', ip);
  assert.deepEqual(await waitlist.confirmSubscription(tokenOf(mailer)), { status: 'unavailable' });
  assert.deepEqual(logs, [{ event: 'waitlist:unexpected', detail: { where: 'confirm', name: 'RangeError' } }]);
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

test('a tagged signup seals its origin tag and the source ends with it', async () => {
  for (const locale of ['es', 'en']) {
    const { mailer, audience, waitlist } = setup();
    const calls = counted(audience);
    assert.equal(await waitlist.requestConfirmation(values, locale, ip, 'ig'), 'sent');
    const token = tokenOf(mailer);
    assert.deepEqual(openToken('confirm', token, keys, start), {
      status: 'valid', payload: { email: values.email, name: values.name, locale, consentAt: start, policyVersion: '2026-01', o: 'ig' },
    });
    // The confirm page reads only the name and locale, never the tag
    assert.deepEqual(waitlist.readConfirmation(token), { status: 'valid', name: values.name, locale });
    assert.deepEqual(await waitlist.confirmSubscription(token), { status: 'subscribed', locale });
    assert.deepEqual(calls, [[{ email: values.email, name: values.name }, locale, `rutaopta.org/${locale} · 2026-01 · o=ig`]]);
  }
});

test('a signup without a tag seals no o key and keeps the source it had before tags', async () => {
  const { mailer, audience, waitlist } = setup();
  const calls = counted(audience);
  await waitlist.requestConfirmation(values, 'es', ip, undefined);
  const opened = openToken('confirm', tokenOf(mailer), keys, start);
  assert.ok(!('o' in opened.payload));
  await waitlist.confirmSubscription(tokenOf(mailer));
  assert.equal(calls[0][2], 'rutaopta.org/es · 2026-01');
});

test('a link emailed before tags existed still confirms with its old source', async () => {
  const { audience, waitlist } = setup();
  const calls = counted(audience);
  const legacy = sealToken('confirm', { email: values.email, name: values.name, locale: 'es', consentAt: start, policyVersion: '2026-11-draft' }, keys, confirmTtlMs, start);
  assert.deepEqual(await waitlist.confirmSubscription(legacy), { status: 'subscribed', locale: 'es' });
  assert.equal(calls[0][2], 'rutaopta.org/es · 2026-11-draft');
});

test('the longest tag adds at most 42 characters to the emailed link', async () => {
  const link = async (tag) => {
    const { mailer, waitlist } = setup();
    await waitlist.requestConfirmation(values, 'es', ip, tag);
    return /https:\/\/x\/es\/confirm\?t=[\w-]+/.exec(mailer.sent[0].text)[0];
  };
  const untagged = await link(undefined);
  assert.ok((await link('ig')).length - untagged.length <= 12);
  assert.ok((await link('a'.repeat(24))).length - untagged.length <= 42);
});

test('the origin tag never reaches a log', async () => {
  const tag = 'flyer-armenia-plaza';
  const failing = setup({ mailer: { send: async () => ({ ok: false, code: 'E_1' }) }, audience: { subscribe: async () => ({ status: 'unavailable', code: 'Z_1' }) } });
  await failing.waitlist.requestConfirmation(values, 'es', ip, tag);
  const { mailer, logs, waitlist } = setup({ audience: { subscribe: async () => { throw new Error(tag); } } });
  await waitlist.requestConfirmation(values, 'es', ip, tag);
  await waitlist.confirmSubscription(tokenOf(mailer));
  const all = [...failing.logs, ...logs];
  assert.ok(all.length >= 2);
  assert.ok(!JSON.stringify(all).includes(tag));
});

// A store whose every operation hangs, as Netlify Blobs does while it retries an outage
const hanging = () => {
  const never = () => new Promise(() => {});
  return { getJSON: never, setJSON: never, claim: never, delete: never };
};

test('the use cases give up at a 20 second deadline', async () => {
  const { useCaseDeadlineMs } = await import(join(dir, 'use-cases.ts'));
  assert.equal(useCaseDeadlineMs, 20_000);
});

test('a store that never answers makes a signup unavailable within the deadline', async () => {
  const slow = setup({ deadlineMs: 30, throttle: createThrottle(hanging(), new Uint8Array(32).fill(5), defaultLimits, () => start) });
  const started = performance.now();
  assert.equal(await slow.waitlist.requestConfirmation(values, 'es', ip), 'unavailable');
  assert.ok(performance.now() - started < 1_000);
  assert.deepEqual(slow.logs, [{ event: 'waitlist:deadline', detail: { where: 'request' } }]);
  assert.equal(slow.mailer.sent.length, 0);
});

test('a store that never answers makes a confirmation unavailable within the deadline, with no audience call', async () => {
  const { mailer, waitlist, clock } = setup();
  await waitlist.requestConfirmation(values, 'es', ip);
  const slow = setup({ deadlineMs: 30, guard: createConfirmGuard(hanging(), new Uint8Array(32).fill(5), () => clock.now) });
  const calls = counted(slow.audience);
  const started = performance.now();
  assert.deepEqual(await slow.waitlist.confirmSubscription(tokenOf(mailer)), { status: 'unavailable' });
  assert.ok(performance.now() - started < 1_000);
  assert.deepEqual(slow.logs, [{ event: 'waitlist:deadline', detail: { where: 'confirm' } }]);
  assert.equal(calls.length, 0);
});

test('an audience that never answers makes a confirmation unavailable within the deadline', async () => {
  const { mailer, waitlist } = setup();
  await waitlist.requestConfirmation(values, 'es', ip);
  const slow = setup({ deadlineMs: 30, audience: { subscribe: () => new Promise(() => {}) } });
  assert.deepEqual(await slow.waitlist.confirmSubscription(tokenOf(mailer)), { status: 'unavailable' });
  assert.deepEqual(slow.logs, [{ event: 'waitlist:deadline', detail: { where: 'confirm' } }]);
});
