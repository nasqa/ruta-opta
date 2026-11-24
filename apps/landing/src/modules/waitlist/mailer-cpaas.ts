import type { Mailer, SendResult } from './mailer';

export type CpaasConfig = { apiKey: string; fromAddress: string; fetch?: typeof fetch; timeoutMs?: number };

type CpaasBody = { data?: { error_code?: unknown }; error?: { code?: unknown } };

const endpoint = 'https://cpaas.zoho.com/v1.1/email';

const parse = (text: string): CpaasBody | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null ? (value as CpaasBody) : undefined;
  } catch {
    return undefined;
  }
};

const codeOf = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

export const createCpaasMailer = ({ apiKey, fromAddress, fetch: doFetch = fetch, timeoutMs = 4000 }: CpaasConfig): Mailer => ({
  send: async ({ to, senderName, subject, html, text, reference }): Promise<SendResult> => {
    try {
      const response = await doFetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Zoho-enczapikey ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          from: { address: fromAddress, name: senderName },
          to: [{ email_address: { address: to.address } }],
          subject,
          htmlbody: html,
          textbody: text,
          client_reference: reference,
          track_opens: false,
          track_clicks: false,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return { ok: true };
      const body = parse(await response.text());
      return { ok: false, code: codeOf(body?.data?.error_code) ?? codeOf(body?.error?.code) ?? `http_${response.status}` };
    } catch (error) {
      const name = error instanceof Error ? error.name : undefined;
      return { ok: false, code: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network' };
    }
  },
});
