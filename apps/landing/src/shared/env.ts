import 'server-only';

// Netlify sets URL to the site's primary address at build time
export const siteUrl = new URL(process.env.URL ?? 'http://localhost:3000');
