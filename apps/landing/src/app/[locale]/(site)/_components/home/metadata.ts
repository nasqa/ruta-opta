import type { Metadata } from 'next';

type Locale = 'es' | 'en';

type MetaInput = {
  locale: Locale;
  title: string;
  description: string;
  ogAlt: string;
  og: { src: string; width: number; height: number };
  languages: Record<string, string>;
};

const ogLocales = { es: 'es_CO', en: 'en_US' } as const;

// `languages` is the page's alternates() as is, x-default included; each locale is canonical to itself. Next does not copy
// the Open Graph fields into Twitter's, so the card repeats them
export const homeMetadata = ({ locale, title, description, ogAlt, og, languages }: MetaInput): Metadata => ({
  title: { absolute: title },
  description,
  alternates: { canonical: languages[locale], languages },
  openGraph: {
    type: 'website',
    title,
    description,
    url: languages[locale],
    locale: ogLocales[locale],
    alternateLocale: [ogLocales[locale === 'es' ? 'en' : 'es']],
    images: [{ url: og.src, width: og.width, height: og.height, alt: ogAlt }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [{ url: og.src, alt: ogAlt }] },
});
