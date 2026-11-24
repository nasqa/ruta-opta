import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { siteUrl } from '@/shared/env';
import type { Audience } from './audience';
import { createFakeAudience } from './audience-fake';
import { createZohoAudience, zohoDataCenters } from './audience-zoho';
import { buildConfirmEmail } from './confirm-email';
import { createConfirmGuard } from './confirm-guard';
import type { Mailer } from './mailer';
import { createCpaasMailer } from './mailer-cpaas';
import { createFakeMailer } from './mailer-fake';
import type { WaitlistValues } from './state';
import { createBlobsStore, createMemoryStore, type Store } from './store';
import { createThrottle, defaultLimits } from './throttle';
import { deriveKey, parseTokenKeys, type TokenKeys } from './token';
import { type ConfirmResult, createWaitlist, type ReadResult, type WaitlistDeps } from './use-cases';

// The privacy policy version a subscriber consents to; the token carries it to Zoho. Bump it whenever the policy's fields or purposes change
// (2026-11-24: the origin tag of a tracked link)
const policyVersion = '2026-11-24-draft';

type Waitlist = ReturnType<typeof createWaitlist>;
// Reads a variable through its parser; a blank variable takes the fallback. A missing or unparsable value comes back undefined and its name is reported
type Read = <T>(name: string, parse: (value: string) => T | undefined, fallback?: T) => T | undefined;

const text = (value: string) => value;
const isComplete = <T extends object>(values: T): values is { [K in keyof T]: Exclude<T[K], undefined> } =>
  Object.values(values).every((value) => value !== undefined);

// Switching provider is one more entry here and its MAIL_PROVIDER value; each entry reads its own variables
const mailers = {
  cpaas: (read: Read) => {
    const settings = { apiKey: read('CPAAS_API_KEY', text), fromAddress: read('MAIL_FROM_ADDRESS', text) };
    return isComplete(settings) ? createCpaasMailer(settings) : undefined;
  },
} satisfies Record<string, (read: Read) => Mailer | undefined>;

// Switching newsletter tool is the same with AUDIENCE_PROVIDER. An entry reads its own variables first, so every missing one is reported in one log,
// and then builds on the shared store and token keys
type Shared = { store: Store; keys: TokenKeys };
const audiences = {
  zoho: (read: Read) => {
    const settings = {
      dataCenter: read('ZOHO_DC', (value) => zohoDataCenters.find((center) => center === value), 'com'),
      clientId: read('ZOHO_CLIENT_ID', text),
      clientSecret: read('ZOHO_CLIENT_SECRET', text),
      refreshToken: read('ZOHO_REFRESH_TOKEN', text),
      es: read('ZOHO_LIST_KEY_ES', text),
      en: read('ZOHO_LIST_KEY_EN', text),
    };
    if (!isComplete(settings)) return undefined;
    const { es, en, ...zoho } = settings;
    return (shared: Shared) => createZohoAudience({ ...zoho, listKeys: { es, en }, ...shared });
  },
} satisfies Record<string, (read: Read) => ((shared: Shared) => Audience) | undefined>;

const isMailProvider = (value: string): value is keyof typeof mailers => Object.hasOwn(mailers, value);
const isAudienceProvider = (value: string): value is keyof typeof audiences => Object.hasOwn(audiences, value);

const confirmEmail: WaitlistDeps['confirmEmail'] = async (locale, confirmUrl) => {
  const [t, layout] = await Promise.all([getTranslations({ locale, namespace: 'ConfirmEmail' }), getTranslations({ locale, namespace: 'EmailLayout' })]);
  const copy = { sender: t('sender'), subject: t('subject'), preheader: t('preheader'), heading: t('heading'), paragraphs: [t('p1'), t('p2'), t('p3')], action: t('action') };
  const chrome = {
    logoUrl: new URL('/email/opta-horizontal-plate@2x.png', siteUrl).href,
    logoAlt: layout('logoAlt'),
    privacyUrl: new URL(getPathname({ locale, href: '/privacy' }), siteUrl).href,
    privacyLabel: layout('privacyLabel'),
    reason: layout('reason'),
    organization: layout('organization'),
    fallback: layout('fallback'),
  };
  return buildConfirmEmail(copy, locale, confirmUrl, chrome);
};

const confirmUrl: WaitlistDeps['confirmUrl'] = (locale, token) =>
  new URL(getPathname({ locale, href: { pathname: '/confirm', query: { t: token } } }), siteUrl).href;

const common = { policyVersion, confirmEmail, confirmUrl, now: Date.now, reference: randomUUID, log: console.error };

// Local runs, the e2e and deploy previews: nothing leaves the process. A random key when none is set means links die with the process
const composeFake = (): Waitlist => {
  const keys = parseTokenKeys(process.env.WAITLIST_TOKEN_KEY) ?? { current: new Uint8Array(randomBytes(32)) };
  const store = createMemoryStore();
  const hashKey = deriveKey(keys, 'waitlist/throttle');
  const throttle = createThrottle(store, hashKey, defaultLimits);
  return createWaitlist({ ...common, mailer: createFakeMailer(), audience: createFakeAudience(), throttle, guard: createConfirmGuard(store, hashKey), keys });
};

// Returns the waitlist, or the names of the variables that are missing or invalid
const composeLive = (): Waitlist | string[] => {
  const invalid: string[] = [];
  const read: Read = (name, parse, fallback) => {
    const raw = process.env[name];
    const value = raw ? parse(raw) : fallback;
    if (value === undefined) invalid.push(name);
    return value;
  };

  const mailProvider = read('MAIL_PROVIDER', (value) => (isMailProvider(value) ? value : undefined));
  const audienceProvider = read('AUDIENCE_PROVIDER', (value) => (isAudienceProvider(value) ? value : undefined), 'zoho');
  const settings = {
    mailer: mailProvider && mailers[mailProvider](read),
    audience: audienceProvider && audiences[audienceProvider](read),
    // Each key is parsed on its own, so a bad previous key is reported by its own name
    currentKey: read('WAITLIST_TOKEN_KEY', (value) => parseTokenKeys(value)?.current),
    previousKey: read('WAITLIST_TOKEN_KEY_PREVIOUS', (value) => parseTokenKeys(value)?.current, null),
    dailyCap: read('WAITLIST_DAILY_CAP', (value) => (/^[1-9]\d*$/.test(value) ? Number(value) : undefined), defaultLimits.totalPerDay),
  };
  // The confirm links are built on URL, which falls back to localhost when unset: a live email must never carry that, or plain http
  if (siteUrl.protocol !== 'https:') invalid.push('URL');
  if (!isComplete(settings) || invalid.length > 0) return invalid;

  const { mailer, currentKey, previousKey, dailyCap } = settings;
  const keys = previousKey ? { current: currentKey, previous: previousKey } : { current: currentKey };
  // SITE_ID is set on Netlify only; a live run elsewhere keeps its state in memory
  const store = process.env.SITE_ID ? createBlobsStore('waitlist') : createMemoryStore();
  const audience = settings.audience({ store, keys });
  const hashKey = deriveKey(keys, 'waitlist/throttle');
  const throttle = createThrottle(store, hashKey, { ...defaultLimits, totalPerDay: dailyCap });
  return createWaitlist({ ...common, mailer, audience, throttle, guard: createConfirmGuard(store, hashKey), keys });
};

// A live deploy with bad variables fails closed: nothing is sent, opened or subscribed. A link says unavailable rather than invalid, since the
// fault is ours, not the link's
const closed: Waitlist = {
  requestConfirmation: async () => 'unavailable',
  readConfirmation: () => ({ status: 'unavailable' }),
  confirmSubscription: async () => ({ status: 'unavailable' }),
};

const compose = () => {
  if (process.env.WAITLIST_ADAPTER !== 'live') return { waitlist: composeFake(), live: false };
  const waitlist = composeLive();
  if (!Array.isArray(waitlist)) return { waitlist, live: true };
  // The names only, never the values
  console.error('waitlist:config-invalid', { variables: waitlist.join(',') });
  return { waitlist: closed, live: true };
};

// Read at first use, not when the file loads: next build loads it on a machine without the production variables
let composition: ReturnType<typeof compose> | undefined;
const current = () => (composition ??= compose());
// Once per instance is enough to notice, and the log carries no value
let ipMissingLogged = false;

export const requestConfirmation = (values: WaitlistValues, locale: Locale, ip: string | undefined, originTag: string | undefined): Promise<'sent' | 'unavailable'> => {
  const { waitlist, live } = current();
  if (live && ip === undefined && !ipMissingLogged) {
    ipMissingLogged = true;
    console.error('waitlist:ip-missing');
  }
  // Live requests without the header share one 'unknown' bucket rather than skip the IP rule. Fake mode passes the header through as it is,
  // and without one the IP rule is skipped, so the e2e is unaffected
  return waitlist.requestConfirmation(values, locale, live ? (ip ?? 'unknown') : ip, originTag);
};

export const readConfirmation = async (token: string): Promise<ReadResult> => current().waitlist.readConfirmation(token);

export const confirmSubscription = (token: string): Promise<ConfirmResult> => current().waitlist.confirmSubscription(token);
