'use server';

import { subscribeToWaitlist } from './server';
import type { WaitlistState } from './state';
import { validateWaitlist } from './validate';

export const joinWaitlist = async (_previous: WaitlistState, form: FormData): Promise<WaitlistState> => {
  // A person never sees this field; a bot that fills every input does. It gets the same answer and nothing is sent
  const trap = form.get('company');
  if (typeof trap === 'string' && trap !== '') return { status: 'sent', name: '' };

  const validation = validateWaitlist(form);
  if (!validation.ok) return { status: 'invalid', errors: validation.errors, values: validation.values };

  const result = await subscribeToWaitlist(validation.values);
  // The same answer for a new address and one already on the list: the form never reveals who is subscribed
  return result === 'sent' ? { status: 'sent', name: validation.values.name } : { status: 'unavailable', values: validation.values };
};
