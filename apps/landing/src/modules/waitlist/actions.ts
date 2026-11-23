'use server';

import { hasLocale } from 'next-intl';
import { headers } from 'next/headers';
import { localesFor } from '@/i18n/coverage';
import { redirect } from '@/i18n/navigation';
import { confirmSubscription, requestConfirmation } from './server';
import type { ConfirmState, WaitlistState } from './state';
import { validateWaitlist } from './validate';

export const joinWaitlist = async (_previous: WaitlistState, form: FormData): Promise<WaitlistState> => {
  // A person never sees this field; a bot that fills every input does. It gets the same answer and nothing is sent
  const trap = form.get('company');
  if (typeof trap === 'string' && trap !== '') return { status: 'sent', name: '' };

  const validation = validateWaitlist(form);
  if (!validation.ok) return { status: 'invalid', errors: validation.errors, values: validation.values };

  // The form sends its page's locale: getLocale() reads next/root-params, which Server Actions cannot. It must be one whose /confirm page exists,
  // since it picks the email's language and the link's page
  const locale = form.get('locale');
  if (!hasLocale(localesFor('/confirm'), locale)) return { status: 'unavailable', values: validation.values };

  const ip = (await headers()).get('x-nf-client-connection-ip') ?? undefined;
  const result = await requestConfirmation(validation.values, locale, ip);
  // The same answer for a new address and one already on the list: the form never reveals who is subscribed
  return result === 'sent' ? { status: 'sent', name: validation.values.name } : { status: 'unavailable', values: validation.values };
};

export const confirmWaitlist = async (_previous: ConfirmState, form: FormData): Promise<ConfirmState> => {
  const token = form.get('token');
  const result = await confirmSubscription(typeof token === 'string' ? token : '');
  if (result.status !== 'subscribed') return { status: result.status };
  // Post/redirect/get: reloading /confirmed does not resubscribe. The token's locale is the language the subscriber signed up in
  return redirect({ href: '/confirmed', locale: result.locale });
};
