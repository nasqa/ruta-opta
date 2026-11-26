'use client';

import { Button, Checkbox, TextInput } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState } from 'react';
import { Link } from '@/i18n/navigation';
import { initialWaitlistState } from '@/modules/waitlist';
import { joinWaitlist } from '@/modules/waitlist/actions';
import styles from './waitlist-form.module.css';

// Attributes the page hands down to spread on the form; what they mean is the page's business
type Tracking = { className?: string; [key: `data-${string}`]: string | undefined };

export const WaitlistForm = ({ tracking }: { tracking: Tracking }) => {
  const t = useTranslations('Waitlist');
  const locale = useLocale();
  const [state, action, pending] = useActionState(joinWaitlist, initialWaitlistState);

  if (state.status === 'sent') {
    return (
      <div role="status" className={styles.done}>
        <p className="t-title">{t('sent.title', { name: state.name })}</p>
        <p className="t-body-md">{t('sent.text')}</p>
      </div>
    );
  }

  // React clears an uncontrolled form after each submit, so what the person typed comes back as the default
  const values = state.status === 'idle' ? { name: '', email: '', consent: false } : state.values;
  const errors = state.status === 'invalid' ? state.errors : {};

  return (
    <form {...tracking} action={action} noValidate className={[styles.form, tracking.className].filter(Boolean).join(' ')}>
      <TextInput
        name="name"
        label={t('name.label')}
        autoComplete="given-name"
        defaultValue={values.name}
        error={errors.name && t('name.error')}
        required
        withAsterisk={false}
      />
      <TextInput
        name="email"
        type="email"
        label={t('email.label')}
        placeholder={t('email.placeholder')}
        autoComplete="email"
        defaultValue={values.email}
        error={errors.email && t('email.error')}
        required
        withAsterisk={false}
      />
      <Checkbox
        name="consent"
        defaultChecked={values.consent}
        error={errors.consent && t('consent.error')}
        label={t('consent.label')}
        description={t.rich('consent.notice', { privacy: (chunks) => <Link href="/privacy">{chunks}</Link> })}
        classNames={{ label: 't-body-sm', description: `t-caption ${styles.notice}` }}
      />
      <div hidden aria-hidden="true">
        <input name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      {/* The action cannot read the page's locale itself, and the confirmation email is written in it */}
      <input type="hidden" name="locale" value={locale} />
      {state.status === 'unavailable' && (
        <p role="alert" className={`${styles.alert} t-body-md`}>
          {t('unavailable')}
        </p>
      )}
      <Button type="submit" loading={pending}>
        {t('submit')}
      </Button>
      <p className="t-caption">{t('note')}</p>
    </form>
  );
};
