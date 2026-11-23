import { getStore } from '@netlify/blobs';

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

// Netlify injects the credentials per request, so the store is opened inside each call
export const createBlobsStore = (name: string): Store => ({
  getJSON: async <T>(key: string) => (await getStore({ name, consistency: 'strong' }).get(key, { type: 'json' }) as T | null) ?? undefined,
  setJSON: async (key, value) => {
    await getStore({ name, consistency: 'strong' }).setJSON(key, value);
  },
  claim: async (key, value) => (await getStore({ name, consistency: 'strong' }).setJSON(key, value, { onlyIfNew: true })).modified,
  delete: (key) => getStore({ name, consistency: 'strong' }).delete(key),
});
