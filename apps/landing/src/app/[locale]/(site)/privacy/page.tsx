import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import { Link } from '@/i18n/navigation';
import { SiteHeader } from '@/modules/site-shell';
import styles from './page.module.css';

export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/privacy').includes(await getLocale())) return {};

  const t = await getTranslations('Privacy');

  return { title: t('metaTitle'), alternates: alternates('/privacy') };
};

const sections = ['controller', 'data', 'purpose', 'processor', 'rights'] as const;

const PrivacyPage = () => {
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/privacy').includes(useLocale())) notFound();

  const t = useTranslations('Privacy');

  return (
    <>
      <SiteHeader href="/privacy" />
      <main className={styles.page}>
        <h1 className="t-display-md">{t('title')}</h1>
        <p className="t-body-lg">{t('intro')}</p>
        {sections.map((section) => (
          <section key={section} className={styles.section}>
            <h2 className="t-heading-md">{t(`sections.${section}.title`)}</h2>
            <p className="t-body-md">{t(`sections.${section}.text`)}</p>
          </section>
        ))}
        <p className={`${styles.contact} t-body-md`}>
          <span>{t('contactEs')}</span>
          <a href={`mailto:${t('emailEs')}`}>{t('emailEs')}</a>
        </p>
        <p className={`${styles.contact} t-body-md`}>
          <span>{t('contactEn')}</span>
          <a href={`mailto:${t('emailEn')}`}>{t('emailEn')}</a>
        </p>
        <Link className="t-body-lg" href="/">
          {t('home')}
        </Link>
      </main>
    </>
  );
};

export default PrivacyPage;
