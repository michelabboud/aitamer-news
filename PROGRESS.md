# Progress

## Where the site is (2026-09-25)

- **Live:** https://aitamer.news (Cloudflare Pages). A push to `main` deploys it. The GitHub Pages copy is retired: its workflow was disabled on 2026-09-25 and the last copy there is stale.
- **Content:** 25 published posts (specimens 0001–0025) across seven habitats (Models, Tools, Creative, Infra, Rust, Policy, Opinion), each with a house hero image, a Wildness rating and a verdict (the welcome note has no rating). Two authors: `wiz-cat` (human) and `desk-bot` (bot).
- **Site features:** the Bestiary theme; post contract v1 (strict, versioned, published as JSON Schema); scheduled publishing; Pagefind search; Extinction Watch and Campfire pages; the site's own baked-static comments (Disqus removed, task A4); click-to-load YouTube; RSS, JSON Feed, `llms.txt`, sitemaps (general and Google News) and JSON-LD; Google Analytics on the main domain only; incremental Astro builds.

## Log

- **2026-10-05** — 0.2.60 planning: ledger/allocation becomes workflow-owned in the proposed design. #169 merged and deployed; #172 integration #174 remains pending under the new constraint. Confirmed: bots choose Habitat and submit the article; workflow alone supplies numbering.

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
