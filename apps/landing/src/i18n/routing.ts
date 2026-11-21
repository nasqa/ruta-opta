import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
  pathnames: { '/': '/' },
  // Each page declares its hreflang alternates in its metadata; the proxy's Link header would duplicate them
  alternateLinks: false,
});
