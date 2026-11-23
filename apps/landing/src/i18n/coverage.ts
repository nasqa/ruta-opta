import type { Locale, Messages } from 'next-intl';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import { routing } from './routing';

export type Href = keyof typeof routing.pathnames;

// D6: the namespace each route renders. A route exists only in the locales whose messages have that namespace
const namespaces: Record<Href, keyof Messages> = { '/': 'Prelaunch', '/privacy': 'Privacy', '/confirmed': 'Confirmed', '/confirm': 'Confirm' };

const catalogs: Record<Locale, object> = { es, en };

export const localesWith = (namespace: keyof Messages, messages = catalogs) =>
  routing.locales.filter((locale) => namespace in messages[locale]);

export const localesFor = (href: Href) => localesWith(namespaces[href]);
