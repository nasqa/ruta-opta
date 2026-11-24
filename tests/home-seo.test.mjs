import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const home = join(import.meta.dirname, '../apps/landing/src/app/[locale]/(site)/_components/home');
const { homeJsonLd, jsonLdScript } = await import(join(home, 'structured-data.ts'));
const { homeMetadata } = await import(join(home, 'metadata.ts'));

const org = {
  url: 'https://www.rutaopta.org/es',
  logo: 'https://www.rutaopta.org/brand/opta-icon-512.png',
  name: 'Ruta Opta',
  legalName: 'Fundación Embajadores de la Paz',
  description: 'Ruta Opta conecta el talento de las personas con oportunidades.',
  locality: 'Armenia',
  region: 'Quindío',
  areas: ['Quindío', 'Risaralda', 'Caldas', 'Valle del Cauca', 'Chocó'],
  language: 'es',
};

const keysDeep = (value) =>
  value && typeof value === 'object' ? Object.entries(value).flatMap(([key, child]) => [key, ...keysDeep(child)]) : [];

const graph = homeJsonLd(org);
const organization = graph['@graph'].find((node) => node['@type'] === 'Organization');
const website = graph['@graph'].find((node) => node['@type'] === 'WebSite');

test('the graph is a schema.org context with exactly an Organization and a WebSite', () => {
  assert.equal(graph['@context'], 'https://schema.org');
  assert.deepEqual(graph['@graph'].map((node) => node['@type']).sort(), ['Organization', 'WebSite']);
});

test('the Organization carries the name, legal name, address, areas and languages it was given', () => {
  assert.equal(organization['@id'], 'https://www.rutaopta.org/es#organization');
  assert.equal(organization.name, 'Ruta Opta');
  assert.equal(organization.legalName, 'Fundación Embajadores de la Paz');
  assert.equal(organization.url, org.url);
  assert.equal(organization.logo, org.logo);
  assert.equal(organization.description, org.description);
  assert.deepEqual(organization.address, { '@type': 'PostalAddress', addressLocality: 'Armenia', addressRegion: 'Quindío', addressCountry: 'CO' });
  assert.deepEqual(organization.areaServed.map((area) => area.name), org.areas);
  assert.deepEqual(organization.knowsLanguage, ['es', 'en']);
});

test('the Organization is not typed as an NGO, which would imply a status we have not confirmed', () => {
  assert.equal(organization['@type'], 'Organization');
});

test('the WebSite names itself, its URL and its language', () => {
  assert.equal(website.name, 'Ruta Opta');
  assert.equal(website.url, org.url);
  assert.equal(website.inLanguage, 'es');
  assert.equal(homeJsonLd({ ...org, language: 'en' })['@graph'].find((node) => node['@type'] === 'WebSite').inLanguage, 'en');
});

test('no field that is not confirmed appears anywhere in the graph', () => {
  const present = new Set(keysDeep(graph));
  for (const key of ['sameAs', 'aggregateRating', 'review', 'telephone', 'email', 'taxID', 'foundingDate', 'potentialAction', 'contactPoint', 'streetAddress']) {
    assert.ok(!present.has(key), `JSON-LD must not carry ${key}`);
  }
});

test('the script payload cannot break out of its script element and still parses back', () => {
  const script = jsonLdScript({ a: '</script><script>alert(1)</script>', b: 'Quindío <!--' });
  assert.ok(!script.includes('<'));
  assert.deepEqual(JSON.parse(script), { a: '</script><script>alert(1)</script>', b: 'Quindío <!--' });
});

const languages = { es: '/es', en: '/en', 'x-default': '/es' };
const metaInput = (locale) => ({
  locale,
  title: 'Ruta Opta · Talento y turismo comunitario en Colombia',
  description: 'Ruta Opta conecta el talento de las personas con oportunidades.',
  siteName: 'Ruta Opta',
  ogTitle: 'El talento de las comunidades puede transformar sus territorios',
  ogDescription: 'Conectamos el talento de las comunidades con oportunidades.',
  ogAlt: 'Un valle en relieve de papel.',
  og: { src: '/_next/static/media/home-og.jpg', width: 1200, height: 630 },
  languages,
});

test('the home title ignores the layout template', () => {
  assert.deepEqual(homeMetadata(metaInput('es')).title, { absolute: 'Ruta Opta · Talento y turismo comunitario en Colombia' });
});

test('each locale is canonical to itself and keeps every hreflang entry, x-default included', () => {
  for (const locale of ['es', 'en']) {
    const { alternates } = homeMetadata(metaInput(locale));
    assert.equal(alternates.canonical, languages[locale]);
    assert.deepEqual(alternates.languages, languages);
  }
});

test('Open Graph is a website with this locale first and the other as alternate, and one image with its alt', () => {
  const es = homeMetadata(metaInput('es')).openGraph;
  const en = homeMetadata(metaInput('en')).openGraph;
  assert.equal(es.type, 'website');
  assert.equal(es.url, '/es');
  assert.equal(es.locale, 'es_CO');
  assert.deepEqual(es.alternateLocale, ['en_US']);
  assert.equal(en.locale, 'en_US');
  assert.deepEqual(en.alternateLocale, ['es_CO']);
  assert.deepEqual(es.images, [{ url: '/_next/static/media/home-og.jpg', width: 1200, height: 630, alt: 'Un valle en relieve de papel.' }]);
});

test('the card names the site and carries the headline and the short description, not the meta title and description', () => {
  const es = homeMetadata(metaInput('es')).openGraph;
  assert.equal(es.siteName, 'Ruta Opta');
  assert.equal(es.title, 'El talento de las comunidades puede transformar sus territorios');
  assert.equal(es.description, 'Conectamos el talento de las comunidades con oportunidades.');
});

test('the Twitter card is the large image, with its own title, description and image', () => {
  const { twitter } = homeMetadata(metaInput('es'));
  assert.equal(twitter.card, 'summary_large_image');
  assert.equal(twitter.title, 'El talento de las comunidades puede transformar sus territorios');
  assert.equal(twitter.description, 'Conectamos el talento de las comunidades con oportunidades.');
  assert.deepEqual(twitter.images, [{ url: '/_next/static/media/home-og.jpg', alt: 'Un valle en relieve de papel.' }]);
});

test('the description is passed through for the plain meta tag', () => {
  assert.equal(homeMetadata(metaInput('es')).description, 'Ruta Opta conecta el talento de las personas con oportunidades.');
});
