import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import './support/next-resolution.mjs';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const analytics = join(import.meta.dirname, '../apps/landing/src/modules/analytics');
const { violation, infoEmail, instagramUrl, rightsEmails } = await import(join(analytics, 'policy.ts'));
const { eventProps, noEvent } = await import(join(analytics, 'markup.ts'));
const { goalOf } = await import(join(analytics, 'plausible.ts'));
const { events, awaitingScriptCheck } = await import(join(analytics, 'catalog.ts'));

const element = ({ href, inNav = false, optedOut = false, goal }) => ({ href, inNav, optedOut, goal });
const assertViolation = (cases) => {
  for (const fields of cases) assert.match(violation(element(fields)) ?? '', /^[A-Z].+\.$/, `expected a violation: ${JSON.stringify(fields)}`);
};
const assertFree = (cases) => {
  for (const fields of cases) assert.equal(violation(element(fields)), undefined, `expected no violation: ${JSON.stringify(fields)}`);
};

describe('the destination policy', () => {
  const goal = 'Footer Email';
  const rights = ['mailto:privacidad@rutaopta.org', 'mailto:privacy@rutaopta.org'].flatMap((href) => [href, `${href}?subject=Data`, `${href},ana@example.com`]);

  test('a rights-request address carries no event', () => {
    assertViolation(rights.map((href) => ({ href, goal })));
    assertViolation(rights.map((href) => ({ href, goal, inNav: true })));
    assertFree(rights.map((href) => ({ href })));
  });

  const conversions = [
    'https://wa.me/573000000000',
    'https://wa.me/573000000000?text=Hi',
    'mailto:info@rutaopta.org',
    'mailto:info@rutaopta.org?subject=Hi',
    'mailto:info@rutaopta.org,ana@example.com',
    'https://www.instagram.com/rutaopta',
    'https://www.instagram.com/rutaopta/',
    'https://www.instagram.com/rutaopta/?igsh=abc',
  ];

  test('a WhatsApp, contact e-mail or Instagram link carries an event', () => {
    assertViolation(conversions.map((href) => ({ href })));
    assertFree(conversions.map((href) => ({ href, goal })));
  });

  test('neither a <nav> nor noEvent excuses a WhatsApp, contact e-mail or Instagram link', () => {
    assertViolation(conversions.flatMap((href) => [{ href, inNav: true }, { href, optedOut: true }]));
    assertViolation([{ href: 'https://wa.me/573000000000', inNav: true, optedOut: true }]);
  });

  const sections = ['#lista', '#allies', '/es#lista', '/es#allies', '/en#lista', '/en#allies'];

  test('a link to the sign-up or the ally section needs an event or noEvent', () => {
    assertViolation(sections.map((href) => ({ href })));
    assertFree(sections.map((href) => ({ href, goal })));
    assertFree(sections.map((href) => ({ href, optedOut: true })));
  });

  test('in a <nav> a link to the sign-up or the ally section is free', () => {
    assertFree(sections.flatMap((href) => [{ href, inNav: true }, { href, inNav: true, optedOut: true }]));
  });

  test('noEvent on anything but those links is a violation', () => {
    assertViolation(
      [undefined, '/es', '#faq', '#listado', '/es/privacidad#lista', 'https://example.org/#lista', 'mailto:privacy@rutaopta.org'].map((href) => ({
        href,
        optedOut: true,
      })),
    );
    assertViolation([{ href: 'https://wa.me/573000000000', goal, optedOut: true }]);
  });

  test('everything else is free, tagged or not', () => {
    const others = [
      undefined,
      '/es',
      '/es/privacidad',
      '#faq',
      '#listado',
      '/es/privacidad#lista',
      'mailto:ana@example.com',
      'https://www.instagram.com/someone-else/',
      'https://example.org/?to=https://wa.me/573000000000',
    ];
    assertFree(others.map((href) => ({ href })));
    assertFree(others.map((href) => ({ href, goal })));
  });

  test('the addresses of the policy are the ones the site shows, in both locales', () => {
    for (const messages of [es, en]) {
      assert.equal(messages.SiteShell.footer.infoEmail, infoEmail);
      assert.equal(messages.SiteShell.footer.instagramUrl, instagramUrl);
      assert.deepEqual([messages.Privacy.emailEs, messages.Privacy.emailEn], rightsEmails);
    }
  });
});

describe('the markup of an event', () => {
  test("eventProps keeps the call site's classes first, then the vendor's attributes", () => {
    const { className } = eventProps('footer-whatsapp', 'a b');
    assert.ok(className.startsWith('a b '), className);
    assert.equal(goalOf({ class: className }), 'Footer WhatsApp');
  });

  test('eventProps without classes has no stray space', () => {
    const { className } = eventProps('hero-follow');
    assert.equal(className, className.trim());
    assert.equal(goalOf({ class: className }), events['hero-follow'].goal);
  });

  test('noEvent marks the element with the reason, and with no event', () => {
    assert.deepEqual(noEvent('recovery'), { 'data-no-event': 'recovery' });
  });

  test('every event awaiting the script check is in the catalog', () => {
    assert.deepEqual(
      awaitingScriptCheck.filter((id) => !Object.hasOwn(events, id)),
      [],
    );
    assert.deepEqual([...awaitingScriptCheck], ['signup-submit']);
  });
});

// server-only throws under plain Node, so the entry holds no logic and is read as text
test('the server entry starts by importing server-only, so a client import fails the build', () => {
  assert.ok(readFileSync(join(analytics, 'server.ts'), 'utf8').startsWith("import 'server-only';\n"));
});
