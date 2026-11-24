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
  // Absolute: a scraper reads the tag as is
  ogImage: string;
  languages: Record<string, string>;
};

const ogLocales = { es: 'es_CO', en: 'en_US' } as const;

// The card is a stable file per locale under public/og, never a hashed asset: WhatsApp and Facebook keep the image URL they cached, so a hash
// that changes with the art orphans every link already shared. A new card is a new version (scripts/brand-images.mjs); old versions stay
export const ogCard = { width: 1200, height: 630, type: 'image/jpeg', path: (locale: Locale) => `/og/home-${locale}-v2.jpg` } as const;

// `languages` is the page's alternates() as is, x-default included; each locale is canonical to itself. The card's title is the headline
// without the brand, which og:site_name carries, and its description fits a preview (about 110 characters) while the meta description keeps
// the long one. Next does not copy the Open Graph fields into Twitter's, so the card repeats them
export const homeMetadata = ({ locale, title, description, siteName, ogTitle, ogDescription, ogAlt, ogImage, languages }: MetaInput): Metadata => ({
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
    images: [{ url: ogImage, width: ogCard.width, height: ogCard.height, type: ogCard.type, alt: ogAlt }],
  },
  twitter: { card: 'summary_large_image', title: ogTitle, description: ogDescription, images: [{ url: ogImage, alt: ogAlt }] },
});
