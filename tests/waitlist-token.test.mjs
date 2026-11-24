import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const { sealToken, openToken, parseTokenKeys, deriveKey } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/token.ts'));

const keyA = Buffer.alloc(32, 7).toString('base64');
const keyB = Buffer.alloc(32, 9).toString('base64');
const keys = parseTokenKeys(keyA);
const payload = { email: 'ana@example.com', name: 'Ana', locale: 'es' };

test('round trip returns the payload', () => {
  assert.deepEqual(openToken('confirm', sealToken('confirm', payload, keys, 1000), keys), { status: 'valid', payload });
});

test('the token does not show the email', () => {
  const token = sealToken('confirm', payload, keys, 1000);
  const bytes = Buffer.from(token, 'base64url');
  assert.ok(!bytes.includes('ana@example.com'));
  assert.ok(!bytes.includes('"name":"Ana"'));
});

test('a token sealed for another purpose is invalid', () => {
  assert.deepEqual(openToken('confirm', sealToken('zoho-access-token', payload, keys, 1000), keys), { status: 'invalid' });
});

test('tampering is invalid', () => {
  const token = sealToken('confirm', payload, keys, 1000);
  const middle = Math.floor(token.length / 2);
  const tampered = token.slice(0, middle) + (token[middle] === 'A' ? 'B' : 'A') + token.slice(middle + 1);
  assert.deepEqual(openToken('confirm', tampered, keys), { status: 'invalid' });
});

test('garbage is invalid, never a throw', () => {
  for (const garbage of ['', 'abc', '!!!', 'A'.repeat(5000)]) assert.deepEqual(openToken('confirm', garbage, keys), { status: 'invalid' });
});

test('expiry', () => {
  const token = sealToken('confirm', payload, keys, 1000, 0);
  assert.equal(openToken('confirm', token, keys, 999).status, 'valid');
  assert.equal(openToken('confirm', token, keys, 1000).status, 'expired');
});

test('rotation', () => {
  const token = sealToken('confirm', payload, keys, 1000);
  assert.equal(openToken('confirm', token, parseTokenKeys(keyB, keyA)).status, 'valid');
  assert.equal(openToken('confirm', token, parseTokenKeys(keyB)).status, 'invalid');
});

test('parseTokenKeys accepts 32 bytes and refuses everything else', () => {
  for (const bad of [undefined, '', 'not base64!', Buffer.alloc(16, 7).toString('base64')]) assert.equal(parseTokenKeys(bad), undefined);
  assert.equal(parseTokenKeys(keyA, 'nope'), undefined);
  assert.equal(parseTokenKeys(keyA, Buffer.alloc(16, 1).toString('base64')), undefined);
  assert.equal(parseTokenKeys(keyA, keyB).previous.length, 32);
  assert.equal(parseTokenKeys(keyA).current.length, 32);
});

test('deriveKey is deterministic, depends on the current key and is 32 bytes', () => {
  const derived = deriveKey(keys, 'waitlist/throttle');
  assert.equal(derived.length, 32);
  assert.deepEqual(derived, deriveKey(parseTokenKeys(keyA), 'waitlist/throttle'));
  assert.notDeepEqual(derived, deriveKey(parseTokenKeys(keyB), 'waitlist/throttle'));
});
