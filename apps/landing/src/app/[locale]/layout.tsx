// Theme CSS, in this order: Mantine's layered base, then Opta's tokens, type and fonts, then Trama's scopes and skin
import '@mantine/core/styles.layer.css';
import '@nasqa/trama-theme-opta/tokens.css';
import '@nasqa/trama-theme-opta/type.css';
import '@nasqa/trama-theme-opta/fonts.css';
import '@nasqa/trama-react/scopes.css';
import '@nasqa/trama-react/system.css';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { TramaProvider } from '@nasqa/trama-react';
import { theme } from '@nasqa/trama-theme-opta';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/shared/env';

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export const metadata: Metadata = { metadataBase: siteUrl };

const LocaleLayout = async ({ children }: LayoutProps<'/[locale]'>) => {
  const locale = await getLocale();
  const { Common } = await getMessages();
  const t = await getTranslations('Common');

  return (
    <html lang={locale} data-theme="light" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript forceColorScheme="light" />
      </head>
      <body>
        {/* Client islands get only the namespaces they use */}
        <NextIntlClientProvider messages={{ Common }}>
          <TramaProvider theme={theme} labels={{ close: t('close') }} colorScheme="light">
            {children}
          </TramaProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
