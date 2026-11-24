import { getImageProps } from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Fragment } from 'react';
import type { Href } from '@/i18n/coverage';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import logo from './assets/opta-horizontal.svg';
import styles from './site-header.module.css';

// 120 px wide on desktop; the CSS module narrows it to 96 px on phones
const { props: logoProps } = getImageProps({ src: logo, alt: '', width: 120, loading: 'eager' });

type SiteHeaderProps = { href: Href; query?: Record<string, string> };

// The switch opens this same page in each locale, query included (/confirm's token), so the page passes its own href
export const SiteHeader = ({ href, query }: SiteHeaderProps) => {
  const locale = useLocale();
  const t = useTranslations('SiteShell');

  return (
    <header className={styles.header}>
      {/* The accessible name contains the visible «Ruta Opta» (WCAG 2.5.3), so the logo inside is decorative. No prefetch: this link is in
          view on every page, and prefetching the home would load its form's JS everywhere */}
      <Link href="/" prefetch={false} className={styles.brand} aria-label={t('home')}>
        <img {...logoProps} alt="" className={styles.logo} />
        <span className={styles.divider} />
        <span className={`${styles.product} t-label`}>{t('product')}</span>
      </Link>
      <nav aria-label={t('languageNav')} className={styles.switcher}>
        {routing.locales.map((language, index) => (
          <Fragment key={language}>
            {index > 0 && <span className={styles.dot} />}
            {/* The name starts with the visible code (WCAG 2.5.3) and names the language in itself. next-intl sets hreflang only on a
                link that changes the locale; the current one gets it here */}
            <Link
              href={{ pathname: href, query }}
              locale={language}
              lang={language}
              hrefLang={language}
              aria-label={`${language.toUpperCase()} ${t(`languages.${language}`)}`}
              aria-current={language === locale ? 'true' : undefined}
              className={`${styles.language} t-label`}
            >
              {language.toUpperCase()}
            </Link>
          </Fragment>
        ))}
      </nav>
    </header>
  );
};
