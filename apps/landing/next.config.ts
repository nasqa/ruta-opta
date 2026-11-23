import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Netlify sets CONTEXT only while building, so the production deploy is checked here: it must never answer with the fake adapters
if (process.env.CONTEXT === 'production' && process.env.WAITLIST_ADAPTER !== 'live') {
  throw new Error('Production builds need WAITLIST_ADAPTER=live (Netlify, Production context).');
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: { agentFeedback: false },
};

export default withNextIntl(nextConfig);
