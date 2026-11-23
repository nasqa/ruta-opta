import type { Locale } from 'next-intl';
import type { Audience } from './audience';

export const createFakeAudience = (): Audience & { contacts: Map<string, { name: string; locale: Locale }> } => {
  const contacts = new Map<string, { name: string; locale: Locale }>();
  return { contacts, subscribe: async ({ email, name }, locale) => (contacts.set(email, { name, locale }), { status: 'subscribed' }) };
};
