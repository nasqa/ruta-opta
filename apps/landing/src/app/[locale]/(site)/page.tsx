import { Button } from '@mantine/core';
import { Scope } from '@nasqa/trama-react';
import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import styles from './page.module.css';

// Home's title is the site name, the layout's default; other pages set title: t('metaTitle') and the layout's template adds it
export const generateMetadata = async (): Promise<Metadata> => ({ alternates: alternates('/') });

const HomePage = () => {
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/').includes(useLocale())) notFound();

  const t = useTranslations('Home');

  return (
    <main className={styles.page}>
      <h1 className="t-display-lg">{t('title')}</h1>
      <p className="t-body-lg">{t('lead')}</p>
      <Scope territory="quindio">
        <section className={styles.territory}>
          <Button>{t('cta')}</Button>
        </section>
      </Scope>
    </main>
  );
};

export default HomePage;
