'use client';

import { Button } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useEffect, useRef } from 'react';
import { getPathname } from '@/i18n/navigation';
import { initialConfirmState } from '@/modules/waitlist';
import { confirmWaitlist } from '@/modules/waitlist/actions';
import styles from './confirm-form.module.css';

// Final answers: confirming again cannot change them, so the button goes. Unavailable keeps it, because a retry can work
const final = new Set(['blocked', 'expired', 'invalid']);
// Signing up again is the way out of these; a blocked address would only be blocked again, and its text gives the privacy address
const signUpAgain = new Set(['expired', 'invalid']);

// Attributes the page hands down to spread on the way back to the sign-up; what they mean is the page's business
type Tracking = { className?: string; [key: `data-${string}`]: string | undefined };

// A confirmed subscription redirects to /confirmed; any other answer stays here and says why
export const ConfirmForm = ({ token, againTracking }: { token: string; againTracking: Tracking }) => {
  const t = useTranslations('Confirm');
  const locale = useLocale();
  const [state, action, pending] = useActionState(confirmWaitlist, initialConfirmState);
  const alert = useRef<HTMLParagraphElement>(null);

  // The submit button that had focus is gone for a final answer: the alert takes it, so keyboard users land on the reason
  useEffect(() => {
    if (final.has(state.status)) alert.current?.focus();
  }, [state.status]);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="token" value={token} />
      {/* The action cannot read the page's locale, and /confirmed opens in it */}
      <input type="hidden" name="locale" value={locale} />
      {state.status !== 'idle' && (
        <p ref={alert} tabIndex={-1} role="alert" className={`${styles.alert} t-body-md`}>
          {t(`${state.status}.text`)}
        </p>
      )}
      {/* A plain anchor: a next-intl Link would prefetch the home's JS */}
      {signUpAgain.has(state.status) && (
        <Button component="a" href={`${getPathname({ locale, href: '/' })}#lista`} size="lg" {...againTracking}>
          {t('again')}
        </Button>
      )}
      {!final.has(state.status) && (
        <Button type="submit" size="lg" loading={pending}>
          {t('submit')}
        </Button>
      )}
    </form>
  );
};
