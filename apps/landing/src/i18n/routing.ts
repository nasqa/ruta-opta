import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
  // The pages exist only in Spanish for now: an English browser at / must land on /es, not on the English 404
  localeDetection: false,
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
