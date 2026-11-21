import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

// The locale comes from the [locale] root segment, so pages and layouts need no setRequestLocale to render statically
export default getRequestConfig(async ({ locale: override }) => {
  const locale = override ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, locale)) notFound();

  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
