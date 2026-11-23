import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import './support/next-resolution.mjs';

const config = pathToFileURL(join(import.meta.dirname, '../apps/landing/next.config.ts')).href;
let run = 0;
// A new query string is a new module, so Node evaluates the file again under the env of each case
const load = () => import(`${config}?case=${++run}`);

const withEnv = async (env, check) => {
  const saved = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
  const apply = (values) => Object.entries(values).forEach(([name, value]) => (value === undefined ? delete process.env[name] : (process.env[name] = value)));
  try {
    apply(env);
    await check();
  } finally {
    apply(saved);
  }
};

test('next.config.ts throws for a production build without WAITLIST_ADAPTER=live', async () => {
  const message = 'Production builds need WAITLIST_ADAPTER=live (Netlify, Production context).';
  await withEnv({ CONTEXT: 'production', WAITLIST_ADAPTER: undefined }, () => assert.rejects(load(), { message }));
  await withEnv({ CONTEXT: 'production', WAITLIST_ADAPTER: 'fake' }, () => assert.rejects(load(), { message }));
  await withEnv({ CONTEXT: 'production', WAITLIST_ADAPTER: 'live' }, () => assert.doesNotReject(load()));
  // next dev, the e2e's next start and a local next build have no CONTEXT; deploy previews run fake
  await withEnv({ CONTEXT: undefined, WAITLIST_ADAPTER: undefined }, () => assert.doesNotReject(load()));
  await withEnv({ CONTEXT: 'deploy-preview', WAITLIST_ADAPTER: 'fake' }, () => assert.doesNotReject(load()));
});

test('next.config.ts throws for a deploy preview or branch deploy with WAITLIST_ADAPTER=live', async () => {
  const message = 'Deploy previews and branch deploys must not run WAITLIST_ADAPTER=live: set it for the Production context only.';
  await withEnv({ CONTEXT: 'deploy-preview', WAITLIST_ADAPTER: 'live' }, () => assert.rejects(load(), { message }));
  await withEnv({ CONTEXT: 'branch-deploy', WAITLIST_ADAPTER: 'live' }, () => assert.rejects(load(), { message }));
  // netlify dev sets CONTEXT=dev, and testing live locally stays possible
  await withEnv({ CONTEXT: 'dev', WAITLIST_ADAPTER: 'live' }, () => assert.doesNotReject(load()));
  await withEnv({ CONTEXT: 'deploy-preview', WAITLIST_ADAPTER: 'fake' }, () => assert.doesNotReject(load()));
});
