import type { WaitlistField, WaitlistValues } from './state';

const maxNameLength = 80;
const maxEmailLength = 254;
// Letters and marks, joined by one space, apostrophe or hyphen; a period only before a space or at the end. The separator is mandatory in the loop: an optional one lets runs of letters split
// many ways, and a failing name backtracks exponentially
const namePattern = /^[\p{L}\p{M}]+(?:[ '’\-][\p{L}\p{M}]+|\.(?= |$))*$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Validation =
  | { ok: true; values: WaitlistValues }
  | { ok: false; errors: Partial<Record<WaitlistField, true>>; values: WaitlistValues };

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
};

// The action validates here whatever the form already checked: anyone can post to it directly
export const validateWaitlist = (form: FormData): Validation => {
  const values: WaitlistValues = {
    name: text(form, 'name').trim().replace(/\s+/g, ' ').normalize('NFC'),
    email: text(form, 'email').trim(),
    consent: form.get('consent') === 'on',
  };
  const errors: Partial<Record<WaitlistField, true>> = {
    ...((values.name.length > maxNameLength || !namePattern.test(values.name)) && { name: true as const }),
    ...((values.email.length > maxEmailLength || !emailPattern.test(values.email)) && { email: true as const }),
    ...(!values.consent && { consent: true as const }),
  };

  return Object.keys(errors).length === 0 ? { ok: true, values } : { ok: false, errors, values };
};
