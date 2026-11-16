import handler from '../lib/contact.mjs';
import { localLimiter } from '../lib/contact-limiter.mjs';

export default {
  fetch(request) {
    // Vercel supplies the visitor's IP. Normalize it for the shared handler.
    const headers = new Headers(request.headers);
    headers.set('CF-Connecting-IP', request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown');
    return handler.fetch(new Request(request, { headers }), {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      CONTACT_LIMITER: localLimiter,
    });
  },
};
