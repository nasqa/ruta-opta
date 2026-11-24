// The token key the e2e server runs with (playwright.config.ts), so tests can seal their own confirmation links
export const testTokenKey = Buffer.alloc(32, 7).toString('base64');
