import type { Locale } from 'next-intl';
import { localesWith } from '@/i18n/coverage';

// A locale takes signups only when its confirmation email, the email's layout strings, its confirm page and its confirmed page all exist, so a
// partial translation never mails raw message keys or links to a page that 404s
export const signupLocales = (messages?: Record<Locale, object>): Locale[] => {
  const withEach = (['ConfirmEmail', 'EmailLayout', 'Confirm', 'Confirmed'] as const).map((namespace) => localesWith(namespace, messages));
  return withEach[0].filter((locale) => withEach.every((locales) => locales.includes(locale)));
};
