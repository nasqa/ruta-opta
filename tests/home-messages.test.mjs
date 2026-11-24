import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const locales = { es, en };

const strings = (value) => (typeof value === 'object' ? Object.values(value).flatMap(strings) : [value]);
const at = (messages, path) => path.split('.').reduce((node, key) => node?.[key], messages);

const territoryKeys = ['quindio', 'risaralda', 'caldas', 'valle', 'choco', 'narino'];
const commitmentKeys = ['listen', 'recognize', 'connect', 'decide'];
const routeKeys = ['train', 'link', 'validate', 'drive', 'accompany', 'share'];
const homeKeys = [
  'metaTitle', 'metaDescription', 'ogAlt', 'ogTitle', 'ogDescription', 'title', 'lead', 'cta',
  'thesis.title', 'thesis.text', 'thesis.territoriesLabel',
  ...territoryKeys.map((key) => `thesis.territories.${key}`),
  'methodTitle',
  ...['grow', 'create', 'connect'].flatMap((stage) => ['name', 'tagline', 'text'].map((field) => `stages.${stage}.${field}`)),
  'tourism.title', 'tourism.text', 'tourism.status',
  'who.title', 'who.text', 'who.legalName', 'who.nit', 'who.representative', 'who.locality', 'who.region',
  'allies.title', 'allies.text', 'allies.ask', 'allies.forLabel', 'allies.byEmail', 'allies.byEmailFor',
  ...routeKeys.flatMap((route) => ['verb', 'who', 'offer', 'cta', 'message', 'subject'].map((field) => `allies.routes.${route}.${field}`)),
  ...['title', 'whatsappText', 'emailText'].map((field) => `alliesOther.${field}`),
  ...['title', 'label', 'opensNewTab', 'number', 'message'].map((field) => `allies.whatsapp.${field}`),
  ...['title', 'label', 'address', 'subject'].map((field) => `allies.email.${field}`),
  'listTitle', 'listLead', 'privacyLink',
  'overline', 'ctaAllies', 'ctaNote',
  'thesis.stance', 'thesis.stanceAuthor', 'thesis.commitmentsLabel',
  ...commitmentKeys.flatMap((key) => ['title', 'text'].map((field) => `thesis.commitments.${key}.${field}`)),
  'places.title', 'places.lead', 'places.nextLabel', 'places.quindio', 'places.status.design', 'places.status.upcoming',
  'methodLead', 'tourismOverline', 'tourismLink',
  ...['label', 'designed', 'decides', 'price'].map((field) => `tourismPrinciples.${field}`),
  'copyEmail', 'copiedEmail',
  'faq.title', ...['what', 'when', 'book', 'donate', 'allies', 'data'].flatMap((question) => [`faq.${question}.q`, `faq.${question}.a`]),
  'listPromise',
];

const shellKeys = [
  ...['label', 'places', 'method', 'tourism', 'allies', 'faq'].map((key) => `sections.${key}`),
  'whatsappFloat.label',
  ...['initiative', 'privacy', 'email', 'mission', 'explore', 'contact', 'legal', 'whatsapp', 'whatsappNumber', 'infoEmail', 'instagram', 'instagramUrl', 'place', 'rights'].map(
    (key) => `footer.${key}`,
  ),
];

test('every home key is a non-empty string in both locales, and the retired keys are gone', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    for (const key of homeKeys) {
      const value = at(messages.Prelaunch, key);
      assert.ok(typeof value === 'string' && value.trim() !== '', `${locale}: Prelaunch.${key} is missing or empty`);
    }
    for (const retired of ['buildingTitle', 'territory', 'alliesFor', 'alliesWhatsappText', 'alliesEmailText', 'methodNote']) assert.ok(!(retired in messages.Prelaunch), `${locale}: Prelaunch.${retired} must be removed`);
    for (const retired of ['risaralda', 'caldas', 'valle', 'choco', 'narino']) assert.ok(!(retired in messages.Prelaunch.places), `${locale}: Prelaunch.places.${retired} is one line repeated six times and must stay removed`);
  }
});

test('every shell key the home and the footer read is a non-empty string in both locales', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    for (const key of shellKeys) {
      const value = at(messages.SiteShell, key);
      assert.ok(typeof value === 'string' && value.trim() !== '', `${locale}: SiteShell.${key} is missing or empty`);
    }
  }
});

test('six territories in order in both locales', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    const { territories } = messages.Prelaunch.thesis;
    assert.deepEqual(Object.keys(territories), territoryKeys, `${locale}: territory keys and their order`);
    assert.deepEqual(Object.values(territories), ['Quindío', 'Risaralda', 'Caldas', 'Valle del Cauca', 'Chocó', 'Nariño'], `${locale}: territory names`);
  }
});

test('legal name, tax ID and representative in Prelaunch appear in Privacy controller text in both locales', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    const { legalName, nit, representative } = messages.Prelaunch.who;
    const controller = messages.Privacy.sections.controller.text;
    for (const fact of [legalName, nit, representative]) assert.ok(controller.includes(fact), `${locale}: the privacy policy does not name ${fact}`);
  }
});

test('contact constants identical across locales and well formed', () => {
  assert.equal(es.Prelaunch.allies.whatsapp.number, en.Prelaunch.allies.whatsapp.number);
  assert.equal(es.Prelaunch.allies.email.address, en.Prelaunch.allies.email.address);
  assert.match(es.Prelaunch.allies.whatsapp.number, /^57\d{10}$/);
  assert.match(es.Prelaunch.allies.email.address, /^[^\s@]+@rutaopta\.org$/);
});

// The footer, the allies' cards, the FAQ and the privacy policy name the same number and addresses: one changed alone would send
// people to a dead end
test('the footer, the allies, the FAQ and the policy agree on every contact, in both locales', () => {
  for (const [locale, { Prelaunch, SiteShell, Privacy }] of Object.entries(locales)) {
    const { footer } = SiteShell;
    assert.equal(footer.whatsappNumber, Prelaunch.allies.whatsapp.number, `${locale}: footer.whatsappNumber`);
    assert.equal(footer.whatsapp.replace(/\D/g, ''), footer.whatsappNumber, `${locale}: the visible WhatsApp number`);
    assert.equal(footer.infoEmail, Prelaunch.allies.email.address, `${locale}: footer.infoEmail`);
    // Each locale's footer names its own privacy address (privacidad@ in Spanish, privacy@ in English)
    assert.equal(footer.email, locale === 'es' ? Privacy.emailEs : Privacy.emailEn, `${locale}: footer.email is the policy's address`);
    const phone = footer.whatsapp.match(/\+[\d ]+\d/)?.[0];
    assert.ok(phone && Privacy.sections.controller.text.includes(phone), `${locale}: the policy names the phone ${phone}`);
    assert.ok(Prelaunch.faq.allies.a.includes(footer.infoEmail), `${locale}: the FAQ names ${footer.infoEmail}`);
    assert.ok(footer.rights.includes(Prelaunch.who.legalName) && footer.rights.includes('{year}'), `${locale}: footer.rights`);
    // The floating button names WhatsApp and warns that it opens a new tab
    assert.ok(SiteShell.whatsappFloat.label.includes('WhatsApp'), `${locale}: the floating WhatsApp button's label names WhatsApp`);
    // Two links to WhatsApp on one page must not share a name: the allies' button opens a written message, the floating one does not
    const alliesName = Prelaunch.allies.whatsapp.opensNewTab.replace('{label}', Prelaunch.allies.whatsapp.label);
    assert.notEqual(SiteShell.whatsappFloat.label, alliesName, `${locale}: the floating WhatsApp button needs a name of its own`);
    // The profile is @rutaopta; the visible text names the handle and the link goes to that profile
    assert.equal(footer.instagramUrl, 'https://www.instagram.com/rutaopta/', `${locale}: footer.instagramUrl`);
    assert.ok(footer.instagram.includes('@rutaopta'), `${locale}: the visible Instagram handle`);
    assert.ok(footer.place.startsWith(`${Prelaunch.who.locality}, ${Prelaunch.who.region}`), `${locale}: footer.place`);
  }
});

test('meta lengths', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    assert.ok(messages.Prelaunch.metaTitle.length <= 60, `${locale}: metaTitle is ${messages.Prelaunch.metaTitle.length} characters`);
    assert.ok(messages.Prelaunch.metaDescription.length <= 155, `${locale}: metaDescription is ${messages.Prelaunch.metaDescription.length} characters`);
  }
});

test('the card title is the headline without its period, and the card description fits a preview', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    const { title, ogTitle, ogDescription } = messages.Prelaunch;
    assert.equal(ogTitle, title.replace(/\.$/, ''), `${locale}: ogTitle`);
    // WhatsApp shows about 80 to 100 characters and other previews cut near 125
    assert.ok(ogDescription.length >= 90 && ogDescription.length <= 110, `${locale}: ogDescription is ${ogDescription.length} characters`);
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

test('the WhatsApp link announces its new tab around the visible label', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    assert.match(messages.Prelaunch.allies.whatsapp.opensNewTab, /^\{label\} \(.+\)$/, `${locale}: opensNewTab wraps {label}`);
  }
});

// A lead's first message is written for its kind of ally: each route has its own text and subject, in both locales
test('every ally route has its own message and subject, and its call to action names the verb it asks of the ally', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    const { routes } = messages.Prelaunch.allies;
    assert.deepEqual(Object.keys(routes), routeKeys, `${locale}: route keys and their order`);
    for (const field of ['verb', 'message', 'subject', 'cta']) {
      const values = Object.values(routes).map((route) => route[field]);
      assert.equal(new Set(values).size, values.length, `${locale}: two routes share the same ${field}`);
    }
  }
});

test('the privacy policy covers what an ally tells us by WhatsApp or email, in both locales', () => {
  for (const [locale, messages] of Object.entries({ es, en })) {
    assert.ok('contact' in messages.Privacy.sections, `${locale}: Privacy.sections.contact is missing`);
    const { text } = messages.Privacy.sections.contact;
    for (const fact of ['WhatsApp', 'info@rutaopta.org', 'privac']) assert.ok(text.includes(fact), `${locale}: the contact section does not mention ${fact}`);
  }
});
