import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import { Link } from '@/i18n/navigation';
import styles from './page.module.css';

export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/confirmed').includes(await getLocale())) return {};

  const t = await getTranslations('Confirmed');

  return { title: t('metaTitle'), alternates: alternates('/confirmed') };
};

const ConfirmedPage = () => {
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/confirmed').includes(useLocale())) notFound();

  const t = useTranslations('Confirmed');

  return (
    <main className={styles.page}>
      <h1 className="t-display-md">{t('title')}</h1>
      <p className="t-body-lg">{t('lead')}</p>
      <Link className="t-body-lg" href="/">
        {t('home')}
      </Link>
    </main>
  );
};

export default ConfirmedPage;
