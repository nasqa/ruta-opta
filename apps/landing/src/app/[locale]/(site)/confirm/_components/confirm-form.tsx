'use client';

import { Button } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import { initialConfirmState } from '@/modules/waitlist';
import { confirmWaitlist } from '@/modules/waitlist/actions';
import styles from './confirm-form.module.css';

// A confirmed subscription redirects to /confirmed; any other answer stays here and says why
export const ConfirmForm = ({ token }: { token: string }) => {
  const t = useTranslations('Confirm');
  const [state, action, pending] = useActionState(confirmWaitlist, initialConfirmState);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="token" value={token} />
      {state.status !== 'idle' && (
        <p role="alert" className={`${styles.alert} t-body-md`}>
          {t(`${state.status}.text`)}
        </p>
      )}
      <Button type="submit" loading={pending}>
        {t('submit')}
      </Button>
    </form>
  );
};
