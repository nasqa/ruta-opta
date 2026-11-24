type OrgInput = {
  url: string;
  logo: string;
  name: string;
  legalName: string;
  description: string;
  locality: string;
  region: string;
  areas: string[];
  language: 'es' | 'en';
};

// Only what is confirmed: no sameAs, rating, review, phone, email, taxID, foundingDate or SearchAction until they exist
export const homeJsonLd = ({ url, logo, name, legalName, description, locality, region, areas, language }: OrgInput) => ({
  '@context': 'https://schema.org' as const,
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${url}#organization`,
      name,
      legalName,
      url,
      logo,
      description,
      address: { '@type': 'PostalAddress', addressLocality: locality, addressRegion: region, addressCountry: 'CO' },
      areaServed: areas.map((area) => ({ '@type': 'AdministrativeArea', name: area })),
      knowsLanguage: ['es', 'en'],
    },
    { '@type': 'WebSite', '@id': `${url}#website`, name, url, inLanguage: language },
  ],
});

// JSON.stringify leaves "<" alone, so "</script>" in a string would close the element it is printed in
export const jsonLdScript = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c');
