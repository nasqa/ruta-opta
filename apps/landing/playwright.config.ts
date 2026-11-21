import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } };
const phone = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: { baseURL },
  projects: [
    { name: 'desktop', use: desktop },
    { name: 'phone', use: phone },
    // prefers-contrast: more switches Trama to its high-contrast tokens (no data-contrast is set)
    { name: 'desktop-hc', use: { ...desktop, contrast: 'more' } },
    { name: 'phone-hc', use: { ...phone, contrast: 'more' } },
  ],
  webServer: {
    command: 'npm run start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
