import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const locales = { es, en };

const strings = (value) => (typeof value === 'object' ? Object.values(value).flatMap(strings) : [value]);
const at = (messages, path) => path.split('.').reduce((node, key) => node?.[key], messages);

const territoryKeys = ['quindio', 'risaralda', 'caldas', 'valle', 'choco'];
const homeKeys = [
  'metaTitle', 'metaDescription', 'ogAlt', 'title', 'lead', 'cta',
  'thesis.title', 'thesis.text', 'thesis.territoriesLabel',
  ...territoryKeys.map((key) => `thesis.territories.${key}`),
  'methodTitle',
  ...['grow', 'create', 'connect'].flatMap((stage) => ['name', 'tagline', 'text'].map((field) => `stages.${stage}.${field}`)),
  'tourism.title', 'tourism.text', 'tourism.status',
  'who.title', 'who.text', 'who.legalName', 'who.locality', 'who.region',
  'allies.title', 'allies.text',
  ...['title', 'label', 'number', 'message'].map((field) => `allies.whatsapp.${field}`),
  ...['title', 'label', 'address', 'subject'].map((field) => `allies.email.${field}`),
  'listTitle', 'listLead', 'privacyLink',
];

test('every home key is a non-empty string in both locales, and the retired keys are gone', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    for (const key of homeKeys) {
      const value = at(messages.Prelaunch, key);
      assert.ok(typeof value === 'string' && value.trim() !== '', `${locale}: Prelaunch.${key} is missing or empty`);
    }
    for (const retired of ['buildingTitle', 'territory']) assert.ok(!(retired in messages.Prelaunch), `${locale}: Prelaunch.${retired} must be removed`);
  }
});

test('five territories in order in both locales', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    const { territories } = messages.Prelaunch.thesis;
    assert.deepEqual(Object.keys(territories), territoryKeys, `${locale}: territory keys and their order`);
    assert.deepEqual(Object.values(territories), ['Quindío', 'Risaralda', 'Caldas', 'Valle del Cauca', 'Chocó'], `${locale}: territory names`);
  }
});

test('legal name in Prelaunch appears in Privacy controller text in both locales', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    const { legalName } = messages.Prelaunch.who;
    assert.ok(messages.Privacy.sections.controller.text.includes(legalName), `${locale}: the privacy policy does not name ${legalName}`);
  }
});

test('contact constants identical across locales and well formed', () => {
  assert.equal(es.Prelaunch.allies.whatsapp.number, en.Prelaunch.allies.whatsapp.number);
  assert.equal(es.Prelaunch.allies.email.address, en.Prelaunch.allies.email.address);
  assert.match(es.Prelaunch.allies.whatsapp.number, /^57\d{10}$/);
  assert.match(es.Prelaunch.allies.email.address, /^[^\s@]+@rutaopta\.org$/);
});

test('meta lengths', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    assert.ok(messages.Prelaunch.metaTitle.length <= 60, `${locale}: metaTitle is ${messages.Prelaunch.metaTitle.length} characters`);
    assert.ok(messages.Prelaunch.metaDescription.length <= 155, `${locale}: metaDescription is ${messages.Prelaunch.metaDescription.length} characters`);
  }
});

test('the meta title is the approved one in each language', () => {
  assert.equal(es.Prelaunch.metaTitle, 'Ruta Opta · Talento y turismo comunitario en Colombia');
  assert.equal(en.Prelaunch.metaTitle, 'Ruta Opta · Talent and community tourism in Colombia');
});

test('no Quindío-first line', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    for (const text of strings(messages.Prelaunch)) assert.doesNotMatch(text, /empezar por el Quindío|starting in Quindío/i, `${locale}: ${text}`);
  }
});

// The course organizer is never named on the page. Not even here: the words are compared by their SHA-256, so the public
// repository does not carry the name either
const unnamedWords = new Set(['c64eedc706c31b5866793dbbbc238b8eb5e7fca08d9b2b1f85742d448629029a']);
const sha256 = (word) => createHash('sha256').update(word).digest('hex');

test('Opta is never written alone, and the course organizer is never named', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    for (const text of strings(messages.Prelaunch)) {
      assert.doesNotMatch(text, /(?<!Ruta )\bopta\b/i, `${locale}: a bare "Opta" in: ${text}`);
      const named = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => unnamedWords.has(sha256(word)));
      assert.deepEqual(named, [], `${locale}: names the course organizer in: ${text}`);
    }
  }
});
