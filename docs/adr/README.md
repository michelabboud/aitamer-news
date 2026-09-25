# Decisions

- [Contact notes go out through Cloudflare Email](0001-contact-form-uses-cloudflare-email.md) — accepted 2026-09-25, **superseded by 0002** the same day: Cloudflare Pages rejects the `send_email` binding it relied on.
- [Contact notes go out through the Cloudflare Email REST API](0002-contact-form-sends-through-the-email-rest-api.md) — accepted 2026-09-25. The About form's Pages Function calls the Email Sending API with a scoped token; no Worker, no binding, no stored notes.
