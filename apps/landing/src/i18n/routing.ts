import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
  // Every page exists in both locales: an English browser at / lands on /en, any other on /es
  localeDetection: true,
  pathnames: {
    '/': '/',
    '/privacy': { es: '/privacidad', en: '/privacy' },
    '/confirmed': { es: '/confirmado', en: '/confirmed' },
    '/confirm': { es: '/confirmar', en: '/confirm' },
    '/unsubscribed': { es: '/baja', en: '/unsubscribed' },
  },
  // Each page declares its hreflang alternates in its metadata; the proxy's Link header would duplicate them
  alternateLinks: false,
});
