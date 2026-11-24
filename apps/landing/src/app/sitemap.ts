import type { MetadataRoute } from 'next';
import { localesFor } from '@/i18n/coverage';
import { alternates } from '@/i18n/alternates';
import { indexable } from '@/i18n/indexing';
import { getPathname } from '@/i18n/navigation';
import { siteUrl } from '@/shared/env';

const absolute = (path: string) => new URL(path, siteUrl).href;

// One entry per localized URL, each listing the page's own hreflang set. x-default is the Spanish page itself, so the unprefixed / never appears
const sitemap = (): MetadataRoute.Sitemap =>
  indexable.flatMap((href) => {
    const languages = Object.fromEntries(Object.entries(alternates(href).languages).map(([language, path]) => [language, absolute(path)]));
    return localesFor(href).map((locale) => ({ url: absolute(getPathname({ locale, href })), alternates: { languages } }));
  });

export default sitemap;
