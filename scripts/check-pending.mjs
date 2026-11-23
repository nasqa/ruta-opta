// Fails while any message file holds a [PENDIENTE] marker, so nothing is published with a blank NIT, address or draft copy.
// Not part of `npm run check`: the drafts are meant to carry markers until Santiago supplies the data.
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const messagesDir = process.env.MESSAGES_DIR ?? fileURLToPath(new URL('../apps/landing/messages', import.meta.url));

const pending = (value, path = '') =>
  typeof value === 'string'
    ? value.includes('[PENDIENTE') ? [path] : []
    : Object.entries(value).flatMap(([key, child]) => pending(child, path ? `${path}.${key}` : key));

const files = (await readdir(messagesDir)).filter((file) => file.endsWith('.json')).sort();

const found = (
  await Promise.all(
    files.map(async (file) => pending(JSON.parse(await readFile(join(messagesDir, file), 'utf8'))).map((path) => `${basename(file, '.json')}: ${path}`)),
  )
).flat();

if (found.length > 0) {
  console.error(`Blocked: ${found.length} message(s) still hold a [PENDIENTE] marker:\n${found.map((line) => `  ${line}`).join('\n')}`);
  process.exit(1);
}

console.log(`No [PENDIENTE] markers left in ${files.join(', ')}.`);
