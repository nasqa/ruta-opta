import type { Locale } from 'next-intl';
import { type Href, localesFor } from '../src/i18n/coverage';
import { routing } from '../src/i18n/routing';

// Playwright cannot load next-intl's navigation, so this mirrors getPathname for static pathnames; a wrong path fails the 200 checks
export const pathFor = (locale: Locale, href: Href) => {
  const localized: string | Record<Locale, string> = routing.pathnames[href];
  const pathname = typeof localized === 'string' ? localized : localized[locale];
  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
};

// Every route in routing.pathnames, in each locale that has its namespace
export const pages = (Object.keys(routing.pathnames) as Href[]).flatMap((href) =>
  localesFor(href).map((locale) => ({ locale, href, path: pathFor(locale, href) })),
);

export const pagePaths = pages.map(({ path }) => path);
