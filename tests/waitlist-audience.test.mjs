import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';

const dir = join(import.meta.dirname, '../apps/landing/src/modules/waitlist');
const { createZohoAudience } = await import(join(dir, 'audience-zoho.ts'));
const { createFakeAudience } = await import(join(dir, 'audience-fake.ts'));
const { createMemoryStore } = await import(join(dir, 'store.ts'));
const { openToken } = await import(join(dir, 'token.ts'));

const keys = { current: new Uint8Array(32).fill(7) };
const tokenUrl = 'https://accounts.zoho.eu/oauth/v2/token';
const subscribeUrl = 'https://campaigns.zoho.eu/api/v1.1/json/listsubscribe';
const accessToken = (n) => `1000.2deaf8d0c268e3c85daa2a013a843b1${n}.703adef2bb337b8ca36cfc5d7b83cf24`;
const contact = { email: 'ana@example.com', name: 'Ana' };

const tokenReply = (n = 1, expiresIn = 3600) =>
  [200, JSON.stringify({ access_token: accessToken(n), api_domain: 'https://www.zohoapis.eu', token_type: 'Bearer', expires_in: expiresIn })];
const subscribed = [200, JSON.stringify({ message: 'A confirmation email is sent to the user.', status: 'success', code: '0', uri: '/api/v1.1/json/listsubscribe', version: '1.1' })];
const unauthorized = [401, '{"message":"Unauthorized"}'];

// Answers token and listsubscribe calls from their own queues (the last reply repeats) and records every call in order
const zoho = ({ tokens = [tokenReply()], subscribes = [subscribed] } = {}) => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const queue = url === tokenUrl ? tokens : subscribes;
    const reply = queue.length > 1 ? queue.shift() : queue[0];
    return typeof reply === 'function' ? reply() : new Response(reply[1], { status: reply[0] });
  };
  const kinds = () => calls.map(({ url }) => (url === tokenUrl ? 'token' : 'subscribe'));
  return { calls, fetch, kinds, tokenCalls: () => kinds().filter((kind) => kind === 'token').length };
};

const audienceWith = (fetch, overrides = {}) => createZohoAudience({
  dataCenter: 'eu',
  clientId: 'client-1',
  clientSecret: 'secret-1',
  refreshToken: 'refresh-1',
  listKeys: { es: 'KEY_ES', en: 'KEY_EN' },
  store: createMemoryStore(),
  keys,
  fetch,
  ...overrides,
});

test('subscribes to the list of the locale', async () => {
  const api = zoho();
  const audience = audienceWith(api.fetch);
  assert.deepEqual(await audience.subscribe(contact, 'es', 'rutaopta.org/es'), { status: 'subscribed' });
  assert.deepEqual(await audience.subscribe(contact, 'en', 'rutaopta.org/en'), { status: 'subscribed' });
  assert.deepEqual(api.kinds(), ['token', 'subscribe', 'subscribe']);

  const [refresh, es, en] = api.calls;
  assert.equal(refresh.init.method, 'POST');
  assert.equal(refresh.init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.deepEqual(Object.fromEntries(new URLSearchParams(refresh.init.body)), {
    grant_type: 'refresh_token', refresh_token: 'refresh-1', client_id: 'client-1', client_secret: 'secret-1',
  });

  assert.equal(es.url, subscribeUrl);
  assert.equal(es.init.method, 'POST');
  assert.equal(es.init.headers.Authorization, `Zoho-oauthtoken ${accessToken(1)}`);
  assert.equal(es.init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.ok(es.init.signal instanceof AbortSignal);
  const esBody = new URLSearchParams(es.init.body);
  assert.equal(esBody.get('resfmt'), 'JSON');
  assert.equal(esBody.get('listkey'), 'KEY_ES');
  assert.deepEqual(JSON.parse(esBody.get('contactinfo')), { 'Contact Email': 'ana@example.com', 'First Name': 'Ana' });
  assert.equal(esBody.get('source'), 'rutaopta.org/es');

  const enBody = new URLSearchParams(en.init.body);
  assert.equal(enBody.get('listkey'), 'KEY_EN');
  assert.equal(enBody.get('source'), 'rutaopta.org/en');
});

test('code "0" and code 0 are subscribed', async () => {
  for (const code of ['0', 0]) {
    const api = zoho({ subscribes: [[200, JSON.stringify({ code, status: 'success' })]] });
    assert.deepEqual(await audienceWith(api.fetch).subscribe(contact, 'es', 'src'), { status: 'subscribed' });
  }
});

test('{"code":2006,"message":"Contact belongs to Do-not-mail registry.","status":"success"} is blocked', async () => {
  const api = zoho({ subscribes: [[200, '{"code":2006,"message":"Contact belongs to Do-not-mail registry.","status":"success"}']] });
  assert.deepEqual(await audienceWith(api.fetch).subscribe(contact, 'es', 'src'), { status: 'blocked' });
});

test('{"code":"2501","status":"error"} is unavailable with code 2501', async () => {
  const api = zoho({ subscribes: [[200, '{"code":"2501","status":"error"}']] });
  assert.deepEqual(await audienceWith(api.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: '2501' });
});

test('an HTML 502 is unavailable with code http_502', async () => {
  const api = zoho({ subscribes: [[502, '<html>Bad Gateway</html>']] });
  assert.deepEqual(await audienceWith(api.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'http_502' });
});

test('the access token is refreshed once and reused', async () => {
  const api = zoho();
  const audience = audienceWith(api.fetch);
  await audience.subscribe(contact, 'es', 'src');
  await audience.subscribe(contact, 'es', 'src');
  assert.deepEqual(api.kinds(), ['token', 'subscribe', 'subscribe']);
});

test('a second instance reuses the stored token', async () => {
  const store = createMemoryStore();
  const first = zoho();
  const second = zoho();
  await audienceWith(first.fetch, { store }).subscribe(contact, 'es', 'src');
  assert.deepEqual(await audienceWith(second.fetch, { store }).subscribe(contact, 'es', 'src'), { status: 'subscribed' });
  assert.equal(first.tokenCalls(), 1);
  assert.deepEqual(second.kinds(), ['subscribe']);
  assert.equal(second.calls[0].init.headers.Authorization, `Zoho-oauthtoken ${accessToken(1)}`);

  assert.equal(JSON.stringify(store.entries()).includes(accessToken(1)), false);
  const [[key, sealed]] = store.entries();
  assert.equal(key, 'zoho:access-token');
  assert.deepEqual(openToken('zoho-access-token', sealed, keys), { status: 'valid', payload: accessToken(1) });
});

test('the token lives min(expires_in, 3600) seconds less a minute', async () => {
  let clock = 1_000_000;
  const api = zoho({ tokens: [tokenReply(1, 7200), tokenReply(2)] });
  const audience = audienceWith(api.fetch, { now: () => clock });
  await audience.subscribe(contact, 'es', 'src');
  clock += 3_540_000 - 1;
  await audience.subscribe(contact, 'es', 'src');
  assert.equal(api.tokenCalls(), 1);
  clock += 1;
  await audience.subscribe(contact, 'es', 'src');
  assert.equal(api.tokenCalls(), 2);
  assert.equal(api.calls.at(-1).init.headers.Authorization, `Zoho-oauthtoken ${accessToken(2)}`);
});

test('401 clears the token, refreshes and retries once', async () => {
  const store = createMemoryStore();
  const api = zoho({ tokens: [tokenReply(1), tokenReply(2)], subscribes: [unauthorized, subscribed] });
  assert.deepEqual(await audienceWith(api.fetch, { store }).subscribe(contact, 'es', 'src'), { status: 'subscribed' });
  assert.deepEqual(api.kinds(), ['token', 'subscribe', 'token', 'subscribe']);
  assert.equal(api.calls[1].init.headers.Authorization, `Zoho-oauthtoken ${accessToken(1)}`);
  assert.equal(api.calls[3].init.headers.Authorization, `Zoho-oauthtoken ${accessToken(2)}`);
  const [[, sealed]] = store.entries();
  assert.deepEqual(openToken('zoho-access-token', sealed, keys), { status: 'valid', payload: accessToken(2) });
});

test('a 401 on the retry is unavailable after exactly one retry', async () => {
  const api = zoho({ tokens: [tokenReply(1), tokenReply(2)], subscribes: [unauthorized] });
  assert.deepEqual(await audienceWith(api.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'http_401' });
  assert.deepEqual(api.kinds(), ['token', 'subscribe', 'token', 'subscribe']);
});

test('a 401 clears the stored token even when the refresh then fails', async () => {
  const store = createMemoryStore();
  const throttled = [400, '{"error_description":"You have made too many requests continuously. Please try again after some time.","error":"Access Denied"}'];
  const api = zoho({ tokens: [tokenReply(1), throttled], subscribes: [unauthorized] });
  assert.deepEqual(await audienceWith(api.fetch, { store }).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'token_400' });
  assert.deepEqual(api.kinds(), ['token', 'subscribe', 'token']);
  assert.deepEqual(store.entries(), [['zoho:access-token', null]]);
});

test('a stored token that gets a 401 is refreshed, not reopened from the store', async () => {
  const store = createMemoryStore();
  await audienceWith(zoho().fetch, { store }).subscribe(contact, 'es', 'src');
  const api = zoho({ tokens: [tokenReply(2)], subscribes: [unauthorized, subscribed] });
  assert.deepEqual(await audienceWith(api.fetch, { store }).subscribe(contact, 'es', 'src'), { status: 'subscribed' });
  assert.deepEqual(api.kinds(), ['subscribe', 'token', 'subscribe']);
});

test('concurrent subscribes share one refresh', async () => {
  const api = zoho();
  const audience = audienceWith(api.fetch);
  const results = await Promise.all(Array.from({ length: 5 }, () => audience.subscribe(contact, 'es', 'src')));
  assert.deepEqual(results, Array(5).fill({ status: 'subscribed' }));
  assert.equal(api.tokenCalls(), 1);
});

test('a failed refresh is unavailable with code token_400', async () => {
  const throttled = [400, '{"error_description":"You have made too many requests continuously. Please try again after some time.","error":"Access Denied"}'];
  const api = zoho({ tokens: [throttled] });
  assert.deepEqual(await audienceWith(api.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'token_400' });
  assert.deepEqual(api.kinds(), ['token']);
});

test('a refresh without an access token is unavailable with code token_<status>', async () => {
  const api = zoho({ tokens: [[200, '{"error":"invalid_code"}']] });
  assert.deepEqual(await audienceWith(api.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'token_200' });
});

test('a timeout is not retried, a rejected fetch gives network', async () => {
  const reject = (error) => () => Promise.reject(error);
  const timedOut = zoho({ subscribes: [reject(new DOMException('timed out', 'TimeoutError'))] });
  assert.deepEqual(await audienceWith(timedOut.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'timeout' });
  assert.deepEqual(timedOut.kinds(), ['token', 'subscribe']);

  const offline = zoho({ subscribes: [reject(new TypeError('fetch failed'))] });
  assert.deepEqual(await audienceWith(offline.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'network' });

  const tokenTimeout = zoho({ tokens: [reject(new DOMException('aborted', 'AbortError'))] });
  assert.deepEqual(await audienceWith(tokenTimeout.fetch).subscribe(contact, 'es', 'src'), { status: 'unavailable', code: 'timeout' });
  assert.deepEqual(tokenTimeout.kinds(), ['token']);
});

test('a failing store is a cache miss, not a failure', async () => {
  const broken = { getJSON: () => Promise.reject(new Error('down')), setJSON: () => Promise.reject(new Error('down')), claim: async () => false };
  const api = zoho();
  const audience = audienceWith(api.fetch, { store: broken });
  assert.deepEqual(await audience.subscribe(contact, 'es', 'src'), { status: 'subscribed' });
  assert.deepEqual(await audience.subscribe(contact, 'es', 'src'), { status: 'subscribed' });
  assert.equal(api.tokenCalls(), 1);
});

test('the fake subscribes everyone and records them', async () => {
  const fake = createFakeAudience();
  assert.deepEqual(await fake.subscribe(contact, 'en', 'src'), { status: 'subscribed' });
  assert.deepEqual([...fake.contacts], [['ana@example.com', { name: 'Ana', locale: 'en' }]]);
});
