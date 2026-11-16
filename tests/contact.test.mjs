import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../lib/contact.mjs';

const nativeFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = nativeFetch; });
const env = () => ({
  RESEND_API_KEY: 'test-only-secret',
  EMAIL_FROM: 'Ohlluu Website <notifications@ohlluudev.com>',
  CONTACT_LIMITER: { limit: async () => ({ success: true }) },
});
const details = {
  name: 'A Visitor', email: 'visitor@example.com', phone: '555-0100',
  company: 'Example', website: 'https://example.com', budget: 'startup',
  service: 'website', message: 'Please help with our website.',
  requestId: '94383ccd-0806-4606-bcc5-961b82bb54cf',
};
const request = (data = details, origin = 'https://ohlluudev.com', options = {}) =>
  new Request('https://contact.example.workers.dev/contact', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
    body: JSON.stringify(data), ...options,
  });

test('sends to the fixed owner inbox with visitor reply-to and a stable retry key', async () => {
  const sent = [];
  globalThis.fetch = async (url, options) => {
    sent.push({ url, options, body: JSON.parse(options.body) });
    return Response.json({ id: 'provider-test-id' });
  };
  for (let i = 0; i < 2; i++) {
    const response = await worker.fetch(request({ ...details, to: 'attacker@example.com' }), env());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://ohlluudev.com');
  }
  assert.equal(sent[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(sent[0].body.to, ['info@ohlluudev.com']);
  assert.equal(sent[0].body.reply_to, details.email);
  assert.ok(sent[0].body.text.includes(details.message));
  assert.ok(sent[0].body.text.includes(details.phone));
  assert.equal(sent[0].options.headers['Idempotency-Key'], sent[1].options.headers['Idempotency-Key']);
});

test('rejects unwanted origins and permits preflight without sending mail', async () => {
  globalThis.fetch = () => { throw new Error('Must not send'); };
  const rejected = await worker.fetch(request(details, 'https://other.example'), env());
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get('Access-Control-Allow-Origin'), null);
  const preflight = await worker.fetch(new Request('https://contact.example/contact', {
    method: 'OPTIONS', headers: { Origin: 'https://www.ohlluudev.com' },
  }), env());
  assert.equal(preflight.status, 200);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://www.ohlluudev.com');
});

test('rejects missing details, injected headers, oversized input, honeypots and malformed JSON', async () => {
  globalThis.fetch = () => { throw new Error('Must not send'); };
  for (const data of [{ ...details, name: '' }, { ...details, email: 'invalid' },
    { ...details, phone: '' }, { ...details, name: 'Visitor\r\nBcc: bad@example.com' },
    { ...details, message: 'x'.repeat(6001) }, { ...details, _company_site: 'spam' },
    { ...details, requestId: 'invalid' }, null]) {
    assert.equal((await worker.fetch(request(data), env())).status, 400);
  }
  assert.equal((await worker.fetch(request({ ...details, message: 'x'.repeat(17000) }), env())).status, 413);
  assert.equal((await worker.fetch(request(details, 'https://ohlluudev.com', { body: '{' }), env())).status, 400);
});

test('fails closed when email credentials or rate limiting are missing', async () => {
  globalThis.fetch = () => { throw new Error('Must not send'); };
  for (const key of ['RESEND_API_KEY', 'EMAIL_FROM', 'CONTACT_LIMITER']) {
    const settings = env(); delete settings[key];
    assert.equal((await worker.fetch(request(), settings)).status, 503);
  }
});

test('enforces throttling before reaching the email provider', async () => {
  globalThis.fetch = () => { throw new Error('Must not send'); };
  const settings = env();
  settings.CONTACT_LIMITER.limit = async ({ key }) => {
    assert.equal(key, '192.0.2.1'); return { success: false };
  };
  const response = await worker.fetch(request(), settings);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
});

test('provider rejection and lost responses never report a successful send', async () => {
  globalThis.fetch = async () => Response.json({ message: 'private provider details' }, { status: 403 });
  let response = await worker.fetch(request(), env());
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('private provider details'), false);
  globalThis.fetch = async () => { throw new Error('private connection details'); };
  response = await worker.fetch(request(), env());
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('private connection details'), false);
});
