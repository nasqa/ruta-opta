import assert from 'node:assert/strict';
import { test } from 'node:test';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const locales = {
  es: { policy: es.Privacy, address: 'privacidad@rutaopta.org', businessDays: 'días hábiles', yearly: 'Una vez al año' },
  en: { policy: en.Privacy, address: 'privacy@rutaopta.org', businessDays: 'business days', yearly: 'Once a year' },
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

test('the effective line is dated and promises the yearly reminder', () => {
  for (const [locale, { policy, yearly }] of Object.entries(locales)) {
    for (const fact of ['2026', yearly]) assert.ok(policy.effective.includes(fact), `${locale}: the effective line does not say "${fact}"`);
  }
});

test('the policy never writes OPTA without Ruta, and has no placeholder left', () => {
  for (const [locale, { policy }] of Object.entries(locales)) {
    assert.doesNotMatch(JSON.stringify(policy), /(?<!Ruta )OPTA/, locale);
    assert.deepEqual(strings(policy).filter((text) => text.includes('[')), [], `${locale}: unfilled placeholders`);
  }
});
