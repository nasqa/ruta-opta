import type { MetadataRoute } from 'next';
import { siteUrl } from '@/shared/env';

// Nothing is disallowed: a disallow would stop crawlers from seeing the noindex on the transactional pages
const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: '*', allow: '/' },
  sitemap: new URL('/sitemap.xml', siteUrl).href,
});

export default robots;
