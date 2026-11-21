import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const parse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
const input = parse(readFileSync(0, 'utf8'));
if (!input || input.stop_hook_active) process.exit(0);

const failures = ['typecheck', 'lint']
  .map((script) => spawnSync('npm', ['run', script], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
  .filter(({ status }) => status !== 0)
  .map(({ stdout, stderr }) => `${stdout}${stderr}`);
if (failures.length === 0) process.exit(0);

console.error(failures.join('\n').split('\n').filter(Boolean).slice(0, 30).join('\n'));
process.exit(2);
