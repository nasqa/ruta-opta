import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import { getPathname } from '@/i18n/navigation';
import { SceneBand, SceneCard, SiteHeader } from '@/modules/site-shell';
import ridge from './_art/ridge.webp';
import styles from './page.module.css';

export const generateMetadata = async (): Promise<Metadata> => {
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/privacy').includes(await getLocale())) return {};

  const t = await getTranslations('Privacy');

  return { title: t('metaTitle'), alternates: alternates('/privacy') };
};

// The keys of Privacy.sections, which are also the section ids the contents link to
const sections = ['controller', 'data', 'purpose', 'measurement', 'contact', 'processor', 'rights', 'requests'] as const;

// The privacy address first, then the English one, in every locale
const contacts = ['Es', 'En'] as const;

// Headings are plain h1/h2 with Trama's classes, and the cards are plain blocks with Trama's card tokens: Mantine's Title, Card and Stack
// add client JS to every route. The contents is static (no scroll-spy, which needs client JS). Every link is a plain anchor: a next-intl
// Link would prefetch the home's JS
const PrivacyPage = () => {
  const locale = useLocale();
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/privacy').includes(locale)) notFound();

  const t = useTranslations('Privacy');

  return (
    <>
      <SiteHeader href="/privacy" />
      <main className={styles.page}>
        <SceneBand scene={ridge} height="strip" imageClassName={styles.ridge} />
        <SceneCard width="wide">
          <p className={`${styles.secondary} t-overline`}>{t('overline')}</p>
          <h1 className="t-display-lg">{t('title')}</h1>
          <p className={`${styles.intro} t-body-lg`}>{t('intro')}</p>
          <p className={`${styles.secondary} t-body-sm`}>{t('effective')}</p>
        </SceneCard>
        <div className={styles.doc}>
          <nav className={styles.toc} aria-label={t('toc')}>
            <p className={`${styles.secondary} t-overline`}>{t('toc')}</p>
            <ol className="t-body-sm">
              {sections.map((section) => (
                <li key={section}>
                  <a href={`#${section}`}>{t(`sections.${section}.title`)}</a>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.body}>
            <article className={styles.article}>
              {sections.map((section) => (
                <section key={section} id={section} className={styles.section}>
                  <h2 className="t-heading-md">{t(`sections.${section}.title`)}</h2>
                  {t(`sections.${section}.text`)
                    .split('\n\n')
                    .map((paragraph) => (
                      <p key={paragraph} className="t-body-md">
                        {paragraph}
                      </p>
                    ))}
                </section>
              ))}
              <div className={styles.contact}>
                <h2 className="t-title">{t('questions')}</h2>
                {contacts.map((language) => (
                  <p key={language} className="t-body-md">
                    {t(`contact${language}`)} <a href={`mailto:${t(`email${language}`)}`}>{t(`email${language}`)}</a>
                  </p>
                ))}
              </div>
            </article>
            <a className={`${styles.home} t-body-lg`} href={getPathname({ locale, href: '/' })}>
              {t('home')}
            </a>
          </div>
        </div>
      </main>
    </>
  );
};

export default PrivacyPage;
