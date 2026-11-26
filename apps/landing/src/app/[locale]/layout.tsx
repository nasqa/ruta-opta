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
import resolved from '@nasqa/trama-theme-opta/tokens.resolved.json' with { type: 'json' };
import comfortaa from '@nasqa/trama-theme-opta/fonts/comfortaa-latin-wght-normal.woff2';
import inter from '@nasqa/trama-theme-opta/fonts/inter-latin-opsz-normal.woff2';
import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/shared/env';
import { AnalyticsScript } from './_components/analytics-script';

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

// The browser's chrome takes the paper canvas the site renders on (light only, like the manifest)
export const viewport: Viewport = { themeColor: resolved.light['color.surface.canvas'].hex };

// Netlify's free plan injects a comment wrapped in line breaks into <head>. React fails to hydrate a document whose <head> has text nodes and re-renders it all on the client
const dropHeadWhitespace = 'for (const node of [...document.head.childNodes]) if (node.nodeType === 3 && !node.data.trim()) node.remove()';

// A page sets only its own title and the template adds the site name; pages without one, such as the 404, get the default
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations('Site');

  return { metadataBase: siteUrl, title: { default: t('name'), template: t('titleTemplate', { page: '%s' }) } };
};

const LocaleLayout = async ({ children }: LayoutProps<'/[locale]'>) => {
  const locale = await getLocale();
  const { Common } = await getMessages();
  const t = await getTranslations('Common');
  // The fonts download alongside the CSS instead of after it (React adds the crossorigin a font preload needs)
  [comfortaa, inter].forEach((font) => preload(font, { as: 'font', type: 'font/woff2' }));

  return (
    <html lang={locale} data-theme="light" {...mantineHtmlProps}>
      <head>
        {/* Runs while the HTML parses, before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: dropHeadWhitespace }} />
        <ColorSchemeScript forceColorScheme="light" />
        <AnalyticsScript />
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
