import type { Locale } from 'next-intl';
import type { Audience, SubscribeResult } from './audience';
import type { Store } from './store';
import { openToken, sealToken, type TokenKeys } from './token';

// Canada is left out: its hosts are zohocloud.ca, not zoho.ca, and were never verified
export const zohoDataCenters = ['com', 'eu', 'in', 'com.au', 'jp', 'sa', 'com.cn'] as const;

export type ZohoConfig = {
  dataCenter: (typeof zohoDataCenters)[number]; clientId: string; clientSecret: string; refreshToken: string;
  listKeys: Record<Locale, string>; store: Store; keys: TokenKeys; fetch?: typeof fetch; timeoutMs?: number; now?: () => number;
};

type ZohoBody = { code?: unknown; error?: unknown; access_token?: unknown; expires_in?: unknown };
type Reply = { status: number; ok: boolean; body?: ZohoBody } | { failure: 'timeout' | 'network' };
type Grant = { token: string } | { code: string };

const storeKey = 'zoho:access-token';
// An access token lasts an hour at most; dropping it a minute early keeps a request from racing its expiry
const maxLifetimeSeconds = 3600;
const expiryMarginMs = 60_000;

const parse = (text: string): ZohoBody | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null ? (value as ZohoBody) : undefined;
  } catch {
    return undefined;
  }
};

const unavailable = (code: string): SubscribeResult => ({ status: 'unavailable', code });

// Campaigns reports a rejected token as HTTP 401, or inside a 200 as code 401 or 1007 ("Unauthorized request")
const isUnauthorized = (reply: Reply) => !('failure' in reply) && (reply.status === 401 || ['401', '1007'].includes(String(reply.body?.code)));

// Zoho's OAuth errors are plain words such as invalid_code; anything else falls back to the status
const tokenFailure = ({ status, body }: { status: number; body?: ZohoBody }) =>
  `token_${typeof body?.error === 'string' && /^[a-z_]{1,40}$/i.test(body.error) ? body.error : status}`;

// Zoho answers with its own code: a do-not-mail contact comes back as status "success" with code 2006, so only the code counts
const toResult = (reply: Reply): SubscribeResult => {
  if ('failure' in reply) return unavailable(reply.failure);
  const code = reply.body?.code;
  if (String(code) === '0') return { status: 'subscribed' };
  if (String(code) === '2006') return { status: 'blocked' };
  return unavailable(String(code ?? `http_${reply.status}`));
};

export const createZohoAudience = ({
  dataCenter, clientId, clientSecret, refreshToken, listKeys, store, keys, fetch: doFetch = fetch, timeoutMs = 4000, now = Date.now,
}: ZohoConfig): Audience => {
  // Memory and the store both hold the sealed token, so its expiry travels with it
  let memory: string | undefined;
  let inflight: Promise<Grant> | undefined;

  const open = (sealed: unknown) => {
    if (typeof sealed !== 'string') return undefined;
    const opened = openToken<string>('zoho-access-token', sealed, keys, now());
    return opened.status === 'valid' ? opened.payload : undefined;
  };

  const post = async (url: string, params: Record<string, string>, headers: Record<string, string> = {}): Promise<Reply> => {
    try {
      const response = await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
        body: new URLSearchParams(params),
        signal: AbortSignal.timeout(timeoutMs),
      });
      return { status: response.status, ok: response.ok, body: parse(await response.text()) };
    } catch (error) {
      const name = error instanceof Error ? error.name : undefined;
      return { failure: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network' };
    }
  };

  const requestToken = async (): Promise<Grant> => {
    const reply = await post(`https://accounts.zoho.${dataCenter}/oauth/v2/token`, {
      grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret,
    });
    if ('failure' in reply) return { code: reply.failure };
    const token = reply.body?.access_token;
    if (!reply.ok || typeof token !== 'string' || !token) return { code: tokenFailure(reply) };
    const expiresIn = typeof reply.body?.expires_in === 'number' ? reply.body.expires_in : maxLifetimeSeconds;
    memory = sealToken('zoho-access-token', token, keys, Math.min(expiresIn, maxLifetimeSeconds) * 1000 - expiryMarginMs, now());
    // The store only spares other instances a refresh: when it is down, this instance still has its token
    await store.setJSON(storeKey, memory).catch(() => undefined);
    return { token };
  };

  const loadToken = async (): Promise<Grant> => {
    const stored = await store.getJSON<string>(storeKey).catch(() => undefined);
    const token = open(stored);
    if (!token) return requestToken();
    memory = stored;
    return { token };
  };

  // Zoho allows 10 refreshes per 10 minutes per refresh token, so concurrent callers in one instance share one lookup
  const once = (task: () => Promise<Grant>) => (inflight ??= task().finally(() => { inflight = undefined; }));

  const grant = (): Promise<Grant> => {
    const cached = open(memory);
    return cached ? Promise.resolve({ token: cached }) : once(loadToken);
  };

  // A concurrent caller may already have replaced the rejected token. Otherwise both caches are cleared and the store is not read again
  const renew = (rejected: string): Promise<Grant> => {
    const current = open(memory);
    if (current && current !== rejected) return Promise.resolve({ token: current });
    memory = undefined;
    return once(async () => {
      await store.setJSON(storeKey, null).catch(() => undefined);
      return requestToken();
    });
  };

  const listSubscribe = (token: string, params: Record<string, string>) =>
    post(`https://campaigns.zoho.${dataCenter}/api/v1.1/json/listsubscribe`, params, { Authorization: `Zoho-oauthtoken ${token}` });

  return {
    // At most four calls: token, subscribe, and after a rejected token one more of each. Timeouts are never retried
    subscribe: async ({ email, name }, locale, source) => {
      const params = { resfmt: 'JSON', listkey: listKeys[locale], contactinfo: JSON.stringify({ 'Contact Email': email, 'First Name': name }), source };
      try {
        const auth = await grant();
        if ('code' in auth) return unavailable(auth.code);
        const reply = await listSubscribe(auth.token, params);
        if (!isUnauthorized(reply)) return toResult(reply);
        const renewed = await renew(auth.token);
        return 'code' in renewed ? unavailable(renewed.code) : toResult(await listSubscribe(renewed.token, params));
      } catch {
        return unavailable('unexpected');
      }
    },
  };
};
