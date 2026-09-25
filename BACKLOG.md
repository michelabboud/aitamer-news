# Backlog

Dated one-liners for everything deferred or spotted and not done. Format: `date · source · status — item`.

- 2026-09-25 · contact form · open — Onboard `aitamer.news` to Cloudflare Email Routing, verify the receiving inbox, and set the `CONTACT_TO` Pages secret. Until then the form answers "Contact is not set up yet." (needs Michel's Cloudflare account).
- 2026-09-25 · contact form · open — Confirm on the first production deploy that Cloudflare Pages accepts the `send_email` binding; only local `wrangler pages dev` has proven it.
- 2026-09-25 · contact form · idea — Add Cloudflare Turnstile if the honeypot stops being enough; needs a widget created in the account.
- 2026-09-25 · maintenance · open — Log in Wrangler on this machine (`wrangler login`) so live Pages settings can be read (`wrangler pages download config aitamer-news`) and compared with `wrangler.toml`.
