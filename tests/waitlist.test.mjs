import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import es from '../apps/landing/messages/es.json' with { type: 'json' };
import './support/next-resolution.mjs';

const { validateWaitlist } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/validate.ts'));
const { signupLocales } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/signup-locales.ts'));

const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

test('a name, an email and the consent pass, with the name tidied', () => {
  const result = validateWaitlist(form({ name: '  Ana   María ', email: ' ana@example.com ', consent: 'on' }));
  assert.deepEqual(result, { ok: true, values: { name: 'Ana María', email: 'ana@example.com', consent: true } });
});

test('every missing piece is reported, and what was typed comes back', () => {
  const result = validateWaitlist(form({ name: '   ', email: 'ana' }));
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, { name: true, email: true, consent: true });
  assert.deepEqual(result.values, { name: '', email: 'ana', consent: false });
});

test('the consent counts only when the box was checked', () => {
  assert.deepEqual(validateWaitlist(form({ name: 'Ana', email: 'ana@example.com' })).errors, { consent: true });
  assert.deepEqual(validateWaitlist(form({ name: 'Ana', email: 'ana@example.com', consent: 'yes' })).errors, { consent: true });
});

test('names and emails past their limits are refused', () => {
  const result = validateWaitlist(form({ name: 'a'.repeat(81), email: `${'a'.repeat(250)}@example.com`, consent: 'on' }));
  assert.deepEqual(result.errors, { name: true, email: true });
});

test('a missing field or a file upload counts as empty', () => {
  const data = new FormData();
  data.set('name', new File(['x'], 'x.txt'));
  assert.deepEqual(validateWaitlist(data).errors, { name: true, email: true, consent: true });
});

test('real names pass', () => {
  for (const name of ['Ana', 'María José', 'Nguyễn', "D'Angelo", 'D’Angelo', 'Jean-Luc', 'J. R. Tolkien', 'Jr.']) {
    assert.equal(validateWaitlist(form({ name, email: 'ana@example.com', consent: 'on' })).ok, true, name);
  }
});

test('a decomposed name passes and comes back composed', () => {
  const result = validateWaitlist(form({ name: 'Jose\u0301', email: 'ana@example.com', consent: 'on' }));
  assert.equal(result.ok, true);
  assert.equal(result.values.name, 'José');
});

test('link-shaped or odd names are refused', () => {
  for (const name of ['spamsite.com', 'visit http://x', 'a/b', '<b>', 'ana@x', 'Ana2', '--', '. Ana']) {
    assert.equal(validateWaitlist(form({ name, email: 'ana@example.com', consent: 'on' })).errors?.name, true, name);
  }
});

test('a long near-miss name is refused without backtracking', () => {
  const started = performance.now();
  assert.equal(validateWaitlist(form({ name: `${'a'.repeat(79)}2`, email: 'ana@example.com', consent: 'on' })).errors?.name, true);
  assert.ok(performance.now() - started < 100);
});

test('a locale takes signups only when its email, its layout strings, confirm page and confirmed page all exist', () => {
  const { Confirm, ConfirmEmail, EmailLayout, Confirmed } = es;
  const complete = { Confirm, ConfirmEmail, EmailLayout, Confirmed };
  assert.deepEqual(signupLocales(), ['es', 'en']);
  assert.deepEqual(signupLocales({ es, en: complete }), ['es', 'en']);
  // A partial English go-live: any missing namespace keeps English out, so no email goes out with raw keys
  for (const missing of Object.keys(complete)) {
    const en = Object.fromEntries(Object.entries(complete).filter(([namespace]) => namespace !== missing));
    assert.deepEqual(signupLocales({ es, en }), ['es'], `without ${missing}`);
  }
});
