import type { WaitlistField, WaitlistValues } from './state';

const maxNameLength = 80;
const maxEmailLength = 254;
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
    name: text(form, 'name').trim().replace(/\s+/g, ' '),
    email: text(form, 'email').trim(),
    consent: form.get('consent') === 'on',
  };
  const errors: Partial<Record<WaitlistField, true>> = {
    ...((values.name === '' || values.name.length > maxNameLength) && { name: true as const }),
    ...((values.email.length > maxEmailLength || !emailPattern.test(values.email)) && { email: true as const }),
    ...(!values.consent && { consent: true as const }),
  };

  return Object.keys(errors).length === 0 ? { ok: true, values } : { ok: false, errors, values };
};
