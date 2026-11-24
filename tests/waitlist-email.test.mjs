import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import resolved from '@nasqa/trama-theme-opta/tokens.resolved.json' with { type: 'json' };
import './support/next-resolution.mjs';

const dir = join(import.meta.dirname, '../apps/landing/src/modules/waitlist');
const { renderEmail } = await import(join(dir, 'email-layout.ts'));
const { buildConfirmEmail } = await import(join(dir, 'confirm-email.ts'));

const hex = (key) => resolved.light[key].hex;
const chrome = {
  logoUrl: 'https://www.rutaopta.org/email/opta-horizontal-plate@2x.png',
  logoAlt: 'Opta',
  privacyUrl: 'https://www.rutaopta.org/es/privacidad',
  privacyLabel: 'Política de tratamiento de datos',
  reason: 'Recibiste este correo porque alguien escribió esta dirección en rutaopta.org.',
  organization: 'Fundación Embajadores de la Paz · Armenia, Quindío, Colombia',
  fallback: '¿El botón no funciona? Copia este enlace en tu navegador:',
};
const footerText = `${chrome.reason}\n\n${chrome.organization}\n\n${chrome.privacyLabel}: ${chrome.privacyUrl}`;
const base = { locale: 'es', subject: 'Subject', preheader: 'Pre', heading: 'Heading', paragraphs: ['One', 'Two'], chrome };
const url = 'https://www.rutaopta.org/confirm?t=a&b=1';

test('the layout escapes every string', async () => {
  const hostile = `<b>&"'`;
  const { html } = await renderEmail({
    ...base, subject: hostile, preheader: hostile, heading: hostile, paragraphs: [hostile],
    action: { label: hostile, url: `https://example.com/?q="><script>&x='1'` },
    unsubscribeUrl: 'https://example.com/u?a=1&b=2',
    chrome: {
      ...Object.fromEntries(Object.keys(chrome).map((key) => [key, hostile])),
      logoUrl: 'https://example.com/logo.png?q="><script>',
      privacyUrl: `https://example.com/privacy?q="><script>&x='1'`,
    },
  });
  assert.ok(html.includes('&lt;b&gt;&amp;&quot;&#39;'));
  assert.ok(!html.includes('<b>'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('?q=&quot;&gt;&lt;script&gt;&amp;x=&#39;1&#39;'));
  assert.ok(html.includes('?a=1&amp;b=2'));
  assert.ok(html.includes('logo.png?q=&quot;&gt;&lt;script&gt;'));
});

test('the action renders as a button, the fallback label and the bare URL; text keeps label: URL', async () => {
  const { html, text, subject } = await renderEmail({ ...base, action: { label: 'Confirm', url } });
  const safe = 'https://www.rutaopta.org/confirm?t=a&amp;b=1';
  assert.equal(subject, 'Subject');
  const [, href, style] = html.match(/<a href="([^"]+)"[^>]*style="([^"]+)"[^>]*>Confirm<\/a>/);
  assert.equal(href, safe);
  for (const rule of [`background-color:${hex('color.action.solid')}`, `;color:${hex('color.action.on-solid')}`, `border:1px solid ${hex('color.action.solid')}`, 'border-radius:7px'])
    assert.ok(style.includes(rule), `the button's style lacks ${rule}`);
  assert.ok(html.includes('mso-padding-alt'));
  const [, fallbackStyle] = html.match(new RegExp(`<a href="${safe.replace(/[?.]/g, '\\$&')}"[^>]*style="([^"]+)"[^>]*>${safe.replace(/[?.]/g, '\\$&')}</a>`));
  assert.ok(fallbackStyle.includes('word-break:break-all'));
  assert.ok(html.indexOf(chrome.fallback) > html.indexOf('>Confirm</a>') && html.indexOf(chrome.fallback) < html.lastIndexOf(`>${safe}</a>`));
  assert.equal(text, `Heading\n\nOne\n\nTwo\n\nConfirm: ${url}\n\n${footerText}`);
});

test('the structure is one accessible document with one h1 and a padded hidden preheader', async () => {
  const { html } = await renderEmail(base);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<meta charset="utf-8">'));
  assert.ok(html.includes('<meta name="viewport"'));
  assert.ok(html.includes('<title>Subject</title>'));
  assert.equal(html.match(/<h1/g).length, 1);
  assert.ok(html.includes('display:none'));
  assert.ok(html.includes('Pre&nbsp;&zwnj;&nbsp;&zwnj;'));
});

test('clients that read the scheme keep it light', async () => {
  const { html } = await renderEmail(base);
  assert.ok(html.includes('<meta name="color-scheme" content="light only">'));
  assert.ok(html.includes('<meta name="supported-color-schemes" content="light only">'));
});

test('Outlook gets a 600 px ghost table and everyone else a fluid max-width column', async () => {
  const { html } = await renderEmail(base);
  assert.ok(html.includes('<!--[if mso]>'));
  assert.ok(html.includes('width="600"'));
  assert.ok(html.includes('max-width:600px'));
});

test('Outlook on Windows is pinned to a sans font and never sees the webfont', async () => {
  const { html } = await renderEmail(base);
  const mso = html.match(/<!--\[if mso\]><style>([^<]*)<\/style><!\[endif\]-->/);
  assert.ok(mso, 'no MSO-only style block');
  assert.ok(mso[1].includes('body, table, td, h1, p, a { font-family: Arial, Helvetica, sans-serif !important; }'));
  assert.ok(/<!--\[if !mso\]><!--><style>@font-face\{[^<]*<\/style><!--<!\[endif\]-->/.test(html));
  assert.equal(html.match(/@font-face/g).length, 1);
});

test('the logo is the plate PNG with explicit size and alt', async () => {
  const { html } = await renderEmail(base);
  assert.ok(html.includes(`<img src="${chrome.logoUrl}" width="164" height="72" alt="Opta"`));
});

test('the arc bar is five solid cells in the token colours', async () => {
  const { html } = await renderEmail(base);
  const cells = [...html.matchAll(/<td[^>]*height="4"[^>]*bgcolor="(#[\da-f]{6})"/g)].map(([, color]) => color);
  assert.deepEqual(cells, [1, 2, 3, 4, 5].map((step) => hex(`ref.arc.${step}`)));
});

test('colours come from the token file', async () => {
  const { html } = await renderEmail({ ...base, action: { label: 'Confirm', url } });
  for (const key of ['color.action.solid', 'color.action.on-solid', 'color.surface.canvas', 'color.surface.raised', 'color.border.subtle', 'color.text.primary', 'color.text.secondary'])
    assert.ok(html.includes(hex(key)), `${key} is missing`);
  assert.ok(html.includes(`bgcolor="${hex('color.surface.canvas')}"`));
  assert.ok(html.includes(`border:1px solid ${hex('color.border.subtle')}`));
  assert.ok(html.includes(`bgcolor="${hex('color.surface.raised')}"`));
  assert.ok(html.includes(`;color:${hex('color.text.primary')}`));
  assert.ok(html.includes(`;color:${hex('color.text.secondary')}`));
});

test('narrow clients get a 480 px media block', async () => {
  const { html } = await renderEmail(base);
  assert.ok(html.includes('@media'));
  assert.ok(html.includes('max-width: 480px'));
});

test('the footer says why, who, and links privacy; the text part ends with them', async () => {
  const { html, text } = await renderEmail(base);
  assert.ok(html.includes(chrome.reason));
  assert.ok(html.includes(chrome.organization));
  assert.ok(html.includes(`href="${chrome.privacyUrl}"`));
  assert.ok(html.includes(`>${chrome.privacyLabel}</a>`));
  assert.ok(text.endsWith(footerText));
});

test('unsubscribeUrl renders a final link line in both parts', async () => {
  const { html, text } = await renderEmail({ ...base, unsubscribeUrl: 'https://example.com/u' });
  assert.ok(html.includes('href="https://example.com/u"'));
  assert.ok(text.endsWith('\n\nhttps://example.com/u'));
});

test('html lang follows locale', async () => {
  assert.ok((await renderEmail({ ...base, locale: 'es' })).html.includes('<html lang="es">'));
  assert.ok((await renderEmail({ ...base, locale: 'en' })).html.includes('<html lang="en">'));
});

test('the layout rejects non-http(s) and relative URLs', async () => {
  for (const bad of ['javascript:alert(1)', '/confirm', 'ftp://example.com', 'not a url']) {
    await assert.rejects(renderEmail({ ...base, action: { label: 'Go', url: bad } }), /absolute http/);
    await assert.rejects(renderEmail({ ...base, chrome: { ...chrome, logoUrl: bad } }), /absolute http/);
    await assert.rejects(renderEmail({ ...base, chrome: { ...chrome, privacyUrl: bad } }), /absolute http/);
  }
  await assert.rejects(renderEmail({ ...base, unsubscribeUrl: 'data:text/html,x' }), /absolute http/);
});

const copy = { sender: 'Ruta Opta', subject: 'Confirm your subscription', preheader: 'One click', heading: 'Confirm', paragraphs: ['Click to confirm.', 'Ignore if not you.'], action: 'Confirm subscription' };

test('the confirmation email carries only the copy and the URL', async () => {
  const confirmUrl = 'https://www.rutaopta.org/newsletter/confirm?token=abc.def';
  const email = await buildConfirmEmail(copy, 'es', confirmUrl, chrome);
  assert.equal(email.senderName, copy.sender);
  assert.equal(email.subject, copy.subject);
  assert.ok(email.html.includes(confirmUrl) && email.text.includes(confirmUrl));
  assert.ok(copy.paragraphs.every((p) => !p.includes(confirmUrl)));
  assert.ok(email.text.includes(`${copy.action}: ${confirmUrl}`));
  assert.deepEqual(Object.keys(email).sort(), ['html', 'senderName', 'subject', 'text']);
});

test('no value the person typed can appear', () => {
  // The email is built from translated copy, the locale, the confirm URL and the layout's chrome: no input carries a name or an address
  assert.equal(buildConfirmEmail.length, 4);
  assert.deepEqual(Object.keys(copy).sort(), ['action', 'heading', 'paragraphs', 'preheader', 'sender', 'subject']);
  assert.deepEqual(Object.keys(chrome).sort(), ['fallback', 'logoAlt', 'logoUrl', 'organization', 'privacyLabel', 'privacyUrl', 'reason']);
});
