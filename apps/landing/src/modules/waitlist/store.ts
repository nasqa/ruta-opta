import { getStore } from '@netlify/blobs';
import { withDeadline } from './deadline';

export type Store = { getJSON: <T>(key: string) => Promise<T | undefined>; setJSON: (key: string, value: unknown) => Promise<void>;
  // Create-only write: true when this call created the key, false when it already existed
  claim: (key: string, value: unknown) => Promise<boolean>;
  // Resolves whether or not the key existed
  delete: (key: string) => Promise<void>;
};
export type MemoryStore = Store & { entries: () => [string, unknown][] };

export const createMemoryStore = (): MemoryStore => {
  const data = new Map<string, string>();
  return {
    getJSON: async <T>(key: string) => {
      const raw = data.get(key);
      return raw === undefined ? undefined : (JSON.parse(raw) as T);
    },
    setJSON: async (key, value) => {
      data.set(key, JSON.stringify(value));
    },
    claim: async (key, value) => {
      // no await between the check and the set, so concurrent claims cannot both win
      if (data.has(key)) return false;
      data.set(key, JSON.stringify(value));
      return true;
    },
    delete: async (key) => {
      data.delete(key);
    },
    entries: () => [...data].map(([key, raw]): [string, unknown] => [key, JSON.parse(raw)]),
  };
};

// In the Next.js runtime, body.cancel() on a fetch response never settles, and @netlify/blobs cancels the body of every 404, so reading a key
// that does not exist yet hung. Reading each body in full first leaves nothing to cancel; the values kept here are small JSON
const nullBodyStatuses = new Set([101, 204, 205, 304]);
export const bufferedFetch = (inner: typeof fetch = fetch): typeof fetch => async (input, init) => {
  const response = await inner(input, init);
  const body = nullBodyStatuses.has(response.status) ? null : await response.arrayBuffer();
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
};

// @netlify/blobs sets no request timeout and retries a failed request 5 times, 5 s apart, so one operation during an outage can outlast a
// Function. Each operation is raced against this instead; an AbortSignal in a custom fetch would not do, because the retry loop catches the abort
export const blobsTimeoutMs = 2_000;

type BlobsOptions = { open?: () => Pick<ReturnType<typeof getStore>, 'get' | 'setJSON' | 'delete'>; timeoutMs?: number };

// Netlify injects the credentials per request, so the store is opened inside each call
export const createBlobsStore = (name: string, { open = () => getStore({ name, consistency: 'strong', fetch: bufferedFetch() }), timeoutMs = blobsTimeoutMs }: BlobsOptions = {}): Store => {
  // Opening runs inside the race too, so a throw from getStore becomes a rejection like any other failure
  const timed = <T>(operation: string, task: () => Promise<T>) => withDeadline(Promise.resolve().then(task), timeoutMs, `Netlify Blobs ${operation}`);
  return {
    getJSON: <T>(key: string) => timed('get', async () => ((await open().get(key, { type: 'json' })) as T | null) ?? undefined),
    setJSON: (key, value) => timed('set', async () => {
      await open().setJSON(key, value);
    }),
    claim: (key, value) => timed('claim', async () => (await open().setJSON(key, value, { onlyIfNew: true })).modified),
    delete: (key) => timed('delete', () => open().delete(key)),
  };
};
