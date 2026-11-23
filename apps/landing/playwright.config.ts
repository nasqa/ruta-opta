import { defineConfig, devices } from '@playwright/test';
import { testTokenKey } from './e2e/fixtures';

// Its own port, so the run never lands on a dev server on :3000, which reads .env.local and reaches Zoho
const port = 3100;
const baseURL = `http://localhost:${port}`;
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } };
const phone = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // CI uploads the report and the failure traces (test-results/) when a run fails; open: 'never' keeps a local failure from blocking
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: desktop },
    { name: 'phone', use: phone },
    // prefers-contrast: more switches Trama to its high-contrast tokens (no data-contrast is set)
    { name: 'desktop-hc', use: { ...desktop, contrast: 'more' } },
    { name: 'phone-hc', use: { ...phone, contrast: 'more' } },
  ],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: baseURL,
    // Never a server it did not start: only this one gets the env below
    reuseExistingServer: false,
    // Fake mailer and audience, and a known token key so tests seal their own links. The blank secrets win over .env.local (Next never overrides a set
    // variable), so the live adapters fail closed if the fake ones are ever off
    env: {
      WAITLIST_ADAPTER: 'fake',
      WAITLIST_TOKEN_KEY: testTokenKey,
      MAIL_PROVIDER: '',
      CPAAS_API_KEY: '',
      MAIL_FROM_ADDRESS: '',
      AUDIENCE_PROVIDER: '',
      ZOHO_CLIENT_ID: '',
      ZOHO_CLIENT_SECRET: '',
      ZOHO_REFRESH_TOKEN: '',
      ZOHO_LIST_KEY_ES: '',
      ZOHO_LIST_KEY_EN: '',
    },
  },
});
