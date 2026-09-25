# Contact notes go out through the Cloudflare Email REST API

Supersedes [0001](0001-contact-form-uses-cloudflare-email.md).

## Context

Decision 0001 sent contact notes through a `send_email` binding declared in `wrangler.toml`, which also made that file the Pages project configuration. The deep review of that work (`docs/reviews/2026-09-25-contact-form-deep-review.md`, finding B1) showed that Cloudflare Pages rejects it: `wrangler pages deploy` fails with `Configuration file for Pages projects does not support "send_email"`. Local `pages dev` and `pages functions build` accept it, which hid the problem. Merging would have stopped every deploy of the site.

Michel ruled out a separate Worker (2026-09-25): the site stays one Pages project.

## Decision

`functions/api/contact.js` stays a Pages Function on `POST /api/contact`. It sends the note with one HTTPS call to the Email Sending REST API, `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/email/sending/send` (`functions/contact-send.mjs`), with a Cloudflare API token in the `Authorization` header.

- The token is the Pages secret `CF_EMAIL_API_TOKEN`, scoped to **Email Sending: Edit** and nothing else.
- The recipient is the Pages secret `CONTACT_TO`, a verified Email Routing destination. Sending to a verified destination is free on every plan.
- The account id is not a secret; it defaults to the account in the deploy workflow and can be overridden with `CF_ACCOUNT_ID`.
- `wrangler.toml` goes back to not being Pages configuration, so dashboard settings and secrets stay the source of truth.
- The static build never sees either secret. `npm run check:dist` fails CI if a secret name, a bearer header, the API address, or a known secret value appears in `dist/`.

## Alternatives rejected

- **A separate Worker holding the `send_email` binding** (on `aitamer.news/api/contact`, or called through a Pages service binding). It works, and it avoids an API token, but it adds a second deployable and a second config. Michel chose one Pages project.
- **SMTP submission** to `smtp.mx.cloudflare.net`. Pages Functions cannot open raw TCP to port 465 as simply as they can call `fetch`, and it needs the same token.
- **A third-party form host.** Rejected in 0001 for the same reason: another company stores the note.

## Consequences

- A leaked `CF_EMAIL_API_TOKEN` lets someone send mail from `aitamer.news`. Keep its scope to Email Sending only, never reuse the deploy token, and rotate it if exposed.
- Until the domain is onboarded to Email Routing, the destination is verified, and both secrets are set, the form answers "Contact is not set up yet." (503) and does not pretend the note was sent.
- API failures, bounces, and timeouts (10 seconds) return 502 to the visitor. The log records Cloudflare's error codes, never the token or the note.
- Abuse limits are still the origin check and the honeypot. Cloudflare Turnstile and a WAF rate-limiting rule on `/api/contact` are the next layer (BACKLOG).

## Status

Accepted 2026-09-25.
