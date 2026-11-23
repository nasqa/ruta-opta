import 'server-only';
import type { WaitlistValues } from './state';

// Zoho runs one data center per region: the account's address decides which one our keys belong to
const dataCenters = ['com', 'eu', 'in', 'com.au', 'jp', 'ca', 'sa', 'com.cn'];
const requestTimeout = 8000;
const tokenMargin = 60_000;

type ZohoSettings = { dataCenter: string; clientId: string; clientSecret: string; refreshToken: string; listKey: string };

const readSettings = (): ZohoSettings | undefined => {
  const { ZOHO_DC = 'com', ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_LIST_KEY } = process.env;
  if (!dataCenters.includes(ZOHO_DC) || !ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_LIST_KEY) return undefined;

  return { dataCenter: ZOHO_DC, clientId: ZOHO_CLIENT_ID, clientSecret: ZOHO_CLIENT_SECRET, refreshToken: ZOHO_REFRESH_TOKEN, listKey: ZOHO_LIST_KEY };
};

// Tests run the form against a stand-in. It never runs on Netlify's production context, so a stray variable cannot fake signups
const usesStandIn = () => process.env.WAITLIST_ADAPTER === 'fake' && process.env.CONTEXT !== 'production';

// Zoho limits how many access tokens one refresh token can mint, so a warm server reuses the one it has
let cachedToken: { value: string; expiresAt: number } | undefined;

const accessToken = async (settings: ZohoSettings) => {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const response = await fetch(`https://accounts.zoho.${settings.dataCenter}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: settings.refreshToken,
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(requestTimeout),
  });
  const body: { access_token?: string; expires_in?: number } = await response.json();
  if (!response.ok || !body.access_token) throw new Error(`token request failed (${response.status})`);

  cachedToken = { value: body.access_token, expiresAt: Date.now() + Math.min(body.expires_in ?? 3600, 3600) * 1000 - tokenMargin };
  return cachedToken.value;
};

// With the list's double opt-in on, Zoho emails the person and adds them only once they confirm
const subscribe = async (settings: ZohoSettings, { name, email }: WaitlistValues) => {
  const response = await fetch(`https://campaigns.zoho.${settings.dataCenter}/api/v1.1/json/listsubscribe`, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${await accessToken(settings)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      resfmt: 'JSON',
      listkey: settings.listKey,
      contactinfo: JSON.stringify({ 'First Name': name, 'Contact Email': email }),
      source: 'rutaopta.org',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(requestTimeout),
  });
  const body: { status?: string; code?: string | number } = await response.json();
  if (response.status === 401) cachedToken = undefined;
  if (!response.ok || body.status !== 'success') throw new Error(`subscribe failed (${response.status}, code ${body.code ?? 'none'})`);
};

// Returns what the form needs to show. The log names the failure, never the person's data
export const subscribeToWaitlist = async (values: WaitlistValues): Promise<'sent' | 'unavailable'> => {
  if (usesStandIn()) return 'sent';

  const settings = readSettings();
  if (!settings) {
    console.error('waitlist: the Zoho settings are missing or invalid');
    return 'unavailable';
  }

  try {
    await subscribe(settings, values);
    return 'sent';
  } catch (error) {
    console.error('waitlist: Zoho did not accept the signup:', error instanceof Error ? error.message : 'unknown error');
    return 'unavailable';
  }
};
