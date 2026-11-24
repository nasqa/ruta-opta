import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const landing = join(import.meta.dirname, '../apps/landing');
const { localesFor } = await import(join(landing, 'src/i18n/coverage.ts'));
const { ogCard } = await import(join(landing, 'src/app/[locale]/(site)/_components/home/metadata.ts'));

// A JPEG's size sits in its start-of-frame segment: walk the segments from SOI until one of SOF0-SOF15 (C4, C8 and CC are other markers)
const jpegSize = (bytes) => {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'not a JPEG');
  for (let offset = 2; offset + 9 < bytes.length; offset += 2 + bytes.readUInt16BE(offset + 2)) {
    assert.equal(bytes[offset], 0xff, `no marker at ${offset}`);
    const marker = bytes[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
  }
  throw new Error('no start-of-frame segment');
};

test('the size reader finds a baseline and a progressive frame', () => {
  const app0 = [0xff, 0xe0, 0x00, 0x04, 0x00, 0x00];
  const frame = (marker) => Buffer.from([0xff, 0xd8, ...app0, 0xff, marker, 0x00, 0x11, 0x08, 0x02, 0x76, 0x04, 0xb0, 0x03, ...Array(9).fill(0)]);
  assert.deepEqual(jpegSize(frame(0xc0)), { width: 1200, height: 630 });
  assert.deepEqual(jpegSize(frame(0xc2)), { width: 1200, height: 630 });
  assert.throws(() => jpegSize(Buffer.from([0x89, 0x50, 0x4e, 0x47])), /not a JPEG/);
});

test('each locale with the home has its card: a JPEG of 1200x630, at most 300 KB, as the metadata declares', async () => {
  assert.deepEqual([ogCard.width, ogCard.height, ogCard.type], [1200, 630, 'image/jpeg']);
  for (const locale of localesFor('/')) {
    const path = ogCard.path(locale);
    assert.match(path, new RegExp(`^/og/home-${locale}-v\\d+\\.jpg$`));
    const bytes = await readFile(join(landing, 'public', path));
    assert.deepEqual(jpegSize(bytes), { width: 1200, height: 630 }, path);
    // WhatsApp drops an image over 600 KB; half of that leaves room
    assert.ok(bytes.length <= 300_000, `${path} is ${bytes.length} bytes`);
  }
});
