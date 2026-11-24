import { useLocale, useTranslations } from 'next-intl';
import { getPathname } from '@/i18n/navigation';
import layout from './layout.module.css';
import styles from './who.module.css';

// Who answers for Ruta Opta, right after the allies' contact cards: it continues their band, set apart by a hairline
export const Who = () => {
  const locale = useLocale();
  const t = useTranslations('Prelaunch');

  return (
    <section className={`${layout.band} ${layout.subtle} ${styles.band}`} aria-labelledby="who-title">
      <div className={layout.inner}>
        <div className={styles.layout}>
          <h2 id="who-title" className="t-heading-lg">
            {t('who.title')}
          </h2>
          <div className={styles.body}>
            <p className="t-body-lg">{t('who.text', { legalName: t('who.legalName'), nit: t('who.nit'), locality: t('who.locality'), region: t('who.region'), representative: t('who.representative') })}</p>
            {/* A plain anchor, as in the footer: no client Link, so the home never prefetches /privacy */}
            <a className={`${styles.link} t-body-md`} href={getPathname({ locale, href: '/privacy' })}>
              {t('privacyLink')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
