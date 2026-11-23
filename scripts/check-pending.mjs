// Fails while the Spanish copy still holds a [PENDIENTE] marker, so nothing is published with a blank NIT or address.
// Not part of `npm run check`: the drafts are meant to carry markers until Santiago supplies the data.
import { readFile } from 'node:fs/promises';

const messages = JSON.parse(await readFile(new URL('../apps/landing/messages/es.json', import.meta.url), 'utf8'));

const pending = (value, path = '') =>
  typeof value === 'string'
    ? value.includes('[PENDIENTE') ? [path] : []
    : Object.entries(value).flatMap(([key, child]) => pending(child, path ? `${path}.${key}` : key));

const found = pending(messages);

if (found.length > 0) {
  console.error(`Blocked: ${found.length} message(s) still hold a [PENDIENTE] marker:\n${found.map((path) => `  ${path}`).join('\n')}`);
  process.exit(1);
}

console.log('No [PENDIENTE] markers left in messages/es.json.');
