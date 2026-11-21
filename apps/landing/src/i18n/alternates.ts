import { type Href, localesFor } from './coverage';
import { getPathname } from './navigation';
import { routing } from './routing';

// hreflang for a page: one entry per locale that has it. x-default is the unprefixed path where the proxy negotiates the
// locale, as in next-intl's own alternate links, so only a page that exists in every locale gets one: for any other page
// negotiation could land on a locale that answers 404
export const alternates = (href: Href, locales = localesFor(href), pathnameOf = getPathname) => ({
  languages: {
    ...Object.fromEntries(locales.map((locale) => [locale, pathnameOf({ locale, href })])),
    ...(locales.length === routing.locales.length && {
      'x-default': pathnameOf({ locale: routing.defaultLocale, href, forcePrefix: false }),
    }),
  },
});
