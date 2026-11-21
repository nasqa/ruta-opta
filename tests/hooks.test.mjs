import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';

const root = join(import.meta.dirname, '..');
const hook = (name, input) =>
  spawnSync('node', [join(root, '.claude/hooks', name)], { input: JSON.stringify(input), encoding: 'utf8', cwd: root });

const lintEdited = (file_path) => hook('lint-edited.mjs', { tool_name: 'Edit', tool_input: { file_path } });
const verifyOnStop = (stop_hook_active) => hook('verify-on-stop.mjs', { hook_event_name: 'Stop', stop_hook_active });

// Plants a file under the real src, always removed in finally; the id keeps names unique
const withTempFile = async (code, check, extension = 'ts') => {
  const path = join(root, `apps/landing/src/shared/hooks-probe-${randomBytes(4).toString('hex')}.${extension}`);
  try {
    await writeFile(path, code);
    await check(path);
  } finally {
    await rm(path, { force: true });
  }
};

test('lint-edited blocks a file with any and reports file:line rule message', () =>
  withTempFile('export const loose = (value: any) => value;\n', (path) => {
    const { status, stderr } = lintEdited(path);
    assert.equal(status, 2, stderr);
    assert.match(stderr, /:\d+ @typescript-eslint\/no-explicit-any /);
  }));

test('lint-edited blocks a literal color in CSS', () =>
  withTempFile(
    '.probe {\n  color: #ff0000;\n}\n',
    (path) => {
      const { status, stderr } = lintEdited(path);
      assert.equal(status, 2, stderr);
      assert.match(stderr, /:\d+ \S+ /);
    },
    'css',
  ));

test('lint-edited passes a clean file', () =>
  withTempFile('export const answer = 42;\n', (path) => {
    const { status, stderr } = lintEdited(path);
    assert.equal(status, 0, stderr);
  }));

test('lint-edited ignores a markdown file', () => assert.equal(lintEdited(join(root, 'README.md')).status, 0));

test('lint-edited ignores files outside apps and packages', () =>
  assert.equal(lintEdited(join(root, 'tests/hooks.test.mjs')).status, 0));

test('verify-on-stop lets Claude stop when the hook already fired, even with a type error', () =>
  withTempFile("export const wrong: number = 'text';\n", () => {
    const { status, stderr } = verifyOnStop(true);
    assert.equal(status, 0, stderr);
  }));

test('verify-on-stop sends Claude back to work on a type error', () =>
  withTempFile("export const wrong: number = 'text';\n", () => {
    const { status, stderr } = verifyOnStop(false);
    assert.equal(status, 2);
    assert.match(stderr, /error TS/);
  }));
