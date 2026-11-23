import { createHmac } from 'node:crypto';
import type { Store } from './store';

export type ThrottleLimits = { addressGapMs: number; addressPerDay: number; ipPerHour: number; totalPerDay: number };
export const defaultLimits: ThrottleLimits = { addressGapMs: 120_000, addressPerDay: 3, ipPerHour: 30, totalPerDay: 1_000 };

export type Verdict = 'send' | 'skip' | 'refuse';
export type Throttle = { admit: (email: string, ip: string | undefined) => Promise<Verdict> };

type Counter = { count: number };

// The IP and total counters are approximate: Blobs has no atomic increment, and concurrent requests may under-count.
// The per-address limits use create-only claims, so they hold under concurrency
export const createThrottle = (store: Store, hashKey: Uint8Array, limits: ThrottleLimits, now: () => number = Date.now): Throttle => {
  const hash = (value: string) => createHmac('sha256', hashKey).update(value).digest('hex');

  const admit: Throttle['admit'] = async (email, ip) => {
    const time = now();
    const stamp = new Date(time).toISOString().replace(/\D/g, '');
    const day = stamp.slice(0, 8);
    const ipKey = ip === undefined ? undefined : `ip:${hash(ip)}:${stamp.slice(0, 10)}`;
    const totalKey = `total:${day}`;

    const ipCount = ipKey ? ((await store.getJSON<Counter>(ipKey))?.count ?? 0) : 0;
    if (ipCount >= limits.ipPerHour) return 'refuse';
    const total = (await store.getJSON<Counter>(totalKey))?.count ?? 0;
    if (total >= limits.totalPerDay) return 'refuse';
    if (ipKey) await store.setJSON(ipKey, { count: ipCount + 1 });

    const address = hash(email.trim().toLowerCase());
    if (!(await store.claim(`gap:${address}:${Math.floor(time / limits.addressGapMs)}`, 1))) return 'skip';
    for (let n = 1; n <= limits.addressPerDay; n++) {
      if (!(await store.claim(`day:${address}:${day}:${n}`, 1))) continue;
      await store.setJSON(totalKey, { count: total + 1 });
      return 'send';
    }
    return 'skip';
  };

  return { admit };
};
