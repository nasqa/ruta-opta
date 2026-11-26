import assert from 'node:assert/strict';
import { test } from 'node:test';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const locales = {
  es: {
    policy: es.Privacy,
    consent: es.Waitlist.consent,
    address: 'privacidad@rutaopta.org',
    businessDays: 'días hábiles',
    yearly: 'Una vez al año',
    ipAddress: 'dirección IP',
    notDeleted: 'no se borran automáticamente',
    ourNews: 'Para dejar de recibir nuestras novedades',
    everyEmail: /dejar de recibir correos|que trae cada uno/,
    linkCount: 'contar inscripciones por enlace',
  },
  en: {
    policy: en.Privacy,
    consent: en.Waitlist.consent,
    address: 'privacy@rutaopta.org',
    businessDays: 'business days',
    yearly: 'Once a year',
    ipAddress: 'IP address',
    notDeleted: 'not deleted automatically',
    ourNews: 'To stop receiving our news',
    everyEmail: /stop receiving emails|link in any of them/,
    linkCount: 'count sign-ups per link',
  },
};

const paragraphs = (text) => text.split('\n\n');
const strings = (value) => (typeof value === 'object' ? Object.values(value).flatMap(strings) : [value]);

test('the policy has its sections in reading order, in both locales', () => {
  for (const [locale, { policy }] of Object.entries(locales)) {
    assert.deepEqual(Object.keys(policy.sections), ['controller', 'data', 'purpose', 'measurement', 'contact', 'processor', 'rights', 'requests'], locale);
  }
});

test('the measurement section names Plausible, then the cookie, in two paragraphs', () => {
  for (const [locale, { policy }] of Object.entries(locales)) {
    const [measurement, cookie, ...rest] = paragraphs(policy.sections.measurement.text);
    assert.deepEqual(rest, [], `${locale}: more than two paragraphs`);
    assert.ok(measurement.includes('Plausible'), `${locale}: the first paragraph does not name Plausible`);
    assert.ok(cookie?.includes('cookie'), `${locale}: the second paragraph does not mention the cookie`);
  }
});

test('the processor section names the company that processes the visit data', () => {
  for (const [locale, { policy }] of Object.entries(locales)) {
    assert.ok(policy.sections.processor.text.includes('Plausible Insights OÜ'), locale);
  }
});

test('the requests section says who attends, where to write and the terms in business days', () => {
  for (const [locale, { policy, address, businessDays }] of Object.entries(locales)) {
    const { text } = policy.sections.requests;
    assert.equal(paragraphs(text).length, 4, `${locale}: paragraphs`);
    for (const fact of ['Stephania Forero', address]) assert.ok(text.includes(fact), `${locale}: the requests section does not name ${fact}`);
    // In the order the text states them: a query and its extension, then a claim and its extension
    const terms = [...text.matchAll(new RegExp(`(\\d+) ${businessDays}`, 'g'))].map(([, days]) => Number(days));
    assert.deepEqual(terms, [10, 5, 15, 8], `${locale}: terms`);
  }
});

test('the controller section ends with the privacy address', () => {
  for (const [locale, { policy, address }] of Object.entries(locales)) {
    assert.ok(policy.sections.controller.text.endsWith(`${address}.`), locale);
  }
});

test('the data section ends with the sign-up protection: it names the IP address and says the codes stay', () => {
  for (const [locale, { policy, ipAddress, notDeleted }] of Object.entries(locales)) {
    const [, protection, ...rest] = paragraphs(policy.sections.data.text);
    assert.deepEqual(rest, [], `${locale}: more than two paragraphs`);
    assert.ok(protection?.includes(ipAddress), `${locale}: the second paragraph does not name the IP address`);
    assert.ok(protection.includes(notDeleted), `${locale}: the second paragraph does not say the codes are not deleted automatically`);
  }
});

// The confirmation e-mail has no unsubscribe link, so the policy only promises one in the news
test('the rights section promises the unsubscribe link for the news, not for every e-mail', () => {
  for (const [locale, { policy, ourNews, everyEmail }] of Object.entries(locales)) {
    assert.doesNotMatch(policy.sections.rights.text, everyEmail, locale);
    assert.ok(policy.sections.rights.text.includes(ourNews), `${locale}: the rights section does not say "${ourNews}"`);
  }
});

test('the consent label names Ruta Opta and the count per link, with no link or other tag', () => {
  for (const [locale, { consent, linkCount }] of Object.entries(locales)) {
    for (const fact of ['(Ruta Opta)', linkCount]) assert.ok(consent.label.includes(fact), `${locale}: the consent label does not say "${fact}"`);
    assert.doesNotMatch(consent.label, /[<>]/, `${locale}: the consent label holds a tag`);
  }
});

test('the consent notice holds the privacy address, the phone and one link to the policy', () => {
  for (const [locale, { consent, address }] of Object.entries(locales)) {
    assert.ok(consent.notice?.includes(address), `${locale}: the consent notice does not hold ${address}`);
    // \s also covers the no-break spaces that keep the number on one line
    assert.match(consent.notice, /\+57\s310\s587\s4657/, `${locale}: the consent notice does not hold the phone`);
    assert.equal([...consent.notice.matchAll(/<privacy>[^<>]+<\/privacy>/g)].length, 1, `${locale}: not exactly one <privacy> link`);
    assert.equal([...consent.notice.matchAll(/</g)].length, 2, `${locale}: another tag in the consent notice`);
  }
});

test('the consent messages never write OPTA without Ruta', () => {
  for (const [locale, { consent }] of Object.entries(locales)) assert.doesNotMatch(JSON.stringify(consent), /(?<!Ruta )OPTA/, locale);
});

test('the effective line is dated and promises the yearly reminder', () => {
  for (const [locale, { policy, yearly }] of Object.entries(locales)) {
    assert.match(policy.effective, /\b\d{4}\b/, `${locale}: the effective line has no year`);
    assert.ok(policy.effective.includes(yearly), `${locale}: the effective line does not say "${yearly}"`);
  }
});

test('the policy never writes OPTA without Ruta, and has no placeholder left', () => {
  for (const [locale, { policy }] of Object.entries(locales)) {
    assert.doesNotMatch(JSON.stringify(policy), /(?<!Ruta )OPTA/, locale);
    assert.deepEqual(strings(policy).filter((text) => text.includes('[')), [], `${locale}: unfilled placeholders`);
  }
});
