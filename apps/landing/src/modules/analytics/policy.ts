// Which elements must, may or must not carry an event. It knows no vendor: the caller reads the goal through the adapter.
// For server and test code only (URL.parse). Links are judged by where they lead: the ordinary spellings in its tests, not every possible one

// The addresses the site shows; the tests compare them with the messages
export const infoEmail = 'info@rutaopta.org';
export const instagramUrl = 'https://www.instagram.com/rutaopta/';
export const rightsEmails = ['privacidad@rutaopta.org', 'privacy@rutaopta.org'];

// href is the attribute as written (getAttribute), not the resolved address: resolved, #lista would take the host and path of its page
export type PageElement = { href?: string; inNav: boolean; optedOut: boolean; goal?: string };

const site = 'https://www.rutaopta.org';
const siteHosts = ['rutaopta.org', 'www.rutaopta.org'];
const homePath = /^\/(?:(?:es|en)\/?)?$/;
const sections = ['#lista', '#allies'];
const instagramHandle = new URL(instagramUrl).pathname.split('/')[1];

// Escape by escape, so it never throws and a malformed one cannot hide the addresses around it
const percentDecode = (text: string) => text.replace(/%([\da-f]{2})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));

// A name may come before the address, which then sits in angle brackets
const addressOf = (recipient: string) => (/<([^<>]*)>/.exec(recipient)?.[1] ?? recipient).trim().toLowerCase();

const recipientsOf = ({ protocol, pathname, searchParams }: URL) => {
  if (protocol !== 'mailto:') return [];
  const fields = [...searchParams].filter(([name]) => ['to', 'cc', 'bcc'].includes(name.toLowerCase())).map(([, value]) => value);
  // Some mail clients also take a semicolon between addresses
  return [percentDecode(pathname), ...fields].flatMap((list) => list.split(/[,;]/)).map(addressOf);
};

// A recipient reaches an address when it starts with it and the domain stops there: a malformed ending (&subject, a final dot) still counts
const domainGoesOn = /^\.?[a-z\d-]/;

const includesAny = (recipients: string[], addresses: string[]) =>
  recipients.some((recipient) => addresses.some((address) => recipient.startsWith(address) && !domainGoesOn.test(recipient.slice(address.length))));

// Where WhatsApp and Instagram reach Ruta Opta; their other pages are ordinary links
const isContactPage = ({ hostname, pathname }: URL) => {
  const [first, second] = pathname.toLowerCase().split('/').slice(1);
  if (['wa.me', 'api.whatsapp.com', 'chat.whatsapp.com'].includes(hostname)) return true;
  if (['whatsapp.com', 'www.whatsapp.com'].includes(hostname)) return first === 'channel';
  if (['instagram.com', 'www.instagram.com'].includes(hostname)) return first === instagramHandle;
  return hostname === 'ig.me' && first === 'm' && second === instagramHandle;
};

const isSectionLink = ({ hostname, pathname, hash }: URL) => siteHosts.includes(hostname) && homePath.test(pathname) && sections.includes(hash);

export const violation = ({ href = '', inNav, optedOut, goal }: PageElement) => {
  // An address that cannot be parsed leads nowhere: it counts as the home with no section
  const url = URL.parse(href, site) ?? new URL(site);
  const recipients = recipientsOf(url);
  if (goal && includesAny(recipients, rightsEmails)) return 'A rights-request address must carry no event.';
  if (!goal && (includesAny(recipients, [infoEmail]) || isContactPage(url))) return 'A WhatsApp, contact e-mail or Instagram link must carry an event.';
  const toSection = isSectionLink(url);
  if (optedOut && !toSection) return 'Only a link to the sign-up or the ally section may opt out of events.';
  if (toSection && !goal && !optedOut && !inNav) return 'A link to the sign-up or the ally section outside a <nav> must carry an event or opt out.';
  return undefined;
};
