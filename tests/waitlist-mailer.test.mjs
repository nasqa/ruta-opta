import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const dir = join(import.meta.dirname, '../apps/landing/src/modules/waitlist');
const { createCpaasMailer } = await import(join(dir, 'mailer-cpaas.ts'));
const { createFakeMailer } = await import(join(dir, 'mailer-fake.ts'));

const email = { to: { address: 'ana@example.com' }, senderName: 'Ruta Opta', subject: 'Confirm', html: '<p>hi</p>', text: 'hi', reference: 'ref-1' };
const mailerWith = (fetch) => createCpaasMailer({ apiKey: 'key-1', fromAddress: 'hola@rutaopta.org', fetch });
const respond = (status, body) => async () => new Response(body, { status });

test('sends the exact CPaaS request', async () => {
  const calls = [];
  const result = await mailerWith(async (url, init) => (calls.push({ url, init }), new Response('{}', { status: 200 }))).send(email);
  assert.deepEqual(result, { ok: true });
  const [{ url, init }] = calls;
  assert.equal(url, 'https://cpaas.zoho.com/v1.1/email');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, 'Zoho-enczapikey key-1');
  assert.equal(init.headers['Content-Type'], 'application/json');
  assert.equal(init.headers.Accept, 'application/json');
  assert.ok(init.signal instanceof AbortSignal);
  const body = JSON.parse(init.body);
  assert.deepEqual(body, {
    from: { address: 'hola@rutaopta.org', name: 'Ruta Opta' },
    to: [{ email_address: { address: 'ana@example.com' } }],
    subject: 'Confirm',
    htmlbody: '<p>hi</p>',
    textbody: 'hi',
    client_reference: 'ref-1',
    track_opens: false,
    track_clicks: false,
  });
  assert.equal('name' in body.to[0].email_address, false);
});

test('200 with a data array is ok', async () => {
  const body = '{"data":[{"code":"EM_104","message":"OK"}],"message":"OK","request_id":"r1"}';
  assert.deepEqual(await mailerWith(respond(200, body)).send(email), { ok: true });
});

test('401 with an error object gives code TM_4001', async () => {
  const body = '{"error":{"code":"TM_4001","details":[{"code":"SERR_157"}]}}';
  assert.deepEqual(await mailerWith(respond(401, body)).send(email), { ok: false, code: 'TM_4001' });
});

test('400 with data.error_code gives code TM_3004', async () => {
  const body = '{"data":{"error_code":"TM_3004","message":"Invalid request"},"message":"error"}';
  assert.deepEqual(await mailerWith(respond(400, body)).send(email), { ok: false, code: 'TM_3004' });
});

test('502 with an HTML body gives code http_502', async () => {
  assert.deepEqual(await mailerWith(respond(502, '<html>Bad Gateway</html>')).send(email), { ok: false, code: 'http_502' });
});

test('a JSON error without a code gives http_<status>', async () => {
  assert.deepEqual(await mailerWith(respond(500, '{"message":"boom"}')).send(email), { ok: false, code: 'http_500' });
});

test('an aborted fetch gives timeout, a rejected fetch gives network', async () => {
  const reject = (error) => async () => { throw error; };
  assert.deepEqual(await mailerWith(reject(new DOMException('timed out', 'TimeoutError'))).send(email), { ok: false, code: 'timeout' });
  assert.deepEqual(await mailerWith(reject(new DOMException('aborted', 'AbortError'))).send(email), { ok: false, code: 'timeout' });
  assert.deepEqual(await mailerWith(reject(new TypeError('fetch failed'))).send(email), { ok: false, code: 'network' });
});

test('a real timeout maps to timeout', async () => {
  const hang = (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  const mailer = createCpaasMailer({ apiKey: 'k', fromAddress: 'a@b.c', fetch: hang, timeoutMs: 20 });
  assert.deepEqual(await mailer.send(email), { ok: false, code: 'timeout' });
});

test('the fake records what it was given', async () => {
  const fake = createFakeMailer();
  assert.deepEqual(await fake.send(email), { ok: true });
  assert.deepEqual(fake.sent, [email]);
});
