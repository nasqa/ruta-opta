import type { Href } from './coverage';

// Every route decides whether search engines list it. A new route must join one set: seo.test.mjs fails otherwise
export const indexable = ['/', '/privacy'] as const satisfies Href[];

// These pages are noindex; the sitemap omits them and robots.txt leaves them crawlable so crawlers can read the noindex
export const noindex = ['/confirmed', '/confirm', '/unsubscribed'] as const satisfies Href[];
