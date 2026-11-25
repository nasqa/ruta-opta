import type { routing } from '@/i18n/routing';

// The one list of what the site measures. It knows no vendor: how an event reaches the analytics tool belongs to the adapter.
// A goal name is a contract with the tool's dashboard, where its history lives: never rename one. Move a removed event to retiredGoals

// No event without a question it answers and a decision that answer informs
export const questions = {
  channel: { ask: 'Which channel deserves the effort: WhatsApp groups, Instagram, QR codes or e-mail?', action: 'Where the next links, QR codes and hours go' },
  instagram: { ask: 'What does Instagram contribute to sign-ups and confirmations?', action: 'Whether Instagram keeps its weekly time' },
  'ally-route': { ask: 'Which ally route or contact link turns clicks into real messages?', action: 'Which invitation or pre-written message to rewrite or push' },
  funnel: { ask: 'Where does the funnel leak: visit, call to action, sign-up, confirmation?', action: 'Which step of the page or the sign-up to fix first' },
} as const;

export const allyRoutes = ['train', 'link', 'validate', 'drive', 'accompany', 'share'] as const;
export type AllyRoute = (typeof allyRoutes)[number];

// Intent and channel stay comparable when a redesign moves things around; only the placements change
type EventDefinition = {
  goal: string;
  intent: 'follow' | 'ally' | 'contact' | 'social';
  placement: 'hero' | 'tourism' | 'ally-routes' | 'ally-other' | 'floating' | 'footer' | 'signup-form';
  channel: 'page' | 'whatsapp' | 'email' | 'copy' | 'instagram' | 'form';
  allyRoute?: AllyRoute | 'other';
  answers: readonly (keyof typeof questions)[];
};

export const events = {
  'hero-follow': { goal: 'Hero Follow', intent: 'follow', placement: 'hero', channel: 'page', answers: ['funnel', 'channel', 'instagram'] },
  'hero-ally': { goal: 'Hero Ally', intent: 'ally', placement: 'hero', channel: 'page', answers: ['funnel'] },
  'tourism-follow': { goal: 'Tourism Follow', intent: 'follow', placement: 'tourism', channel: 'page', answers: ['funnel', 'channel', 'instagram'] },
  'ally-train-whatsapp': { goal: 'Ally Train WhatsApp', intent: 'ally', placement: 'ally-routes', channel: 'whatsapp', allyRoute: 'train', answers: ['ally-route'] },
  'ally-train-email': { goal: 'Ally Train Email', intent: 'ally', placement: 'ally-routes', channel: 'email', allyRoute: 'train', answers: ['ally-route'] },
  'ally-link-whatsapp': { goal: 'Ally Link WhatsApp', intent: 'ally', placement: 'ally-routes', channel: 'whatsapp', allyRoute: 'link', answers: ['ally-route'] },
  'ally-link-email': { goal: 'Ally Link Email', intent: 'ally', placement: 'ally-routes', channel: 'email', allyRoute: 'link', answers: ['ally-route'] },
  'ally-validate-whatsapp': { goal: 'Ally Validate WhatsApp', intent: 'ally', placement: 'ally-routes', channel: 'whatsapp', allyRoute: 'validate', answers: ['ally-route'] },
  'ally-validate-email': { goal: 'Ally Validate Email', intent: 'ally', placement: 'ally-routes', channel: 'email', allyRoute: 'validate', answers: ['ally-route'] },
  'ally-drive-whatsapp': { goal: 'Ally Drive WhatsApp', intent: 'ally', placement: 'ally-routes', channel: 'whatsapp', allyRoute: 'drive', answers: ['ally-route'] },
  'ally-drive-email': { goal: 'Ally Drive Email', intent: 'ally', placement: 'ally-routes', channel: 'email', allyRoute: 'drive', answers: ['ally-route'] },
  'ally-accompany-whatsapp': { goal: 'Ally Accompany WhatsApp', intent: 'ally', placement: 'ally-routes', channel: 'whatsapp', allyRoute: 'accompany', answers: ['ally-route'] },
  'ally-accompany-email': { goal: 'Ally Accompany Email', intent: 'ally', placement: 'ally-routes', channel: 'email', allyRoute: 'accompany', answers: ['ally-route'] },
  'ally-share-whatsapp': { goal: 'Ally Share WhatsApp', intent: 'ally', placement: 'ally-routes', channel: 'whatsapp', allyRoute: 'share', answers: ['ally-route'] },
  'ally-share-email': { goal: 'Ally Share Email', intent: 'ally', placement: 'ally-routes', channel: 'email', allyRoute: 'share', answers: ['ally-route'] },
  'ally-other-whatsapp': { goal: 'Ally Other WhatsApp', intent: 'ally', placement: 'ally-other', channel: 'whatsapp', allyRoute: 'other', answers: ['ally-route'] },
  'ally-other-email': { goal: 'Ally Other Email', intent: 'ally', placement: 'ally-other', channel: 'email', allyRoute: 'other', answers: ['ally-route'] },
  'copy-email': { goal: 'Copy Email', intent: 'ally', placement: 'ally-other', channel: 'copy', allyRoute: 'other', answers: ['ally-route'] },
  'floating-whatsapp': { goal: 'WhatsApp Floating', intent: 'contact', placement: 'floating', channel: 'whatsapp', answers: ['ally-route'] },
  'footer-whatsapp': { goal: 'Footer WhatsApp', intent: 'contact', placement: 'footer', channel: 'whatsapp', answers: ['ally-route'] },
  'footer-email': { goal: 'Footer Email', intent: 'contact', placement: 'footer', channel: 'email', answers: ['ally-route'] },
  'footer-instagram': { goal: 'Footer Instagram', intent: 'social', placement: 'footer', channel: 'instagram', answers: ['instagram'] },
  // Counts attempts, refused ones included (the form validates after submitting). The mailing list is the truth for sign-ups
  'signup-submit': { goal: 'Signup Submit', intent: 'follow', placement: 'signup-form', channel: 'form', answers: ['funnel', 'channel', 'instagram'] },
} as const satisfies Record<string, EventDefinition>;

export type EventId = keyof typeof events;

// Events a redesign removed. Their names are never reused, so each keeps one meaning in the dashboard's history
export const retiredGoals: readonly { goal: string; retiredOn: string; reason: string }[] = [];

// Funnel steps counted as pageview goals: opened the e-mail link, confirmed, left the list
export const pageGoalRoutes = ['/confirm', '/confirmed', '/unsubscribed'] as const satisfies readonly (keyof (typeof routing)['pathnames'])[];
