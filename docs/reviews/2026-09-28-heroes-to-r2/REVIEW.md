# Deep review (data-risk class): c554515 `site/heroes-to-r2` against 060c610

Reviewer: Opus 5.5, independent, read-only. Cold read written first: `COLD-READ.md`.
The checkout was used as-is. I added one untracked `node_modules` symlink to run `npm test` and ran no `astro` commands. Every network request was a read-only GET or HEAD.

## Verification evidence

### 1. Data integrity: posts and bytes

- **Only the hero line changed in each post.** The diff of `src/content/posts` holds exactly 44 `-` lines and 44 `+` lines, and all of them are `heroImage` lines. `git diff 060c610 c554515 -- src/content/posts | grep -E '^[-+][^-+]' | grep -v heroImage` prints nothing.
- **Each post points at its own image.** A loop over all 44 files asserted that the old line equals `heroImage: /heroes/<basename>.jpg` and the new line equals `heroImage: https://media.aitamer.news/heroes/<basename>.jpg`. There were 0 mismatches. That includes the five posts by Mai: `a-voice-not-a-report`, `routing-is-two-systems`, `the-gap-between-the-needles`, `more-context-isnt-better` and `the-scroll-and-the-clock`.
- **The lists agree.** Base had 44 files in `public/heroes/` and there are 44 posts. `LEGACY_HEROES` equals the base file list exactly (`comm -3` is empty), and no post lacks a `heroImage`.
- **Live, every URL answers correctly:** `HEAD 200 image/jpeg: 44/44`.
- **Live, every byte matches git.** The sha256 of each GET body was compared with `git show 060c610:public/heroes/<slug>.jpg | sha256sum` for **all 44**, not a sample: `sha256 match: 44/44`.
- **The project's own check agrees:** `check:media: 44/44 post heroes on https://media.aitamer.news answer 200 image/jpeg.` (exit 0).
- **The media host sends the expected headers:** `cache-control: public, max-age=86400`, `x-content-type-options: nosniff`, `cross-origin-resource-policy: cross-origin`, and an MD5 ETag.

### 2. Tests and checks

- `npm test`: `ℹ tests 676 · ℹ pass 676 · ℹ fail 0`.
- `npm run check:posts`: `check:times: every published post has a publish time and its hero on the media host.` · `check:specimens: 44 published posts numbered; ledger holds 44 lines.` · `made-on-youtube-2026-gemini-ask-studio.md: 2 known finding(s) excused while the file is unchanged (GRANDFATHERED_POSTS)`.
- The test that keeps account details out of the public repo passes: `✔ no tracked file carries a literal Cloudflare account id` (5/5 pass). No secret, account id or token appears in the added lines.

### 3. The new `check:posts` rule, attacked directly

I ran `heroProblem` (`scripts/stamp-post-times.mjs:70`) on 22 hand-written cases:

- **Refused, as they should be:** another post's slug, another host, `http:`, a query string, a `#fragment`, a trailing slash, an uppercase host, a percent-encoded slug, a userinfo trick (`https://media.aitamer.news@evil.example/…`), a trailing space, the old `/heroes/<slug>.jpg` path when the file is absent, `heroImage:` left empty (null), `heroImage: ""`, `draft: False`, and no `draft` field at all (which means published by default).
- **Passed, correctly:** the exact URL (plain or quoted), a post with no hero, a draft carrying a wrong hero, and a scheduled post dated 2099 with the right URL.
- **Passed but harmless:** `draft: "false"` and `draft: no` are strings, so the check does not judge the post. The schema's `z.boolean()` fails the build on them anyway.
- **A draft flipping to published:** the check applies the moment `draft` becomes false, so the flip itself is gated.
- **Slug derivation:** the check uses the file name, and `scripts/slug.mjs` (enforced in `check:posts`) guarantees Astro derives the same id from it. The check does not depend on `PUBLIC_MEDIA_BASE`, because `heroUrl` uses the constant `MEDIA_ORIGIN`.

### 4. Redirects and the deploy

- **`public/_redirects`** holds 44 static lines in the form `/heroes/<slug>.jpg https://media.aitamer.news/heroes/<slug>.jpg 301`, after the 20 section lines, with no overlap between the two groups. Pages accepts absolute targets on another domain in this file. The 64 rules are far under the 2,000-rule static limit.
- **`_headers`** has no `/heroes/*` rule. The diagrams lockdown and the CSP are unaffected: `img-src` already allows `https:`.
- **Smoke test:** a rule whose target is absolute must now land on the same origin *and* the same path. A relative target is still compared by path only. The test covers both faults, `redirect-other-host` and `redirect-same-host`.
- **Reserved names:** `reservedTopLevelNames` reads the first segment of each source path in `_redirects`. It ignores comments and blank lines, and handles CRLF (because of `trim`) and absolute sources (`split('/')[1]` is `''`, so they are skipped). `[writer].astro` and the test are its only callers, and both pass the file.
- **Nothing stale in the build:** no reference to `public/heroes` or `decode-heroes` remains in `.github/workflows`, `package.json`, `astro.config.mjs` or any test fixture that affects the build. The remaining `/heroes/` strings are in tests of the rejection paths, in historical reviews, in the CHANGELOG, and in `LICENSE-CONTENT.md` (finding N3).
- **No network at build time.** The only `fetch` calls in `src/` are in client-side scripts. `check-media` runs on demand, and its test runs against a local `http.createServer`.

### 5. The re-hashed exempt post (`GRANDFATHERED_POSTS`)

- Base sha256 `52e10338…79580` equals the old constant. Tip sha256 `8973eb96…75ca5` equals the new constant.
- Removing the `heroImage` line from both versions leaves identical files (`diff` is empty). The re-hash is honest: only the hero line changed.

### 6. The edit to the deploy-file-budget decision record (ADR 0005)

Exactly what changed:

- **Context table:** the label "(today)" became "(until 0.2.44)", and the second row gained "(since 0.2.45, ADR 0020)". The numbers are unchanged.
- **Status:** a sentence was appended: step 3.1 is done, it was carried out by the site rather than atn-mcp, the ceiling is now about 9,900 posts, and "only the table's labels were updated".

The Decision, Alternatives and Consequences sections are untouched, so the recorded decision (full-text search stays, the budget is guarded in CI, and the order of moves) is not altered. The record does now say who carried out step 3.1 differently from what it decided ("done by atn-mcp"), and it says so in the Status line rather than by superseding. See N4.

## Findings

### N1 · non-blocking (should be fixed soon) · the deploy no longer catches a hero that was never uploaded

- **Where:** `scripts/check-media.mjs` header, ADR 0020 decision point 4 and its Consequences section. The rule that made the old gate work is `scripts/check-dist-links.mjs` (`img` `src` is resolved against `dist`).
- **What changed:** before this commit, a published post whose `/heroes/<slug>.jpg` was missing failed `check:links` in `deploy-pages.yml:180`, because the link checker resolves same-site `img src` against `dist`. After this commit the hero is on another host, and the link checker skips other hosts by design. `check:media` is on demand only. No gate in either CI or the deploy now proves that a published hero exists. The ADR admits this openly, which is honest, but it is a guarantee the site had and has now lost.
- **Failure scenario:** a bot or an AI writer (Mai's daily posts, the scheduled series) opens a pull request with the correct `heroImage` URL, but the upload failed or was forgotten. `check:posts` passes because the URL string is right, and the post goes live with a broken image on the page, in the card, in the JSON feed and in every social preview. The feed and social caches then keep the broken preview.
- **Fix:** the reason given for keeping this out of the deploy is that "the build must not depend on the media host". That argument does not reach the smoke test, which already runs over the network against the preview deployment before production is promoted. I recommend having `smoke-site.mjs` send a HEAD to the media-host hero of every published post whose page it checks (44 requests today; it can be bounded later to posts changed by the deploy) and fail the preview round on a non-200 response or a non-JPEG content type. The alternative is to run `check:media` in `deploy-pages.yml` between the preview smoke test and the production deploy. In both cases the media host is ours, so an outage there blocking a deploy is acceptable, and it is arguably the right outcome.

### N2 · non-blocking · a leftover exception lets images back into the repository

- **Where:** `scripts/stamp-post-times.mjs:76-78` (`if (value === '/heroes/${slug}.jpg') { if (existsSync(join(heroesDir, …))) return null; … }`).
- **Failure scenario:** a human contributor, or any pull request that can write under `public/`, adds `public/heroes/new-post.jpg` and writes `heroImage: /heroes/new-post.jpg`. `check:posts` passes. The JPEG ships in the deploy and in the repository, which ADR 0020 says never happens again ("Nothing image-shaped goes in the repository"). The redirect list is described as "closed", but the rule that should enforce that is open.
- **Fix:** the migration is finished, so remove the exception and refuse `/heroes/…` outright, with the same helpful message. Add a small test asserting that `public/heroes/` does not exist, or that `public/` contains no `*.jpg` outside the allowed files (`masthead.jpg`, `covers/`). The schema can keep admitting `/heroes/…` for the posts tool, as the author intends.

### N3 · non-blocking · the content licence still names a folder that no longer exists

- **Where:** `LICENSE-CONTENT.md:8`: "The artwork: `public/heroes/`, `public/masthead.jpg`, …".
- **Failure scenario:** the rights reservation for the hero artwork points at a path that is gone. Someone reading the licence finds no hero artwork named there, and the images now served from `https://media.aitamer.news/` are not mentioned at all. Copyright still applies by default, but the whole point of this file is to be explicit.
- **Fix:** change the line to something like "the hero and in-body images served from `https://media.aitamer.news/` (formerly `public/heroes/`)". Michel may want to see this wording change first, since the file is legal text.

### N4 · non-blocking (process) · an accepted decision record was edited in place

- **Where:** `docs/adr/0005-deploy-file-budget.md:11-12` (table labels) and `:37` (Status).
- **What it does:** it does not alter the decision (see section 6). It does rewrite the Context of an accepted record, which the rulebook forbids ("Never edit or delete an old ADR — supersede it"). It also leaves the record internally inconsistent: Consequences line 31 still says "Today's ceiling is about 6,600 posts", while the edited table now says that figure applied only "until 0.2.44". The repository does have precedent for "Amended" notes (the content-security-policy record, 0010), so the house practice is looser than the rule.
- **Fix:** revert the two table labels. Keep a Status note only, for example "Step 3.1 carried out on 2026-09-28 by ADR 0020, which replaces its 'done by atn-mcp' clause." Add "Supersedes ADR 0005 step 3.1 in part (who carries it out)" to ADR 0020's Status or Context. Changing a Status line to point at the record that supersedes it is the one edit the ADR convention allows.

### I1 · informational (pre-existing) · posts in subfolders escape `check:times`

`postFiles` (`scripts/stamp-post-times.mjs:144`) reads only the top level of `src/content/posts/`, while Astro's loader uses `**/*.{md,mdx}` (`src/content.config.ts:43`). A post in a subfolder would be built, but it would escape both the publish-time rule and the new hero rule. This predates the commit, and no subfolders exist today. The cheapest guard is to have `check:posts` refuse any subfolder.

### I2 · informational · the hero-rule tests do not list the tricky variants

The strict `===` comparison already refuses http, query strings, fragments, trailing slashes, case changes, encoded characters and userinfo; I verified all of them (section 3). The unit tests cover only another host, another slug and the old path. A table-driven test of these variants would pin the behaviour against a future "normalise before comparing" refactor that could quietly loosen it.

### I3 · informational · the redirect test ties deleting a post to deleting its redirect

`src/lib/redirects.test.ts` requires every `LEGACY_HEROES` slug to be an existing post. Deleting one of these posts forces removal of its redirect, and the old URL then returns 404 even though ADR 0020 decision point 7 keeps the object in the bucket. That is a defensible choice (the test comment says "the deletion is a decision"). Note it for whoever writes a withdrawal procedure.

## Not found (looked for, clean)

- No change to any post body or frontmatter field other than `heroImage`.
- No mismatched slug and no extra or missing redirect.
- No account id or secret in the added lines.
- No remaining build step that uses `decode-heroes` or `public/heroes`.
- No network access at build time.
- No CSP regression.
- No faulty parsing in `reservedTopLevelNames`.
- No dishonest hash in the exemption list.

VERDICT: CLEAR
