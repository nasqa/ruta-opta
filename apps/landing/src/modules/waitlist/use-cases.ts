import type { Locale } from 'next-intl';
import type { Audience } from './audience';
import type { ConfirmGuard } from './confirm-guard';
import { withDeadline } from './deadline';
import type { Mailer, OutgoingEmail } from './mailer';
import type { WaitlistValues } from './state';
import type { Throttle } from './throttle';
import { confirmTtlMs, openToken, sealToken, type TokenKeys } from './token';

// Netlify ends a synchronous Function at 60 s. Each use case answers within this, whatever its store and providers do
export const useCaseDeadlineMs = 20_000;

export type ConfirmPayload = { email: string; name: string; locale: Locale; consentAt: number; policyVersion: string };

export type WaitlistDeps = {
  mailer: Mailer;
  audience: Audience;
  throttle: Throttle;
  guard: ConfirmGuard;
  keys: TokenKeys;
  policyVersion: string;
  confirmEmail: (locale: Locale, confirmUrl: string) => Promise<Omit<OutgoingEmail, 'to' | 'reference'>>;
  confirmUrl: (locale: Locale, token: string) => string;
  now: () => number;
  reference: () => string;
  log: (event: string, detail: Record<string, string>) => void;
  deadlineMs?: number;
};

export type ReadResult = { status: 'valid'; name: string; locale: Locale } | { status: 'expired' } | { status: 'invalid' };
export type ConfirmResult = { status: 'subscribed'; locale: Locale } | { status: 'blocked' | 'expired' | 'invalid' | 'unavailable' };

export const createWaitlist = ({ mailer, audience, throttle, guard, keys, policyVersion, confirmEmail, confirmUrl, now, reference, log, deadlineMs = useCaseDeadlineMs }: WaitlistDeps) => {
  // Past the deadline the work may still finish in the background; the person gets an answer now. Claims are not released then, since the
  // email may still go out
  const timed = <T>(where: 'request' | 'confirm', task: Promise<T>, fallback: T) =>
    withDeadline(task, deadlineMs, where).catch(() => (log('waitlist:deadline', { where }), fallback));

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

  const admitAndSend = async (values: WaitlistValues, locale: Locale, ip: string | undefined): Promise<'sent' | 'unavailable'> => {
    const admission = await throttle.admit(values.email, ip).catch(() => undefined);
    if (!admission) return log('waitlist:throttle-failed', {}), 'unavailable';
    if (admission.verdict === 'refuse') return log('waitlist:throttle-refused', { reason: admission.reason }), 'unavailable';
    if (admission.verdict === 'skip') return 'sent';
    const result = await send(values, locale).catch(() => (log('waitlist:unexpected', { where: 'request' }), 'unavailable' as const));
    // The gap claims go back, so an immediate retry sends instead of answering "sent" with nothing sent. The day claim stays (see Admission)
    if (result === 'unavailable') await admission.release().catch(() => log('waitlist:release-failed', {}));
    return result;
  };

  const requestConfirmation = (values: WaitlistValues, locale: Locale, ip: string | undefined) =>
    timed('request', admitAndSend(values, locale, ip), 'unavailable' as const);

  const readConfirmation = (token: string): ReadResult => {
    const opened = openToken<ConfirmPayload>('confirm', token, keys, now());
    return opened.status === 'valid' ? { status: 'valid', name: opened.payload.name, locale: opened.payload.locale } : { status: opened.status };
  };

  const subscribe = async ({ email, name, locale, policyVersion: consentedVersion }: ConfirmPayload): Promise<ConfirmResult> => {
    const result = await audience.subscribe({ email, name }, locale, `rutaopta.org/${locale} · ${consentedVersion}`);
    if (result.status === 'subscribed') return { status: 'subscribed', locale };
    if (result.status === 'unavailable') log('waitlist:subscribe-failed', { code: result.code });
    return { status: result.status };
  };

  // A token confirmed before answers from its marker; a second try within the minute waits, so a replayed link cannot hammer Zoho
  const gate = async (token: string) => ((await guard.alreadyConfirmed(token)) ? 'confirmed' : (await guard.admit(token)) ? 'open' : 'busy');

  const confirm = async (token: string): Promise<ConfirmResult> => {
    const opened = openToken<ConfirmPayload>('confirm', token, keys, now());
    if (opened.status !== 'valid') return { status: opened.status };
    const state = await gate(token).catch(() => undefined);
    if (!state) return log('waitlist:guard-failed', {}), { status: 'unavailable' };
    if (state === 'confirmed') return { status: 'subscribed', locale: opened.payload.locale };
    if (state === 'busy') return log('waitlist:confirm-throttled', {}), { status: 'unavailable' };
    const result = await subscribe(opened.payload).catch(() => (log('waitlist:unexpected', { where: 'confirm' }), { status: 'unavailable' as const }));
    if (result.status === 'subscribed') await guard.markConfirmed(token).catch(() => log('waitlist:mark-failed', {}));
    return result;
  };

  const confirmSubscription = (token: string) => timed<ConfirmResult>('confirm', confirm(token), { status: 'unavailable' });

  return { requestConfirmation, readConfirmation, confirmSubscription };
};
