// Throwaway diagnostic for a deploy preview; never merged
import { getStore } from '@netlify/blobs';

const race = <T>(task: Promise<T>, ms: number) =>
  Promise.race([task, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms))]);

const probe = async (label: string, task: () => Promise<unknown>) => {
  const started = Date.now();
  try {
    const value = await race(Promise.resolve().then(task), 6_000);
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
  const ctx = raw ? (JSON.parse(Buffer.from(raw, 'base64').toString()) as Record<string, string>) : {};
  const rawFetch = (base: string, path: string) => async () => {
    const res = await fetch(new URL(`/${ctx.siteID}/site:waitlist-diag/${path}`, base), { headers: { authorization: `Bearer ${ctx.token}` } });
    return { status: res.status, server: res.headers.get('server'), xcache: res.headers.get('x-nf-request-id') ? 'has-request-id' : null, body: (await res.text()).slice(0, 120) };
  };
  const noStore: typeof fetch = (url, init) => fetch(url, { ...init, cache: 'no-store' });
  const nullBody = new Set([101, 204, 205, 304]);
  const buffered: typeof fetch = async (url, init) => {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    const body = nullBody.has(res.status) ? null : await res.arrayBuffer();
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  };
  const cancelProbe = async () => {
    const res = await fetch(new URL(`/${ctx.siteID}/site:waitlist-diag/${key}`, ctx.uncachedEdgeURL), { headers: { authorization: `Bearer ${ctx.token}` } });
    await res.body?.cancel();
    return res.status;
  };
  const results = [
    await probe('raw GET missing then body.cancel()', cancelProbe),
    await probe('getStore fetch=no-store get missing', () => getStore({ name: 'waitlist-diag', consistency: 'strong', fetch: noStore }).get(key)),
    await probe('getStore fetch=buffered get missing', () => getStore({ name: 'waitlist-diag', consistency: 'strong', fetch: buffered }).get(key)),
  ];
  if (results.length) return Response.json({ results });
  const unused = [
    await probe('raw uncached GET missing', rawFetch(ctx.uncachedEdgeURL ?? '', key)),
    await probe('raw cached GET missing', rawFetch(ctx.edgeURL ?? '', key)),
    await probe('getStore region get missing', () => getStore({ name: 'waitlist-diag', consistency: 'strong', region: ctx.primaryRegion as never } as never).get(key)),
    await probe('eventual get', () => getStore({ name: 'waitlist-diag' }).get(key, { type: 'json' })),
    await probe('strong get', () => strong().get(key, { type: 'json' })),
    await probe('setJSON', () => strong().setJSON(key, { at: Date.now() })),
    await probe('setJSON onlyIfNew', () => strong().setJSON(key, 1, { onlyIfNew: true })),
    await probe('strong get after set', () => strong().get(key, { type: 'json' })),
    await probe('delete', () => strong().delete(key)),
  ];
  return Response.json({ contextFound: Boolean(raw), contextKeys, hosts, siteIdSet: Boolean(process.env.SITE_ID), results });
};
