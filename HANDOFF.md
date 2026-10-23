# Handoff

**Current handoff:** [Author profiles and security headers](docs/handoffs/2026-10-23-author-profiles-security-headers.md),2026-10-23.

**Where we are:**
1. Automatic analytics and deferred comment verification are deployed; Cloudflare HSTS/www redirect verified.
2. Canonical author profiles and headers candidate0.2.98 passes full local production checks and Pages/browser probes.
3. Independent review, hosted checks and live acceptance remain pending; see the current handoff.

## Historical handoff snapshot

**Previous handoff note:** [`docs/handoffs/2026-10-11-quill-pr248-conflict-fix.md`](docs/handoffs/2026-10-11-quill-pr248-conflict-fix.md) (2026-10-11). The earlier [2026-10-03 publication handoff](docs/handoffs/2026-10-03-codex-handoff.md) remains as historical evidence.

**Previous task (historical):** PR 248 conflict repair at 0.2.86. Local validation passed; independent review, branch push/checkpoint and remote CI remain pending. Quill admission stays disabled; the coordinator owns the reviewed, checked PR merge. App activation is outside this task.

**Where we are (2026-09-25):**
1. The site is live on Cloudflare Pages; `main` deploys on every push. The GitHub Pages copy was retired on 2026-09-25 (its workflow is disabled).
2. The About-page contact form (0.1.5) posts to the `contact.aitamer.news` Worker; going live needs Email Routing, a first Worker deploy and the `CONTACT_TO` secret (see README).
3. Open work is in `BACKLOG.md`.
4. Version and history: `VERSION`, `CHANGELOG.md`.
