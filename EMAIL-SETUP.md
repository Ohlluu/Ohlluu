# Contact email on Vercel

The website sends contact inquiries through `/api/contact`, a Vercel Function,
using Resend. The public form calls `https://ohlluu.vercel.app/api/contact` so
it also works while the custom domain is hosted on GitHub Pages. The recipient is fixed on the server as `info@ohlluudev.com`.
The visitor’s email becomes the reply-to address. No API key is published in
website JavaScript. Cloudflare is not needed.

## Finish setup

1. Verify `ohlluudev.com` in Resend (completed by the owner).
2. Create a Resend key with Sending access restricted to that domain.
3. In the Vercel **ohlluu** project, open Settings > Environment Variables.
   Add `RESEND_API_KEY` as a sensitive production variable using the private key.
   Add `EMAIL_FROM` with `Ohlluu Website <notifications@ohlluudev.com>`.
   Do not paste the API key into chat or commit it to Git.
4. Deploy this code to Vercel. The configuration uses `npm run build` to copy
   public assets into `public/`, while Vercel separately bundles `api/contact.mjs`.
5. Submit a clearly labelled test from the website. Check Resend delivery status
   and receipt at `info@ohlluudev.com`, and confirm that Reply addresses the visitor.

Allowed origins: `https://ohlluu.vercel.app`, `https://ohlluudev.com`, and
`https://www.ohlluudev.com`. No changes to DNS or the mailbox are required.
The receiving mailbox must already exist; Resend does not create it.

## Behavior

The form keeps entered details after failures and reuses its request ID on retries
for unchanged content. Resend uses that ID to prevent duplicate delivery within
its 24-hour idempotency window. Success means Resend accepted the message; inbox
placement must be confirmed separately. The endpoint does not send visitor
autoresponses, store messages in a database, or create newsletter subscriptions.

Basic spam protection includes a honeypot, exact origin checks, bounded inputs,
and a five-attempts-per-minute local IP limiter. Local counters are per running
instance and reset on cold starts, so this is not a globally enforced limit.
Vercel Firewall rules can provide shared limits if needed; review their plan
availability before enabling any paid feature.

The former blog newsletter form used the cancelled service and is now an email
link. The minified JavaScript is regenerated alongside its source.

## Checks

Run `npm test` and `npm run build`. Tests mock email provider calls and send no
real messages. Until the environment variables are added, the endpoint returns a
clear setup error instead of falsely reporting success.
