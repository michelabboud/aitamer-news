# Decisions

- [Contact notes go out through Cloudflare Email](0001-contact-form-uses-cloudflare-email.md) — accepted 2026-09-25, **superseded by 0002**: Cloudflare Pages rejects the `send_email` binding it relied on.
- [Contact notes go out through the Cloudflare Email REST API](0002-contact-form-sends-through-the-email-rest-api.md) — accepted 2026-09-25, **superseded by 0003**: a Pages Function cannot rate-limit, and it held a send-capable API token.
- [The contact form runs on its own Worker](0003-contact-form-runs-on-a-worker.md) — accepted 2026-09-25. `contact.aitamer.news` validates, rate-limits (per IP and site-wide), optionally checks Turnstile, and sends through the `send_email` binding; no API token, no stored notes.
- [The post contract rejects unknown fields](0004-post-contract-is-strict.md) — accepted 2026-09-25. Every nested object and the top-level post schema are `.strict()`, so a misspelled or retired frontmatter field fails the build naming the file instead of vanishing silently.
- [The deploy has a file budget, and search stays full-text over every story](0005-deploy-file-budget.md) — accepted 2026-09-25: about three deploy files per post; CI warns at 16,000 and fails at 19,500 of the free plan's 20,000; heroes move to R2 first.
