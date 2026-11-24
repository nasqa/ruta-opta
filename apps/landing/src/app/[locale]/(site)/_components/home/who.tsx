import { useLocale, useTranslations } from 'next-intl';
import { getPathname } from '@/i18n/navigation';
import styles from './who.module.css';

export const Who = () => {
  const locale = useLocale();
  const t = useTranslations('Prelaunch');

  return (
    <section className={styles.section} aria-labelledby="who-title">
      <h2 id="who-title" className="t-heading-lg">
        {t('who.title')}
      </h2>
      <p className="t-body-lg">{t('who.text', { legalName: t('who.legalName'), locality: t('who.locality'), region: t('who.region') })}</p>
      {/* A plain anchor, as in the footer: no client Link, no prefetch of /privacy from the home */}
      <a className="t-body-md" href={getPathname({ locale, href: '/privacy' })}>
        {t('privacyLink')}
      </a>
    </section>
  );
};
