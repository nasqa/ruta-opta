import type { Locale } from 'next-intl';

export type EmailContent = { locale: Locale; subject: string; preheader: string; heading: string; paragraphs: string[]; action?: { label: string; url: string }; unsubscribeUrl?: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

const assertAbsoluteHttpUrl = (value: string) => {
  const isHttp = URL.canParse(value) && /^https?:$/.test(new URL(value).protocol);
  if (!isHttp) throw new Error('Email links must be absolute http(s) URLs');
};

const font = 'font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
const hidden = 'display:none !important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden';

// Placeholder look: the branded layout replaces the internals and keeps this contract
export const renderEmail = async ({ locale, subject, preheader, heading, paragraphs, action, unsubscribeUrl }: EmailContent) => {
  if (action) assertAbsoluteHttpUrl(action.url);
  if (unsubscribeUrl) assertAbsoluteHttpUrl(unsubscribeUrl);

  const paragraph = (inner: string) => `<p style="margin:0 0 16px">${inner}</p>`;
  const body = [
    `<div style="${hidden}">${escapeHtml(preheader)}</div>`,
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3">${escapeHtml(heading)}</h1>`,
    ...paragraphs.map((text) => paragraph(escapeHtml(text))),
    ...(action
      ? [
          paragraph(`<a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 24px;border:2px solid;border-radius:4px;font-weight:bold;text-decoration:none">${escapeHtml(action.label)}</a>`),
          `<p style="margin:0 0 16px;word-break:break-all">${escapeHtml(action.url)}</p>`,
        ]
      : []),
    ...(unsubscribeUrl ? [paragraph(`<a href="${escapeHtml(unsubscribeUrl)}">${escapeHtml(unsubscribeUrl)}</a>`)] : []),
  ].join('\n');

  const html = `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px;${font};font-size:16px;line-height:1.5">
${body}
</body>
</html>`;

  const text = [heading, ...paragraphs, ...(action ? [`${action.label}: ${action.url}`] : []), ...(unsubscribeUrl ? [unsubscribeUrl] : [])].join('\n\n');

  return { subject, html, text };
};
