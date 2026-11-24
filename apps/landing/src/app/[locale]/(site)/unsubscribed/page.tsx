import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import { getPathname } from '@/i18n/navigation';
import { SceneBand, SceneCard, SiteHeader } from '@/modules/site-shell';
import quietValley from './_art/quiet-valley.webp';
import styles from './page.module.css';

export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/unsubscribed').includes(await getLocale())) return {};

  const t = await getTranslations('Unsubscribed');

  // Zoho's unsubscribe link redirects here: search engines have nothing to list
  return { title: t('metaTitle'), alternates: alternates('/unsubscribed'), robots: { index: false, follow: false } };
};

// Calm: the still valley, no ring and no button, one quiet way home. A plain h1 with Trama's class, not Mantine's Title (+757 B on every
// route). The link is a plain anchor: a next-intl Link this high on the page would prefetch the home's JS
const UnsubscribedPage = () => {
  const locale = useLocale();
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/unsubscribed').includes(locale)) notFound();

  const t = useTranslations('Unsubscribed');

  return (
    <>
      <SiteHeader href="/unsubscribed" />
      <main className={styles.page}>
        <SceneBand scene={quietValley} height="short" imageClassName={styles.valley} />
        <SceneCard>
          <h1 className="t-display-md">{t('title')}</h1>
          <p className="t-body-lg">{t('lead')}</p>
          <a className={`${styles.home} t-body-lg`} href={getPathname({ locale, href: '/' })}>
            {t('home')}
          </a>
        </SceneCard>
      </main>
    </>
  );
};

export default UnsubscribedPage;
