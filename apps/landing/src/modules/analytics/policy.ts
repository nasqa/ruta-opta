// Which elements must, may or must not carry an event. It knows no vendor: the caller reads the goal through the adapter

// The addresses the site shows; the tests compare them with the messages
export const infoEmail = 'info@rutaopta.org';
export const instagramUrl = 'https://www.instagram.com/rutaopta/';
export const rightsEmails = ['privacidad@rutaopta.org', 'privacy@rutaopta.org'];

export type PageElement = { href?: string; inNav: boolean; optedOut: boolean; goal?: string };

const sectionLink = /^(?:\/(?:es|en))?#(?:lista|allies)$/;

// Both lists match by prefix: whatever follows (a message, a subject, a second recipient), the link still reaches that address
const conversionPrefixes = ['https://wa.me/', `mailto:${infoEmail}`, instagramUrl.slice(0, -1)];

const rightsPrefixes = rightsEmails.map((address) => `mailto:${address}`);

const startsWithAny = (href: string, prefixes: string[]) => prefixes.some((prefix) => href.startsWith(prefix));

export const violation = ({ href = '', inNav, optedOut, goal }: PageElement) => {
  if (goal && startsWithAny(href, rightsPrefixes)) return 'A rights-request address must carry no event.';
  if (!goal && startsWithAny(href, conversionPrefixes)) return 'A WhatsApp, contact e-mail or Instagram link must carry an event.';
  const toSection = sectionLink.test(href);
  if (optedOut && !toSection) return 'Only a link to the sign-up or the ally section may opt out of events.';
  if (toSection && !goal && !optedOut && !inNav) return 'A link to the sign-up or the ally section outside a <nav> must carry an event or opt out.';
  return undefined;
};
