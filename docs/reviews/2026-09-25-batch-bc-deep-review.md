<!-- Review record. Target 0ad2563, base 106bdd9 (batches B and C of docs/plans/2026-09-25-bestiary-redesign.md, plus the focused re-review of batch A's fixes).
Kind: deep. Reviewer: Strong tier (Claude Opus 5.5, general-purpose agent with a shell), in-process subagent, working in a detached worktree of 0ad2563
with its own node_modules copy; ran tests, builds and probe builds there. Not blind (single reviewer). Returned 2026-09-25. Committed verbatim by the coordinator. -->

**Verdict: batch B/C should not be ruled yet.** All six batch A blockers are fixed at 0ad2563, but the new work in the range has three Blocking defects: a script injection through JSON-LD, scheduled publishing that has failed every run since 0.1.19, and Pagefind cutting the free plan's 10,000-post headroom to about 6,600.

| # | Finding in the batch A review | Ruling at 0ad2563 | Evidence |
|---|---|---|---|
| B1 | Stampers read YAML with regexes | **Fixed** | `scripts/frontmatter.mjs:53-69` parses with `js-yaml` `load()`, and both stampers, `due-posts` and `sitemap-data` share it. My probe: the README template (comments included) is read as a draft with sources and gets no number. `draft: True`, flow and unindented `sources`, `sources: []` and CRLF+BOM all read correctly. `draft: yes` and duplicate keys are refused. |
| B2 | A failed run leaves an unrepairable ledger | **Fixed** | `stamp-specimens.mjs:509-581` runs validate → compute every text in memory → append ledger → write posts. An empty or `~` specimen, a quoted `"12"`, a non-slug file name and a `slug:` field are all refused before anything is written. Tests "third of three … nothing is written" and "an interrupted run is repaired" pass. |
| B3 | The documented collision fix can never pass | **Fixed** | Void lines (`:206`, `:326-366`); "slug issued twice" check (`:360-363`); `check-posts.yml` runs on pull requests; the end-to-end two-branch test passes; POST.md section 4 describes the repair that actually works. Residual: a direct push to `main` still skips the pull-request check (Info 3). |
| B4 | `withdrawn` publishes the body and stays in the sitemap | **Fixed** | Probe build with a withdrawn post: its body text appears in no file in `dist/`, the page has `noindex`, no NewsArticle JSON-LD, no comments and no `data-pagefind-body`, and it is absent from the sitemap, RSS, `feed.json`, `llms.txt` and the Pagefind index. |
| B5 | Unknown keys silently dropped; loose dates | **Fixed** | `post-schema.ts`: `.strict()` on every object and at the top level. A probe build with `verdit: typo` fails with `Unrecognized key: "verdit"`, so strictness survives `.extend({author})`. Numeric, boolean and offset dates in `sunset` are rejected. ADR 0004 is written. |
| B6 | `String.replace` corrupts `$$` / `$'` | **Fixed** | `withRaw` splices by index (`frontmatter.mjs:91-93`) and `assertOnlyChanged` re-parses the result. Probe: `"from $$ to $' and $&"` comes through byte for byte. |
| M1 | POST.md checklist | Fixed | POST.md section 7 lists `check:posts` and the ledger. |
| M2 | ARCHITECTURE check names | Fixed | `ARCHITECTURE.md:15` |
| M3 | ARCHITECTURE content bullet | **Partly** | `ARCHITECTURE.md:9` still says only `draft: true` keeps a post off listings. Withdrawn and scheduled posts and `getPostPages` are not described, and the scheduled-publish workflow is missing from the document entirely. |
| M4 | PROGRESS content line | Fixed | "25 published posts … seven habitats" |
| M5 | BACKLOG `check:times` | Fixed | `BACKLOG.md:6` |
| M6 | "Catches it at merge" | Fixed | `BACKLOG.md:17` |
| M7 | Creative and Infra colours missing | Fixed (superseded) | `big-top-tokens.css` is deleted, and no `data-section` or `--sec` use remains. |

The batch A informational items were also resolved:
- **Theme change vs build cache:** resolved; see "Checked and sound" below.
- **Slug check on file names (4):** done.
- **Number at stamp time vs go-live (5):** decided in POST.md: the number is issued when the post is stamped.
- **Rename and GitHub Pages workflow (6, 11):** in BACKLOG.
- **`heroImage` pattern (8), contract version (9), wildness constants (10):** done.

**Checks run** (snapshot tree, hard-linked `node_modules`):
- `npm test`: 136 pass, 0 fail.
- `check:posts`: "25 published posts numbered; ledger holds 25 lines".
- `npm run build`: exit 0; "Indexed 25 pages"; 136 files in `dist/`.
- `check:dist`: "78 published files, no secrets".

Probes ran in my own copy of the snapshot, extracted with `git archive` into `scratchpad/review-batchBC/probe/` (plus `nomods/`), using three fixture posts and four builds. Nothing in the snapshot or the live repo was edited.

---

## Blocking

### N1. JSON-LD lets a `</script>` in post data break out of the script and run
- **Where:** `src/pages/posts/[slug].astro:107-108` (NewsArticle and BreadcrumbList), `src/components/VideoEmbed.astro:30` (VideoObject). All use `set:html={JSON.stringify(...)}`.
- **Evidence:** `JSON.stringify` does not escape `<`, `>`, `/` or `<!--`, and `set:html` writes the string raw.
  - Probe post title: `Why </script><script>alert(1)</script> still matters <!--`.
  - Built `dist/posts/probe-xss/index.html` contains `"headline":"Why </script><script>alert(1)</script> still matters <!--"` inside `<script type="application/ld+json">`. That closes the data block and runs an inline script on aitamer.news.
  - The trailing `<!--` swallowed the rest of the page: Pagefind indexed 25 of the 26 eligible pages in that build.
- **Reachable through:** `title` and `description` (unbounded strings), `heroImage` (`https://.*`), `tags`, source URLs, `video.title` and `video.channel`. All of these are written by the bots and atn-mcp.
- **Failure scenario:**
  1. A bot files a web-security story whose headline quotes `</script>`.
  2. The page runs injected script, or goes blank below the head.
  3. The BreadcrumbList copy of the title keeps this true on withdrawn pages too.
- **Fix:** one helper for all three sites, for example `jsonLdSafe(obj) = JSON.stringify(obj).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')`. Add a regression test with `</script>` and `<!--` in the title. The home page's `WebSite` block (`index.astro:71`) holds only constants, but should use the same helper.

### N2. Scheduled publishing has failed on every run since 0.1.19
- **Where:** `.github/workflows/scheduled-publish.yml:22-29`; `scripts/frontmatter.mjs:19`.
- **Evidence:** the workflow checks out and runs `node scripts/due-posts.mjs` with no `npm ci`. Since acb5fee (0.1.19), `due-posts.mjs` imports `frontmatter.mjs`, which imports `js-yaml`. Reproduced on the 0.1.21 scripts with no `node_modules`:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'js-yaml' imported from …/scripts/frontmatter.mjs`, exit 1.
  - No `due=` line is written, so the deploy step never runs.
- **Failure scenario:** every scheduled post stays invisible until an unrelated push to `main`. The failure shows only as a red run in the Actions tab.
- **Fix:**
  - Add `npm ci` (or `npm ci --omit=dev`) before the check.
  - Add a smoke test that runs `node scripts/due-posts.mjs` as a subprocess, so an import error fails `npm test`.
  - The rest of the workflow is sound:
    - Permissions are `contents: read` and `actions: write`.
    - `GITHUB_TOKEN` is allowed to create a `workflow_dispatch` run; GitHub's "no recursive runs" rule exempts `workflow_dispatch` and `repository_dispatch`.
    - The two-hour window against the hourly cron at :07 is correct.

### N3. Pagefind adds one file per post, halving the free plan's 10,000-post headroom
- **Where:** `package.json` build script (`pagefind --site dist`); `BACKLOG.md:24`; `docs/reports/2026-09-25-pagefind-vetting.md`, which never mentions file count.
- **Evidence:** `dist/pagefind/fragment/` holds 25 files for 25 posts (one per indexed page). Each post now costs three deploy files:
  - its page
  - its hero JPEG
  - its Pagefind fragment

  On top of that come the index chunks and about 60 fixed pages.
- **What that means for the ceiling:**
  - With heroes in the repo: about 6,600 posts before the 20,000-file cap.
  - With heroes moved to R2: about 9,900.
  - `BACKLOG.md:24` ("before ~8,000 posts move heroes to R2") is now wrong: 8,000 posts would already be about 24,000 files.
- **Failure scenario:** around 6,600 posts, every deploy is rejected by Cloudflare Pages. The documented fix (R2 heroes) no longer restores 10,000.
- **Fix (needs a decision):** pick one and record it in an ADR and the vetting report:
  - serve `dist/pagefind/` from R2 (Pagefind UI `bundlePath`);
  - index only the newest N posts with `data-pagefind-body`;
  - accept a lower ceiling.

  Then correct `BACKLOG.md:24`.

## Minor
1. **The pull-request check doesn't build, so schema violations still land on `main`.** `check-posts.yml:36-43` runs `npm test` and `check:posts` only. B5's strictness, and retired or unknown `section` values, fail only at `astro build`, which runs only in `deploy-pages.yml`. A typo passes the pull request and then blocks every deploy. Fix: add `npm run build` (or `astro sync`) to `check-posts.yml`.
2. **Source URLs take any scheme.** `post-schema.ts:124-133` has `url: z.string()`, rendered as `<a href>` at `[slug].astro:217`. Probe: `url: "javascript:alert(document.domain)"` is accepted and rendered as `href="javascript:alert(document.domain)"`. This predates the range, but v1 is now published as JSON Schema ("only grows"), so tightening later breaks the promise. Fix: require `https?://` now, the same reasoning as B5. Note that Markdown bodies accept raw HTML anyway, so the trust model is "writers are trusted"; ADR 0004 should say so.
3. **The home page lost its `<h1>`.** At 106bdd9 it had `<h1 class="hero-name">`; the built `dist/index.html` now has none (every other page has exactly one). The wordmark in `BaseLayout.astro:135-138` is a `<span>`. Fix: render the wordmark name as `h1` when `home` is set.
4. **JSON-LD `dateModified` disagrees with the sitemap.** `[slug].astro:74` uses `updatedDate ?? corrections.at(-1)`, which is file order and ignores a correction newer than `updatedDate`. `sitemap-data.mjs:72-74` takes the maximum. Fix: use the same maximum.
5. **A slug reused after deletion inherits the old story's number.** `stamp-specimens.mjs:244-245` restores any live ledger number held by the slug. If a post is deleted and a new story is filed under the same slug (weekly `open-weights-roundup`-style slugs), the new story silently gets the old citable number. Fix: restore only with an explicit `--restore`, or record enough in the ledger (for example the `pubDate`) to tell an interrupted run apart from a reused slug.
6. **POST.md is wrong about date-only future `pubDate`.** POST.md line 88 says such a post goes live "the next time anything deploys … not at a precise hour". In fact `check:times` refuses a published date-only post, and `stamp` rewrites it to `YYYY-MM-DDT00:00:00Z`. Probe: `2030-01-01` becomes `2030-01-01T00:00:00Z`, and `due-posts` then triggers a deploy at 00:07. `stamp` also prints the misleading "went live on a different day … set the real time by hand" for it.
7. **`llms.txt` overstates the rules.** `llms.txt.ts:49` says numbers are "assigned once, in publish order" (false for scheduled posts, per POST.md) and "every story lists its sources" (Opinion is exempt).
8. **The About topic prefill can send an empty note.** `about.astro:174-177`: a prefilled `"Correction: "` is not user-edited, so the browser's `minlength` doesn't apply, and it passes the Worker's `MESSAGE_MIN = 10`. A reader can send a note that is only the opener. The form markup and the Worker are unchanged (verified by diff). Fix: refuse a submit whose value equals the opener.
9. **The published JSON Schema rejects the documented draft form.** It declares `pubDate` as `format: date-time`, but POST.md tells writers to use a plain date while drafting. A validator that enforces formats (ajv-formats) rejects that for atn-mcp.
10. **M3 is only partly fixed** (see the table).

## Informational
1. **Theme changes do invalidate cached pages.** Astro's source, `node_modules/astro/dist/core/build/incremental.js`, skips a page only if the route's `dependencyHash` matches. `plugin-incremental.js` hashes every transitively imported module plus compiled CSS; config and lockfile hashes invalidate everything. Measured in the probe:
   - rebuild with no change: 43 pages cached;
   - after appending one CSS rule: 0 cached;
   - after editing `BaseLayout`: 0 cached, and the new text is present in post HTML.

   Remaining gap: the footer `© {new Date().getFullYear()}` (`BaseLayout.astro:246`) stays stale on cached pages across New Year until code changes.
2. **The YouTube privacy claim holds.** The built page has no `<iframe>` or `<img>` from YouTube before the click; `i.ytimg.com` appears only inside JSON-LD, which browsers do not fetch. The ID is limited to `^[A-Za-z0-9_-]{11}$`, so it cannot inject into URLs. The privacy page says the same.
3. **Scheduled-publish operations.**
   - GitHub disables cron workflows after 60 days without repository activity.
   - A dispatched deploy that fails `check:posts` is not retried once the post leaves the two-hour window.
   - A solo push straight to `main` bypasses `check-posts.yml`, so a number collision is then caught only at deploy.
4. **Scale at 10,000 posts** (pagination is already in BACKLOG line 8):
   - The desk-bot author page is 37.5 KB for about 21 posts, roughly 15 MB at 10,000, and it is re-rendered on every post.
   - Habitat, author and archive cache keys concatenate every entry stamp.
   - Feeds are correctly capped at 50.
5. **Contrast** (WCAG, computed):
   - `#9aa39b` on `#111513`: **7.09:1**
   - ember `#ff7a45` on night: **7.12:1**
   - `--ember-text` on night: 7.91:1
   - `--ink-tag` on bone (specimen tag, 10px): 6.48:1
   - `--ink-tag` on night: 2.28:1, but I found no text of that colour on night

   Form focus drops the outline (`global.css:661`) but changes the border from 1.82:1 to 14.78:1 against night. Landmarks are all labelled; there is exactly one `main`.
6. **Public-repo cleanup** fixed HEAD only. History still holds the deleted `draft-internal-tooling-notes.md`, the newsroom-routing `posting-standards.md` ("Human Gate waived … EIC standing authority") and `/workspace/atn-design-options/` paths. Nothing secret, but the plan's step V2 ("privacy audit of the full history") still has to be done. The Cloudflare account id in the workflows is not a secret (ADR 0002).
7. **Small robustness gaps.**
   - `sitemap-data.mjs:46` destructures `readFrontmatter()`, which is `null` for a file with no frontmatter, so the config crashes with an unclear error.
   - `updatedDate` still uses `z.coerce.date()`: `20261023` is accepted as 1970 (probe).
   - `/contract/v1/` re-exports the live handler, so it is pinned only until someone forgets to fork it on a breaking change.

## Checked and found sound
- **Pagefind search:**
  - base-aware `bundlePath` and `baseUrl`;
  - `noindex` on the search page and excluded from the sitemap;
  - withdrawn and scheduled posts left out of the index;
  - comments, rating link and video excluded (`data-pagefind-ignore`).
- **Scheduled posts** appear in no page, feed, sitemap or index before their time (probe with a 2030 post).
- **Feeds and sitemaps:**
  - news sitemap: 48-hour window, 1,000 cap, XML escaping;
  - RSS, JSON Feed and `llms.txt` capped at 50, all through `getPublishedPosts`;
  - sitemap drops withdrawn and future posts and carries `lastmod`.
- **Ledger:** append-only arithmetic, and atomic writes for the ledger and posts.

Next: fix N2 first. It is one `npm ci` line plus a subprocess smoke test, and until then no scheduled post goes live on time.
