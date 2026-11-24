import type { Mailer, OutgoingEmail } from './mailer';

export const createFakeMailer = (): Mailer & { sent: OutgoingEmail[] } => {
  const sent: OutgoingEmail[] = [];
  return { sent, send: async (email) => (sent.push(email), { ok: true }) };
};
