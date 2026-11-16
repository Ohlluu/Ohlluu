const ORIGINS = new Set(['https://ohlluudev.com', 'https://www.ohlluudev.com', 'https://ohlluu.vercel.app']);
const RECIPIENT = 'info@ohlluudev.com';
const MAX_BYTES = 16_000;

function reply(origin, status, value, extra = {}) {
  return Response.json(value, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
      ...(ORIGINS.has(origin) ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      } : {}),
      ...extra,
    },
  });
}

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw new Error('size');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('json');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function field(input, key, max, required = false) {
  const value = input[key] ?? '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new Error(key);
  }
  return value.trim();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (!['/contact', '/api/contact'].includes(new URL(request.url).pathname)) return reply(origin, 404, { error: 'Not found.' });
    if (!ORIGINS.has(origin)) return reply(origin, 403, { error: 'Please use the contact form on ohlluudev.com.' });
    if (request.method === 'OPTIONS') return reply(origin, 200, { ok: true });
    if (request.method !== 'POST') return reply(origin, 405, { error: 'Method not allowed.' }, { Allow: 'POST, OPTIONS' });
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
      return reply(origin, 415, { error: 'Please submit the website contact form.' });
    }
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.CONTACT_LIMITER) {
      return reply(origin, 503, { error: 'Please email info@ohlluudev.com directly while the contact form is being connected.' });
    }
    try {
      const { success } = await env.CONTACT_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!success) return reply(origin, 429, { error: 'Please wait a minute before sending another message.' }, { 'Retry-After': '60' });
    } catch {
      return reply(origin, 503, { error: 'The contact form is temporarily unavailable. Please email info@ohlluudev.com.' });
    }
    let input;
    try {
      input = await readBody(request);
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('json');
    } catch (error) {
      return reply(origin, error.message === 'size' ? 413 : 400, { error: 'Please check your message and try again.' });
    }
    if (input._company_site) return reply(origin, 400, { error: 'Please check your message and try again.' });
    let values;
    try {
      values = {
        name: field(input, 'name', 120, true),
        email: field(input, 'email', 254, true),
        phone: field(input, 'phone', 60, true),
        company: field(input, 'company', 200),
        website: field(input, 'website', 500),
        budget: field(input, 'budget', 100),
        service: field(input, 'service', 100),
        message: field(input, 'message', 6000, true),
        requestId: field(input, 'requestId', 36, true),
      };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || /[\r\n]/.test(values.name)) throw new Error('email');
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(values.requestId)) throw new Error('requestId');
    } catch {
      return reply(origin, 400, { error: 'Please check your name, email, phone number, and project details.' });
    }
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `ohlluu-contact-${values.requestId}`,
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [RECIPIENT],
          reply_to: values.email,
          subject: `Website inquiry from ${values.name}`,
          text: [
            `Name: ${values.name}`, `Email: ${values.email}`, `Phone: ${values.phone}`,
            `Company: ${values.company || 'Not provided'}`, `Website: ${values.website || 'Not provided'}`,
            `Budget: ${values.budget || 'Not provided'}`, `Service: ${values.service || 'Not provided'}`,
            '', 'Project details:', values.message,
          ].join('\n'),
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        console.error('Contact email provider rejected request:', response.status);
        return reply(origin, 502, { error: 'Your message could not be sent. Please try again or email info@ohlluudev.com.' });
      }
      return reply(origin, 200, { ok: true });
    } catch {
      return reply(origin, 502, { error: 'We could not confirm delivery. Please retry or email info@ohlluudev.com.' });
    }
  },
};
