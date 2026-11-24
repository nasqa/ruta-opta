import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Netlify sets CONTEXT only while building, so the deploy context is checked here: production must never answer with the fake adapters,
// and nothing else on Netlify may send real email. A new Netlify variable reaches every context unless it is scoped, and netlify dev sets CONTEXT=dev
const context = process.env.CONTEXT;
const live = process.env.WAITLIST_ADAPTER === 'live';
if (context === 'production' && !live) {
  throw new Error('Production builds need WAITLIST_ADAPTER=live (Netlify, Production context).');
}
if (context && context !== 'production' && context !== 'dev' && live) {
  throw new Error('Deploy previews and branch deploys must not run WAITLIST_ADAPTER=live: set it for the Production context only.');
}

// The site's own address: production answers on URL, the primary domain; a deploy preview or branch deploy on DEPLOY_PRIME_URL, where its new
// files exist. Netlify Functions see only URL at runtime, so the choice is inlined at build for every server bundle; a local build has neither
const preview = context === 'deploy-preview' || context === 'branch-deploy';
const siteUrl = (preview && process.env.DEPLOY_PRIME_URL) || process.env.URL;

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Next skips an undefined value, so src/shared/env.ts then reads the runtime environment and falls back to localhost
  env: { SITE_URL: siteUrl },
  experimental: { agentFeedback: false },
};

export default withNextIntl(nextConfig);
