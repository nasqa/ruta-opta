import type { Locale } from 'next-intl';

export type Contact = { email: string; name: string };
export type SubscribeResult = { status: 'subscribed' } | { status: 'blocked' } | { status: 'unavailable'; code: string };
export type Audience = { subscribe: (contact: Contact, locale: Locale, source: string) => Promise<SubscribeResult> };
