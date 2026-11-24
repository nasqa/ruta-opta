import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';

const app = join(import.meta.dirname, '../apps/landing/src/app');

// A PNG's IHDR follows its 8-byte signature: width and height at 16 and 20, colour type at 25 (2 is RGB, 6 is RGB with alpha)
const pngHeader = async (path) => {
  const bytes = await readFile(path);
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a', `${path} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), alpha: [4, 6].includes(bytes[25]) };
};

test('the icon is a square PNG over 48 px, as Google asks for a favicon', async () => {
  const { width, height } = await pngHeader(join(app, 'icon.png'));
  assert.equal(width, height);
  assert.ok(width > 48, `icon.png is ${width} px`);
});

test('the apple-touch-icon is a 180 px PNG with no alpha, since iOS paints transparency black', async () => {
  assert.deepEqual(await pngHeader(join(app, 'apple-icon.png')), { width: 180, height: 180, alpha: false });
});
