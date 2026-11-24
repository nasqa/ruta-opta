import resolved from '@nasqa/trama-theme-opta/tokens.resolved.json' with { type: 'json' };
import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

// The site is paper in light mode only, so the browser's chrome and the launch screen take the canvas colour
const canvas = resolved.light['color.surface.canvas'].hex;

// One manifest for the whole site, named in the default locale. display: browser keeps the browser's own UI: this is a site, not an app
const manifest = async (): Promise<MetadataRoute.Manifest> => {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'Site' });

  return {
    name: t('name'),
    short_name: t('name'),
    start_url: getPathname({ locale: routing.defaultLocale, href: '/' }),
    display: 'browser',
    theme_color: canvas,
    background_color: canvas,
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
};

export default manifest;
