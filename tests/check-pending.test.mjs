import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const script = join(import.meta.dirname, '../scripts/check-pending.mjs');

const run = async (files) => {
  const dir = await mkdtemp(join(tmpdir(), 'check-pending-'));
  try {
    await mkdir(dir, { recursive: true });
    await Promise.all(Object.entries(files).map(([name, content]) => writeFile(join(dir, name), JSON.stringify(content))));
    return spawnSync(process.execPath, [script], { env: { ...process.env, MESSAGES_DIR: dir }, encoding: 'utf8' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

test('a marker in any locale blocks', async () => {
  const result = await run({ 'es.json': { Home: { title: 'Hola' } }, 'en.json': { Home: { title: 'Hello [PENDIENTE: copy]' } } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /en: Home\.title/);
  assert.doesNotMatch(result.stderr, /es:/);
});

test('clean messages in every locale pass', async () => {
  const result = await run({ 'es.json': { Home: { title: 'Hola' } }, 'en.json': { Home: { title: 'Hello' } } });
  assert.equal(result.status, 0);
});
