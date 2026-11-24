import { Button } from '@mantine/core';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import { getPathname } from '@/i18n/navigation';
import { SceneBand, SiteHeader } from '@/modules/site-shell';
import confirmedDawn from './_art/confirmed-dawn.webp';
import styles from './page.module.css';

export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/confirmed').includes(await getLocale())) return {};

  const t = await getTranslations('Confirmed');

  // Reached only after confirming, so search engines have nothing to list here
  return { title: t('metaTitle'), alternates: alternates('/confirmed'), robots: { index: false, follow: false } };
};

// A plain h1 with Trama's class, not Mantine's Title (+757 B on every route, and its inline letter-spacing overrides the class).
// The home button is a plain anchor: a next-intl Link as a Button's component fails the build from a server page and would prefetch the home's JS
const ConfirmedPage = async () => {
  const locale = await getLocale();
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/confirmed').includes(locale)) notFound();

  const t = await getTranslations('Confirmed');

  return (
    <>
      <SiteHeader href="/confirmed" />
      <main className={styles.page}>
        <div className={styles.column}>
          <h1 className="t-display-lg">{t('title')}</h1>
          <p className="t-body-lg">{t('lead')}</p>
          <p className="t-body-lg">{t('frequency')}</p>
          <Button component="a" href={getPathname({ locale, href: '/' })} size="lg">
            {t('home')}
          </Button>
        </div>
        <SceneBand scene={confirmedDawn} height="tall" sun imageClassName={styles.dawn} />
      </main>
    </>
  );
};

export default ConfirmedPage;
