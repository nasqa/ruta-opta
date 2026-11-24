import { type Href, localesFor } from './coverage';
import { getPathname } from './navigation';
import { routing } from './routing';

// hreflang for a page: one entry per locale that has it, and x-default on the default locale's own page. Not the unprefixed path, as in
// next-intl's own links: / answers with the Spanish home, whose canonical is /es, and any other unprefixed path redirects. A page in a single
// locale has nothing to choose between, so it gets no x-default
export const alternates = (href: Href, locales = localesFor(href), pathnameOf = getPathname) => ({
  languages: {
    ...Object.fromEntries(locales.map((locale) => [locale, pathnameOf({ locale, href })])),
    ...(locales.length > 1 && locales.includes(routing.defaultLocale) && { 'x-default': pathnameOf({ locale: routing.defaultLocale, href }) }),
  },
});
