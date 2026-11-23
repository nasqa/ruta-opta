import { Button } from '@mantine/core';
import { Scope } from '@nasqa/trama-react';
import type { Metadata } from 'next';
import { NextIntlClientProvider, useLocale, useMessages, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import { Link } from '@/i18n/navigation';
import { IllustrationSlot } from './_components/illustration-slot';
import { WaitlistForm } from './_components/waitlist-form';
import styles from './page.module.css';

// The home's title is the site name, the layout's default; other pages set title: t('metaTitle') and the layout's template adds it
export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/').includes(await getLocale())) return {};

  const t = await getTranslations('Prelaunch');

  return { description: t('metaDescription'), alternates: alternates('/') };
};

const stages = ['grow', 'create', 'connect'] as const;

const PrelaunchPage = () => {
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/').includes(useLocale())) notFound();

  const t = useTranslations('Prelaunch');
  const { Waitlist } = useMessages();

  return (
    <>
      <main className={styles.page}>
        <Scope territory="quindio">
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroText}>
              <h1 id="hero-title" className="t-display-lg">
                {t('title')}
              </h1>
              <p className="t-body-lg">{t('lead')}</p>
              <Button component="a" href="#lista">
                {t('cta')}
              </Button>
            </div>
            <IllustrationSlot />
          </section>
        </Scope>
        <section className={styles.section} aria-labelledby="building-title">
          <h2 id="building-title" className="t-heading-lg">
            {t('buildingTitle')}
          </h2>
          <ol className={styles.stages}>
            {stages.map((stage) => (
              <li key={stage} className={styles.card}>
                <h3 className="t-title">{t(`stages.${stage}.name`)}</h3>
                <p className="t-body-md">{t(`stages.${stage}.text`)}</p>
              </li>
            ))}
          </ol>
          <p className="t-body-md">{t('territory')}</p>
        </section>
        <section id="lista" className={styles.card} aria-labelledby="list-title">
          <h2 id="list-title" className="t-heading-lg">
            {t('listTitle')}
          </h2>
          <p className="t-body-md">{t('listLead')}</p>
          {/* The island gets only the namespace it uses */}
          <NextIntlClientProvider messages={{ Waitlist }}>
            <WaitlistForm />
          </NextIntlClientProvider>
        </section>
      </main>
      <footer className={styles.footer}>
        <Link className="t-body-sm" href="/privacy">
          {t('privacyLink')}
        </Link>
      </footer>
    </>
  );
};

export default PrelaunchPage;
