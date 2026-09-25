<!-- Review record. Target 2e59d0d (v0.2.0 candidate, VERSION 0.1.25), base 29e1453 (last release state).
Kind: high deep, release gate, blind reviewer A of a dual-blind pair (same-family pair unless the coordinator says otherwise).
Reviewer: Top tier (Claude Fable 5.1), separate session, fresh context; brief and inputs only.
Isolation actually provided: own scratch directory holding only my material; detached worktree at tree/ with a hard-linked node_modules.
Tools: Read, Glob, Grep only — the harness denied Bash for this session, so no command was run. Cold-read note: COLD-READ.md (written before the earlier reviews were opened; see its contamination note about three grep-matched lines).
Returned 2026-09-25. -->

# Release review (high deep) — aitamer-news v0.2.0 candidate at 2e59d0d

**Verdict: release after fixes.** One Blocking finding (a plan deliverable that is absent and has a live effect: no 404 page, so Cloudflare Pages serves the home page with status 200 for every unknown URL), one editorial gate the plan made a milestone condition and nobody recorded as passed, and a handful of Minor drift items. No security defect found in what reaches HTML, the workflows, or the Worker. The three Blocking findings and ten Minors of the batch B/C review are all fixed in the tree at 2e59d0d.

## What I could and could not verify

| Check | Status |
|---|---|
| Source read at 2e59d0d: every file under `src/`, `scripts/`, `.github/workflows/`, `workers/contact/`, `public/` (text), root docs, `docs/adr`, `docs/reports`, `docs/plans`, both batch reviews | **Verified by reading** |
| `npm test`, `npm run build`, `check:posts`, `check:dist`, `check:files`, `npm audit` | **Unavailable** (no shell). The batch B/C reviewer ran them at 0ad2563: 136 tests pass, build exit 0, `check:dist` clean. Nothing after 0ad2563 changes what those checks cover except the 0.1.24 fixes, which add tests I read but could not run. |
| `git log/diff 29e1453..2e59d0d`, f46861a as a diff | **Unavailable** (`tree/.git` points outside my directory). Every fix was verified against the tree state instead. |
| `dist/404.html` absence | **Inferred** from the absence of `src/pages/404.astro` and of any 404 route/config; Astro emits 404.html only from that page. |
| Git-history privacy audit (plan V2), GitHub repository settings (rulesets, fork-PR approval, secret scanning), Cloudflare `_redirects` behaviour | **Unavailable** |

## The 0.1.24 fixes (commit f46861a), verified against the tree

| Finding (batch B/C review) | State at 2e59d0d | Evidence |
|---|---|---|
| N1 JSON-LD script injection | **Fixed** | `src/lib/json-ld.ts:10-17` escapes `<`,`>`,`&`,U+2028/9; used by `posts/[slug].astro:111-112`, `VideoEmbed.astro:31`, `index.astro:72`. No other `set:html` carries post data (`section/[section].astro:69` is the constant stub). Test `json-ld.test.ts` covers `</script>`, `<!--`, round-trip. |
| N2 scheduled publish never installed deps | **Fixed** | `scheduled-publish.yml:29-30` `npm ci --omit=dev --ignore-scripts`; `js-yaml` is a runtime dependency (`package.json:28`). `scripts/cli-smoke.test.mjs:13-15` runs `due-posts.mjs` as a subprocess. |
| N3 file budget | **Fixed** | ADR 0005; `scripts/check-dist-files.mjs` (warn 16,000 / fail 19,500) + test; `deploy-pages.yml:49-50` runs it after `check:dist`; `BACKLOG.md:24` corrected to ~6,000 posts; Pagefind vetting addendum. |
| Minor 1 PR check does not build | Fixed | `check-posts.yml:45-48` |
| Minor 2 source URL scheme | Fixed | `post-schema.ts:131` `^https?:\/\/\S+$`; `post-contract.test.ts:182-191` |
| Minor 3 home `<h1>` | Fixed | `BaseLayout.astro:137` |
| Minor 4 `dateModified` rule | Fixed | `posts/[slug].astro:76-78` (max of pubDate, updatedDate, corrections; same as `sitemap-data.mjs:34-36`) |
| Minor 5 slug reuse inherits number | Fixed | `stamp-specimens.mjs:388-395` `--restore` opt-in; test at `stamp-specimens.test.mjs:226-237` |
| Minor 6 POST.md date-only future pubDate | Fixed | `POST.md:88` now matches `stamp` + `due-posts` behaviour (verified by reading both scripts) |
| Minor 7 llms.txt wording | Fixed | `llms.txt.ts:49` |
| Minor 8 opener-only note | Fixed | `about.astro:185-193` |
| Minor 9 JSON Schema rejects a plain draft date | Fixed (inferred) | `strictDate()` union includes `z.iso.date()`; `pubDate: '2026-09-25'` passes zod (test). The generated JSON Schema's `anyOf` was not executed here. |
| Minor 10 / M3 ARCHITECTURE | Fixed | `ARCHITECTURE.md:9-10` |
| Info 7 robustness (`sitemap-data` null, `updatedDate` coerce) | Fixed | `sitemap-data.mjs:47`; `post-schema.ts:90` |

Batch A's B1–B6 were re-verified statically as well (js-yaml reader, validate→ledger→posts order, `void:` lines, withdrawn page/sitemap/search, `.strict()`, index splicing). All present.

## Findings, ranked

### Blocking

#### 1. No 404 page: every unknown URL on aitamer.news returns the home page with HTTP 200
- **Where:** `src/pages/` (no `404.astro`), `public/` (no `404.html`), `astro.config.mjs` (no redirect/404 config). Plan `docs/plans/2026-09-25-bestiary-redesign.md:8` ("plus a new 404") and `:123` (B6: "About, privacy, terms, 404").
- **Evidence:** Astro writes `dist/404.html` only from `src/pages/404.astro`. Cloudflare Pages, when the root has no `404.html`, switches to single-page-application mode and serves `index.html` with status 200 for any path that matches no file. `deploy-pages.yml:59` deploys with `pages deploy dist`, so this fallback applies. CHANGELOG 0.1.16 lists every page that moved and omits the 404; BACKLOG, PROGRESS and PLAN record no deferral. Neither batch review mentions it.
- **Failure scenario:** a reader or crawler hits `/posts/typo/`, `/section/oldname/`, a deleted draft's URL, or any link rot. The full home page comes back as 200. Google indexes soft-404 duplicates of the home page under arbitrary URLs; GA4 counts phantom home views; `llms.txt` readers get the home page for any hallucinated slug; "withdrawal, not deletion" (posting-standards) is undermined for anything actually deleted, since the URL answers 200 with unrelated content.
- **Why Blocking:** a plan deliverable silently absent (rule 0.2), with a live behaviour nobody asked for. Fix effort is one file.
- **Fix:** add `src/pages/404.astro` on `BaseLayout` with `noindex`, a one-line notice and links to `/`, `/search/`, `/archive/`; add it to CHANGELOG. Confirm after the first deploy with a HEAD request to a nonsense path expecting 404.

### Minor

#### 2. Field data for 24 posts is live without the editorial sign-off the plan made a milestone condition
- **Where:** `docs/reviews/2026-09-25-field-data-drafts.md:7-8` ("**Awaiting Michel's editorial review** — nothing here is published editorial judgment until he signs off"); plan `:112` (A5 "Michel reviews before M2 merges") and `:125` (M2: "A5 review doc signed off"); CHANGELOG 0.1.13 "(awaiting editorial review)", 0.1.16 renders the data on every page.
- **Evidence:** no later CHANGELOG, PROGRESS or review entry records the sign-off; the review document still says awaiting.
- **Failure scenario:** wildness ratings and verdicts drafted by a model are published under the site's editorial voice; the release claims them as the site's judgment.
- **Fix:** Michel confirms the table (one line in the review doc and CHANGELOG), or the release notes say the ratings are provisional. Not code.

#### 3. Time-relative strings are rendered at build time (plan decision D12, checks B3 and C5)
- **Where:** `src/components/ExtinctionList.astro:17-26` ("N Days left", "Goes today"), used by `index.astro:151` and `extinction-watch.astro:26,36`.
- **Evidence:** plan D12 `:34`: "nothing time-relative is rendered at build … Without JS the reader sees the date only, never a wrong state"; B3 check `:120`: no "today"/"days left" in `dist/index.html`; C5 `:133`. The client script (`:52-79`) recounts, and `docs/bestiary.md:71` documents the shipped behaviour, but the plan was never revised.
- **Failure scenario:** no-JS readers and anyone reading the HTML (LLM crawlers, feed readers that fetch pages) see a count that is wrong by however long since the last deploy; with no new post for a week the home page says "3 days left" for something that went extinct.
- **Fix:** render the `<time>` date as the no-JS state and let the script fill the count; or record a plan revision with the reason. Keep the nav cell (`BaseLayout.astro:198`), which already follows D12.

#### 4. Plan task C5 (copy and accessibility pass) has no close-out; the scripted dead-link check does not exist
- **Where:** plan `:133`; `scripts/`, `package.json` (no link-check script); CHANGELOG (no C5 entry).
- **Evidence:** `aria-current` on the tab bar (`BaseLayout.astro:252-255`) and `prefers-reduced-motion` (`global.css:798-800`, scroll behaviour only) exist; contrast numbers exist only inside the batch B/C review; no dead-link tool; finding 3 above shows the time-relative check was not run.
- **Fix:** run C5 as a task or record it as descoped in BACKLOG/PLAN with Michel's word.

#### 5. README's frontmatter template fails the strict contract
- **Where:** `README.md:59` `heroImage: /images/foo.jpg # optional`; `src/content/post-schema.ts:96-102`.
- **Failure scenario:** a bot or a human copies the README template as the README tells them to; the build fails on `heroImage`. `README.md:33-35` and `:139` ("section chips", "PostCard, badges, chips", "editorial dark theme") and the "Key routes" table (no `/feed.json`, `/llms.txt`, `/contract/…`, `/extinction-watch/`, `/campfire/`, `/news-sitemap.xml`) are also stale.
- **Fix:** `heroImage: /heroes/your-slug.jpg`, and refresh the table.

#### 6. CHANGELOG 0.1.17 claims the GitHub Pages sentence left the privacy page; it did not
- **Where:** `CHANGELOG.md:80`; `src/pages/privacy.astro:43-44` ("The form on the GitHub Pages copy posts to the same place."); `src/pages/terms.astro:23-24` still describes a GitHub Pages mirror.
- **Fix:** delete the sentence; reword terms to "the public copy at aitamer.news is the one that counts".

#### 7. `about.astro` imports a type that does not exist
- **Where:** `src/pages/about.astro:12` `type Wildness` from `../lib/site`; `site.ts:182` exports `WildnessRating` only.
- **Evidence:** type imports are erased, so `astro build` passes; `astro check`/`tsc` fails; `LEVELS` at `:28` is untyped.
- **Fix:** import `WildnessRating`.

#### 8. Contract: `title` and `description` accept the empty string and have no upper bound (†partly overlaps a line I saw in the B/C review before the cold read)
- **Where:** `post-schema.ts:86-87` bare `z.string()`.
- **Failure scenario:** `title: ""` passes the build and `check:posts`: empty `<h1>`, `<title> · AI Tamer`, empty `<news:title>` (Google News rejects the entry), empty JSON-LD headline, an llms.txt line `- [](url): …`. Every other free-text field carries `min(1).max(n)`.
- **Fix:** `min(1)` on both, and a generous `max` (e.g. 200 / 300); an additive tightening, but it is a public-contract change and belongs in this release rather than after v1 has more writers.

### Informational

9. **Scale: `/campfire/` lists every published post with a Disqus count each** (`campfire.astro:34-43`). At 10,000 posts that is a multi-megabyte page and 10,000 identifiers for `count.js`. Author, habitat and month pages are in BACKLOG line 8; Campfire is not. Add it.
10. **Contact Worker still allows `https://michelabboud.github.io` as an origin** (`workers/contact/src/handler.mjs:5-9`). The GitHub Pages copy is retired (V3) but still up and can still post. Low risk (owner-controlled origin); Worker changes are out of this plan's scope. The Worker sources are unchanged in substance since 0.1.5 by the CHANGELOG; I could not diff.
11. **Going public — what becomes visible:** Cloudflare account id in `deploy-pages.yml:57` and `deploy-contact-worker.yml:46` (not a secret by Cloudflare's model; ADR 0002 says so); GA4 id and Disqus shortname (public by nature). No secret values in the tree: `.env.example` is names only; `contact.test.mjs:213` holds Cloudflare's documented always-pass Turnstile test key; `check-dist-secrets.test.mjs:23` is a fixture. No home paths, personal email, or fleet internals. The history audit (plan V2) is still owed per the B/C review's Info 6 and is unverifiable here.
12. **Workflows and permissions are sound.** `deploy-pages.yml`: `contents: read`, wrangler-action pinned by SHA, tests + `check:posts` before build, `check:dist` + `check:files` after, cache restored after `npm ci`. `check-posts.yml`: read-only, `persist-credentials: false`, no secrets, builds. `scheduled-publish.yml`: `contents: read` + `actions: write`; `workflow_dispatch` from `GITHUB_TOKEN` is permitted by GitHub. Operational notes for a runbook: GitHub disables cron in a public repo after 60 days without a commit; `deploy-github-pages.yml` still triggers on push and runs `check:times` (BACKLOG line 19; disabled in the UI per docs, unverifiable here).
13. **HTML injection surface is clean.** Post data reaches HTML only through Astro expressions/attributes (escaped), `toJsonLd()`, or validated fields (`sources[].url` http(s), `video.youtube` 11 chars, `heroImage` local path or https). `define:vars` uses Astro's `stringifyForScript` (escapes `<`; `node_modules/astro/dist/runtime/server/escape.js:30-32`). Nit: `heroImage`'s `https:\/\/.*` accepts whitespace and quotes (harmless after escaping); `^https://\S+$` would match `sources.url`.
14. **Data integrity is consistent.** Ledger: 25 lines match the 25 posts and the plan's ordering; `findProblems` covers missing/duplicate/unlisted/voided/wrong-owner numbers, drafts with numbers, slug rule, subfolders, `slug:` fields, sources outside Opinion (withdrawn exempt). Withdrawn: `getPostPages` vs `getPublishedPosts` applied consistently in every page, endpoint, sitemap filter and the Pagefind body marker. Scheduled: one `BUILD_TIME`; the sitemap's own `now` runs seconds earlier at config load (a post due in that gap is built but not listed until the next deploy — negligible). Specimen numbers are issued at stamp time, documented in `POST.md:88`.
15. **Incremental cache:** keys carry post+author stamps; home, extinction watch, campfire and the habitat index have no `getStaticPaths` and always rebuild; the B/C review measured that code/CSS changes invalidate everything (dependency hash). Remaining stale item: footer `© {new Date().getFullYear()}` (`BaseLayout.astro:246`) on cached pages across New Year.
16. **`/contract/v1/post.schema.json` re-exports the live handler** (`contract/v1/post.schema.json.ts:7`); a v2 bump must fork it first. Worth a comment in `POST_CONTRACT_VERSION`'s docstring.
17. **Privacy copy vs code:** Disqus `count.js` loads on every page (`BaseLayout.astro:74-79`), including privacy/terms/about which list no stories; `privacy.astro:17-18` says "Pages that list stories also load a Disqus count". Pre-existing shape, now inaccurate.
18. **BACKLOG hygiene:** line 14 (sticky header with "ten desk pills") describes the Big Top layout and is stale after the theme port.
19. **Test coverage:** pure helpers are tested with real behaviour and failure paths (schema rejections, ledger collision end to end, `--restore`, JSON-LD hostile title, feeds, news window, redirects file ↔ `LEGACY_SECTIONS`). Untested but Astro-coupled: `getHabitatCounts`, `readingMinutes`, `formatClock/ShortDate`, `canonicalPath` (pre-existing). Acceptable for a static site whose pages are checked by build.

## Plan conformance (promised vs shipped)

| Plan item | Shipped | Note |
|---|---|---|
| A1 habitats, A2 stubs + `_redirects`, A3 contract, A4 stampers + ledger + `check:posts` | Yes | `check:posts` in the Cloudflare deploy and on PRs; GitHub Pages workflow keeps `check:times` (BACKLOG 19) |
| A5 field data + review doc, signed off before M2 | Data yes; **sign-off not recorded** | Finding 2 |
| A6 scheduled publishing | Yes | Date-only future dates documented in POST.md §4 |
| B1–B5 theme, components, home, post page, listings | Yes | `AuthorTag`/`HabitatLink`/`FieldLogRow` never materialised (naming only; §9 superseded batch B) |
| B6 about, privacy, terms, **404** | About/privacy/terms yes; **404 missing** | Finding 1; privacy still has the GitHub Pages sentence (finding 6) |
| B7 video, corrections, withdrawn | Yes | Click-to-load, VideoObject, noindex withdrawn |
| C1 Extinction Watch (+ `sunset.ts`, UTC test, client label) | Yes as `bestiary.ts` + test | **D12 not honoured** (finding 3) |
| C2 Campfire | Yes | Scale note (9) |
| C3 Pagefind | Yes | Vetted, pinned, noindex search page, excluded from sitemap |
| C4 docs | Yes | README template stale (finding 5) |
| C5 copy and accessibility pass | **No close-out** | Finding 4 |
| C6 llms.txt, JSON feed, RSS cap, JSON Schema | Yes | Versioned route is a re-export (16) |
| C7 SEO | Yes | NewsArticle, BreadcrumbList, news sitemap, lastmod, max-image-preview, heroAlt, noindex |
| C8 going public: audit, moves, protections | HEAD cleaned; history audit and repo protections unverifiable | (11) |
| D5 no invented numbers | Yes | All counts derive from content |
| D11 counts only on home | Yes | |
| D14 footer links only to existing pages | Yes | Anchors `#tamers`, `#wildness`, `#contact` exist |
| Release chain (rule 6.3): `npm audit`, docs, `v0.2.0`, `gh release` | Not yet; PLAN.md status "running" | `npm audit` unavailable here; the Pagefind vetting says 0 vulnerabilities at 0.1.20 |

## Recommended order
1. Add `src/pages/404.astro` (finding 1). 2. Michel signs off the field-data table or the release notes call it provisional (finding 2). 3. One commit for findings 5, 6, 7, 8 and the D12 no-JS state (3), plus BACKLOG lines for 9, 4, 17, 18. Then re-run the gate's checks (`npm test`, build, `check:posts`, `check:dist`, `check:files`, `npm audit`) on the fixed tip — I could not run them on this one.
