# Changelog

All notable changes to aitamer.news. The version lives in `VERSION`; each task is tagged `checkpoint/<VERSION>`.

## [0.2.22] — 2026-09-26

### Added
- **The reactions component** (reactions plan, task RB3), `src/components/Reactions.astro`, **off**: `REACTIONS_LIVE` stays false, so no page shows it and the only change a visitor's browser receives is a larger stylesheet. Under the article: a React button (it shows your own choice once made), the top three reactions and the total (hidden at zero), and a small panel of the seven reactions as a native `popover` — no library, one inline script like the comment form's, a `hidden` fallback where `popover` is missing. Keyboard: Tab, Enter opens on your choice (else the first), arrows and Home/End move, Enter or Space chooses, Escape closes and returns focus, Tab leaves. Tapping your current choice removes it. One rise-and-fade on choosing, none (and no hover zoom) under reduced motion. A choice is one `keepalive` `POST /react` to the comments Worker; the counts move for that visit, your choice is remembered 30 days in `localStorage` (never a cookie); a 410 disables it with "Reactions are closed on this story.", any other failure is silent. A story with closed comments shows its totals and that note, no button. Without script the summary still shows and the panel says "Reacting needs JavaScript.".
- Pure helpers for it in `src/lib/reactions.ts` (`reactEndpoint`, `reactionCaption`, `applyChoice`, `nextChoice`), with tests.

### Changed
- The story page's `cacheKey` carries its reactions file's stamp, so a changed total re-renders that story's page.

## [0.2.21] — 2026-09-26

### Changed
- **The publisher's second lane** (reactions plan, task RB2; ADR 0008, a security-boundary change). The guard `scripts/check-publisher-paths.mjs` now lets the desk's publisher add, change or delete `src/content/reactions/<slug>.json` as well as `src/content/comments/<slug>.json`, and nothing else; a rename may not cross between the two directories. The required check `publisher-paths` and the deploy's refusal of a publisher push both run this script, so both widen with it; neither workflow's logic changed (comments only), and the rulesets and the App's permissions are unchanged. 8 new tests: a reactions file passing, `README.md`, nested, lookalike (`src/content/reactionsx/`), traversal and wrong-extension paths failing, renames across lanes failing both ways (in real git output too), a pull request or push that adds anything else beside a reactions file failing, and the maintainer exemption unchanged.

## [0.2.20] — 2026-09-26

### Added
- **Reactions data contract v1** (reactions plan, task RB1). `src/content/reactions/<slug>.json` will carry a story's reaction totals, written by the desk's publisher: `{ version: 1, slug, reactions: [{ id, n }] }`, ids sorted and unique, `n` a whole number ≥ 1, at most 64 entries, no timestamp (equal totals, equal bytes). Strict schema in `src/content/reaction-schema.ts`, published at `/contract/reactions.schema.json` and `/contract/v1/reactions.schema.json`, v1 frozen by a byte-for-byte snapshot. Unknown (retired) ids are allowed and counted in the total, never shown.
- The reaction set and its pure helpers, `src/lib/reactions.ts`: the seven reactions (Love, Wow, Funny, Angry, Skeptical, Overhyped, Underrated), `REACTION_ID`, totals, the top three, accessible labels, and the 30-day memory of a reader's own choice in `localStorage` (never a cookie).
- The `reactions` collection, `getReactionThreads()`, and `npm run check:reactions` in `npm run check:posts` (a file with no post, a slug that is not the file name, or anything but `README.md` and regular `<slug>.json` files fails it). POST.md section 9 and `src/content/reactions/README.md` document the format.
- `REACTIONS_LIVE = false` in `src/lib/site.ts`: nothing about reactions shows on the site until the publisher bakes real totals.

### Changed
- The comment loader and file probe became shared by both data directories: `src/content/comments-loader.ts` → `src/content/data-file-loader.ts`, `src/content/comment-files.ts` → `src/content/data-files.ts` (`hasCommentFiles` → `hasDataFiles`), and the comment check's rules moved to `scripts/data-files.mjs`. No behaviour change: `scripts/check-comments.test.mjs` passes unchanged.
- `package.json`'s version follows `VERSION` again (0.2.19 had left it at 0.2.18).

## [0.2.19] — 2026-09-26

### Changed
- **Turnstile is on.** The site key is set, so the contact form and the comment form both show Cloudflare's bot check, and both Workers verify the token (action, and hostname `aitamer.news` or `www.aitamer.news`). The comment form now appears under stories; comments still wait for approval and appear on pages once the publisher is live. The privacy page now mentions Turnstile for the contact form.

## [0.2.18] — 2026-09-26

### Changed
- **The contact form is live.** The contact Worker was deployed at `contact.aitamer.news` and a test note reached the desk; `CONTACT_FORM_LIVE` is on, so the About page shows the form again and the privacy and Campfire pages point to it. The free plan accepted both rate-limit bindings. Comments stay closed until the Turnstile key is set and the comments Worker is live.

## [0.2.17] — 2026-09-26

### Changed
- Comment file format docs: `generatedAt` is the time of the newest comment in the file (the desk now writes it that way, so an unchanged thread produces identical bytes). The format itself is unchanged.

## [0.2.16] — 2026-09-26

### Fixed
Focused review of the batch A fixes:
- **The contact Worker accepts Turnstile tokens solved on `www.aitamer.news`** as well as the apex. The site serves the same pages on both, so with Turnstile on, every note from www would otherwise have been refused, including removal requests.
- **Privacy page, exact about what stays:** the trust score and link count kept with each comment's record; a removed comment leaves a bare record (id, story, times, score, link count) and its erased text can remain in the database's restorable backups for up to 30 days; a ban keeps a short reason with the hash for 30 days; Cloudflare's rate limit and Turnstile see the address itself while you send.
- `POST.md`: after a refused publisher push, also disable the scheduled publish until the revert, since its hourly deploy is not a push. The decision index points 0006's readers to the corrected removal rule.
- The last two workflows (`check-posts`, `scheduled-publish`) pin their actions by commit.

## [0.2.15] — 2026-09-26

### Changed
- Comments stay closed until the contact form is live: it is the channel readers use to ask for a comment's removal. The go-live order is now enforced in code (`commentFormSetup` requires `contactFormLive`), not only in the docs. 1 test.

### Fixed
- A test expectation that 0.2.15 itself broke (the pushed commit had 1 failing test out of 352).

## [0.2.14] — 2026-09-26

### Fixed
Batch A deep review (site side):
- **Removing a comment** is the desk's delete, which also erases the stored name and text; a hand edit of a comment file is only an emergency stopgap (POST.md §8, comments README), because the desk regenerates files from its records.
- **Privacy page** states the retention: IP address only as a salted, shortened hash for 30 days (rate limits, duplicates, trust, bans); time on page 30 days; a rejected comment's name and text erased 30 days after review, a removed one's at once; published comments also appear on the Campfire and stay in the public source history.
- **Comment contract v1, deliberately revised before any file was published:** slugs at most 120 characters (the site's `check:posts` enforces the same cap), at most one joiner between two characters, and the invisible format characters above U+FFFF refused. The frozen snapshot records the revision.
- Decision record 0007 describes the publisher guard as built and supersedes 0006's guard section. The deploy guard compares the pusher's numeric id (`PUBLISHER_ACTOR_ID`).
- The contact form's Turnstile widget has its own action, and the contact Worker checks action and hostname, so a token from one form cannot be spent on the other.
- Privacy and Campfire copy follow whether the contact form is live; the Campfire list gets the same text-direction protections as the post page; remaining workflow actions pinned by commit; the account-id test also catches dashboard URLs.

## [0.2.13] — 2026-09-26

### Removed
- **Disqus is gone:** no comment-count script on every page, no embedded threads, no Disqus settings. `grep -ri disqus dist/` is empty.

### Changed
- **The Campfire runs on our own comments:** every story with its count, and "Around the fire", the 30 newest comments site-wide.
- **Privacy and terms** say exactly what a comment sends (name, text, time the form was open, a Turnstile check) and where; that comments wait for approval; that a published comment is public, sits in the page's structured data and stays in the public source history; how to ask for removal; that the IP address is kept only as a salted, shortened hash for a short period. `SECURITY.md` puts `comments.aitamer.news` in scope.

## [0.2.12] — 2026-09-26

### Fixed
Deep review of comment rendering:
- **A comment link always shows where it really goes.** The visible text is rebuilt from the parsed address, with the whole host shown (in punycode when it is not plain ASCII); long links are shortened only after the host; addresses with a user name or password, or an IP-address host, stay plain text. Seven regression tests that failed on the old code.
- The display strips exactly the characters the comment contract refuses (`FORBIDDEN_CHARACTERS`, one list).
- Counts on the home page and the Campfire are looked up once per page; trailing-punctuation handling is linear (6.9 ms → 0.1 ms per worst-case comment) and knows Chinese and Japanese punctuation; long links are cut on whole characters, emoji included.
- Each comment in the structured data carries its own URL; comment bodies cannot paint over their neighbours; names and text follow their own writing direction.

## [0.2.11] — 2026-09-25

### Fixed
Deep review of the comment form and the publisher check:
- **The publisher cannot slip code into someone else's pull request.** `publisher-paths` now holds every pull request to the comments-only rule unless both its author and the account that triggered the run are the maintainer (`MAINTAINER_ID`, numeric id); edits and reopenings never exempt. The verdict is pinned to one commit, read with `git diff` and `git ls-tree` without ever checking out or running the pull request, and the check installs nothing (`scripts/slug.mjs` holds the slug rule without dependencies). Actions are pinned by commit.
- **Second line:** the deploy refuses a push to `main` by the publisher (`PUBLISHER_ACTOR`) that touches anything outside `src/content/comments/`, judged by the script as it was before the push.
- Form: the "held for the desk" note shows without JavaScript (`#comment-held`); the submit button waits for Turnstile; errors from the Worker are shown as plain text; a plain `http:` endpoint is accepted only for localhost.
- 26 more tests, several on real temporary git repositories.

## [0.2.10] — 2026-09-25

### Changed
- The Cloudflare account id is no longer written in the workflows; both deploys read the Actions secret `CLOUDFLARE_ACCOUNT_ID`. A test fails if a literal account id appears in any tracked file again.

## [0.2.9] — 2026-09-25

### Fixed
Deep review of the comment contract (fixes for its two blockers and eight minors):
- **Invisible text is refused.** Names and comments may no longer carry format, invisible, private-use or bidirectional characters, Unicode tag characters (which can hide instructions for AI readers) or blank-looking fillers; the joiners U+200C/U+200D only between two characters, so scripts and emoji that need them still work. Both fields need a visible character. The list is one exported constant, `FORBIDDEN_CHARACTERS`, for the renderer and the desk to share.
- `<?` is refused as HTML; the HTML rule no longer needs lookahead; ULIDs must start `0`–`7`; at most 2,000 comments per file, none later than the file's `generatedAt`; length is checked before any pattern.
- **v1 is frozen:** `/contract/v1/comments.schema.json` has its own `$id` and a committed snapshot that a test compares byte for byte.
- `check:comments` refuses links, folders and anything but `README.md` and lowercase `<slug>.json` files, never following a link.
- Decision record 0006 now describes the publisher design Michel approved: a GitHub App behind the required `publisher-paths` check, confined to its own branches.
- 36 more tests, including every published pattern compiled with and without the `u` flag.

## [0.2.8] — 2026-09-25

### Fixed
- **The About page no longer shows a contact form that cannot work.** `contact.aitamer.news` has never been deployed (the address does not resolve), so every note failed. Until it is, the page says the form opens soon and points security reports to GitHub's private reporting. `CONTACT_FORM_LIVE` in `src/lib/site.ts` turns the form back on after the Worker's first deploy.

## [0.2.7] — 2026-09-25

### Added
- **The comment form** under each story's comments: works without script (a plain post that returns to the story), and with script posts in place and says the comment is held for the desk. Honeypot, Turnstile with its own `comment` action, and the time spent on the form (`elapsed`, from `performance.now()`). Until Turnstile and the comments Worker are set up, the form says commenting is not set up yet.
- `comments: { closed: true }` in a post's frontmatter closes its thread (additive to contract v1).
- `/comments/threads.json`: which stories accept comments, for the comments Worker.
- The `publisher-paths` check (`.github/workflows/check-publisher-pr.yml`): on pull requests from the desk's publisher it refuses any change outside `src/content/comments/<slug>.json`, symlinks, submodules and executables, without ever running the pull request's code.
- 52 tests.

## [0.2.6] — 2026-09-25

### Added
- **Comments render on the post page** from the published data files: our own `#comments` section with plain text made safe (escaped, paragraphs, only `http(s)` links, marked `nofollow ugc`), each comment linkable by its id, an empty state, nothing on withdrawn posts. The article's structured data carries `commentCount` and the 50 newest comments.
- Only the post whose comments changed is rebuilt: each post's incremental cache key includes its own comment file. Verified: one changed file re-renders one post page.
- Build-time comment counts on the home page and the Campfire. The Disqus thread stays below ours until Disqus is removed. 39 tests.

## [0.2.5] — 2026-09-25

### Added
- **Comment data contract v1** (`src/content/comment-schema.ts`): strict format for `src/content/comments/<slug>.json` — ULID ids, names and plain-text bodies with no HTML, control, zero-width or bidirectional characters, lengths in Unicode code points, oldest first. Published at `/contract/comments.schema.json` and `/contract/v1/`. A bad file fails the build naming it.
- `check:posts` now also checks comment files: no orphan, file name equals slug, no nested or non-JSON file (`scripts/check-comments.mjs`). POST.md §8 documents the format.
- 41 tests.

## [0.2.4] — 2026-09-25

### Added
- Decision record 0006: comments are baked into the static pages from data files the desk publishes into this repo; readers never cause a Worker request, and the key that can push here never sits in a public-facing Worker.

## [0.2.3] — 2026-09-25

### Added
- `src/lib/media.ts`: one place that knows the media host (`https://media.aitamer.news`) and rewrites it for local work with `PUBLIC_MEDIA_BASE` (e.g. `/media-local`, files under the git-ignored `public/media-local/heroes/`). Every hero-image consumer (cards, post page, social image, JSON feed) resolves through it. Built pages are unchanged today. 10 tests.

## [0.2.2] — 2026-09-25

### Changed
- The phase 2 plan is approved and now lives in the private operations repository; `PLAN.md` keeps the record.

## [0.2.1] — 2026-09-25

### Added
- Draft plan for phase 2: our own comments in place of Disqus, hero images on R2, and reader sign-in with Google and GitHub. Awaiting approval.

## [0.2.0] — 2026-09-25

Release: the Bestiary redesign (`docs/plans/2026-09-25-bestiary-redesign.md`), versions 0.1.6 to 0.1.28. Passed the high deep, dual-blind release review (`docs/reviews/2026-09-25-release-review.md`). `npm audit`: 0 vulnerabilities.

## [0.1.28] — 2026-09-25

### Fixed
Release review, reviewer A (`docs/reviews/2026-09-25-release-review.md`, with both reports beside it):
- `heroImage` as an `https://` URL may no longer contain spaces or quotes, matching `sources[].url`. 1 test.
- The privacy page says what the code does: the Disqus comment-count script loads on every page.
- The About page imports the wildness type that exists (`WildnessRating`).
- BACKLOG: Campfire pagination, the footer year on cached pages, GitHub's 60-day pause of scheduled workflows; the Big Top phone-header line is marked superseded.

### Added
- The combined release review record and both reviewers' reports under `docs/reviews/`.

## [0.1.27] — 2026-09-25

### Fixed
Release review, reviewer B (`docs/reviews/2026-09-25-release-review.md`):
- **A real 404 page.** Without `404.html`, Cloudflare Pages served the home page with status 200 for every unknown URL (soft 404s). `/404.html` now says "Specimen not found" with search and the habitats, `noindex`.
- **No stale countdowns in the HTML.** Extinction Watch writes only the shutdown date ("SEP 28") or "Extinct" into the page; the "3 days left" count is computed in the reader's browser, as plan decision D12 required.
- **The contract refuses empty headlines:** `title` (1–200), `description` (1–400) and each tag (1–60) must be non-empty, before v1 is released. 1 test.
- Copy: the privacy and terms pages no longer mention the retired GitHub Pages copy; the Desk Bot bio drops "Placeholder"; the README post template passes the contract.
- The retired GitHub Pages workflow no longer triggers on push (manual only), so a fork cannot run it by accident.
- `SECURITY.md` states the trust model (writers are trusted; Markdown bodies may carry HTML by design).
- The plan records every task's status at release; deferred items are in BACKLOG.

## [0.1.26] — 2026-09-25

### Changed
- **The repository is public** (Michel, 2026-09-25), after the privacy audit and clean-up (0.1.12, 0.1.23). Protections, all verified:
  - rulesets: no force-push or deletion of `main`; `v*` and `checkpoint/*` tags can't be moved or deleted;
  - Actions: read-only default token, no pull-request approvals by workflows, and workflows from outside contributors wait for the owner's approval;
  - secret scanning with push protection, Dependabot alerts and security fixes, private vulnerability reporting;
  - the wiki and projects tabs are off. Only the owner can push.
- The ops and MCP repos (`atn-ops`, `atn-mcp`) stay private.

### Added
- `SECURITY.md` (how to report, scope) and `CONTRIBUTING.md` (setup, the checks CI runs, versions, licence of contributions).

## [0.1.25] — 2026-09-25

### Changed
- The private ops repo is now **atn-ops** (renamed from aitamer-news-ops, to match atn-mcp); `POST.md`, the plan and code comments use the new name. Both stay private.
- `POST.md` documents `npm run stamp -- --restore` (from 0.1.24) and the date-only future `pubDate` behaviour.

## [0.1.24] — 2026-09-25

### Fixed
Findings of the batch B–C deep review (`docs/reviews/2026-09-25-batch-bc-deep-review.md`):
- **N1, script injection through JSON-LD:** a title containing `</script>` could close a structured-data block and run script. Every JSON-LD block now goes through `src/lib/json-ld.ts` (`<`, `>`, `&`, U+2028/2029 escaped; still valid JSON). Checked with a hostile-title probe build. 2 tests.
- **N2, scheduled publishing failed every run since 0.1.19:** the hourly job never installed dependencies, so the YAML reader could not load. It now runs `npm ci --omit=dev`. New smoke tests run each command-line script as its own process.
- **N3, the deploy file budget:** each post costs about three deploy files (page, hero, search fragment), so the free plan's 20,000-file cap arrives near 6,600 posts. Decision recorded in `docs/adr/0005-deploy-file-budget.md`; `npm run check:files` in the deploy warns from 16,000 files and fails from 19,500; BACKLOG's R2 threshold corrected.
- Pull requests now also build, so a post that breaks the strict schema fails its pull request, not the next deploy.
- Source links must be `http(s)`; `pubDate` and `updatedDate` refuse bare numbers; the published JSON Schema accepts a plain date for drafts.
- The home page has its `h1` again (the wordmark); JSON-LD `dateModified` uses the same newest-date rule as the sitemap.
- A new story filed under a deleted post's slug no longer inherits that post's specimen number: restoring a ledger number after an interrupted stamp now needs `npm run stamp -- --restore`.
- A contact note that is only the prefilled opener ("Correction: ") is refused in the browser.
- Wording: `llms.txt` (numbers are in filing order; opinion pieces may have no sources), `POST.md` (date-only future `pubDate`, `--restore`), `ARCHITECTURE.md` (live, scheduled and withdrawn posts; the scheduled workflow). The sitemap reader names a file with no frontmatter.

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
