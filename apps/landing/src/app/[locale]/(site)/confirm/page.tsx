import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { localesFor } from '@/i18n/coverage';
import { Link } from '@/i18n/navigation';
import { readConfirmation } from '@/modules/waitlist/server';
import { ConfirmForm } from './_components/confirm-form';
import styles from './page.module.css';

// The URL carries the token: no search engine keeps it, no Referer header sends it on, and no hreflang alternates point at it
export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/confirm').includes(await getLocale())) return {};

  const t = await getTranslations('Confirm');

  return { title: t('metaTitle'), robots: { index: false, follow: false }, referrer: 'no-referrer' };
};

// Opening the link changes nothing: mail scanners open every link, so only the button confirms
const ConfirmPage = async ({ searchParams }: PageProps<'/[locale]/confirm'>) => {
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/confirm').includes(await getLocale())) notFound();

  const { t: query } = await searchParams;
  const token = typeof query === 'string' ? query : '';
  const result = await readConfirmation(token);
  const t = await getTranslations('Confirm');

  if (result.status !== 'valid') {
    // Unavailable has no title of its own: the page keeps its usual heading and says it could not confirm now
    const title = result.status === 'unavailable' ? t('title') : t(`${result.status}.title`);
    return (
      <main className={styles.page}>
        <h1 className="t-display-md">{title}</h1>
        <p className="t-body-lg">{t(`${result.status}.text`)}</p>
        <Link className="t-body-lg" href="/">
          {t('again')}
        </Link>
      </main>
    );
  }

  const { Confirm } = await getMessages();

  return (
    <main className={styles.page}>
      <h1 className="t-display-md">{t('title')}</h1>
      <p className="t-body-lg">{t('greeting', { name: result.name })}</p>
      <p className="t-body-lg">{t('lead')}</p>
      {/* The island gets only the namespace it uses */}
      <NextIntlClientProvider messages={{ Confirm }}>
        <ConfirmForm token={token} />
      </NextIntlClientProvider>
    </main>
  );
};

export default ConfirmPage;
