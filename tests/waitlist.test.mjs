import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

const { validateWaitlist } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/validate.ts'));

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
