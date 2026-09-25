# Backlog

Dated one-liners for everything deferred or spotted and not done. Format: `date · source · status — item`.

- 2026-09-25 · contact form · open — Onboard `aitamer.news` to Cloudflare Email Routing, verify the receiving inbox, and set the `CONTACT_TO` Pages secret. Until then the form answers "Contact is not set up yet." (needs Michel's Cloudflare account).
- 2026-09-25 · deep review B1 · BLOCKING, open — Cloudflare Pages rejects `send_email` in `wrangler.toml` (reproduced with Wrangler 4.139.0). The form cannot send as designed; choose a new sending path (separate Worker on the `/api/contact` route, or Pages Function → service binding → Worker), write the superseding ADR, fix ARCHITECTURE/CHANGELOG. Work is held on `feat/contact-form`, not on `main`.
- 2026-09-25 · deep review I1 · open — Add a Cloudflare rate-limit rule (or Turnstile) on `/api/contact`; the origin check stops browsers, not scripts.
- 2026-09-25 · contact form · idea — Add Cloudflare Turnstile if the honeypot stops being enough; needs a widget created in the account.
- 2026-09-25 · maintenance · open — Log in Wrangler on this machine (`wrangler login`) so live Pages settings can be read (`wrangler pages download config aitamer-news`) and compared with `wrangler.toml`.
