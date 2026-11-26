import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const root = join(import.meta.dirname, '..');
const read = (path) => readFile(join(root, path), 'utf8');

const { events, pageGoalRoutes } = await import(join(root, 'apps/landing/src/modules/analytics/catalog.ts'));
const { routing } = await import(join(root, 'apps/landing/src/i18n/routing.ts'));

// The lines under one "## " heading, up to the next one
const section = async (heading) => {
  const lines = (await read('docs/analytics.md')).split('\n');
  const start = lines.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, `docs/analytics.md has no "## ${heading}" heading`);
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  return lines.slice(start + 1, end === -1 ? undefined : end);
};

// Goals are typed into the dashboard from this document, so each name must be the catalog's, letter by letter
test('the Goals table lists exactly the active goals', async () => {
  const rows = (await section('Goals')).filter((line) => line.startsWith('|')).slice(2);
  assert.deepEqual(
    rows.map((row) => row.split('|')[1].trim()).toSorted(),
    Object.values(events)
      .map(({ goal }) => goal)
      .toSorted(),
  );
});

test('the Pageview goals list holds exactly the localised paths of the funnel pages', async () => {
  const listed = (await section('Pageview goals')).filter((line) => line.startsWith('- ')).map((line) => /^- `([^`]+)`/.exec(line)?.[1] ?? line);
  const paths = pageGoalRoutes.flatMap((route) => routing.locales.map((locale) => `/${locale}${routing.pathnames[route][locale]}`));
  assert.deepEqual(listed.toSorted(), paths.toSorted());
});

test('the growth skill no longer teaches the tracked-link parameter that never shipped', async () => {
  assert.ok(!(await read('.claude/skills/growth-opta/SKILL.md')).includes('?o='), 'SKILL.md still names ?o=');
});
