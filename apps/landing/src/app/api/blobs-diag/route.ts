// Throwaway diagnostic for a deploy preview; never merged
import { getStore } from '@netlify/blobs';

const race = <T>(task: Promise<T>, ms: number) =>
  Promise.race([task, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms))]);

const probe = async (label: string, task: () => Promise<unknown>) => {
  const started = Date.now();
  try {
    const value = await race(Promise.resolve().then(task), 8_000);
    return { label, ms: Date.now() - started, ok: true, value: JSON.stringify(value ?? null) };
  } catch (error) {
    return { label, ms: Date.now() - started, ok: false, error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
  }
};

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const raw = (globalThis as { netlifyBlobsContext?: string }).netlifyBlobsContext ?? process.env.NETLIFY_BLOBS_CONTEXT;
  let contextKeys: string[] = [];
  const hosts: Record<string, string> = {};
  if (raw) {
    try {
      const context = JSON.parse(Buffer.from(raw, 'base64').toString()) as Record<string, string>;
      contextKeys = Object.keys(context);
      for (const name of ['edgeURL', 'uncachedEdgeURL', 'apiURL']) if (context[name]) hosts[name] = new URL(context[name]).host;
    } catch {
      contextKeys = ['<unparseable>'];
    }
  }
  const key = `probe-${Date.now()}`;
  const strong = () => getStore({ name: 'waitlist-diag', consistency: 'strong' });
  const results = [
    await probe('eventual get', () => getStore({ name: 'waitlist-diag' }).get(key, { type: 'json' })),
    await probe('strong get', () => strong().get(key, { type: 'json' })),
    await probe('setJSON', () => strong().setJSON(key, { at: Date.now() })),
    await probe('setJSON onlyIfNew', () => strong().setJSON(key, 1, { onlyIfNew: true })),
    await probe('strong get after set', () => strong().get(key, { type: 'json' })),
    await probe('delete', () => strong().delete(key)),
  ];
  return Response.json({ contextFound: Boolean(raw), contextKeys, hosts, siteIdSet: Boolean(process.env.SITE_ID), results });
};
