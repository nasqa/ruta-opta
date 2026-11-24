import tokens from '@nasqa/trama-theme-opta/tokens.json' with { type: 'json' };
import resolved from '@nasqa/trama-theme-opta/tokens.resolved.json' with { type: 'json' };
import type { Locale } from 'next-intl';

// The layout's own strings and URLs, translated and built by the caller, so the layout stays a pure function of its input
export type EmailChrome = { logoUrl: string; logoAlt: string; privacyUrl: string; privacyLabel: string; reason: string; organization: string; fallback: string };
export type EmailContent = { locale: Locale; subject: string; preheader: string; heading: string; paragraphs: string[]; action?: { label: string; url: string }; unsubscribeUrl?: string; chrome: EmailChrome };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

const assertAbsoluteHttpUrl = (value: string) => {
  const isHttp = URL.canParse(value) && /^https?:$/.test(new URL(value).protocol);
  if (!isHttp) throw new Error('Email links must be absolute http(s) URLs');
};

// Email clients read no CSS variables, so the colours are the light theme's literal hex. No dark styles ship: the metas ask for light only
const { light } = resolved;
const color = {
  canvas: light['color.surface.canvas'].hex,
  raised: light['color.surface.raised'].hex,
  border: light['color.border.subtle'].hex,
  text: light['color.text.primary'].hex,
  muted: light['color.text.secondary'].hex,
  action: light['color.action.solid'].hex,
  onAction: light['color.action.on-solid'].hex,
  link: light['color.action.text-low'].hex,
};
const arc = [light['ref.arc.1'].hex, light['ref.arc.2'].hex, light['ref.arc.3'].hex, light['ref.arc.4'].hex, light['ref.arc.5'].hex];

// Single quotes, since the stacks sit inside double-quoted style attributes
const fontStack = (families: string[]) => families.map((family) => (/\s/.test(family) ? `'${family}'` : family)).join(',');
const [displayFace] = tokens.font.family.display.$value;
const display = fontStack(tokens.font.family.display.$value);
const body = fontStack(tokens.font.family.body.$value);
// Outlook ignores line-height in px unless told to keep it exactly
const typeStyle = (size: number, lineHeight: number, tone: string) =>
  `font-family:${body};font-size:${size}px;line-height:${lineHeight}px;mso-line-height-rule:exactly;color:${tone}`;

const table = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"';
const hidden = 'display:none !important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden';
// Fills the inbox preview after the preheader, so it does not run on into the body
const previewPadding = '&nbsp;&zwnj;'.repeat(90);

export const renderEmail = async ({ locale, subject, preheader, heading, paragraphs, action, unsubscribeUrl, chrome }: EmailContent) => {
  for (const url of [action?.url, unsubscribeUrl, chrome.logoUrl, chrome.privacyUrl]) if (url !== undefined) assertAbsoluteHttpUrl(url);

  // Served from public/email next to the logo: hashed /_next assets vanish on the next deploy, and an email lives for years. Escaped because a
  // host may hold a quote, which would end the CSS string
  const fontUrl = escapeHtml(new URL('/email/comfortaa.woff2', chrome.logoUrl).href);
  const paragraph = (inner: string) => `<p style="margin:0 0 16px;${typeStyle(16, 24, color.text)}">${inner}</p>`;
  const arcCells = arc
    .map((tone) => `<td width="20%" height="4" bgcolor="${tone}" style="height:4px;font-size:0;line-height:0;mso-line-height-rule:exactly;background-color:${tone}">&nbsp;</td>`)
    .join('');

  const actionRows = action
    ? `<table ${table}><tr><td style="padding:8px 0 24px">
<table role="presentation" class="button-box" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${color.action}" style="border-radius:7px;mso-padding-alt:14px 28px">
<a href="${escapeHtml(action.url)}" class="button" style="display:inline-block;padding:14px 28px;border:1px solid ${color.action};border-radius:7px;background-color:${color.action};color:${color.onAction};font-family:${body};font-size:16px;line-height:20px;font-weight:600;text-decoration:none">${escapeHtml(action.label)}</a>
</td></tr></table>
</td></tr></table>
<table ${table}><tr><td style="padding:20px 0 0;border-top:1px solid ${color.border}">
<p style="margin:0;${typeStyle(13, 20, color.muted)}">${escapeHtml(chrome.fallback)}<br><a href="${escapeHtml(action.url)}" style="color:${color.link};text-decoration:underline;word-break:break-all">${escapeHtml(action.url)}</a></p>
</td></tr></table>`
    : '';

  const footerLine = (inner: string, margin: string) => `<p style="margin:${margin};${typeStyle(12.5, 19, color.muted)}">${inner}</p>`;
  const footerLink = (url: string, label: string) => `<a href="${escapeHtml(url)}" style="color:${color.muted};text-decoration:underline">${escapeHtml(label)}</a>`;

  const html = `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(subject)}</title>
<!--[if mso]><style>body, table, td, h1, p, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
<!--[if !mso]><!--><style>@font-face{font-family:'${displayFace}';font-weight:300 700;font-display:swap;src:url('${fontUrl}') format('woff2')}</style><!--<![endif]-->
<style>
@media (max-width: 480px) {
.shell { padding: 16px 8px 28px !important; }
.card-body { padding: 28px 20px 24px !important; }
.heading { font-size: 24px !important; line-height: 30px !important; }
.button-box { width: 100% !important; }
.button { display: block !important; text-align: center !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${color.canvas}">
<div style="${hidden}">${escapeHtml(preheader)}${previewPadding}</div>
<table ${table} bgcolor="${color.canvas}" style="background-color:${color.canvas}"><tr><td class="shell" align="center" style="padding:32px 16px 40px">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<div style="max-width:600px;margin:0 auto;text-align:left">
<table ${table}><tr><td style="padding:0 0 16px"><img src="${escapeHtml(chrome.logoUrl)}" width="164" height="72" alt="${escapeHtml(chrome.logoAlt)}" style="display:block;border:0"></td></tr></table>
<table ${table} class="card" bgcolor="${color.raised}" style="background-color:${color.raised};border:1px solid ${color.border};border-radius:12px;border-collapse:separate;overflow:hidden">
<tr><td style="padding:0"><table ${table}><tr>${arcCells}</tr></table></td></tr>
<tr><td class="card-body" style="padding:40px 40px 32px">
<h1 class="heading" style="margin:0 0 16px;font-family:${display};font-size:28px;line-height:34px;mso-line-height-rule:exactly;font-weight:700;letter-spacing:-0.3px;color:${color.text}">${escapeHtml(heading)}</h1>
${paragraphs.map((text) => paragraph(escapeHtml(text))).join('\n')}
${actionRows}
</td></tr>
</table>
<table ${table}><tr><td style="padding:20px 4px 0">
${footerLine(escapeHtml(chrome.reason), '0 0 6px')}
${footerLine(`${escapeHtml(chrome.organization)} · ${footerLink(chrome.privacyUrl, chrome.privacyLabel)}`, '0')}
${unsubscribeUrl ? footerLine(footerLink(unsubscribeUrl, unsubscribeUrl), '6px 0 0') : ''}
</td></tr></table>
</div>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;

  const text = [
    heading,
    ...paragraphs,
    ...(action ? [`${action.label}: ${action.url}`] : []),
    chrome.reason,
    chrome.organization,
    `${chrome.privacyLabel}: ${chrome.privacyUrl}`,
    ...(unsubscribeUrl ? [unsubscribeUrl] : []),
  ].join('\n\n');

  return { subject, html, text };
};
