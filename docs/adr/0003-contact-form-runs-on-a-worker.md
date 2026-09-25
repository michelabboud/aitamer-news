# The contact form runs on its own Worker

Supersedes [0002](0002-contact-form-sends-through-the-email-rest-api.md).

## Context

Decision 0002 kept the form inside the Pages project: a Pages Function called the Email Sending REST API with a scoped API token. Its deep review found no secret leaks, but Michel rejected it on abuse grounds (2026-09-25): a Pages Function cannot use the Workers rate-limit binding, so anyone could script the public endpoint and flood the desk inbox, and the design held a long-lived API token that could send mail as the domain. He asked for either a third-party form service or a Worker.

## Decision

The form posts to a dedicated Worker, `aitamer-contact`, served on its own custom domain, `https://contact.aitamer.news/` (`workers/contact/`). The Pages project is static files only; it has no `functions/` directory.

In order, cheapest first, the Worker:

1. Allows only `POST /`. Every other path is 404, and `workers.dev` and preview URLs are off.
2. Rejects browsers on other websites (`Origin` allowlist: the site, `www`, the GitHub Pages copy). Local origins are accepted only when `ALLOW_LOCAL_ORIGINS=true`, which lives in the git-ignored `workers/contact/.dev.vars` and is never deployed.
3. Refuses a missing or larger than 32 KB body (411/413) before reading it.
4. Rate-limits with the Workers rate-limit binding: 5 notes a minute per IP and 30 a minute site-wide (429). If either binding is missing, it fails closed (503).
5. Parses and cleans the fields: strips control characters, keeps names to one line, and refuses addresses with quotes, brackets or separators. It also checks lengths and the honeypot.
6. Verifies Cloudflare Turnstile when `TURNSTILE_SECRET_KEY` is set (the matching public site key is `TURNSTILE_SITE_KEY` in `src/lib/site.ts`).
7. Sends through the `send_email` binding, restricted to the sender `desk@aitamer.news`, to the secret `CONTACT_TO`.

There is no API token in this design. The binding authorises the send, and the only secrets are the recipient and the optional Turnstile key, both Worker secrets that the site build never sees (`npm run check:dist`).

## Alternatives rejected

- **0002, the Pages Function with the REST API.** It has no rate-limit binding, and it holds a token that can send mail.
- **A Worker route at `aitamer.news/api/contact`.** It keeps the form same-origin, but Cloudflare's documentation does not say whether a Worker route runs ahead of a Pages custom domain on the same hostname. A custom domain on its own hostname does not depend on that.
- **A third-party form service, or Michel's own servers.** Both work. A form service puts another company between readers and the desk, and a server of our own adds a machine to run and patch. The Worker costs nothing on the free plan: 100,000 requests a day, and sends to a verified destination are free.

## Consequences

- There are two deploys: Pages (on every push to `main`) and the Worker (`.github/workflows/deploy-contact-worker.yml`, only when `workers/contact/**` changes).
- **The CI token needs more permissions.** Besides Pages, it needs Workers Scripts: Edit and Workers custom domains on the `aitamer.news` zone. The first deploy may fail until that is granted, or until Michel runs `npx wrangler deploy --config workers/contact/wrangler.toml` once after `wrangler login`.
- **The free plan might not include the rate-limit binding.** The docs do not say. If the deploy rejects it, the fallback is a WAF rate-limiting rule on `contact.aitamer.news`.
- **The limits are approximate.** Counters are kept per Cloudflare location and keyed by IP, so people behind a shared IP share an allowance. They stop floods, not a patient person; Turnstile covers bots.
- The live form needs Email Routing on `aitamer.news`, a verified destination, the `CONTACT_TO` secret, and the Worker deployed. Until then a post answers "Contact is not set up yet." or fails to connect.

## Status

Accepted 2026-09-25.
