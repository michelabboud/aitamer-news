# Handoff

**Current source task:** [Prepared responsive images](docs/reports/2026-10-24-prepared-responsive-images.md), checkpoint0.2.114. Local news/template builds pass without FFmpeg or FFprobe; qualified variant upload and public readback pass. PR326successor adds bounded browser-test transport and a separate45secondChrome cold-start deadline; normal checks/merge and live acceptance remain pending. Authors/homepage PR324 merged at6573a324; deployment40031677299 and live eight-author/Michel-first/12→72five-batch acceptance passed, including exact old Michel route redirects.

**Previous source snapshot (superseded by the live acceptance above):** [Author directory and bounded homepage](docs/reports/2026-10-23-author-directory-home-feed.md), current-base checkpoint 0.2.111. Accepted main content is integrated and local qualification passes. PR324 still needs exact final source binding, hosted checks, normal merge and live deployment acceptance. Controlled measurements remain pinned to 0.2.110. Existing deployed author/image work remains live until that merge.

**Current handoff:** [Author profiles and security headers](docs/handoffs/2026-10-23-author-profiles-security-headers.md),2026-10-23.

**Where we are:**
1. Automatic analytics and deferred comment verification are deployed; Cloudflare HSTS/www redirect verified.
2. Canonical author profiles and headers source passes full production checks and Pages/browser probes;0.2.99 fixes the source review documentation finding.
3. The current review, hosted-check and live-deployment receipts are on [PR319](https://github.com/michelabboud/aitamer-news/pull/319); see the handoff for scope.

## Historical handoff snapshot

**Previous handoff note:** [`docs/handoffs/2026-10-11-quill-pr248-conflict-fix.md`](docs/handoffs/2026-10-11-quill-pr248-conflict-fix.md) (2026-10-11). The earlier [2026-10-03 publication handoff](docs/handoffs/2026-10-03-codex-handoff.md) remains as historical evidence.

**Previous task (historical):** PR 248 conflict repair at 0.2.86. Local validation passed; independent review, branch push/checkpoint and remote CI remain pending. Quill admission stays disabled; the coordinator owns the reviewed, checked PR merge. App activation is outside this task.

**Where we are (2026-09-25):**
1. The site is live on Cloudflare Pages; `main` deploys on every push. The GitHub Pages copy was retired on 2026-09-25 (its workflow is disabled).
2. The About-page contact form (0.1.5) posts to the `contact.aitamer.news` Worker; going live needs Email Routing, a first Worker deploy and the `CONTACT_TO` secret (see README).
3. Open work is in `BACKLOG.md`.
4. Version and history: `VERSION`, `CHANGELOG.md`.
