# Bestiary redesign — implementation plan

**Status:** approved 2026-09-25 (Michel: "save current template aside and migrate fully to the new design"; after the vision talk: "please proceed with phase 1 + auto commit and push, this is staging time"). Revised the same day with the vision decisions in §3a and the added tasks in §5a.
Owner: Michel (solo, on `main`). Planner: Top tier. Phase ends in release **v0.2.0** (current `VERSION` 0.1.5).

## 1. Goal

Replace the Big Top theme site-wide with "The Bestiary" (design canvas `AI Tamer Concept 2 - Bestiary.dc.html`, frames 2a/2b/2s): a night-palette field station where every story is a **sighting** with a permanent **specimen number**, a **habitat**, a **wildness** rating, a **Tamer's verdict**, and where sunsets feed an **Extinction Watch**. Every page moves: home, post, habitat, habitat index, author, archive (index/year/month), about (pipeline + contact form), privacy, terms, a new 404, plus new Extinction Watch, Campfire and Search pages. The old theme stays reachable at branch `archive/big-top-theme` (29e1453).

## 2. Scope

**In:** theme tokens and CSS; every page; 7-habitat model with redirect stubs for old section URLs; new frontmatter contract (`specimen`, `wildness`, `verdict`, `sunset`) documented in `POST.md` for the ops bots and the posts MCP; specimen stamping and CI check; drafts of wildness/verdict/sunset for the 25 published posts with a review doc; Pagefind search (vetting report at `docs/reports/2026-09-25-pagefind-vetting.md`); Extinction Watch page; Campfire page over the existing Disqus counts; docs (`POST.md`, `ARCHITECTURE.md`, `docs/bestiary.md`, `README.md`, CHANGELOG/PROGRESS/BACKLOG); tests.

**Out:** "Morning Leash" newsletter and "extinction alerts by email" (need a subscriber store and bulk send; owner approval); any forum threads; changes to the contact Worker's behaviour; an A–Z specimen index (backlog); pagination (existing backlog item); self-hosted fonts.

## 3. Decisions

Owner decisions (2026-09-25, from "save current template aside and migrate fully to the new design"):

- **D1** 10 sections → 7 habitats (H1 models, H2 tools, H3 creative = image+video, H4 infra = data+databases, H5 rust, H6 policy, H7 opinion); the one `top` post moves to opinion; old URLs keep working on both hosts.
- **D2** New fields `specimen`, `wildness`, `verdict`, `sunset` — a public contract for atn-ops (bots) and atn-mcp (posting tool). Humans and bots both write posts, so every field must be fillable by hand.
- **D3** Pagefind search in scope.
- **D4** Newsletter and email alerts out; Campfire = existing Disqus; "Report a sighting" = existing contact form.
- **D5** No invented numbers; every count derives from content at build time.
- **D6** Keep GA4 (aitamer.news only), Disqus, RSS, sitemap, incremental-build cacheKeys, `withBase`, archive pages, publish-time stamping, `check:dist`, existing tests.

Planner decisions:

- **D7 — habitat URLs stay `/section/<slug>/`.** The five habitats that keep their slug keep their URLs with no hop; only 5 stubs are needed (`top`, `image`, `video`, `data`, `databases`); frame 2s defines "Habitat" as "a section or desk", so the word is presentation, not routing; on GitHub Pages every stub is a meta-refresh hop, so fewer is better. The frontmatter key also stays `section` (values change).
- **D8 — redirect stubs are rendered by our own route, not Astro `redirects:`.** Astro's static template (`astro/dist/core/routing/3xx.js`) emits the target without `base` and a canonical built on `config.site`, which is `michelabboud.github.io` on the mirror. Our stub uses `withBase()` for the refresh target and `canonicalUrlFor()` for the canonical. A `public/_redirects` file gives Cloudflare real 301s on top; the stubs remain the guarantee on both hosts.
- **D9 — specimen numbers live in the post (`specimen: 12`) and in an append-only ledger `src/content/specimen-ledger.txt` (`0012 <slug>` per line).** "Never reused" cannot be proven from the posts alone once a post is deleted; the ledger is the memory. `npm run stamp` assigns the next number in publish order (pubDate asc, slug asc) and appends; `--check` fails CI on a published post without a number, a duplicate, or a post/ledger disagreement. Display is `No. 0012` (`padStart(4)`, grows past 9999).
- **D10 — the schema keeps the new fields optional; the CI check is the gate.** Same pattern as the publish time today, so `npm run dev` does not break on a post between `draft: false` and `npm run stamp`.
- **D11 — per-habitat counts and the "next sunset" cell render only on the home page.** If the shared header carried site-wide counts, every page's `cacheKey` would need a global stamp and the incremental build would rebuild everything on every new post.
- **D12 — nothing time-relative is rendered at build.** "Latest catch · <absolute date>"; "sightings filed" (total); sunsets show an absolute date, and a small bundled script (importing `src/lib/sunset.ts`) adds "in N days" / "extinct" client-side. Without JS the reader sees the date only, never a wrong state.
- **D13 — batch B (the theme) is built on branch `feat/bestiary-theme` and merged to `main` as a true merge at milestone M2.** Both deploy workflows fire on every push to `main`; a half-restyled site must not go live.
- **D14 — footer and cards link only to pages that exist.** "Cookie settings" → nothing; "AI disclosure" → `/about/#bylines`; "Copyright & takedown" → `/terms/`; "Corrections" → `/about/#contact`; "Editorial standards" → the About pipeline. "A human reads every report" is not rendered unless Michel confirms it (Q2).
- **D15 — "Report a sighting" is `/about/?topic=sighting#contact`.** The About page's inline script prefills the empty note with "Sighting report: ". No new field, no Worker change.
- **D16 — fallback covers keep their mechanism (`src/lib/covers.ts`) with seven night-palette SVGs**, hand-authored.

## 3a. Vision decisions (Michel, 2026-09-25) and what they change here

- **V1 — free tier first**, ~$5/month Workers Paid acceptable later. Cloudflare's free plan caps a deploy at 20,000 files, so this phase keeps the file count lean (RSS/JSON feed/llms.txt capped to the newest 50, no per-post duplicates) and lets `heroImage` hold an absolute `https://` URL so images can move to R2 in phase 2 without another contract change.
- **V2 — the site repo goes public** after a privacy audit of the full history, the moves of anything internal to atn-ops / atn-mcp, and Michel's OK on the result; then repository rulesets (no force-push, no deletion, no outside pushes), read-only default `GITHUB_TOKEN`, approval required for workflows from outside contributors, secret scanning with push protection.
- **V3 — the GitHub Pages copy is retired.** Its workflow is disabled (2026-09-25). `withBase()` stays so the code still builds under a base path, but base-path checks are no longer acceptance criteria. The pushed GitHub Pages site stays up, stale, until Michel says to unpublish it.
- **V4 — bot posts publish automatically or wait for a human per subject, from a score** (subject, confidence, trust). That logic lives in atn-ops / atn-mcp; this repo only needs `draft` and the checks.
- **V5 — YouTube:** posts may embed videos from other creators on an allow-list Michel curates, human-gated for legality in the MCP. This repo adds a `video` field and a click-to-load embed.
- **V6 — humans and LLMs read and post naturally.** This repo publishes `llms.txt`, a JSON feed, schema.org JSON-LD, and the post contract as JSON Schema (`/contract/post.schema.json`) for the MCP to validate against.
- **V7 — SEO:** NewsArticle + BreadcrumbList JSON-LD, a Google News sitemap for the last 48 hours, `lastmod` in the sitemap, `max-image-preview:large`, real image alt text (`heroAlt`), noindex on redirect stubs and withdrawn posts.
- **V8 — scheduled and delayed posts:** a post with a future `pubDate` is built only once its time has passed. An hourly scheduled workflow deploys only when a post fell due in the last two hours (so a missed cron run is caught by the next); otherwise it exits without building.
- **V9 — delivery:** staging. Work lands on `main` task by task and is pushed even when a check fails (Michel). This replaces D13: no theme branch.

## 4. Schema and content model

`src/lib/habitats.ts` (no Astro imports, testable):

```ts
export const HABITATS = ['models', 'tools', 'creative', 'infra', 'rust', 'policy', 'opinion'] as const;
export type Habitat = (typeof HABITATS)[number];
export const HABITAT_META: Record<Habitat, { code: string; label: string; blurb: string }> = { /* H1…H7 */ };
export const LEGACY_SECTIONS = { top: 'opinion', image: 'creative', video: 'creative', data: 'infra', databases: 'infra' } as const satisfies Record<string, Habitat>;
```

`src/content.config.ts` additions:

```ts
const wildness = z.object({
  rating: z.number().int().min(1).max(5),   // 1 tamed (independently verified) … 5 wild (vendor claim only)
  verified: z.string().min(1).max(120),      // what is verified
  claimed: z.string().min(1).max(120),       // what is only claimed
});
const sunset = z.object({
  date: z.coerce.date(),                     // YYYY-MM-DD, UTC
  what: z.string().min(1).max(160),
  replacement: z.string().min(1).max(160).optional(), // omitted = "No replacement listed"
});
section: z.enum(HABITATS),
specimen: z.number().int().positive().optional(),
wildness: wildness.optional(),
verdict: z.string().min(1).max(240).optional(),
sunset: sunset.optional(),
// contract v1 additions from the vision (§3a):
heroAlt: z.string().min(1).max(300).optional(),        // describes the art; falls back to the title
video: z.object({
  youtube: z.string().regex(/^[A-Za-z0-9_-]{11}$/),     // the video ID only, never a URL
  title: z.string().min(1).max(200),
  channel: z.string().min(1).max(120),
}).optional(),
corrections: z.array(z.object({ date: z.coerce.date(), text: z.string().min(1).max(500) })).default([]),
withdrawn: z.object({ date: z.coerce.date(), reason: z.string().min(1).max(500) }).optional(),
```

- **Scheduling:** `pubDate` in the future = scheduled. `isPublished` is `!draft && pubDate <= build time`.
- **Withdrawn:** the page stays at its URL with its title, specimen number and a withdrawal notice instead of the body, `noindex`; it leaves every list, feed, search index and sitemap. Numbers are never reused.
- **Corrections:** shown on the post, newest first, with their dates.
- **Sources:** `check:posts` fails a published post outside the opinion habitat that lists no `sources`.

Old `section` values are not accepted (an out-of-date bot must fail loudly); `POST.md` carries the mapping table. `src/lib/wildness.ts`: labels, colours, `wildnessSegments(rating)`. `src/lib/specimen.ts`: `formatSpecimen(n)`.

**Migration of the 25 published posts:** `welcome-to-aitamer` top→opinion; `flux-3-action` image→creative; `made-on-youtube-2026-gemini-ask-studio`, `sora-videos-api-sunset` video→creative. `infra` starts empty (empty state must render). The draft post gets no specimen. Specimen order from the existing stamps: 0001 welcome, 0002 open-weights-roundup, 0003 policy-watch-transparency, 0004–0009 the six 09-23 posts by time, 0010–0017 the eight at 09-24 09:10:48 by slug, 0018–0020 the three at 09:15:12, 0021–0023 the three at 09:48:07, 0024–0025 the two at 09:48:45. Sunsets: `sora-videos-api-sunset` (2026-09-24, none) and `openai-legacy-instruct-base-hard-remove-2026-09-28` (2026-09-28 → `gpt-5.6-terra`). The welcome post gets no `wildness`.

## 5. Tasks

Each task: one commit, `VERSION` patch bump (numbers nominal; allocated at close-out), `checkpoint/<VERSION>` tag, CHANGELOG entry, close-out report. New test files are added to the `npm test` list. **[deep]** = deep review at task grain (public contract).

### Batch A — foundations (on `main`)

- **A0 — Commit this plan**, `PLAN.md` row, `PROGRESS.md`.
- **A1 — Habitats replace sections [deep].** `src/lib/habitats.ts` + test; `content.config.ts`; `site.ts` derives `ALL_SECTIONS`/`SECTION_LABELS` from `HABITAT_META`; `covers.ts` + `public/covers/{creative,infra}.svg`, remove the five legacy SVGs; the 4 migrated posts; `POST.md`, `README.md`, `docs/posting-standards.md`. Check: build emits the seven habitat pages, none legacy; infra empty state.
- **A2 — Legacy section stubs [deep].** `src/lib/redirect-stub.ts` + test; `section/[section].astro` serves stubs for the 5 legacy slugs; sitemap filter; `public/_redirects`; `ARCHITECTURE.md`. Check on both bases: refresh target includes the base, canonical is aitamer.news, sitemap has no legacy URL.
- **A3 — Field-data contract [deep].** Schema shapes above; `wildness.ts`, `specimen.ts` + tests; `getSunsetPosts()`; `POST.md` rows and YAML example. Check: build accepts all four fields, rejects `rating: 6` naming the file.
- **A4 — Specimen stamping and CI check [deep].** `scripts/stamp-specimens.mjs` (pure helpers, `--check`) + test; ledger with 25 lines; `stamp` runs both stampers; new `check:posts` in both deploy workflows; `POST.md`. Check: idempotent stamp; check fails on a removed `specimen:` line.
- **A5 — Field data for the 25 posts (Strong tier).** `wildness` + `verdict` (welcome: verdict only), two `sunset`s; `docs/reviews/2026-09-25-field-data-drafts.md` with a rationale per post citing its own sources. Michel reviews before M2 merges.

**Batch A boundary → deep review. Milestone M1:** tests, `check:posts`, stub checks on both bases.

### Batch B — the theme (branch `feat/bestiary-theme`)

- **B1 — Tokens and shell.** `bestiary-tokens.css` replaces `big-top-tokens.css`; `global.css` rewritten; `BaseLayout.astro` (fonts, dark theme-color/color-scheme, station bar, habitat nav, footer per D14, mobile tab bar); `HabitatLink.astro`.
- **B2 — Specimen components.** `Wildness`, `SpecimenTag`, `AuthorTag` (replaces `AuthorBadge`), specimen `PostCard`, `FieldLogRow` (`formatLogTime`).
- **B3 — Home: field station.** `index.astro`; `src/lib/counts.ts` + test; all sections from frame 2a with real data; Morning Leash slot marked in a source comment only. Check: no "today"/"days left"/"on shift" in `dist/index.html`.
- **B4 — Post page: the specimen plate.** Wildness block, verdict, sunset notice, comments titled "The Campfire".
- **B5 — Habitat, habitat index, author, archive pages.** New `section/index.astro`; month pages as field-log rows.
- **B6 — About, privacy, terms, 404.** Contact form markup byte-identical except the D15 prefill; `check:dist` green.

**Batch B boundary → deep review, merge to `main`. Milestone M2:** preview walk at 1280 and 390 wide, both bases, all checks; A5 review doc signed off.

### Batch C — features and docs (on `main`)

- **C1 — Extinction Watch page** + `src/lib/sunset.ts` + test (UTC day boundary) + bundled client label script.
- **C2 — Campfire page** (every sighting with its live Disqus count).
- **C3 — Search with Pagefind** (`pagefind@1.5.2` exact devDependency, runs after `astro build`; `/search/`; `data-pagefind-*` on posts; checked under `/aitamer-news`; `npm audit` clean).
- **C4 — Docs.** `docs/bestiary.md`; `docs/big-top.md` points to the archive branch; `ARCHITECTURE.md`, `README.md`, `PROGRESS.md`, `BACKLOG.md`.
- **C5 — Copy and accessibility pass.** Contrast recorded, `aria-current` on the tab bar, reduced motion, no dead links (scripted), no time-relative strings in `dist/`.

**Batch C boundary → deep review. Milestone M3 = release v0.2.0** after the high deep review: `npm audit`, docs, tag, `gh release`.

## 5a. Tasks added by the vision

- **A6 — Scheduled publishing.** `isPublished` honours future `pubDate`; `scripts/due-posts.mjs` + test; `.github/workflows/scheduled-publish.yml` (hourly cron, deploys only when a post fell due).
- **B7 — Video, corrections and withdrawn rendering** on the post page (click-to-load YouTube via `youtube-nocookie.com`, VideoObject JSON-LD).
- **C6 — Machine-readable site:** `llms.txt`, JSON feed, RSS capped to 50, `/contract/post.schema.json`.
- **C7 — SEO:** JSON-LD, Google News sitemap, sitemap `lastmod`, robots meta.
- **C8 — Going public:** apply the privacy audit's fixes and moves, then (after Michel's OK) flip visibility and apply the protections in V2.

## 6. Tests

New: `src/lib/{habitats,redirect-stub,wildness,specimen,counts,sunset}.test.ts`, `scripts/stamp-specimens.test.mjs`. Pure helpers only. Page markup is covered by build checks and the M2 walk, not unit tests.

## 7. Risks

- Live deploys on every `main` push — D13; each A task passes build + `check:posts` + `check:dist` before push.
- Ops bots or the MCP post with old section values or no specimen — the build/check fails naming the file.
- Incremental cache reusing stale shared chrome — D11.
- Pagefind under `base` — C3's `/aitamer-news` check is mandatory.
- Gloock ships weight 400 only; headings must not request 700.
- Disqus threads stay keyed to `/posts/<slug>/`; specimen numbers are display-only.

## 8. Open questions

- **Q1** Author titles ("Editor in chief") need an optional `role` on authors and Michel's wording.
- **Q2** May the report card say "A human reads every report"?
- **Q3** One `sunset` per post, only when it is the story (default), or also for secondary dated deprecations?
- Plus the vision questions put to Michel on 2026-09-25: how posts reach the repo (PR vs direct commit), human approval before bot posts go live, wildness history, meaning of "remove a post", where generated images live at scale, corrections as records.

## 9. Execution lanes (2026-09-25, after A4)

A cloud session (Claude Design's hand-off) had already built the theme on branch `feat/bestiary` (9e51549, off 29e1453). Decision: **reuse its visual work, keep this plan's contract.** Batch B becomes "port `feat/bestiary` onto `main`": its CSS, components and pages, rewired to `src/lib/habitats.ts`, stored `specimen` numbers and the nested `wildness` shape; its `/habitat/<slug>/` pages fold into `/section/<slug>/` (D7). Its 25 drafted ratings are converted, not rewritten.

Host at dispatch: 28 cores, load 1.06 (factor 0.04, near idle), 67 GB available → cap ~19; five lanes run.

| Lane | Tier | Work | Owns (only these files) | Depends on | Lands as |
|---|---|---|---|---|---|
| L1 | Standard (Sonnet), worktree | A5: convert `feat/bestiary` field data to contract v1; welcome post gets no wildness and a neutral verdict; review doc | `src/content/posts/*.md` (field data only), `docs/reviews/2026-09-25-field-data-drafts.md` | A3, A4 | branch → coordinator merges |
| L2 | Standard (Sonnet), worktree | A6: scheduled publishing (`isPublished` honours future `pubDate`, `scripts/due-posts.mjs`, hourly `scheduled-publish.yml`) | `src/lib/site.ts` (`isPublished` only), `scripts/due-posts*.mjs`, `.github/workflows/scheduled-publish.yml`, `POST.md` §4 | A3 | branch → merge |
| L3 | Standard (Sonnet), worktree | C6: `llms.txt`, JSON feed, RSS capped to 50, `/contract/post.schema.json` | new `src/pages/*.ts` endpoints, `src/lib/feeds.ts` + test, `src/pages/rss.xml.ts` | A3 | branch → merge |
| L4 | Standard (Sonnet), worktree | Public-repo cleanup from the privacy audit; ops-internal editorial text moved to `atn-ops` | `README.md`, `ARCHITECTURE.md`, `.env.example`, `docs/big-top.md`, `docs/posting-standards.md`, `src/content/authors/desk-bot.md`, obsolete `decode-heroes.yml`, the draft fixture post | — | branch → merge |
| L5 | Strong (Opus), read-only | Deep review of batch A: `29e1453..106bdd9` | none (report only) | A1–A4 | report → `docs/reviews/` |
| Coordinator | Strong (Opus), main checkout | Batch B: the theme port | styles, layout, components, pages | L1 for real data (not blocking) | commits on `main` |

Lanes never bump `VERSION` or edit `CHANGELOG.md`; the coordinator does both when it merges a lane, so version allocation stays single-writer. After lanes merge, one mechanical review (Standard) covers L1–L4. C3 (search), C7 (SEO), B7 (video/corrections/withdrawn rendering) and C1/C2 follow the theme port because they touch the same pages.
