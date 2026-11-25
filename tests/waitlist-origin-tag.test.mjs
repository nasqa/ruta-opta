import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const { readOriginTag } = await import(join(import.meta.dirname, '../apps/landing/src/modules/waitlist/origin-tag.ts'));

const page = (query) => `https://www.rutaopta.org/es${query}`;

test('the utm_source of the page URL is the origin tag', () => {
  assert.equal(readOriginTag(page('?utm_source=instagram')), 'instagram');
  assert.equal(readOriginTag(page('?utm_source=flyer-armenia-2')), 'flyer-armenia-2');
  assert.equal(readOriginTag(page('?utm_source=x')), 'x');
  assert.equal(readOriginTag(page(`?utm_source=${'a'.repeat(24)}`)), 'a'.repeat(24));
  // A tracked link carries a medium and a campaign too, and Instagram appends its own parameters; only the source counts
  assert.equal(readOriginTag(page('?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento-2026-12&fbclid=abc')), 'instagram');
  // The bare domain serves the Spanish home under its own URL
  assert.equal(readOriginTag('https://www.rutaopta.org/?utm_source=qr'), 'qr');
});

// One vocabulary for the analytics tool and for the list: the earlier ?o= parameter never shipped
test('no other parameter names the origin', () => {
  for (const query of ['?o=ig', '?ref=ig', '?source=ig', '?utm_medium=bio', '?utm_campaign=instagram']) {
    assert.equal(readOriginTag(page(query)), undefined, query);
  }
});

test('a tag is lowercased before it is checked', () => {
  assert.equal(readOriginTag(page('?utm_source=Instagram')), 'instagram');
  assert.equal(readOriginTag(page('?utm_source=Flyer-2')), 'flyer-2');
});

test('the first utm_source wins when the link repeats it', () => {
  assert.equal(readOriginTag(page('?utm_source=instagram&utm_source=whatsapp')), 'instagram');
});

test('anything that is not a plain label of 1 to 24 characters is dropped', () => {
  for (const value of ['', 'a'.repeat(25), 'i_g', 'i%20g', 'ig%0A', 'ig.com', 'ñandú', '%F0%9F%93%B7', '<script>', 'ig%C2%B7x']) {
    assert.equal(readOriginTag(page(`?utm_source=${value}`)), undefined, value);
  }
  for (const query of ['?utm_source', '?UTM_SOURCE=ig', '', '#utm_source=ig']) assert.equal(readOriginTag(page(query)), undefined, query);
});

test('a missing or malformed Referer gives no tag', () => {
  for (const referer of [null, undefined, '', 'not a url', '/es?utm_source=ig', '?utm_source=ig']) {
    assert.equal(readOriginTag(referer), undefined, String(referer));
  }
});
