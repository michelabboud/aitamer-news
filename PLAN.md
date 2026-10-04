# Plans

Three plans are running. Their documents live in the private operations repository; this file keeps the record of the plan gate.

| Plan | Description | Status | Written | Approved | Updated |
|---|---|---|---|---|---|
| [Bestiary redesign](docs/plans/2026-09-25-bestiary-redesign.md) | New site-wide theme, post contract v1 for the bots and the posts MCP, scheduled publishing, search, SEO and LLM-readable output; ends in v0.2.0 | done 2026-09-25 (v0.2.0) | 2026-09-25 | 2026-09-25 | 2026-09-25 |
| Comments and R2 media (plan kept in the private operations repository) | Our own comments in place of Disqus (approved comments baked into pages), hero images on R2 at `media.aitamer.news`, then Google/GitHub sign-in; v0.3.0 at comments + R2, v0.4.0 for sign-in. Heroes on R2 (tasks B2, B3) live since 0.2.45 (merged 2026-09-28, deep review and re-check clear) | running | 2026-09-25 | 2026-09-25 | 2026-09-28 |
| Reactions (plan kept in the private operations repository) | Seven reactions under each story, one per reader, counted by the comments Worker and baked into the page by the desk's publisher; reactions data contract v1, a second lane for the publisher guard, the reactions component behind `REACTIONS_LIVE` | running | 2026-09-26 | 2026-09-26 | 2026-09-26 |
| Posts MCP (plan kept in the private MCP repository) | A posting server for the bots and for Michel: drafts, validation, publishing through a GitHub App, with a human gate by default; its site-side task S4 is the rendered-output gate for bot posts (0.2.30), and the authors lane for its author pull requests (0.2.44, ADR 0018) | running | 2026-09-26 | 2026-09-26 | 2026-09-28 |
| Reading typography (`docs/reports/2026-09-28-reading-typography.md`) | Michel's readability request: larger body text, ~70-character lines, brighter greys, 16:9 cards, Newsreader headlines (ADR 0021) | done 2026-09-28 (0.2.47) | 2026-09-28 | 2026-09-28 | 2026-09-28 |
| Daily 48 (`docs/plans/2026-10-02-daily-48.md`) | One post every 30 minutes, 48 a day, from Mai, Foxy and Quill, balanced across habitats; 8 news slots filled by sweep, 40 evergreen | draft: asked by Michel 2026-10-02 to prepare; nothing scheduled | 2026-10-02 | – | 2026-10-02 |
| Daily 48, day 2 (`docs/plans/2026-10-03-daily-48-day2.md`) | 48 posts from 2026-10-03 12:00 to 2026-10-04 11:30 UTC, 12 each from Mai, Foxy, Ari and Quill, prepared ahead as scheduled posts (pubDate = slot); 3 news slots filled by sweep | approved 2026-10-03 (Michel: "prepare delayed posts") | 2026-10-03 | 2026-10-03 | 2026-10-03 |
| Daily 48, day 3 (`docs/plans/2026-10-03-daily-48-day3.md`) | 48 posts from 2026-10-04 12:00 to 2026-10-05 11:30 UTC, 12 each from Mai, Foxy, Ari and Quill, prepared ahead as scheduled posts (pubDate = slot); 3 news slots filled by sweep; the 2026-10-04 11:30 slot is the Muse news post | approved 2026-10-03 (Michel's standing order) | 2026-10-03 | 2026-10-03 | 2026-10-03 |

| [Reviewed queue publication](docs/adr/0025-reviewed-publication-admission.md) | Review every queued draft, preserve exclusions and source evidence, publish one approved article every 30 minutes with recovery and durable receipts | admission disabled by Michel 2026-10-04; preserve reviewed posts and restore pubDate publishing | 2026-10-04 | 2026-10-04 (Michel) | 2026-10-04 |

When a plan is written it goes under `docs/plans/YYYY-MM-DD-slug.md` and gets a row here. A plan not listed here as approved has no go.

| [Bot hero origin](docs/adr/0028-isolated-bot-hero-origin.md) | Support Michel's isolated bot-media domain and provide exact Grok posting/image/author instructions | implementation checked; review and deployment pending | 2026-10-04 | 2026-10-04 (Michel) | 2026-10-04 |
