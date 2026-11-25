import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import './support/next-resolution.mjs';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const analytics = join(import.meta.dirname, '../apps/landing/src/modules/analytics');

// Stands in for a vendor that marks elements with a data- attribute and no class: the port has to carry that too
const dataOnlyVendor = 'data:text/javascript,export const goalAttributes = (goal) => ({ "data-goal": goal });';
registerHooks({
  resolve: (specifier, context, nextResolve) =>
    specifier === './plausible' && context.parentURL?.endsWith('/markup.ts?vendor=data-only')
      ? { url: dataOnlyVendor, shortCircuit: true }
      : nextResolve(specifier, context),
});
const { violation, infoEmail, instagramUrl, rightsEmails } = await import(join(analytics, 'policy.ts'));
const { eventProps, noEvent } = await import(join(analytics, 'markup.ts'));
const { goalOf } = await import(join(analytics, 'plausible.ts'));
const { events, awaitingScriptCheck } = await import(join(analytics, 'catalog.ts'));

const element = ({ href, inNav = false, optedOut = false, goal }) => ({ href, inNav, optedOut, goal });

// How each rule's sentence starts, so that no case passes because another rule fired
const rules = {
  rights: 'A rights-request address ',
  contact: 'A WhatsApp, contact e-mail or Instagram link ',
  optOut: 'Only a link to the sign-up or the ally section ',
  section: 'A link to the sign-up or the ally section outside ',
};
// Every case that answers wrongly, so one run names them all
const mismatches = (cases, expected) =>
  cases.flatMap((fields) => {
    const found = violation(element(fields));
    return expected(found) ? [] : [`${JSON.stringify(fields)} -> ${found}`];
  });
const assertViolation = (rule, cases) => assert.deepEqual(mismatches(cases, (found) => found?.startsWith(rules[rule])), []);
const assertFree = (cases) => assert.deepEqual(mismatches(cases, (found) => found === undefined), []);

// Ordinary ways to write a link to one address: the guard has to survive a redesign that writes it differently
const mailtoSpellings = (address) => {
  const encoded = address.replace('@', '%40');
  return [
    `mailto:${address}`,
    `mailto:${address}?subject=Data`,
    `mailto:${address[0].toUpperCase()}${address.slice(1)}`,
    `mailto:${address.toUpperCase()}`,
    `MAILTO:${address}`,
    `mailto:${encoded}`,
    ` mailto:${address}`,
    `mailto: ${address} `,
    `mailto:?to=${address}`,
    `mailto:?To=${encoded}`,
    `mailto:ana@example.com?cc=${address}`,
    `mailto:?subject=Data&bcc=ana@example.com,${address}`,
    `mailto:${address},ana@example.com`,
    `mailto:ana@example.com,${address}`,
    `mailto:ana@example.com,%20${address}`,
    `mailto:ana@example.com%2C${address}`,
    `mailto:ana@example.com;${address}`,
    `mailto:<${address}>`,
    `mailto:Team%20<${address}>`,
    `mailto:%zz,${encoded}`,
    // Malformed endings: a mail client may still reach the address
    `mailto:${address}&subject=x`,
    `mailto:${address}%3Fsubject=x`,
    `mailto:${address}.`,
    `mailto:${address}.?subject=x`,
  ];
};

describe('the destination policy', () => {
  const goal = 'Footer Email';
  const tagged = (hrefs) => hrefs.map((href) => ({ href, goal }));
  const untagged = (hrefs) => hrefs.map((href) => ({ href }));
  const rights = ['privacidad@rutaopta.org', 'privacy@rutaopta.org'].flatMap(mailtoSpellings);

  test('a rights-request address carries no event, however the link is written', () => {
    assertViolation('rights', tagged(rights));
    assertViolation('rights', tagged(rights).map((fields) => ({ ...fields, inNav: true })));
    assertFree(untagged(rights));
  });

  const contactPages = [
    'https://wa.me/573000000000',
    'https://wa.me/573000000000?text=Hi',
    'https://wa.me?text=Hi',
    'http://wa.me/573000000000',
    'HTTPS://wa.me/573000000000',
    'https://WA.ME/573000000000',
    'https://api.whatsapp.com/send?phone=573000000000',
    'https://chat.whatsapp.com/AbC123',
    'https://whatsapp.com/channel/0029Va',
    'https://www.whatsapp.com/channel/0029Va',
    'https://www.instagram.com/rutaopta',
    'https://www.instagram.com/rutaopta/',
    'https://www.instagram.com/rutaopta/?igsh=abc',
    'https://instagram.com/rutaopta',
    'https://www.instagram.com/RutaOpta/',
    'HTTPS://WWW.INSTAGRAM.COM/RUTAOPTA',
    'https://ig.me/m/rutaopta',
    'https://ig.me/m/RutaOpta',
  ];
  const conversions = [...contactPages, ...mailtoSpellings('info@rutaopta.org')];

  test('a WhatsApp, contact e-mail or Instagram link carries an event', () => {
    assertViolation('contact', untagged(conversions));
    assertFree(tagged(conversions));
  });

  test('neither a <nav> nor noEvent excuses a WhatsApp, contact e-mail or Instagram link', () => {
    assertViolation(
      'contact',
      conversions.flatMap((href) => [
        { href, inNav: true },
        { href, optedOut: true },
        { href, inNav: true, optedOut: true },
      ]),
    );
  });

  test('a link to both a rights address and the contact address fails with an event and without one', () => {
    const both = [
      'mailto:info@rutaopta.org,privacy@rutaopta.org',
      'mailto:info@rutaopta.org?cc=privacidad@rutaopta.org',
      'mailto:privacy@rutaopta.org?bcc=info@rutaopta.org',
    ];
    assertViolation('rights', tagged(both));
    assertViolation('contact', untagged(both));
  });

  test('only the recipients of an e-mail link count, and nothing in an address makes the policy throw', () => {
    const others = [
      'mailto:ana@example.com?subject=info@rutaopta.org',
      'mailto:ana@example.com?body=privacy@rutaopta.org',
      'mailto:info@rutaopta.org.example.com',
      'mailto:privacy@rutaopta.org.example',
      'mailto:privacy@rutaopta.organisation',
      'mailto:info@rutaopta.org-example.com',
      'mailto:%',
      'mailto:%E0%A4%A',
      'mailto:',
      'https://[unclosed',
    ];
    assertFree(untagged(others));
    assertFree(tagged(others));
  });

  test('other pages of WhatsApp and Instagram, and lookalikes, need no event', () => {
    assertFree(
      untagged([
        'https://www.whatsapp.com/legal',
        'https://whatsapp.com/',
        'https://www.whatsapp.com/channels',
        'https://faq.whatsapp.com/channel/1',
        'https://wa.me.example.org/573000000000',
        'https://example.org/wa.me/573000000000',
        'https://example.org/?to=https://wa.me/573000000000',
        'https://www.instagram.com/rutaopta_oficial/',
        'https://www.instagram.com/rutaoptaco',
        'https://www.instagram.com/someone-else/rutaopta',
        'https://ig.me/m/rutaopta_oficial',
        'https://ig.me/rutaopta',
        'https://example.org/rutaopta',
      ]),
    );
  });

  const sections = [
    '#lista',
    '#allies',
    '/#lista',
    '/es#lista',
    '/es#allies',
    '/es/#lista',
    '/en#lista',
    '/en#allies',
    '/es?utm_source=x#lista',
    'https://www.rutaopta.org/es#lista',
    'https://rutaopta.org/#allies',
  ];

  test('a link to the sign-up or the ally section needs an event or noEvent', () => {
    assertViolation('section', untagged(sections));
    assertFree(tagged(sections));
    assertFree(sections.map((href) => ({ href, optedOut: true })));
  });

  test('in a <nav> a link to the sign-up or the ally section is free', () => {
    assertFree(sections.flatMap((href) => [{ href, inNav: true }, { href, inNav: true, optedOut: true }]));
  });

  const elsewhere = [
    '#listado',
    '/es/privacidad#lista',
    'https://www.rutaopta.org/es/privacidad#lista',
    'https://example.org/#lista',
    'https://example.org/es#allies',
  ];

  test('noEvent on anything but those links is a violation', () => {
    assertViolation(
      'optOut',
      [undefined, '/es', '#faq', ...elsewhere, 'mailto:privacy@rutaopta.org'].map((href) => ({ href, optedOut: true })),
    );
    assertViolation('optOut', [{ href: 'https://wa.me/573000000000', goal, optedOut: true }]);
  });

  test('everything else is free, tagged or not', () => {
    const others = [undefined, '/es', '/es/privacidad', '#faq', ...elsewhere, 'mailto:ana@example.com', 'tel:+573000000000'];
    assertFree(untagged(others));
    assertFree(tagged(others));
  });

  test('the addresses of the policy are the ones the site shows, in both locales', () => {
    for (const messages of [es, en]) {
      assert.equal(messages.SiteShell.footer.infoEmail, infoEmail);
      assert.equal(messages.Prelaunch.allies.email.address, infoEmail);
      assert.equal(messages.SiteShell.footer.instagramUrl, instagramUrl);
      assert.deepEqual([messages.Privacy.emailEs, messages.Privacy.emailEn], rightsEmails);
      assert.ok(rightsEmails.includes(messages.SiteShell.footer.email), messages.SiteShell.footer.email);
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

  test('eventProps leaves the className key out when there is no class to set', async () => {
    const { eventProps: withDataOnly } = await import(`${pathToFileURL(join(analytics, 'markup.ts'))}?vendor=data-only`);
    assert.deepEqual(withDataOnly('hero-follow'), { 'data-goal': 'Hero Follow' });
    assert.deepEqual(withDataOnly('hero-follow', 'a b'), { 'data-goal': 'Hero Follow', className: 'a b' });
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
