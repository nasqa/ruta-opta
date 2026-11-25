import { Button } from '@mantine/core';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { localesFor } from '@/i18n/coverage';
import { getPathname } from '@/i18n/navigation';
import { noEvent } from '@/modules/analytics/server';
import { SceneBand, SceneCard, SiteHeader } from '@/modules/site-shell';
import { readConfirmation } from '@/modules/waitlist/server';
import confirmStage from './_art/confirm-stage.webp';
import routeOpen from './_art/route-open.webp';
import { ConfirmForm } from './_components/confirm-form';
import styles from './page.module.css';

// The URL carries the token: no search engine keeps it, no Referer header sends it on, and no hreflang alternates point at it
export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/confirm').includes(await getLocale())) return {};

  const t = await getTranslations('Confirm');

  return { title: t('metaTitle'), robots: { index: false, follow: false }, referrer: 'no-referrer' };
};

// Opening the link changes nothing: mail scanners open every link, so only the button confirms.
// The headings are plain h1 with Trama's class, not Mantine's Title: referenced from a page, Title left the theme's chunk for one of its own that
// every route loads (+757 B), and its inline letter-spacing (display-lg's, keyed off order) overrode the class's
const ConfirmPage = async ({ searchParams }: PageProps<'/[locale]/confirm'>) => {
  const locale = await getLocale();
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/confirm').includes(locale)) notFound();

  const { t: query } = await searchParams;
  const token = typeof query === 'string' ? query : '';
  const result = await readConfirmation(token);
  const t = await getTranslations('Confirm');
  // Switching language keeps the token, so the link still works in the other locale
  const header = <SiteHeader href="/confirm" query={token ? { t: token } : undefined} />;

  if (result.status !== 'valid') {
    // Unavailable has no title of its own: the page keeps its usual heading and says it could not confirm now
    const title = result.status === 'unavailable' ? t('title') : t(`${result.status}.title`);
    // The road scene: the route stays open. No ring, which marks only what goes right. A plain anchor (Button component="a"): a next-intl Link
    // as a Button's component fails the build from a server page, and a Link would prefetch the home's JS
    return (
      <>
        {header}
        <main className={styles.page}>
          <SceneBand scene={routeOpen} height="tall" imageClassName={styles.road} />
          <SceneCard>
            <h1 className="t-display-md">{title}</h1>
            <p className="t-body-lg">{t(`${result.status}.text`)}</p>
            <Button component="a" href={`${getPathname({ locale, href: '/' })}#lista`} size="lg" {...noEvent('recovery')}>
              {t('again')}
            </Button>
          </SceneCard>
        </main>
      </>
    );
  }

  const { Confirm } = await getMessages();

  return (
    <>
      {header}
      <main className={styles.page}>
        <SceneBand scene={confirmStage} height="tall" imageClassName={styles.stage} />
        <SceneCard mark>
          <h1 className="t-display-md">{t('title')}</h1>
          <div className={styles.lead}>
            <p className={`${styles.greeting} t-body-lg`}>{t('greeting', { name: result.name })}</p>
            <p className="t-body-lg">{t('lead')}</p>
          </div>
          {/* The island gets only the namespace it uses */}
          <NextIntlClientProvider messages={{ Confirm }}>
            <ConfirmForm token={token} againTracking={noEvent('recovery')} />
          </NextIntlClientProvider>
        </SceneCard>
      </main>
    </>
  );
};

export default ConfirmPage;
