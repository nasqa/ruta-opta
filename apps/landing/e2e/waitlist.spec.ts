import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { confirmTtlMs, sealToken } from '../src/modules/waitlist/token';
import { testTokenKey } from './fixtures';

// next start runs with WAITLIST_ADAPTER=fake (playwright.config.ts): the form answers as if Zoho accepted the signup
test.describe('the waitlist form on /es', () => {
  test('asks for what is missing and keeps what was typed', async ({ page }) => {
    await page.goto('/es');
    await page.getByLabel(es.Waitlist.email.label, { exact: true }).fill('no-es-un-correo');
    await page.getByRole('button', { name: es.Waitlist.submit }).click();

    await expect(page.getByText(es.Waitlist.name.error)).toBeVisible();
    await expect(page.getByText(es.Waitlist.email.error)).toBeVisible();
    await expect(page.getByText(es.Waitlist.consent.error)).toBeVisible();
    await expect(page.getByLabel(es.Waitlist.email.label, { exact: true })).toHaveValue('no-es-un-correo');

    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations).toEqual([]);
  });

  test('tells the person to confirm their email', async ({ page }) => {
    await page.goto('/es');
    await page.getByLabel(es.Waitlist.name.label).fill('Ana');
    await page.getByLabel(es.Waitlist.email.label, { exact: true }).fill('ana@example.com');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: es.Waitlist.submit }).click();

    await expect(page.getByRole('status')).toContainText(es.Waitlist.sent.title.replace('{name}', 'Ana'));
    await expect(page.getByRole('status')).toContainText(es.Waitlist.sent.text);
  });

  // The action reads the tag from the Referer, which is the tagged page (origin-tag.ts). The fake audience lives in the server process, so the
  // sealed tag and Zoho's source are checked in tests/waitlist-use-cases.test.mjs
  test('a tracked link stays a static page and its tag reaches the signup', async ({ page }) => {
    const response = await page.goto('/es?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento-2026-12#lista');
    // Served from the prerender, not rendered per visit: reading the tag in the page would cost every visitor the static home
    expect(response?.headers()['cache-control']).toContain('s-maxage');
    await page.getByLabel(es.Waitlist.name.label).fill('Ana');
    await page.getByLabel(es.Waitlist.email.label, { exact: true }).fill('ana.ig@example.com');
    await page.getByRole('checkbox').check();
    const signup = page.waitForRequest((request) => request.method() === 'POST' && 'next-action' in request.headers());
    await page.getByRole('button', { name: es.Waitlist.submit }).click();

    const { referer } = await (await signup).allHeaders();
    expect(new URL(referer ?? 'about:blank').searchParams.get('utm_source')).toBe('instagram');
    await expect(page.getByRole('status')).toContainText(es.Waitlist.sent.title.replace('{name}', 'Ana'));
  });
});

// Links sealed with the key the e2e server runs with, as the confirmation email would carry them
const seal = (now?: number, locale: 'es' | 'en' = 'es') =>
  sealToken(
    'confirm',
    { email: 'ana@example.com', name: 'Ana', locale, consentAt: 0, policyVersion: 'test' },
    { current: Buffer.from(testTokenKey, 'base64') },
    confirmTtlMs,
    now,
  );

// The header's link to this page in English; its name starts with the visible code (WCAG 2.5.3)
const englishLink = (page: Page) =>
  page
    .getByRole('navigation', { name: es.SiteShell.languageNav, exact: true })
    .getByRole('link', { name: `EN ${es.SiteShell.languages.en}`, exact: true });

const axe = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations).toEqual([]);
};

test.describe('the confirm page on /es/confirmar', () => {
  test('a valid link greets by name and confirming lands on /es/confirmado', async ({ page }) => {
    await page.goto(`/es/confirmar?t=${seal()}`);
    await expect(page.getByText(es.Confirm.greeting.replace('{name}', 'Ana'))).toBeVisible();
    await axe(page);

    await page.getByRole('button', { name: es.Confirm.submit }).click();
    await expect(page).toHaveURL('/es/confirmado');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Confirmed.title);
  });

  test('confirming the same link again lands on /es/confirmado too', async ({ page }) => {
    const link = `/es/confirmar?t=${seal()}`;
    for (let round = 0; round < 2; round++) {
      await page.goto(link);
      await page.getByRole('button', { name: es.Confirm.submit }).click();
      await expect(page, `round ${round + 1}`).toHaveURL('/es/confirmado');
    }
  });

  test('a link that expires before the click says so and offers to sign up again', async ({ page }) => {
    // Valid when the page opens, expired by the time the button is clicked
    const expiresAt = Date.now() + 10_000;
    await page.goto(`/es/confirmar?t=${seal(expiresAt - confirmTtlMs)}`);
    await expect(page.getByText(es.Confirm.greeting.replace('{name}', 'Ana'))).toBeVisible();
    await page.waitForTimeout(Math.max(0, expiresAt - Date.now() + 500));

    await page.getByRole('button', { name: es.Confirm.submit }).click();
    // Next's route announcer is an alert too, so the form's is picked by its text
    const alert = page.getByRole('alert').filter({ hasText: es.Confirm.expired.text });
    await expect(alert).toBeVisible();
    // The button that had focus is gone: the alert takes it
    await expect(alert).toBeFocused();
    // A final answer: retrying cannot change it, so the only way on is signing up again, at the home's form
    await expect(page.getByRole('button', { name: es.Confirm.submit })).toHaveCount(0);
    await expect(page.getByRole('link', { name: es.Confirm.again })).toHaveAttribute('href', '/es#lista');
    await axe(page);
  });

  test('an expired link says so and offers to sign up again', async ({ page }) => {
    // Sealed at the epoch, so it expired long ago
    await page.goto(`/es/confirmar?t=${seal(0)}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Confirm.expired.title);
    await expect(page.getByRole('link', { name: es.Confirm.again })).toHaveAttribute('href', '/es#lista');
    await axe(page);
  });

  test('the switch on the confirm page keeps the token', async ({ page }) => {
    const token = seal();
    await page.goto(`/es/confirmar?t=${token}`);

    await expect(englishLink(page)).toHaveAttribute('href', `/en/confirm?t=${token}`);
  });

  test('the switch on a tokenless confirm page carries no token', async ({ page }) => {
    await page.goto('/es/confirmar');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Confirm.invalid.title);
    await expect(englishLink(page)).toHaveAttribute('href', '/en/confirm');
  });

  test('the card is readable and nothing shifts when the art never loads', async ({ page }) => {
    let aborted = 0;
    await page.route('**/_next/image**', (route) => {
      aborted++;
      return route.abort();
    });
    await page.goto(`/es/confirmar?t=${seal()}`);
    await page.waitForLoadState('load');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The band asked for its art, so the test really ran without it
    expect(aborted).toBeGreaterThan(0);
    const shift = await page.evaluate(async () => {
      await document.fonts.ready;
      return new Promise<number>((resolve) => {
        let sum = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!entry.hadRecentInput) sum += entry.value;
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        // Buffered entries arrive in a callback; if none comes, nothing shifted
        setTimeout(() => {
          observer.disconnect();
          resolve(sum);
        }, 1000);
      });
    });
    expect(shift).toBeLessThan(0.1);
  });

  test('a broken link is invalid, not an error', async ({ page }) => {
    for (const query of ['?t=', '?t=abc', `?t=${seal().slice(0, -5)}`]) {
      const response = await page.goto(`/es/confirmar${query}`);
      expect(response?.status(), query).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Confirm.invalid.title);
    }
    await axe(page);
  });

  test('the page is not indexed and sends no referrer', async ({ page }) => {
    await page.goto(`/es/confirmar?t=${seal()}`);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    // The token is in the URL: no Referer header may carry it to another site
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  });
});

test('the unsubscribe page exists at /es/baja and is not indexed', async ({ page }) => {
  const response = await page.goto('/es/baja');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(es.Unsubscribed.title);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations).toEqual([]);
});

test.describe('the waitlist round trip on /en', () => {
  test('signs up in English, then confirming the English link lands on /en/confirmed', async ({ page }) => {
    await page.goto('/en');
    await page.getByLabel(en.Waitlist.name.label).fill('Ana');
    await page.getByLabel(en.Waitlist.email.label, { exact: true }).fill('ana@example.com');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: en.Waitlist.submit }).click();
    await expect(page.getByRole('status')).toContainText(en.Waitlist.sent.title.replace('{name}', 'Ana'));

    // The fake mailer lives in the server process, so the e2e cannot read the email it "sent": it opens the link the email would carry
    await page.goto(`/en/confirm?t=${seal(undefined, 'en')}`);
    await expect(page.getByText(en.Confirm.greeting.replace('{name}', 'Ana'))).toBeVisible();
    await page.getByRole('button', { name: en.Confirm.submit }).click();
    await expect(page).toHaveURL('/en/confirmed');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.Confirmed.title);
  });

  test('confirming an es link from /en/confirm lands on /en/confirmed', async ({ page }) => {
    // The page's language picks where the confirmation lands; the list is still the signup's (the token's), which the e2e cannot see
    await page.goto(`/en/confirm?t=${seal()}`);
    await page.getByRole('button', { name: en.Confirm.submit }).click();

    await expect(page).toHaveURL('/en/confirmed');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.Confirmed.title);
  });
});

test.describe('the confirmed page', () => {
  const pages = [
    { locale: 'es', path: '/es/confirmado', messages: es.Confirmed },
    { locale: 'en', path: '/en/confirmed', messages: en.Confirmed },
  ] as const;

  for (const { locale, path, messages } of pages) {
    test(`/${locale} ends in the dawn band with the sun as a decorative layer`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(messages.title);
      await expect(page.getByRole('link', { name: messages.home })).toHaveAttribute('href', `/${locale}`);
      // The scene and the sun are both decorative: two images with an empty alt inside the band
      const band = page.locator('main img[alt=""]').first().locator('..');
      await expect(band.locator('img[alt=""]')).toHaveCount(2);
      await axe(page);
    });
  }

  test('with reduced motion the sun only fades', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es/confirmado');

    const sun = page.locator('main img[alt=""]').last();
    expect(await sun.evaluate((element) => getComputedStyle(element).animationDuration)).toBe('0.1s');
  });
});
