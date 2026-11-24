type OrgInput = {
  // This locale's home: the base of each node's @id, one graph per language
  page: string;
  // The site root, the same for every language: Google reads WebSite.url as the domain's home
  site: string;
  logo: string;
  name: string;
  description: string;
  locality: string;
  region: string;
  areas: string[];
  language: 'es' | 'en';
  email: string;
  // Country code and number, digits only, as in the wa.me link
  phone: string;
  // The foundation Ruta Opta is an initiative of
  parent: string;
  // Profiles the owner confirmed are Ruta Opta's own
  sameAs: string[];
};

// The site name's fallback for Google, kept in step with og:site_name
const domain = 'rutaopta.org';

// Only what is confirmed: sameAs holds just the profiles the owner confirmed (Instagram); no rating, review, taxID, foundingDate or SearchAction until they exist. Ruta Opta is an initiative of the
// foundation, not the foundation, so the legal name is the parent's. Plain Organization, never NGO, whose legal status is unconfirmed; no
// FAQPage or Tourist* types, which earn no rich result
export const homeJsonLd = ({ page, site, logo, name, description, locality, region, areas, language, email, phone, parent, sameAs }: OrgInput) => {
  const address = { '@type': 'PostalAddress', addressLocality: locality, addressRegion: region, addressCountry: 'CO' };

  return {
    '@context': 'https://schema.org' as const,
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${page}#organization`,
        name,
        url: site,
        logo,
        description,
        address,
        areaServed: areas.map((area) => ({ '@type': 'AdministrativeArea', name: area })),
        knowsLanguage: ['es', 'en'],
        sameAs,
        contactPoint: { '@type': 'ContactPoint', contactType: 'general inquiries', email, telephone: `+${phone}`, availableLanguage: ['es', 'en'] },
        parentOrganization: { '@type': 'Organization', name: parent, address },
      },
      { '@type': 'WebSite', '@id': `${page}#website`, name, alternateName: [domain], url: site, inLanguage: language },
    ],
  };
};

// JSON.stringify leaves "<" alone, so "</script>" in a string would close the element it is printed in
export const jsonLdScript = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c');
