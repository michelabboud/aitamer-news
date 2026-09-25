# Decisions

- [Contact notes go out through Cloudflare Email](0001-contact-form-uses-cloudflare-email.md) — accepted 2026-09-25, **superseded by 0002**: Cloudflare Pages rejects the `send_email` binding it relied on.
- [Contact notes go out through the Cloudflare Email REST API](0002-contact-form-sends-through-the-email-rest-api.md) — accepted 2026-09-25, **superseded by 0003**: a Pages Function cannot rate-limit, and it held a send-capable API token.
- [The contact form runs on its own Worker](0003-contact-form-runs-on-a-worker.md) — accepted 2026-09-25. `contact.aitamer.news` validates, rate-limits (per IP and site-wide), optionally checks Turnstile, and sends through the `send_email` binding; no API token, no stored notes.
