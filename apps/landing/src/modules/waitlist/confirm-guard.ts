import { createHmac } from 'node:crypto';
import type { Store } from './store';

export type ConfirmGuard = {
  alreadyConfirmed: (token: string) => Promise<boolean>;
  admit: (token: string) => Promise<boolean>;
  markConfirmed: (token: string) => Promise<void>;
};

const minuteMs = 60_000;

// Every confirm calls Zoho's listsubscribe, which Zoho locks for 30 minutes after 500 calls a minute, so one replayed link could lock it for everyone.
// A confirmed token answers from its marker, and any token gets one try a minute. The keys hold an HMAC of the token's bytes, never the token:
// base64url decoding skips stray characters, so many spellings open as one token and must count as one
export const createConfirmGuard = (store: Store, hashKey: Uint8Array, now: () => number = Date.now): ConfirmGuard => {
  const hash = (token: string) => createHmac('sha256', hashKey).update(Buffer.from(token, 'base64url')).digest('hex');
  return {
    alreadyConfirmed: async (token) => (await store.getJSON(`confirmed:${hash(token)}`)) !== undefined,
    admit: (token) => store.claim(`confirm:${hash(token)}:${Math.floor(now() / minuteMs)}`, 1),
    markConfirmed: (token) => store.setJSON(`confirmed:${hash(token)}`, 1),
  };
};
