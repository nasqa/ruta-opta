import { createHmac } from 'node:crypto';
import { isIPv6 } from 'node:net';
import type { Store } from './store';

export type ThrottleLimits = { addressGapMs: number; addressPerDay: number; ipPerHour: number; totalPerDay: number };
export const defaultLimits: ThrottleLimits = { addressGapMs: 120_000, addressPerDay: 3, ipPerHour: 30, totalPerDay: 1_000 };

// release gives back the gap and day claims of a send that failed, so a retry is not skipped. The IP and total counters stay counted
export type Admission = { verdict: 'send'; release: () => Promise<void> } | { verdict: 'skip' } | { verdict: 'refuse'; reason: 'ip' | 'cap' };
export type Throttle = { admit: (email: string, ip: string | undefined) => Promise<Admission> };

type Counter = { count: number };

// One mailbox, one limit: a +tag is dropped everywhere, and Gmail also ignores dots and answers at googlemail.com. Only the hash sees this;
// the email still goes to the address as typed
const canonicalAddress = (email: string) => {
  const address = email.trim().toLowerCase();
  const at = address.lastIndexOf('@');
  const local = address.slice(0, at).split('+')[0];
  const domain = address.slice(at + 1) === 'googlemail.com' ? 'gmail.com' : address.slice(at + 1);
  return `${domain === 'gmail.com' ? local.replaceAll('.', '') : local}@${domain}`;
};

// A subscriber gets a whole IPv6 /64, so the /64 is the bucket. The URL parser writes the address canonically (case, leading zeros, embedded IPv4)
// before '::' is expanded. An IPv4-mapped address is its IPv4 address; anything else, IPv4 or live mode's 'unknown', is used as is
const ipBucket = (ip: string) => {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)?.[1];
  if (mapped || !isIPv6(ip) || !URL.canParse(`http://[${ip}]`)) return mapped ?? ip;
  const [head, tail] = new URL(`http://[${ip}]`).hostname.slice(1, -1).split('::');
  const groups = (part: string | undefined) => (part ? part.split(':') : []);
  const hextets = [...groups(head), ...Array<string>(8 - groups(head).length - groups(tail).length).fill('0'), ...groups(tail)];
  return `${hextets.slice(0, 4).join(':')}::/64`;
};

// The IP and total counters are approximate: Blobs has no atomic increment, and concurrent requests may under-count.
// The per-address limits use create-only claims, so they hold under concurrency
export const createThrottle = (store: Store, hashKey: Uint8Array, limits: ThrottleLimits, now: () => number = Date.now): Throttle => {
  const hash = (value: string) => createHmac('sha256', hashKey).update(value).digest('hex');

  const admit: Throttle['admit'] = async (email, ip) => {
    const time = now();
    const stamp = new Date(time).toISOString().replace(/\D/g, '');
    const day = stamp.slice(0, 8);
    const ipKey = ip === undefined ? undefined : `ip:${hash(ipBucket(ip))}:${stamp.slice(0, 10)}`;
    const totalKey = `total:${day}`;

    const ipCount = ipKey ? ((await store.getJSON<Counter>(ipKey))?.count ?? 0) : 0;
    if (ipCount >= limits.ipPerHour) return { verdict: 'refuse', reason: 'ip' };
    const total = (await store.getJSON<Counter>(totalKey))?.count ?? 0;
    if (total >= limits.totalPerDay) return { verdict: 'refuse', reason: 'cap' };
    if (ipKey) await store.setJSON(ipKey, { count: ipCount + 1 });

    const address = hash(canonicalAddress(email));
    // two consecutive slots, so a send blocks until slot s+2 and two sends never land closer than the gap
    const slot = Math.floor(time / limits.addressGapMs);
    const gaps = [`gap:${address}:${slot}`, `gap:${address}:${slot + 1}`];
    if (!(await store.claim(gaps[0], 1))) return { verdict: 'skip' };
    if (!(await store.claim(gaps[1], 1))) return { verdict: 'skip' };
    for (let n = 1; n <= limits.addressPerDay; n++) {
      const dayKey = `day:${address}:${day}:${n}`;
      if (!(await store.claim(dayKey, 1))) continue;
      await store.setJSON(totalKey, { count: total + 1 });
      const release = async () => {
        // every claim is tried, so one failed delete does not keep the others
        const deletes = await Promise.allSettled([...gaps, dayKey].map((key) => store.delete(key)));
        if (deletes.some(({ status }) => status === 'rejected')) throw new Error('A throttle claim could not be released');
      };
      return { verdict: 'send', release };
    }
    return { verdict: 'skip' };
  };

  return { admit };
};
