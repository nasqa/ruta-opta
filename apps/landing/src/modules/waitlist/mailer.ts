export type OutgoingEmail = { to: { address: string }; senderName: string; subject: string; html: string; text: string; reference: string };
export type SendResult = { ok: true } | { ok: false; code: string };
export type Mailer = { send: (email: OutgoingEmail) => Promise<SendResult> };
