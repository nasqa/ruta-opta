import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const dir = join(import.meta.dirname, '../apps/landing/src/modules/waitlist');
const { renderEmail } = await import(join(dir, 'email-layout.ts'));
const { buildConfirmEmail } = await import(join(dir, 'confirm-email.ts'));

const base = { locale: 'es', subject: 'Subject', preheader: 'Pre', heading: 'Heading', paragraphs: ['One', 'Two'] };
const url = 'https://www.rutaopta.org/confirm?t=a&b=1';

test('the layout escapes every string', async () => {
  const hostile = `<b>&"'`;
  const { html } = await renderEmail({
    ...base, subject: hostile, preheader: hostile, heading: hostile, paragraphs: [hostile],
    action: { label: hostile, url: `https://example.com/?q="><script>&x='1'` },
    unsubscribeUrl: 'https://example.com/u?a=1&b=2',
  });
  assert.ok(html.includes('&lt;b&gt;&amp;&quot;&#39;'));
  assert.ok(!html.includes('<b>'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('?q=&quot;&gt;&lt;script&gt;&amp;x=&#39;1&#39;'));
  assert.ok(html.includes('?a=1&amp;b=2'));
});

test('the action renders a button and the bare link in HTML, label and URL in text', async () => {
  const { html, text, subject } = await renderEmail({ ...base, action: { label: 'Confirm', url } });
  const safe = 'https://www.rutaopta.org/confirm?t=a&amp;b=1';
  assert.equal(subject, 'Subject');
  assert.ok(html.includes(`<a href="${safe}"`));
  assert.ok(html.includes('>Confirm</a>'));
  assert.ok(html.includes(`<p style="margin:0 0 16px;word-break:break-all">${safe}</p>`));
  assert.equal(text, `Heading\n\nOne\n\nTwo\n\nConfirm: ${url}`);
});

test('the structure is a minimal accessible document', async () => {
  const { html } = await renderEmail(base);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<meta charset="utf-8">'));
  assert.ok(html.includes('<meta name="viewport"'));
  assert.ok(html.includes('<title>Subject</title>'));
  assert.equal(html.match(/<h1/g).length, 1);
  assert.equal(html.match(/<p /g).length, 2);
  assert.ok(html.includes('display:none'));
  assert.ok(!html.includes('<a '));
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
  for (const bad of ['javascript:alert(1)', '/confirm', 'ftp://example.com', 'not a url'])
    await assert.rejects(renderEmail({ ...base, action: { label: 'Go', url: bad } }), /absolute http/);
  await assert.rejects(renderEmail({ ...base, unsubscribeUrl: 'data:text/html,x' }), /absolute http/);
});

test('the confirmation email carries only the copy and the URL', async () => {
  const copy = { sender: 'Ruta Opta', subject: 'Confirm your subscription', preheader: 'One click', heading: 'Confirm', paragraphs: ['Click to confirm.', 'Ignore if not you.'], action: 'Confirm subscription' };
  const confirmUrl = 'https://www.rutaopta.org/newsletter/confirm?token=abc.def';
  const email = await buildConfirmEmail(copy, 'es', confirmUrl);
  assert.equal(email.senderName, copy.sender);
  assert.equal(email.subject, copy.subject);
  assert.ok(email.html.includes(confirmUrl) && email.text.includes(confirmUrl));
  assert.ok(copy.paragraphs.every((p) => !p.includes(confirmUrl)));
  assert.ok(email.text.includes(`${copy.action}: ${confirmUrl}`));
  assert.deepEqual(Object.keys(email).sort(), ['html', 'senderName', 'subject', 'text']);
});
