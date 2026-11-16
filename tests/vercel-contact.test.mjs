import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import endpoint from '../api/contact.mjs';
import { allowContact } from '../lib/contact-limiter.mjs';

const originalFetch = globalThis.fetch;
const oldKey = process.env.RESEND_API_KEY;
const oldFrom = process.env.EMAIL_FROM;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
  if (oldFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = oldFrom;
});

test('Vercel entry point accepts the production origin and keeps the recipient fixed', async () => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'Ohlluu Website <notifications@ohlluudev.com>';
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body).to, ['info@ohlluudev.com']);
    return Response.json({ id: 'test' });
  };
  const response = await endpoint.fetch(new Request('https://ohlluu.vercel.app/api/contact', {
    method: 'POST', headers: { Origin: 'https://ohlluu.vercel.app', 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.99' },
    body: JSON.stringify({ name: 'Visitor', email: 'visitor@example.com', phone: '555-0100', message: 'Test', requestId: '94383ccd-0806-4606-bcc5-961b82bb54cf' }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('local throttling blocks the sixth attempt and resets after the window', () => {
  for (let i = 0; i < 5; i++) assert.equal(allowContact('limiter-test', 1000), true);
  assert.equal(allowContact('limiter-test', 1000), false);
  assert.equal(allowContact('other-visitor', 1000), true);
  assert.equal(allowContact('limiter-test', 61_001), true);
});
