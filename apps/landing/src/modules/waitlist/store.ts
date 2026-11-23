import { getStore } from '@netlify/blobs';

export type Store = { getJSON: <T>(key: string) => Promise<T | undefined>; setJSON: (key: string, value: unknown) => Promise<void> };
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
    entries: () => [...data].map(([key, raw]): [string, unknown] => [key, JSON.parse(raw)]),
  };
};

// Netlify injects the credentials per request, so the store is opened inside each call
export const createBlobsStore = (name: string): Store => ({
  getJSON: async <T>(key: string) => (await getStore({ name, consistency: 'strong' }).get(key, { type: 'json' }) as T | null) ?? undefined,
  setJSON: async (key, value) => {
    await getStore({ name, consistency: 'strong' }).setJSON(key, value);
  },
});
