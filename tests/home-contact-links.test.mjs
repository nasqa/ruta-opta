import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const { whatsappHref, mailtoHref } = await import(join(import.meta.dirname, '../apps/landing/src/app/[locale]/(site)/_components/home/contact-links.ts'));

test('whatsappHref builds a wa.me link with the message percent-encoded', () => {
  assert.equal(
    whatsappHref('573105874657', 'Hola, quiero conocer Ruta Opta como aliado.'),
    'https://wa.me/573105874657?text=Hola%2C%20quiero%20conocer%20Ruta%20Opta%20como%20aliado.',
  );
});

test('whatsappHref encodes accents and never uses + for spaces', () => {
  const href = whatsappHref('573105874657', 'Mañana, ¿hablamos?');
  assert.ok(href.endsWith('?text=Ma%C3%B1ana%2C%20%C2%BFhablamos%3F'), href);
  assert.ok(!href.includes('+'));
});

test('whatsappHref refuses a number that is not digits only', () => {
  assert.throws(() => whatsappHref('+573105874657', 'hola'), RangeError);
  assert.throws(() => whatsappHref('57 310 587 4657', 'hola'), RangeError);
  assert.throws(() => whatsappHref('', 'hola'), RangeError);
});

test('whatsappHref cannot be steered out of the wa.me path by the message', () => {
  const href = whatsappHref('573105874657', 'x&y=1#frag/../?z');
  assert.equal(new URL(href).origin + new URL(href).pathname, 'https://wa.me/573105874657');
  assert.equal(new URL(href).searchParams.get('text'), 'x&y=1#frag/../?z');
});

test('mailtoHref builds a mailto with the subject percent-encoded, spaces as %20', () => {
  assert.equal(
    mailtoHref('info@rutaopta.org', 'Quiero ser aliado de Ruta Opta'),
    'mailto:info@rutaopta.org?subject=Quiero%20ser%20aliado%20de%20Ruta%20Opta',
  );
});

test('mailtoHref encodes accents in the subject', () => {
  assert.equal(mailtoHref('info@rutaopta.org', 'Colaboración'), 'mailto:info@rutaopta.org?subject=Colaboraci%C3%B3n');
});

test('mailtoHref refuses an address that is not a single plain address', () => {
  assert.throws(() => mailtoHref('info@rutaopta.org?cc=x@y.z', 'a'), RangeError);
  assert.throws(() => mailtoHref('a@b.co,c@d.co', 'a'), RangeError);
  assert.throws(() => mailtoHref('not an address', 'a'), RangeError);
});
