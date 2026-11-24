import type { Metadata } from 'next';

type Locale = 'es' | 'en';

type MetaInput = {
  locale: Locale;
  title: string;
  description: string;
  siteName: string;
  ogTitle: string;
  ogDescription: string;
  ogAlt: string;
  og: { src: string; width: number; height: number };
  languages: Record<string, string>;
};

const ogLocales = { es: 'es_CO', en: 'en_US' } as const;

// `languages` is the page's alternates() as is, x-default included; each locale is canonical to itself. The card's title is the headline
// without the brand, which og:site_name carries, and its description fits a preview (about 110 characters) while the meta description keeps
// the long one. Next does not copy the Open Graph fields into Twitter's, so the card repeats them
export const homeMetadata = ({ locale, title, description, siteName, ogTitle, ogDescription, ogAlt, og, languages }: MetaInput): Metadata => ({
  title: { absolute: title },
  description,
  alternates: { canonical: languages[locale], languages },
  openGraph: {
    type: 'website',
    siteName,
    title: ogTitle,
    description: ogDescription,
    url: languages[locale],
    locale: ogLocales[locale],
    alternateLocale: [ogLocales[locale === 'es' ? 'en' : 'es']],
    images: [{ url: og.src, width: og.width, height: og.height, alt: ogAlt }],
  },
  twitter: { card: 'summary_large_image', title: ogTitle, description: ogDescription, images: [{ url: og.src, alt: ogAlt }] },
});
