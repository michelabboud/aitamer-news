# Handoff

**Current handoff note:** [`docs/handoffs/2026-10-11-quill-pr248-conflict-fix.md`](docs/handoffs/2026-10-11-quill-pr248-conflict-fix.md) (2026-10-11). The earlier [2026-10-03 publication handoff](docs/handoffs/2026-10-03-codex-handoff.md) remains as historical evidence.

**Current task:** PR 248 conflict repair at 0.2.86. Local validation passed; independent review, branch push/checkpoint and remote CI remain pending. Quill admission stays disabled; the coordinator owns the reviewed, checked PR merge. App activation is outside this task.

**Where we are (2026-09-25):**
1. The site is live on Cloudflare Pages; `main` deploys on every push. The GitHub Pages copy was retired on 2026-09-25 (its workflow is disabled).
2. The About-page contact form (0.1.5) posts to the `contact.aitamer.news` Worker; going live needs Email Routing, a first Worker deploy and the `CONTACT_TO` secret (see README).
3. Open work is in `BACKLOG.md`.
4. Version and history: `VERSION`, `CHANGELOG.md`.
