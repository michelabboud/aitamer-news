# Progress

## 0.2.119 · 2026-10-25 · comments and reactions on the data host, switched off

Template-first work from the private UIUX repository (0.0.68 to 0.0.72: the index contract, one renderer with two outputs, browser loading, the held message (left unchanged in this pull request; it moves to the flip), reaction totals from the data host), copied here byte for byte (hashes in the pull request). Behaviour is unchanged by design: the switches stay `'baked'` and `REACTIONS_LIVE` stays `false`. Built-page comparison against 0.2.118, tests and checks: see the pull request. Flipping the switch, retiring the publisher lane and the privacy page wording are separate later pull requests.

## 0.2.117 · 2026-10-24 · sitemap freshness

Before: the live sitemap listed all 1,031 stories and every one of the newest 50 feed items, newest `lastmod` equal to the newest story, regenerated on every build. Added topic `lastmod`, topics in `llms.txt` and a sitemap-equals-build check in the deploy smoke test. 1288 tests and the 1,365-page build pass.

## 0.2.116 · 2026-10-24 · production review fixes

High review of PR330 by a fresh Opus 5.5 session (Astra had no tokens; Michel's word 2026-10-24): no blocker, three should-fix items fixed here. Merge follows green hosted checks.

## 0.2.115 · 2026-10-24 · structured data, dates, topics

Template-first work from the private UIUX repository (0.0.55 to 0.0.60), reviewed twice by independent mechanical reviewers, applied here. 1281 tests and the full 1364-page build pass; every story page's JSON-LD parses with the new fields, 195 topic pages build, and the three corrected stories show one date on every surface. Live acceptance follows the deployment.

## 0.2.92 · 2026-10-20 · owner image approval accepted

PR298 installed the owner workflow; run39400050864 passed all three jobs for the exact refreshed image head. Original PR292 was approved and normally merged, and deployment39400491915 succeeded. Live homepage, both author pages and both image assets answered200 with the new references; the live180634-byte portrait exactly matched its reviewed SHA256. Bot and Grok instructions now separate image proposals from the ordinary article lane. The [current handoff](docs/handoffs/2026-10-20-owner-image-approval.md) records source, checks, normal merge API receipts and independent live verification. Code remains the1092-test0.2.91 candidate;0.2.92 updates records and instructions only.

## 0.2.91 · 2026-10-20 · owner-approved image proposals

Owner-only exact-commit approval in GitHub Actions is implemented with isolated validation and separate required certificates. Bots can propose raster assets, sanitized diagrams and image metadata without gaining general repository authority. New `images/` observation routing and image-shape explanations preserve article numbering restrictions. Final full suite passed **1092/1092**; production build, media and output checks passed. Independent deep and mechanical reviews accepted source and the avatar-origin fix. Hosted acceptance completed; see the0.2.92 receipt and [plan](docs/plans/2026-10-20-owner-image-approval.md).

## 0.2.90 · 2026-10-18 · future hero workflow

Future owned JPEG heroes automatically select WebP and require their twin, with no catalog edit. Paired-upload/readback contract and quality-failure hold are recorded across active posting guides. Focused 41/41 and full 1038/1038 tests passed with red/green regressions; 1815 media checks, build and output checks passed. Both source reviews accepted, including the concrete original-media upload guide. PR290 owns final remote required checks, merge and deployment receipts.

## 0.2.89 · 2026-10-18 · all-post WebP rollout

All 907 current hero twins verified (578 original media, 329 bot). Shared article/card/homepage picture rendering and the verified-pair media gate are implemented. Combined validation passed 1037 tests, 1815 media checks, production build and output checks. Independent mechanical/deep review and the focused offline fix review accepted source at 5d20a6a7. PR289 owns remote required-check merge and deployment receipts.

## 0.2.88 · 2026-10-18 · reviewed WebP integration

Bot X PR283 merged normally as `21fbcb94`. PRs 284, 285 and 261 are integrated with source history preserved on a maintainer code branch; the Grok article lane correctly refuses template changes. Independent review found and integration addressed slug fallback, offline section metadata and bot-guide selection inconsistencies. Combined validation passed1030 tests, production build and all post/media/built-output gates. Both focused acceptance reviews passed at ad0537a6. Maintainer PR288 owns remote check, normal merge and deployment receipts.

## 0.2.86 · 2026-10-11 · Quill PR 248 conflict repair
Current main merged into the Quill App-lane branch with terminal holds, typed producer-candidate rejection and Quill ancestor/current-main byline checks preserved. The identity remains unpinned and disabled. Focused 183/183 and full 1025/1025 tests passed; production build, post/media and built-output checks passed. Independent review, branch push/checkpoint and remote CI remain separate pending steps. [Resolution report](docs/reports/2026-10-11-quill-pr248-conflict-resolution.md).

## 0.2.85 · 2026-10-11 · next publication reliability
Both lane permissions and strict Actions-bound check rules verified live. Focused regression repairs isolate permanent historical holds and malformed Grok candidates. Source and regression evidence are in the linked plan and ADR0037; full automated validation, independent review, CI and live post-merge reconciliation are separate gates.

## Publishing recovery · 2026-10-11
Michel authorized agents to merge the repaired publishing PRs after checks. Quill batches rescheduled into nineteen future non-conflicting half-hour slots; Grok tutorial rescheduled separately to 10:07 UTC. Exact-head admission runs started. Repeated runner read failures have not reproduced locally; GET retries and endpoint diagnostics address transport recovery while preserving write and approval safeguards.

## Where the site is (2026-09-25)

- **Live:** https://aitamer.news (Cloudflare Pages). A push to `main` deploys it. The GitHub Pages copy is retired: its workflow was disabled on 2026-09-25 and the last copy there is stale.
- **Content:** 25 published posts (specimens 0001–0025) across seven habitats (Models, Tools, Creative, Infra, Rust, Policy, Opinion), each with a house hero image, a Wildness rating and a verdict (the welcome note has no rating). Two authors: `wiz-cat` (human) and `desk-bot` (bot).
- **Site features:** the Bestiary theme; post contract v1 (strict, versioned, published as JSON Schema); scheduled publishing; Pagefind search; Extinction Watch and Campfire pages; the site's own baked-static comments (Disqus removed, task A4); click-to-load YouTube; RSS, JSON Feed, `llms.txt`, sitemaps (general and Google News) and JSON-LD; Google Analytics on the main domain only; incremental Astro builds.

## Log

- **2026-10-06** — Removing mandatory owner editorial approval from authorized Grok App article admission. Same-PR numbering, exact-head technical validation and normal merge remain. Code verification and runtime acceptance pending.

- **2026-10-06** — 0.2.76 trial candidate: Michel requested Ubuntu26.04; all14 runner selectors changed, with action pins/Wrangler/trust boundaries unchanged. Official image tool compatibility, semantic YAML comparison,67 Bash steps and45 focused existing tests passed. Fresh remote runtime checks and independent successor review remain required. [Superseding evidence](docs/reports/2026-10-06-workflow-runtime-refresh.md#ubuntu-2604-trial-successor--checkpoint0276).

- **2026-10-06** — 0.2.75 workflow candidate: all 14 hosted jobs pin Ubuntu 24.04; three Wrangler deployment inputs use stable 4.147.0; six action SHAs verified current. Full 933-test suite, production build/post/media/rendered checks, YAML/Bash validation and Worker dry-run passed. PR204 auto-merge disabled; independent reviews, exact-head remote CI, normal merge and deployment remain separate. [Inventory and retained runner failures](docs/reports/2026-10-06-workflow-runtime-refresh.md).

- **2026-10-05** — 0.2.74 docs: enabled Grok single-PR instructions and exact-source correction handoff are published for bot use; producers need no manual admission dispatch, Actions-write permission or model disclosure. PR197 automatically numbered/certified then normally App-merged; queued finalizer auto-merge and its future publication are separate. Patch application, preflight and candidate checks passed in isolated source fixtures. [Bot handoff](docs/reports/2026-10-05-bot-review-handoff.md).

- **2026-10-05** — 0.2.73 source: immutable owner-review receipts and original-root binding repair; deterministic numbering descendants carry approval, rebound roots are held, and observation bases use actual trusted checkout. Focused96/96, full933/933 and production build passed; both independent core reviews accepted. Normal CI/deploy and original197 runtime acceptance remain separate. [Report](docs/reports/2026-10-05-review-source-binding.md).

- **2026-10-05** — 0.2.72 source: repair stale PR readback after successful numbering; trusted certification explicitly wakes existing finalization, which waits for exact authenticated completion before unchanged proof/recovery. Bounded waits never grant approval or merge authority. [Report](docs/reports/2026-10-05-numbered-pr-readback.md).

- **2026-10-05** — 0.2.71 source: same-PR workflow admission with automatic owner-review discovery, deterministic branch updates, isolated validation and strict certificates. Legacy state/proofs remain; independent review and controlled PR #197 rollout are separate evidence. [Report](docs/reports/2026-10-05-single-pr-publication.md).

- **2026-10-05** — 0.2.70: Desk Bot profile uses the supplied 768-pixel avatar and exact three-paragraph introduction. The first paragraph remains the card/SEO summary; Desk Bot stays an unfeatured bot. Author/publisher regressions and rendered profile checks pass. [Evidence](docs/reports/2026-10-05-desk-bot-profile.md).

- **2026-10-05** — 0.2.69: repaired the ambient numbering smoke-test failure from PR #189. Full suites pass 896 tests on numbered main and the exact 24-article source tree with the fix overlay. Required source integrity still waits editorial approval and workflow admission; no articles or ledger identities changed. [Evidence](docs/reports/2026-10-05-bot-submission-checks.md).

- **2026-10-05** — 0.2.62 source: workflow numbering implemented, tested and reviewed. Live enforcement and controlled admissions pending. Recovery regression61 tests passed; full baseline suite841 tests passed before final streaming delta.
- **2026-10-05** — 0.2.61: reusable human writer onboarding and Aviram profile prepared; 797 tests pass, author and opinion rendered fixtures pass. Article publication waits workflow-only numbering; not yet live.

- **2026-10-05** — 0.2.60 planning: ledger/allocation becomes workflow-owned in the proposed design. #169 merged and deployed; #172 integration #174 remains pending under the new constraint. Confirmed site-wide: bots, our writers, the Desk and manual publishers choose Habitat and submit the article; workflow alone supplies numbering and automatically repairs unauthorized submitted number/ledger changes.

- **2026-10-05** — 0.2.59: hero art instructions now provide acceptable colors instead of a single fixed background; Grok review summaries no longer require the automatic writer model.

- **2026-10-05** — 0.2.58: hero prompt and Grok guide allow light background enrichment without competing objects or additional coral accents.

- **2026-10-05** — 0.2.57: Grok editorial acceptance instructions now distinguish technical CI from visual/browser/source review. PR #169 proves App-authenticated submission; merge access remains ungranted.

- **2026-10-05** — 0.2.56 candidate: the dedicated Grok App can receive a narrow content PR lane from same-repository `grok/*` branches. Both numeric identities must match; only plain Markdown posts and append-only specimen history qualify. Source gates and review remain pending; no App-authenticated submission or merge is proven by local tests.

- **2026-10-04** — 0.2.48: one-post publication candidate, “The Small Model That Never Gets the Final Say.” Editorial corrections reviewed; release only this post while the rest of the unpublished queue stays held.

- **2026-09-28** — 0.2.47: reading typography. Bigger body and article text with more line spacing, an article column of about 70 characters a line (was 80), brighter secondary greys, 28 px card titles (26 px three across), card and lead art at its drawn 16:9 with a mild dim that lifts on hover. Then, at Michel's choice, headlines moved from Gloock to Newsreader (ADR 0021): Gloock's letters touched in three of four pairs. Checked in the browser at 390, 820 and 1280 px, with the WCAG text-spacing overrides.

- **2026-09-28** — 0.2.45: hero images moved to R2 (ADR 0020). All 44 uploaded to `media.aitamer.news` and checked byte for byte before any post changed; every post's `heroImage` is now the full media URL (only that line changed); `public/heroes/` and the base64 decoder are gone; the old `/heroes/` URLs redirect. Each post costs ~2 deploy files now. The deep review was clear; its follow-ups are in: the deploy now fails when a live post's hero is missing on the media host, and `public/heroes/` can never come back.

- **2026-09-28** — 0.2.44: the posts App's authors lane (ADR 0018). Its author pull requests pass `publisher-paths` only if they change one AI writer's or bot's file honestly: kind and name never change, no new humans, no borrowed names; a human's file changes only through Michel. The GitHub variable and ruleset come after merge.

- **2026-09-27** — 0.2.33: `check:posts` now fails a post whose `author` has no profile. Astro only logged the broken reference and dropped the post from the build with exit 0.

- **2026-09-26** — 0.2.32: the Content-Security-Policy guard hardened before any enforcement (srcdoc refused; every load type checked; GA hosts per Google's current guidance; Vite's env loader), and two tightenings of the rendered-body gate (only compared pages count; a published post must have its page). Both reviewed clear. Node 22.18 or later.

- **2026-09-26** — 0.2.31: a Content-Security-Policy in report-only mode, with every inline script allowed by its build-time hash and a guard in every workflow that builds. In the browser there were zero violations, report-only and enforced; the search worker's WebAssembly needed its own rule. The deep review is clear; four should-fixes land before enforcement.

- **2026-09-26** — 0.2.30: the rendered-output gate for bot posts (posts MCP task S4). Every bot post is rendered and checked against an exact allowlist, in its place on a copy of the real page, both before and after the build. Five review rounds; clear. A CSP proposal awaits Michel.

- **2026-09-26** — 0.2.29: fixes from the milestone review of reactions. A 404 is resent, because a new story is unknown to the Worker for minutes. Reactions run only on the site's own hosts. The privacy wording on removal is exact. Still off.

- **2026-09-26** — 0.2.28: fixes from the focused review of the reactions fixes. A 410 on the page's own resend no longer moves focus; permanent refusals are not resent; the privacy wording is exact about what the hash does. `/_astro/` files are now cached for a year. Still off.

- **2026-09-26** — 0.2.27: privacy wording from the deep reviews (backups once up front; the reactions paragraph exact). Michel's review of the reactions paragraph is still owed before go-live.

- **2026-09-26** — 0.2.26: fixes from the deep review of the reactions component (unsent choices resent, focus and scroll, the no-popover case, the expiry sweep, a bundled script). Still off.

- **2026-09-26** — 0.2.25: the privacy page says retention exactly (deleted within a day after 30 days); the reactions paragraph says a comment and a reaction share the hash. From the ops-side deep review.

- **2026-09-26** — 0.2.24: fixes from the deep review of RB1 and RB2 (rename-rule wording, ADR 0008 amendment, an 8 KiB cap on reactions files).

- **2026-09-26** — 0.2.23: task RB4, the privacy paragraph for reactions, behind `REACTIONS_LIVE` (off). Batch R-B (site) is built; Michel's review of the paragraph is owed before go-live.

- **2026-09-26** — 0.2.22: task RB3, the reactions component, built and checked in a browser with the flag forced on locally; shipped off (`REACTIONS_LIVE` false).

- **2026-09-26** — 0.2.21: task RB2, the publisher guard's second lane (`src/content/reactions/`, ADR 0008). It must be on `main` before the desk's publisher writes reactions files. Nothing changes for readers.

- **2026-09-26** — 0.2.20: reactions plan approved and running (plan kept in the private operations repository). Task RB1: the reactions data contract v1, the `reactions` collection, its check and the reaction set. Nothing shows on the site yet (`REACTIONS_LIVE` is false).

- **2026-09-26** — 0.2.19: Turnstile on. Site key set; `TURNSTILE_SECRET_KEY` is on both the contact and the comments Workers. The comment form shows under stories; published comments wait on the publisher (GitHub App).

- **2026-09-25** — **v0.2.0 released: the Bestiary redesign.** Both release reviewers' blockers fixed (0.1.27–0.1.28): a real 404 page, no stale countdowns in the HTML, no empty headlines in contract v1. The Wildness ratings and verdicts are provisional until Michel's editorial sign-off. Next phase not chosen yet.

- **2026-09-25** — 0.1.7–0.1.21: the Bestiary redesign, phase 1 (plan `docs/plans/2026-09-25-bestiary-redesign.md`): habitats, the post contract with permanent specimen numbers, the theme site-wide, scheduled posts, search, feeds for machines, SEO, and the repo cleaned up to go public. Released as v0.2.0 after 0.1.22–0.1.28 (reviews and fixes).

- **2026-09-25** — 0.1.6: the Bestiary redesign plan is approved and running (`docs/plans/2026-09-25-bestiary-redesign.md`). The Big Top theme is kept at tag `checkpoint/0.1.5` (the branch that held it was removed later). GitHub Pages deploys are switched off.

- **2026-09-25** — 0.1.5: About page redesigned around the bot pipeline, with the contact form served by the `contact.aitamer.news` Worker (rate-limited, no API token). Live sending waits on Email Routing, the first Worker deploy, and the `CONTACT_TO` secret. Roomier post cards.
- **2026-09-25** — 0.1.4: desk pages no longer show the desk pills twice.
- **2026-09-25** — 0.1.3: CI on Node 24 and the latest stable GitHub Actions; the Cloudflare deploy uses Wrangler 4.
- **2026-09-25** — 0.1.2: archive by year and month; `POST.md` documents how a post works.
- **2026-09-25** — 0.1.1: publish times stamped into every published post; CI refuses a published post without one.
- **2026-09-25** — Standard repository files added; versioning starts at 0.1.0.

- **2026-10-04** — 0.2.49: reviewed-publication guard implemented; 755 tests pass and the isolated fixture retains exactly 211 live articles while holding 10 queued source posts. The new queue, independent review, bootstrap and timer activation remain pending. Existing publishers remain disabled.

- **2026-10-04** — 0.2.50: independent source review confirms the receipt corrections; 763 repository tests, 48 focused publisher tests, and 18 private controller tests pass. Full queue integration and live timer activation remain pending; publishers stay disabled.

- **2026-10-04** — 0.2.51: recovery article-body proof is required by the live check and receipt validator. Independent source recheck and 766 repository tests pass. Content integration, full independent candidate review and activation remain pending.

- **2026-10-04** — 0.2.52: complete 180-article queue prepared in PR #165, with 171 new files, nine existing updates, and one metadata-only quarantine. All 766 tests and source/media checks pass. The 211-article baseline is unchanged. Final independent review, isolated-artifact proof, bootstrap and timer activation remain pending.

- **2026-10-04** — 0.2.53: Michel requested disabling the queue requirement. Restore the pre-admission publishing workflows; queue and receipt implementation retained inactive. Verification and production deployment pending.

- **2026-10-04** — 0.2.54: Michel provisioned bots.aitamer.news and requested exact Grok posting instructions. Add an exact bot-media origin with per-host hero checks; preserve existing publishing and media. 773 tests, build, source checks and existing media checks passed; independent review and deployment pending.

## 0.2.93 · 2026-10-23 · deferred reader scripts candidate

Transferred the reviewed script-loading experiment into a maintainer branch without content or workflow changes. Full-site testing identified the required protected-DOM-name integration, now covered by focused regressions. Production review and hosted PR acceptance remain pending; no live change at this checkpoint.

## 0.2.94 · 2026-10-23 · source review and privacy clarification

Both independent high-review seats accepted code2bf2e5 without blockers. Corrected the identified privacy timing wording and described input-triggered analytics. PR314 owns required current-head checks and normal merge/deployment; no live claim yet.

## 0.2.97 · 2026-10-23 · automatic analytics revision

PR314 merged as217e2f9; live inspection found the expected measurement ID in all995 published sitemap posts. Michel requested revising the interaction requirement because it excludes passive readers. The automatic-load revision retains production-only hosts and deferred comment verification. Local verification, independent review, required hosted checks and deployment are tracked separately in the follow-up PR. Cloudflare HSTS (one month, no subdomain inheritance/preload) and www-to-apex301 redirects were verified live independently of this code.

## 0.2.98 · 2026-10-23 · author profiles and headers candidate

Transferred the template experiment onto latest main b18c88a.1138 tests,1111-page build, content/media/CSP/link/secret/file/diagram gates and actual local Pages/browser probes passed. Independent production review and hosted/live acceptance remain separate pending gates; no source checkpoint is claimed as live.

## 0.2.99 · 2026-10-23 · author/header review correction

Both independent final source reviews accepted candidate f3848e2 with no blockers and one minor documentation mismatch. Updated writer onboarding, the portrait comment and an additive historical decision amendment. Runtime behavior is unchanged. Exact successor review, hosted checks and deployment acceptance are recorded on [PR319](https://github.com/michelabboud/aitamer-news/pull/319).

## 0.2.100 · 2026-10-23 · Michel profile candidate

Michel requested renaming Wiz Cat and importing his public GitHub information. The stable wiz-cat ID and human/editor role remain; the display name, verified full name, GitHub link and local avatar are updated. Public GitHub bio/company/location/blog were empty and no details were invented. Runtime checks, source review and hosted/live acceptance remain distinct gates.
