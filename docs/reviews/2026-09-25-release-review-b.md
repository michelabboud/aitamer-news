# Release review (high deep) — aitamer-news v0.2.0 candidate, reviewer B

<!-- Review record. Target 2e59d0d, phase base 29e1453 (docs/plans/2026-09-25-bestiary-redesign.md).
Kind: high deep, release gate. Reviewer B of a dual-blind pair: Top tier (Claude Fable 5.1), separate session,
own scratch directory, detached checkout in tree/ with a hard-linked node_modules copy.
Isolation actually provided: separate process and directory; no other reviewer's material reachable.
Bash was DENIED for the whole session: no test, build, git or check command ran. Line numbers are at 2e59d0d.
Cold-read note: COLD-READ.md beside this file, written before docs/reviews/ was opened. Returned 2026-09-25. -->

## Verdict: **release after fixes.**

Three blocking findings, all small to fix, none of them found by the earlier reviews. Everything the batch B–C review asked for (N1–N3, minors 1–10) is present at 2e59d0d. The security surfaces I could read are sound. What I could not do is run anything: every test, build and check is **unavailable** in this record and must come from reviewer A or the coordinator.

## How this was reviewed

- **Verified by reading source at 2e59d0d:** every file under `src/`, `scripts/`, `workers/contact/`, `.github/workflows/`, `public/_redirects`, `robots.txt`, the root docs, the plan, ADRs 0004/0005, the two batch reviews, Astro's `dist/core/build/incremental.js`.
- **Verified against a public spec:** Cloudflare Pages serving behaviour (developers.cloudflare.com/pages/configuration/serving-pages, fetched 2026-09-25).
- **Inferred, not verified:** anything that needs a shell. `npm test`, `npm run build`, `check:posts`, `check:dist`, `check:files`, `npm audit`, `git log/diff 29e1453..2e59d0d`, dist file counts, the generated JSON Schema bytes, and "the contact Worker is unchanged this phase" (no diff available; inferred from CHANGELOG, which records no Worker change after 0.1.5, and from reading the Worker source, which matches the 0.1.5 description). Where the batch B–C review ran a probe on the same code, I cite it as that reviewer's evidence, not mine.

## Findings, ranked

### Blocking

**B-1. No 404 page. Cloudflare Pages therefore answers every unknown URL with the home page, status 200.**
- Where: `src/pages/` (no `404.astro`; glob confirmed). Plan §1 and task B6 promise "a new 404". Not in CHANGELOG, PROGRESS or BACKLOG: dropped silently.
- Evidence: Cloudflare docs, "When a project lacks a top-level `404.html` file … Pages assumes that you are deploying a single-page application" and "matches all incoming paths to the root (`/`)". Astro writes `dist/404.html` only from `src/pages/404.astro`.
- Failure scenario: `/posts/typo/`, `/section/nonsense/`, a slug that was renamed, `/wp-admin/` from a scanner: all return the home page with HTTP 200. Search engines see soft-404s across a news site that is about to go public and be crawled hard; readers get no "not found"; the `_redirects` stubs for retired desks are the only paths that behave.
- Whether pre-existing: unknown (base commit not inspectable). It is a plan deliverable either way.
- Fix: `src/pages/404.astro` on `BaseLayout` with `noindex`, a search box link and the habitat list; confirm `dist/404.html` exists in the build. One task.

**B-2. Plan decision D12 ("nothing time-relative is rendered at build") is violated, and the phase's own acceptance checks B3 and C5 fail on it.**
- Where: `src/components/ExtinctionList.astro:18-26` writes `"3"` + `"Days left"`, `"Day left"`, `"Goes today"` into static HTML from a build-time `daysLeft` (`index.astro:52`, `extinction-watch.astro:7`, both `new Date()` at build). Plan D12: "sunsets show an absolute date … a small script adds 'in N days' client-side. Without JS the reader sees the date only, never a wrong state." B3: "Check: no 'today'/'days left' … in `dist/index.html`." C5: "no time-relative strings in `dist/`."
- Evidence: the client script (lines 52-79) recounts for JS readers only. The home page is rebuilt only when a deploy runs; with no new post and no scheduled post there is no deploy, and the count freezes. `docs/bestiary.md:71` documents the build-time count as the design, so docs match code but not the approved plan, and no ADR or plan revision records the change.
- Failure scenario: the live `openai-legacy-instruct-base-hard-remove-2026-09-28` sunset. Built 2026-09-25 it reads "3 Days left"; on 2026-10-02 with no deploy in between, raw HTML still says "3 Days left" to no-JS readers, search snippets, feed scrapers and the LLM readers the site is built for. The product's promise is "no invented numbers" (D5); this is a stale one.
- Fix: render the absolute date in the static markup ("Shuts down Sep 28"), keep `data-sunset` and let the script add the count; or, if Michel prefers the current design, record a plan revision and drop B3/C5's check. Either is one task. Ranked Blocking because it is a safeguard the plan made explicit and an acceptance criterion of this phase; the validator may downgrade to Minor if Michel accepts the revision.

**B-3. The contract v1 that this release publishes accepts an empty `title`, an empty `description` and empty tag strings; narrowing it after publication is a v2.**
- Where: `src/content/post-schema.ts:86-87` (`title: z.string()`, `description: z.string()`), `:93` (`tags: z.array(z.string())`). No `min(1)`, no maximum anywhere on the three most-rendered fields.
- Evidence: a bot posting `title: ""` passes `.strict()`, `check:posts` (which does not look at title) and the build. Result: `<h1></h1>` (`[slug].astro:130`), `<title> · AI Tamer</title>` (`BaseLayout.astro:36`), JSON-LD `headline: ""`, an RSS item with an empty title, an empty search result. ADR 0004 and POST.md §2 promise the contract "only grows"; `/contract/v1/post.schema.json` becomes the writers' validation target with v0.2.0. Adding `min(1)` afterwards rejects frontmatter v1 declared valid. Same now-or-never shape as batch A's B5 and batch B–C's minor 2, both fixed for that reason.
- Failure scenario: atn-mcp validates a post with a blank headline against the published schema, gets "valid", commits; the deploy publishes a headline-less specimen with a permanent number.
- Fix: `title: z.string().min(1).max(200)`, `description: z.string().min(1).max(300)`, `tags: z.array(z.string().min(1).max(40))` (limits to taste; the point is `min(1)` now). Two tests. Confirm the 25 posts pass. One task, before the tag.

### Minor (documentation or copy that misdescribes the code or the product)

**M-1. The privacy and terms pages still describe the retired GitHub Pages mirror, while CHANGELOG 0.1.17 says the privacy page no longer does.**
- `src/pages/privacy.astro:43-44`: "The form on the GitHub Pages copy posts to the same place." `src/pages/terms.astro:23-24`: "A mirror may exist on GitHub Pages; if the two differ, aitamer.news wins." CHANGELOG 0.1.17: "Privacy page: the GitHub Pages copy is gone from the copy." Plan V3 retired the mirror. Fix: delete both sentences.

**M-2. README's post template fails the contract it links to.**
- `README.md:59` `heroImage: /images/foo.jpg` fails the `heroImage` regex at `post-schema.ts:99` (`/heroes/<slug>.jpg` or `https://`). A human following the README gets a build error. README also still says "section chips" (line 139), "PostCard, badges, chips" (33), "editorial dark theme" (35). Fix: copy POST.md's example, refresh the three lines.

**M-3. Two plan tasks were dropped without a record, and the plan carries no task status.**
- B6's 404 (B-1) and C5 "Copy and accessibility pass" (contrast recorded, `aria-current`, reduced motion, "no dead links (scripted)", "no time-relative strings in dist/") have no CHANGELOG entry, no BACKLOG line and no note in the plan. Of C5, `aria-current` and `prefers-reduced-motion` (`global.css:798`) exist; contrast numbers live only inside the batch B–C review; there is no dead-link script. `PLAN.md` says "running"; the plan document marks no task done, deferred or dropped (rule 4.3 asks for status and dates). Fix: a status line per task in the plan, BACKLOG lines for what is deferred, and the release notes saying what shipped.

**M-4. The bot author's public bio begins "Placeholder".**
- `src/content/authors/desk-bot.md:4`. Rendered on `/authors/desk-bot/` and in the home "Tamers" panel. Fix: drop the word.

**M-5. ADR 0004 does not record the trust model the batch B–C review asked it to state (minor 2).**
- The `sources[].url` fix landed; the ADR still does not say that Markdown bodies accept raw HTML and that writers are trusted. One paragraph.

### Informational

1. **The full-history privacy audit (plan V2) is not evidenced in the tree.** The batch B–C review (informational 6) found internal newsroom text and `/workspace/atn-design-options/` paths in history. Rule 6.4 forbids rewriting it, so going public needs Michel's explicit acceptance of what history holds, or a fresh repository. The release itself does not depend on it; the visibility flip does.
2. **V2's repository protections (rulesets, read-only default token, fork-workflow approval, secret scanning with push protection) are GitHub settings**, invisible from the tree. The gate cannot confirm them; the coordinator should, before the flip.
3. **`deploy-github-pages.yml` is disabled only in the GitHub UI.** The file still triggers on push to `main` with `pages: write` and `id-token: write`, and runs `check:times` instead of `check:posts`. Already `BACKLOG.md:19`. Delete it or neutralise the trigger before the repo is public and forkable.
4. **The Cloudflare account id is committed** (`deploy-pages.yml:57`, `deploy-contact-worker.yml:46`). Cloudflare treats it as non-secret; the token stays a secret. No action.
5. **The contact Worker still allow-lists `https://michelabboud.github.io`** (`handler.mjs:8`). Plan scope excludes Worker changes and the stale mirror is still served (V3), so this is consistent today; remove it when the mirror is unpublished.
6. **Footer `© {new Date().getFullYear()}`** (`BaseLayout.astro:246`) stays stale on cached pages across New Year until code changes. Known from the B–C review.
7. **GitHub disables scheduled workflows after 60 days without repository activity.** With bot posts landing daily this will not bite; worth a line in the runbook.
8. **`scripts/decode-heroes.mjs` still runs before every build and dev** and deletes `.b64` sources after decoding. Nothing ships `.b64` files now (the workflow was removed in 0.1.12). Harmless dead step; remove it from `package.json` or keep it documented (POST.md §3 still describes it as the path).
9. **`/contract/v1/post.schema.json` re-exports the live handler** (`contract/v1/post.schema.json.ts:7`); it is pinned only until someone forgets to fork it at v2. Accepted in the B–C review; noting it stays true.
10. **`STATION ONLINE`** (`BaseLayout.astro:122`) is a decorative constant, not a status. Not a number, so D5 is not touched.

## Verification of the batch B–C review's rulings at 2e59d0d (by reading)

| Finding | Status at 2e59d0d | Where |
|---|---|---|
| N1 JSON-LD script injection | Fixed | `src/lib/json-ld.ts`; used by `[slug].astro:111-112`, `VideoEmbed.astro:31`, `index.astro:72`; `json-ld.test.ts` covers `</script>`, `<!--`, U+2028 and round-trip |
| N2 scheduled publish never installed deps | Fixed | `scheduled-publish.yml:30` `npm ci --omit=dev --ignore-scripts`; `cli-smoke.test.mjs` runs `due-posts.mjs` as a subprocess |
| N3 file budget | Fixed | ADR 0005; `check-dist-files.mjs` (warn 16,000, fail 19,500) in `deploy-pages.yml:49-50`; `BACKLOG.md:24` corrected; vetting report addendum |
| Minor 1 PR check does not build | Fixed | `check-posts.yml:47-48` |
| Minor 2 source URL scheme | Fixed (ADR note not added, M-5) | `post-schema.ts:131`; tested |
| Minor 3 home `<h1>` | Fixed | `BaseLayout.astro:137` |
| Minor 4 `dateModified` rule | Fixed | `[slug].astro:76-78` uses the maximum |
| Minor 5 slug reuse inherits number | Fixed | `stamp-specimens.mjs:388-395` requires `--restore` |
| Minor 6 POST.md date-only future pubDate | Fixed | `POST.md:88` matches `stamp-post-times.mjs` + `due-posts.mjs` behaviour |
| Minor 7 llms.txt wording | Fixed | `llms.txt.ts:49` |
| Minor 8 opener-only note | Fixed | `about.astro:188-193` |
| Minor 9 JSON Schema rejects draft date | Fixed (inferred) | `pubDate: strictDate()` (`post-schema.ts:89`) is a union including `z.iso.date()`; generated bytes not inspected |
| Minor 10 / M3 ARCHITECTURE | Fixed | `ARCHITECTURE.md:9-10` |
| Info 7 robustness | Fixed | `sitemap-data.mjs:47` names the file; `updatedDate` uses `strictDate()` |

Batch A's six blockers were re-verified by the B–C review with probes; I re-read the code paths (`frontmatter.mjs`, `stamp-specimens.mjs` order validate → compute → ledger → posts, void lines, `.strict()`, withdrawn rendering, index-based splice) and agree.

## Checked and found sound (risk classes from the brief)

- **Security, post data → HTML.** Every post field reaches HTML through Astro expressions (escaped). `set:html` only at `toJsonLd()` output and `redirectStubHtml()` (constants, escaped). Regex-bounded: `sources[].url` (`^https?://\S+$`), `video.youtube` (11-char id), `heroImage`, wildness rating (int 1–5) before any `style=`. `news-sitemap.ts` escapes XML; `llms.txt` escapes `[`/`]`; RSS via `@astrojs/rss`; JSON feed via `JSON.stringify`. Pagefind indexes only `data-pagefind-body` pages; withdrawn posts carry none.
- **Security, contact Worker.** Origin allow-list, 32 KB cap before read, fail-closed rate limits, honeypot, strict address pattern, name stripped of header syntax, Turnstile optional, no token, secrets never in the build (`check-dist-secrets.mjs` compares values without printing). Consistent with 0.1.5 and ADR 0003; diff unavailable.
- **Security, workflows.** `deploy-pages.yml` `contents: read`, wrangler-action pinned to a commit, token from a secret. `check-posts.yml` on `pull_request` with `persist-credentials: false`, no secrets: fork-safe after going public. `scheduled-publish.yml` `contents: read` + `actions: write`; `workflow_dispatch` is the documented exception to the "GITHUB_TOKEN does not trigger workflows" rule. `deploy-contact-worker.yml` path-scoped.
- **Security, secrets in tree.** Grep for private paths, key shapes, e-mails: false positives only ("desk-bot" matches `sk-b`; posts about Claude Code mention `.claude/`). `.gitignore` covers `.env*`, `.dev.vars`, `.wrangler/`.
- **Data integrity.** One `BUILD_TIME` for `isLive`; `getPostPages` vs `getPublishedPosts` used correctly on every page, feed, sitemap and JSON-LD I read; withdrawn = `noindex`, no body, no NewsArticle, no comments, out of lists/feeds/search/sitemap; scheduled = absent everywhere until due. Ledger: 25 lines, append-only, `void:` repair, `--restore` gate, atomic writes, all-or-nothing order. `frontmatter.mjs` parses with js-yaml and re-verifies every edit.
- **Operations at scale.** Incremental cache (read Astro's `incremental.js`): skip requires a `cacheKey`, matching template dependency hash, matching key and content hashes; config/lockfile change discards the manifest. Pages without `getStaticPaths` are always rebuilt; section/month/author keys change when a scheduled post goes live. D11 holds (counts only on home). Feeds capped at 50; news sitemap 48 h/1,000; file budget guarded. Gloock requested at 400 only.
- **Plan conformance, shipped as promised:** A1–A6, B1–B5, B7, C1–C4, C6, C7 are present and match the plan or its §9 revision (bestiary.ts in place of counts.ts/sunset.ts). Gaps: B6's 404 (B-1), C5 (M-3), D12 (B-2), C8's protections (informational 2).

## Unavailable (must come from reviewer A or the coordinator before the tag)

- `npm test`, `npm run check:posts`, `npm run build`, `npm run check:dist`, `npm run check:files`, `npm audit` on 2e59d0d.
- `dist/404.html` absence confirmed only by source; `dist/index.html` containing "Days left" confirmed only by source.
- `git diff 29e1453..2e59d0d -- workers/contact` (Worker unchanged).
- The generated `/contract/post.schema.json` bytes.

Next: fix B-1, B-2 and B-3 as one small batch, re-run the checks, then tag.
