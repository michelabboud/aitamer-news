# Changelog

All notable changes to aitamer.news. The version lives in `VERSION`; each task is tagged `checkpoint/<VERSION>`.

## [0.1.23] — 2026-09-25

### Changed
- **Licensing** (Michel): the code is now under the Apache License 2.0 (`LICENSE`, the official text; `NOTICE`; `package.json` `"license": "Apache-2.0"`). The articles, author pages, specimen ledger, artwork and the AI Tamer name stay all rights reserved, listed in `LICENSE-CONTENT.md`. Before, everything was proprietary.

### Removed
- 28 stale branches on GitHub (design experiments, early post drafts, image-upload tooling, merged feature branches), ahead of the repo going public. A verified git bundle of all 28 is kept outside the repo. Remaining: `main`, `archive/big-top-theme`, and `feat/bestiary` (the theme's source, cited in the docs).

## [0.1.22] — 2026-09-25

### Changed
- Links to other sites open in a new tab, so aitamer.news stays open behind them (Michel). Links within the site keep the normal behaviour, so Back still works; `aitamer.news` and `www.aitamer.news` count as one site. Each external link carries `rel="noopener noreferrer"` and a screen-reader note "(opens in a new tab)". Sources and the YouTube link have it in the HTML; links in story text and search results get it from a small script in the layout (search results on click, since they appear later).

## [0.1.21] — 2026-09-25

### Changed
- The sitemap leaves out withdrawn posts, scheduled posts not yet live, and the search page, and gives each post its real last-changed date (newest of publish, update and correction). Read at config time by `scripts/sitemap-data.mjs` with the shared YAML reader. 3 tests. Fixes the sitemap half of deep-review finding B4.
- Docs describe the Bestiary, not Big Top: README design notes, ARCHITECTURE (routes, machine-readable endpoints, styling, SEO, third parties), PROGRESS. BACKLOG gains the night-palette covers, the Worker error page's colours, news-sitemap freshness, the newsletter, and the R2 move before ~8,000 posts.

## [0.1.20] — 2026-09-25

### Added
- Site search (lane C3): Pagefind 1.5.2 indexes the story pages after every build (`pagefind --site dist`; 25 pages, 41 index files), and `/search/` searches them in the reader's browser, styled to the theme, with results filterable by habitat. The home masthead has a real search box (Cmd/Ctrl+K focuses it); "Search" is in the station bar, the phone menu and the footer. The search page is `noindex`. Withdrawn posts are never indexed. Vetting: `docs/reports/2026-09-25-pagefind-vetting.md`; `npm audit`: 0 vulnerabilities.

## [0.1.19] — 2026-09-25

### Fixed
- The specimen and time stampers (lane F1, fixing deep-review findings B1, B2, B3, B6 and minors M1, M2, M5, M6):
  - Post headers are read with a real YAML parser (`js-yaml` 4.3.2, the same parser and version Astro uses, so the scripts and the build never disagree; vetting: `docs/reports/2026-09-25-yaml-vetting.md`), shared in `scripts/frontmatter.mjs`. A commented `draft: true   # …` line, `True`, quoted values, flow-style or unindented `sources`, CRLF and a BOM are all read correctly.
  - A stamp run checks everything and computes every file first, then appends the ledger, then writes the posts atomically; one bad post stops the run with nothing written. An interrupted run is repaired by the next one.
  - Number collisions between branches have a legal append-only repair: a `void:` ledger line (`POST.md` §4). The check now reports a number or slug issued twice and a voided number reused.
  - Text containing `$$`, `$'` or `$&` can no longer be corrupted by a stamp.
  - `check:posts` also enforces the slug rule on file names.
- `due-posts` skips a post it cannot read instead of stopping the hourly publish.

### Added
- `.github/workflows/check-posts.yml`: tests and `check:posts` on every pull request and every push to a branch other than `main`, with read-only permissions and no secrets.
- 30 tests, including a real two-branch collision repaired end to end, and a check that `public/_redirects` matches the retired sections.

## [0.1.18] — 2026-09-25

### Changed
- **The post contract is strict** (lane F2, fixing deep-review finding B5): an unknown or misspelled field, top-level or nested, fails the build naming the file. Dates in `sunset`, `corrections` and `withdrawn` accept only a YAML date, `YYYY-MM-DD` or a UTC ISO timestamp; `heroImage` must be `/heroes/<slug>.jpg` or an `https://` URL; the Wildness bounds come from `src/lib/wildness.ts`. Decision: `docs/adr/0004-post-contract-is-strict.md`.
- The schema no longer imports Astro, so it is tested directly (24 tests); `content.config.ts` attaches the author reference. `SITE` moved to `src/lib/site-meta.ts`.

### Added
- The contract is versioned: the JSON Schema carries `"x-contract-version": 1` and is also served at `/contract/v1/post.schema.json`. `POST.md` documents both.

## [0.1.17] — 2026-09-25

### Added
- Google News sitemap `/news-sitemap.xml` (stories from the 48 hours before the build, as Google News requires), listed in `robots.txt`. It is as fresh as the last deploy. 3 tests.
- `max-image-preview:large` on indexable pages (large previews in Google Discover), a schema.org WebSite block on the home page, and `<link rel="alternate">` for the JSON feed and `llms.txt` on every page.

### Changed
- Privacy page: the GitHub Pages copy is gone from the copy; YouTube embeds are described (nothing loads until play, then youtube-nocookie.com).
- Home counts say "bots on the desk", not "on shift" (the number is authors, not a live status).

## [0.1.16] — 2026-09-25

### Changed
- **The Bestiary theme is live site-wide** (plan batch B). Night field-station palette, Gloock / Hanken Grotesk / IBM Plex Mono, the station bar with a live UTC clock, the habitat strip, and a phone tab bar (Log, Habitats, Extinction, Campfire). Every page moved: home (masthead with real counts, latest catch, field log, Extinction Watch panel, new specimens, tamers, campfire, report card), posts, habitats, the habitat index at `/section/`, authors, the archive and About. Ported from the Claude Design hand-off branch `feat/bestiary` (9e51549) and rewired to post contract v1: habitats from `src/lib/habitats.ts`, stored specimen numbers, nested Wildness. The Big Top theme is kept on branch `archive/big-top-theme`.
- The post page renders the whole contract: specimen tag, Wildness with what is verified and what is only claimed, the Tamer's verdict, a sunset notice, dated corrections (newest first), and cover-art alt text from `heroAlt`. A **withdrawn** post keeps its URL but shows only its title and the withdrawal notice, with `noindex`, no body and no comments.
- "Report a sighting" and "rating wrong?" links start the contact note ("Sighting report: ", "Correction: "). Client-side only; the contact Worker is unchanged and the form markup is byte-identical.

### Added
- `/extinction-watch/` (every shutdown, upcoming first, days recounted in the browser) and `/campfire/` (every sighting with its live Disqus count).
- YouTube videos (`video` field) load only when the reader presses play: no request to YouTube before that, then the privacy-enhanced player. VideoObject structured data for search.
- SEO on every post: schema.org NewsArticle (author, publisher, citations from `sources`, specimen as identifier) and BreadcrumbList, `article:published_time` / `modified_time`.
- `src/lib/bestiary.ts` (habitat display, Wildness legend, Extinction Watch) with 4 tests; `docs/bestiary.md` describes the theme.

### Removed
- `src/styles/big-top-tokens.css` and the desk-chip component.

## [0.1.15] — 2026-09-25

### Added
- Machine-readable site (lane L3): `/llms.txt` (llmstxt.org format: how to read the site, habitats, feeds, the newest 50 sightings), `/feed.json` (JSON Feed 1.1 with an `_aitamer` extension carrying specimen, habitat, Wildness, verdict and sunset), and `/contract/post.schema.json`, the post contract as JSON Schema generated from the same schema the build validates with (moved to `src/content/post-schema.ts`). atn-mcp validates against it. 13 tests.

### Changed
- RSS is capped to the newest 50 posts (a feed of 10,000 would be megabytes) and its categories use habitat names.
- `npm test` finds test files by pattern (`scripts/*.test.mjs`, `src/lib/*.test.ts`, `workers/contact/test/*.test.mjs`) instead of a hand-kept list, so a new test file can't be forgotten and parallel work no longer conflicts on that line.

## [0.1.14] — 2026-09-25

### Added
- Scheduled and delayed posts (lane L2): a post with a future `pubDate` stays off the site until a build runs after that time (`src/lib/schedule.ts`). `scripts/due-posts.mjs` finds posts that fell due in the last two hours, and `.github/workflows/scheduled-publish.yml` checks hourly (minute 7) and triggers the deploy only when something is due. `POST.md` §4 explains scheduling. 13 tests.

## [0.1.13] — 2026-09-25

### Added
- Field data for the 25 published posts (lane L1): Wildness (`rating`, `verified`, `claimed`) and a Tamer's verdict on 24 posts, sunsets on the two shutdown stories. Drafted by the Claude Design hand-off session, converted to contract v1 and checked against each post's own sources; the welcome note gets no rating and a neutral verdict. Review table: `docs/reviews/2026-09-25-field-data-drafts.md` (awaiting editorial review).

## [0.1.12] — 2026-09-25

### Changed
- Repo prepared to go public (lane L4): docs no longer describe the retired GitHub Pages copy as live; `docs/big-top.md` is a short archive note without the private path; the public `docs/posting-standards.md` is now an editorial-standards page (sourcing, numbers, Wildness, corrections, withdrawal, bylines, generated art), and the internal newsroom version moved to the private ops repo; the Desk Bot bio matches practice (a human editor reviews when the desk's confidence is low).

### Removed
- `.github/workflows/decode-heroes.yml` (obsolete, write-capable) and the internal draft fixture post.

## [0.1.11] — 2026-09-25

### Changed
- Plan: the theme built by an earlier Claude Design hand-off (branch `feat/bestiary`) is reused and ported onto this plan's post contract; the work is split into five parallel lanes with fixed file ownership (plan §9).

## [0.1.10] — 2026-09-25

### Added
- Specimen numbers: `npm run stamp` now also gives every published post a permanent number (`specimen: N`) and records it in the append-only `src/content/specimen-ledger.txt`, so a number is never reissued, even after a post is withdrawn or deleted. The 25 published posts are numbered 0001–0025 in publish order.
- `npm run check:posts` (times + specimens + sources) replaces `check:times` in the deploy. It fails on a published post with no number, a duplicate, a number the ledger does not hold, or no `sources` outside Opinion.
- 6 tests for the numbering and the checks.

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
