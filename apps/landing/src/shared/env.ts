import 'server-only';

// next.config.ts inlines SITE_URL at build: Netlify's URL in production, the deploy's own address on previews and branch deploys
export const siteUrl = new URL(process.env.SITE_URL ?? 'http://localhost:3000');
