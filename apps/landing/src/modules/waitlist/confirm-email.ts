import type { Locale } from 'next-intl';
import { renderEmail } from './email-layout';
import type { OutgoingEmail } from './mailer';

export type ConfirmEmailCopy = { sender: string; subject: string; preheader: string; heading: string; paragraphs: string[]; action: string };

export const buildConfirmEmail = async ({ sender, action, ...content }: ConfirmEmailCopy, locale: Locale, confirmUrl: string): Promise<Omit<OutgoingEmail, 'to' | 'reference'>> => {
  const { subject, html, text } = await renderEmail({ ...content, locale, action: { label: action, url: confirmUrl } });
  return { senderName: sender, subject, html, text };
};
