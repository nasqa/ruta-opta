import type messages from '../../messages/es.json';
import type { routing } from './routing';

// Spanish is the source of the message types: a key missing from es.json is a type error
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
