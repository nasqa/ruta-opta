import type { Metadata } from 'next';
import { NextIntlClientProvider, useLocale, useMessages, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { alternates } from '@/i18n/alternates';
import { localesFor } from '@/i18n/coverage';
import { getPathname } from '@/i18n/navigation';
import { siteUrl } from '@/shared/env';
import { SiteHeader } from '@/modules/site-shell';
import { Allies } from './_components/home/allies';
import { Faq } from './_components/home/faq';
import { Hero } from './_components/home/hero';
import layout from './_components/home/layout.module.css';
import { homeMetadata, ogCard } from './_components/home/metadata';
import { Method } from './_components/home/method';
import { Places } from './_components/home/places';
import { homeJsonLd, jsonLdScript } from './_components/home/structured-data';
import { Thesis } from './_components/home/thesis';
import { Tourism } from './_components/home/tourism';
import { Who } from './_components/home/who';
import { WaitlistForm } from './_components/waitlist-form';
import styles from './page.module.css';

// The logo is a stable file under public/, not a hashed asset: search engines keep the URL for a long time
const logoPath = '/brand/opta-icon-512.png';

const territories = ['quindio', 'risaralda', 'caldas', 'valle', 'choco'] as const;

// The sections the header links to, in page order (their ids are the section ids below)
const sections = ['places', 'method', 'tourism', 'allies', 'faq'] as const;

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  // A locale without the page renders the 404, so it has no namespace to read here
  if (!localesFor('/').includes(locale)) return {};

  const [t, site] = await Promise.all([getTranslations('Prelaunch'), getTranslations('Site')]);

  return homeMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    siteName: site('name'),
    ogTitle: t('ogTitle'),
    ogDescription: t('ogDescription'),
    ogAlt: t('ogAlt'),
    ogImage: new URL(ogCard.path(locale), siteUrl).href,
    languages: alternates('/').languages,
  });
};

const PrelaunchPage = () => {
  const locale = useLocale();
  // D6: the page exists only in the locales that have its namespace; any other locale gets the localized 404
  if (!localesFor('/').includes(locale)) notFound();

  const t = useTranslations('Prelaunch');
  const site = useTranslations('Site');
  const shell = useTranslations('SiteShell');
  const { Waitlist } = useMessages();

  const jsonLd = homeJsonLd({
    page: new URL(getPathname({ locale, href: '/' }), siteUrl).href,
    site: new URL('/', siteUrl).href,
    logo: new URL(logoPath, siteUrl).href,
    name: site('name'),
    description: t('metaDescription'),
    locality: t('who.locality'),
    region: t('who.region'),
    areas: territories.map((territory) => t(`thesis.territories.${territory}`)),
    language: locale,
    email: t('allies.email.address'),
    phone: t('allies.whatsapp.number'),
    parent: t('who.legalName'),
  });

  return (
    <>
      <SiteHeader href="/" sections={sections.map((id) => ({ id, label: shell(`sections.${id}`) }))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <main>
        <Hero />
        <Thesis />
        <Places />
        <Method />
        <Tourism />
        <Allies />
        <Who />
        <Faq />
        {/* The closing band fades to the canvas at its foot, where the footer's horizon begins */}
        <section id="lista" className={`${layout.band} ${styles.list}`} aria-labelledby="list-title">
          <div className={`${layout.inner} ${styles.listInner}`}>
            <div className={styles.listHead}>
              <h2 id="list-title" className="t-display-md">
                {t('listTitle')}
              </h2>
              <p className="t-body-lg">{t('listLead')}</p>
              <p className={`${styles.promise} t-body-md`}>{t('listPromise')}</p>
            </div>
            <div className={styles.formCard}>
              {/* The island gets only the namespace it uses */}
              <NextIntlClientProvider messages={{ Waitlist }}>
                <WaitlistForm />
              </NextIntlClientProvider>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default PrelaunchPage;
