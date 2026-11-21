import { Button } from '@mantine/core';
import { Scope } from '@nasqa/trama-react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import styles from './page.module.css';

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations('Home');

  return {
    title: t('metaTitle'),
    alternates: {
      languages: {
        ...Object.fromEntries(routing.locales.map((locale) => [locale, getPathname({ locale, href: '/' })])),
        'x-default': getPathname({ locale: routing.defaultLocale, href: '/' }),
      },
    },
  };
};

const HomePage = () => {
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
