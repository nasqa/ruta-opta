import type { Locale } from 'next-intl';
import type { Audience } from './audience';
import type { Mailer, OutgoingEmail } from './mailer';
import type { WaitlistValues } from './state';
import type { Throttle } from './throttle';
import { confirmTtlMs, openToken, sealToken, type TokenKeys } from './token';

export type ConfirmPayload = { email: string; name: string; locale: Locale; consentAt: number; policyVersion: string };

export type WaitlistDeps = {
  mailer: Mailer;
  audience: Audience;
  throttle: Throttle;
  keys: TokenKeys;
  policyVersion: string;
  confirmEmail: (locale: Locale, confirmUrl: string) => Promise<Omit<OutgoingEmail, 'to' | 'reference'>>;
  confirmUrl: (locale: Locale, token: string) => string;
  now: () => number;
  reference: () => string;
  log: (event: string, detail: Record<string, string>) => void;
};

export type ReadResult = { status: 'valid'; name: string; locale: Locale } | { status: 'expired' } | { status: 'invalid' };
export type ConfirmResult = { status: 'subscribed'; locale: Locale } | { status: 'blocked' | 'expired' | 'invalid' | 'unavailable' };

export const createWaitlist = ({ mailer, audience, throttle, keys, policyVersion, confirmEmail, confirmUrl, now, reference, log }: WaitlistDeps) => {
  const send = async (values: WaitlistValues, locale: Locale) => {
    const payload: ConfirmPayload = { email: values.email, name: values.name, locale, consentAt: now(), policyVersion };
    const token = sealToken('confirm', payload, keys, confirmTtlMs, payload.consentAt);
    const message = await confirmEmail(locale, confirmUrl(locale, token));
    const ref = reference();
    const result = await mailer.send({ ...message, to: { address: values.email }, reference: ref });
    if (result.ok) return 'sent';
    log('waitlist:send-failed', { code: result.code, reference: ref });
    return 'unavailable';
  };

  const requestConfirmation = async (values: WaitlistValues, locale: Locale, ip: string | undefined): Promise<'sent' | 'unavailable'> => {
    const verdict = await throttle.admit(values.email, ip).catch(() => undefined);
    if (!verdict) return log('waitlist:throttle-failed', {}), 'unavailable';
    if (verdict === 'refuse') return log('waitlist:throttle-refused', {}), 'unavailable';
    if (verdict === 'skip') return 'sent';
    return send(values, locale).catch(() => (log('waitlist:unexpected', { where: 'request' }), 'unavailable' as const));
  };

  const readConfirmation = (token: string): ReadResult => {
    const opened = openToken<ConfirmPayload>('confirm', token, keys, now());
    return opened.status === 'valid' ? { status: 'valid', name: opened.payload.name, locale: opened.payload.locale } : { status: opened.status };
  };

  const subscribe = async ({ email, name, locale }: ConfirmPayload): Promise<ConfirmResult> => {
    const result = await audience.subscribe({ email, name }, locale, `rutaopta.org/${locale} · ${policyVersion}`);
    if (result.status === 'subscribed') return { status: 'subscribed', locale };
    if (result.status === 'unavailable') log('waitlist:subscribe-failed', { code: result.code });
    return { status: result.status };
  };

  const confirmSubscription = async (token: string): Promise<ConfirmResult> => {
    const opened = openToken<ConfirmPayload>('confirm', token, keys, now());
    if (opened.status !== 'valid') return { status: opened.status };
    return subscribe(opened.payload).catch(() => (log('waitlist:unexpected', { where: 'confirm' }), { status: 'unavailable' as const }));
  };

  return { requestConfirmation, readConfirmation, confirmSubscription };
};
