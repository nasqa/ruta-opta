import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const { readOriginTag } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/origin-tag.ts'));

const page = (query) => `https://www.rutaopta.org/es${query}`;

test('a plain tag in the page URL is the origin tag', () => {
  assert.equal(readOriginTag(page('?o=ig')), 'ig');
  assert.equal(readOriginTag(page('?o=flyer-armenia-2')), 'flyer-armenia-2');
  assert.equal(readOriginTag(page('?o=x')), 'x');
  assert.equal(readOriginTag(page(`?o=${'a'.repeat(24)}`)), 'a'.repeat(24));
  // Instagram appends its own parameters; only o counts
  assert.equal(readOriginTag(page('?utm_source=ig&o=ig&fbclid=abc')), 'ig');
  // The bare domain serves the Spanish home under its own URL
  assert.equal(readOriginTag('https://www.rutaopta.org/?o=ig'), 'ig');
});

test('a tag is lowercased before it is checked', () => {
  assert.equal(readOriginTag(page('?o=IG')), 'ig');
  assert.equal(readOriginTag(page('?o=Flyer-2')), 'flyer-2');
});

test('the first o wins when the link repeats it', () => {
  assert.equal(readOriginTag(page('?o=ig&o=wa')), 'ig');
});

test('anything that is not a plain label of 1 to 24 characters is dropped', () => {
  for (const query of [
    '?o=', '?o', `?o=${'a'.repeat(25)}`, '?o=i_g', '?o=i%20g', '?o=ig%0A', '?o=ig.com', '?o=ñandú', '?o=%F0%9F%93%B7',
    '?o=<script>', '?o=ig%C2%B7x', '?O=ig', '?origin=ig', '', '#o=ig',
  ]) {
    assert.equal(readOriginTag(page(query)), undefined, query);
  }
});

test('a missing or malformed Referer gives no tag', () => {
  for (const referer of [null, undefined, '', 'not a url', '/es?o=ig', '?o=ig']) assert.equal(readOriginTag(referer), undefined, String(referer));
});
