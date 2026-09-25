# Changelog

All notable changes to aitamer.news. The version lives in `VERSION`; each task is tagged `checkpoint/<VERSION>`.

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
