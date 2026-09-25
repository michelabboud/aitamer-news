# Changelog

All notable changes to aitamer.news. The version lives in `VERSION`; each task is tagged `checkpoint/<VERSION>`.

## [0.1.9] — 2026-09-25

### Added
- Post contract v1: optional `heroAlt`, `specimen`, `wildness` (`rating` 1–5, `verified`, `claimed`), `verdict`, `sunset` (`date`, `what`, `replacement`), `video` (a YouTube ID, title, channel), `corrections` (dated list) and `withdrawn` (`date`, `reason`). All documented in `POST.md` as the contract the ops bots, the posts tool and human editors write against. Nothing renders them yet.
- A withdrawn post keeps its page (`getPostPages`) but leaves every list and feed (`getPublishedPosts`). `getSunsetPosts()` lists sunsets soonest first.
- `src/lib/wildness.ts` and `src/lib/specimen.ts`, with 4 tests.

## [0.1.8] — 2026-09-25

### Added
- The retired desk URLs keep working: `/section/top/`, `/image/`, `/video/`, `/data/` and `/databases/` send readers to the habitat that absorbed them. Cloudflare answers with a 301 from `public/_redirects`; the built page itself is a noindex redirect with the right canonical, for any host that ignores that file. They are left out of the sitemap.
- 2 tests for the redirect page (content and escaping).

## [0.1.7] — 2026-09-25

### Changed
- Seven habitats replace the ten desks: Models (H1), Tools (H2), Creative (H3), Infra (H4), Rust (H5), Policy (H6), Opinion (H7), defined once in `src/lib/habitats.ts`. Image and Video folded into Creative, Data and Databases into Infra, and the one Top post (the welcome note) moved to Opinion. The schema rejects the retired values so an out-of-date bot fails loudly.
- Fallback covers: `image.svg` became `creative.svg`, `databases.svg` became `infra.svg`; the `top`, `video` and `data` covers are gone.

### Added
- 4 tests for the habitat list, the legacy mapping, and the sitemap filter the redirect pages will use.

## [0.1.6] — 2026-09-25

### Added
- Plan `docs/plans/2026-09-25-bestiary-redesign.md`: the Bestiary theme site-wide, post contract v1 (habitat, specimen number, Wildness, verdict, sunset, video, corrections, withdrawn), scheduled publishing, search, SEO, and LLM-readable output. Ends in release 0.2.0.
- Dependency vetting for Pagefind: `docs/reports/2026-09-25-pagefind-vetting.md`.

### Changed
- The GitHub Pages copy is retired: the `Deploy GitHub Pages` workflow is disabled (not deleted).
- The Big Top theme is preserved on branch `archive/big-top-theme` (commit 29e1453).

## [0.1.5] — 2026-09-25

### Added
- About page redesign: how a story gets here (the seven-step bot pipeline: seek, sort, research, legal, write, art, publish), what the Human and AI badges mean, and the contact form. The copy no longer claims a human reviews every story. "Contact" joins the footer.
- Contact Worker `aitamer-contact` on `https://contact.aitamer.news/` (`workers/contact/`). In order, it checks:
  - the page's origin (allowlist);
  - body size (32 KB at most, before reading);
  - rate limits (5 notes a minute per IP, 30 site-wide; it fails closed without them);
  - the fields, cleaned (control characters stripped, strict addresses);
  - Turnstile, when enabled.

  It then sends through the `send_email` binding, which can only send from `desk@aitamer.news`. There is no API token and nothing is stored. Decision: `docs/adr/0003-contact-form-runs-on-a-worker.md`, which supersedes 0001 and 0002.
- Workflow `deploy-contact-worker.yml`. It deploys the Worker only when `workers/contact/**` changes.
- `npm run check:dist`, which fails CI if a secret name or a known secret value appears in the static build. Both site deploys run it after building.
- `npm run dev:contact`, which runs the Worker locally. `PUBLIC_CONTACT_ENDPOINT` points a local build at it.
- Tests:
  - 18 for the Worker: rate limits (IPv6 counted per /64), fail-closed, size limits, cleaning (names cannot carry address syntax), Turnstile, origins, 404s, and that the entry module exports only the handler.
  - 6 for the secret check.
- `package-lock.json` is committed.

### Changed
- Post cards have more room between and inside them: the grid gap grows with the screen (28 to 44px), and the padding is larger.
- The privacy and terms pages describe what the form sends, including the per-IP rate count, which is not kept.

### Notes
- Two earlier designs never reached `main`:
  - A Pages Function with a `send_email` binding. Pages rejects it at deploy time.
  - A Pages Function calling the Email REST API with a token. It had no rate limiting.

## [0.1.4] — 2026-09-25

### Fixed
- Desk pages showed the row of desk pills twice (once in the header, once under the title). The header row alone remains and marks the current desk.
- A month archive page with no neighbouring month no longer renders an empty "Other months" navigation.
- `POST.md` no longer says the schema enforces `heroImage`; the posting standards do.

## [0.1.3] — 2026-09-25

### Changed
- CI runs on Node 24 (`.nvmrc` too). Node 22.12+ still works locally.
- Latest stable GitHub Actions: `checkout` v7, `setup-node` v7, `cache` v6, `upload-pages-artifact` v5, `deploy-pages` v5, and `cloudflare/wrangler-action` v4.1.3, pinned to its commit because it holds the Cloudflare token. The Cloudflare deploy now uses Wrangler 4.139.0 (it was Wrangler 3). Vetting: `docs/reports/2026-09-25-ci-actions-upgrade.md`.

## [0.1.2] — 2026-09-25

### Added
- Archive by month: `/archive/` (every month, grouped by year), `/archive/<year>/` (each month with its latest headlines) and `/archive/<year>/<month>/` (every story that month, with links to the neighbouring months). Months follow the UTC publish time. Past months are reused by the incremental build unless one of their posts changes.
- "Archive" in the header and footer; an article's byline date links to its month.
- `POST.md` — how a post works end to end: file and slug, frontmatter, hero image, publishing and the publish time, what CI does, where a post appears, and a pre-merge checklist.
- `src/lib/archive.ts` with tests; `npm test` now also runs TypeScript tests (Node's `--experimental-strip-types`, checked on Node 22.23.3 and 24.20.0).

### Fixed
- The `## [0.1.0]` heading in this changelog, dropped by the 0.1.1 edit.
- `package.json` description kept its em dash instead of a `\u2014` escape.

## [0.1.1] — 2026-09-25

### Added
- Publish times. Every published post now stores a full UTC time in `pubDate` (e.g. `2026-09-23T17:51:26Z`). `npm run stamp` writes it: the time the post first went live according to git, or now for a post published but not yet committed. The frontmatter date always wins; a time on another day falls back to 00:00 UTC and is listed for an editor.
- `npm run check:times` — fails when a published post has a date but no time. Both deploy workflows run it, with `npm test`, before building.
- Article bylines show the publish time in UTC ("Sep 23, 2026, 17:51 UTC"); RSS items carry the time.

### Changed
- The 25 published posts were stamped from git history. Posts published together keep the same time; their order is now fixed by post id instead of being arbitrary.

## [0.1.0] — 2026-09-25

Baseline. Versioning starts here; everything before it is in `git log` (commits up to `63e4065`).

### Added
- Standard repository files: `VERSION`, `CHANGELOG.md`, `PROGRESS.md`, `ARCHITECTURE.md`, `PLAN.md`, `HANDOFF.md`, `BACKLOG.md`, `.env.example`, `LICENSE` (all rights reserved).
