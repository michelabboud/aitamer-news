# Deep security review — aitamer-news PR #46, the posts App's authors lane

- Target `49236a3` (site/author-lane), base `1e5f4e9` (main). Reviewer: Opus 5.5 (opus lane), blind to the ari lane.
- Probes: `opus/probes/` — `parsers.mjs` (the check's reader against Astro's reader), `e2e.sh` (the target's own script, run on a scratch clone with crafted single-file branches), `quill-m1.md`.
- Existing tests at the target: `node --test scripts/check-publisher-paths.test.mjs scripts/publisher-pr-workflow.test.mjs` → `tests 63 · pass 63 · fail 0`. They pass because none of the cases below is in them.

## Blocking

### B1. The check and Astro read different frontmatter: an AI writer passes the check as `kind: ai` and is built as `kind: human` (and can take a human's name)

**Where:** `scripts/check-publisher-paths.mjs:233-277` (`authorContentProblems`) relies on `scripts/frontmatter.mjs:28` (`FENCE`); ADR 0018 decision 4 and the workflow header (`.github/workflows/check-publisher-pr.yml:30-32`) claim "the check and the build can never read a different `kind`".

**Why:** both use js-yaml, but they cut the YAML block out of the file differently. Astro 7.3.5's content layer (`vite-plugin-markdown/content-entry-type.js` → `safeParseFrontmatter` → `@astrojs/internal-helpers/dist/frontmatter.js`) uses
`/(?:^﻿?|^\s*\n)(?:---|\+\+\+)([\s\S]*?\n)(?:---|\+\+\+)/` — the block ends at the first line that merely *starts* with `---` **or `+++`**. The site's reader ends it only at a line that is exactly `---` (plus blanks). So a line like `+++: x` or `---x: y` is an ordinary YAML key to the check and the end of the frontmatter to Astro. Astro's block is a strict prefix of the check's. Combined with a YAML merge key (explicit keys override merged ones, so no duplicate-key error), the two readers see different values:

```
---
<<: {kind: human}
name: Quill
bio: …
+++: x
kind: ai
---
```
check → `{kind: "ai", name: "Quill", …}`; Astro → `{kind: "human", name: "Quill", …}` (`probes/parsers.mjs`, cases `plusKey`, `dashKey`, `quillM`).

**Reproduction (end to end, the target's script, `probes/e2e.sh`):**
1. Modify `quill.md` (kind `ai` at the merge base), keeping `name: Quill`, replacing `kind: ai` with `<<: {kind: human}` and appending `+++: x` / `kind: ai` before the closing fence → `check:publisher: 1 changed file … honest` **exit 0**. Astro builds Quill as a human.
2. Add `ghost.md` with the same shape, `name: Ghost Person` → **exit 0**. A new human, through the App.
3. Same trick on `name`: `<<: {kind: human, name: Wiz Cat}` then, after `+++: x`, `name: Unique Name` / `kind: ai`. The check sees a new AI with a unique name; Astro sees a second human "Wiz Cat". The name-clash and "keeps its name" rules are bypassed the same way.

**Impact:** exactly what the lane exists to refuse: an AI writer or bot presented on the site as a person (no "AI writer" badge, schema.org `Person`, feed name without "(AI writer)" — `src/lib/author-kinds.ts:50-64`, counted among humans on the home page), and an AI taking another author's name. Note: the rendered-body gate and the sources exemptions (`check-rendered-body.mjs`, `stamp-specimens.mjs:310`) read `kind` with the same site reader as this check, so they still see `ai` — the security gates hold, the reader-facing honesty does not. (The site's own scripts and Astro disagreeing is pre-existing; this PR makes a trust boundary rest on it.)

**Fix (all three, the first is the real one):**
- In the lane, parse with Astro's own function — `import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter'` (it is in the lockfile) — or better, parse with both and refuse unless the two `data` objects are deep-equal. Longer term, make `scripts/frontmatter.mjs` call Astro's `extractFrontmatter`/`parseFrontmatter` so the site's scripts and the build share one cut.
- Refuse, in author files in the lane, YAML merge keys (`<<`), anchors and aliases, TOML (`+++`) fences, and any line in the file that begins with `---` or `+++` other than the two fences. Author profiles need none of it.
- Refuse any top-level key outside the authors schema (`name, kind, bio, avatar, portrait, portraitAlt, beats`, plus `id` if kept) — which also closes B2.

### B2. `slug:` in an author file rebinds its Astro id: an AI file can replace a human's profile (or another writer's)

**Where:** the lane ties the file name to the branch id (`scripts/check-publisher-paths.mjs:183-205`) and ADR 0018 decision 2 says the id rule makes "Astro's id the file name". That is false: the authors collection uses `glob({ base: './src/content/authors', … })` with the default `generateId` (`src/content.config.ts:11`), and Astro's `generateIdDefault` returns `String(data.slug)` when the frontmatter has a `slug` (`node_modules/astro/dist/content/loaders/glob.js:11-14`). A duplicate id is only a warning (`prerenderConflictBehavior` defaults to `"warn"`, the site does not set it); the later entry wins. `scripts/check-authors.mjs` counts file names, so it does not notice either. The lane only compares `kind`, `name` and `id`; `slug` is unchecked.

**Reproduction:**
- `e2e.sh` case 3: add `hijack.md` (`name: Hijack Writer`, `kind: ai`, `slug: wiz-cat`, a human's id) → **exit 0**. Case 4: modify `mai.md` adding `slug: wiz-cat` → **exit 0** (kind, name, id unchanged).
- I ran `astro sync` on a copy of the target with case 3 applied: `[WARN] [glob-loader] authors contains multiple entries with the same slug: wiz-cat`, and the content store's `wiz-cat` entry became `{name: "Hijack Writer", kind: "ai", …}`; "Wiz Cat" was gone from the store.

**Impact:** a human author's posts are attributed to an AI's name and bio (a human's profile changed through the App, in effect), or one AI writer takes over another's profile; case 4 also removes Mai's own id, which silently drops Mai's posts from the build (the failure `check-authors.mjs`'s header describes, invisible to it because it counts file names).

**Fix:** refuse unknown keys (B1, third bullet), explicitly including `slug`; and independently, give the authors (and posts) glob loaders `generateId: ({ entry }) => entry.replace(/\.mdx?$/, '')`, or set `prerenderConflictBehavior: 'error'`, so no file can claim another's id whoever writes it.

### B3. Kind and name are judged at the merge base, not at main: a stale branch edits a file that is a human's on main

**Where:** `scripts/check-publisher-paths.mjs:470-495` (`authorsLaneProblems` reads the base text at `mergeBase`; the clash list at `head`).

**Reproduction** (on the scratch clone): branch from the merge base, the App edits `quill.md`'s bio; main then gets the maintainer's commit `kind: ai → kind: human`. Run the check with `--base <new main> --head <pr>` → **exit 0**, because the merge base still says `ai`. `git merge pr` into that main auto-merges: the result is `kind: human` with `bio: EDITED BY APP. …`. Same shape for the name clash: a human added on main after the branch point is not in the head's tree, so an added AI may take their name.

**Impact:** the App changes a human's profile, the case the coordinator's ruling forbids. Needs the maintainer to re-kind or add an author while a posts App PR is open, and the PR merged without an update; lower likelihood than B1/B2, but the brief counts "pass the check with something the lane should refuse".

**Fix:** also judge at `BASE_SHA` (main at the event): for M, the file at base.sha must exist and be `ai`/`bot` with the same kind and name as the head; for A, the path must be absent at base.sha, and the clash list is the union of base.sha's and the head's author names. Since main can still move after the run without a re-run, also require branches to be up to date before merging in the ruleset (or a merge queue), and say so in ADR 0018 decision 6.

## Minor (docs misdescribe code)

- M1. ADR 0018 decision 4, `check-publisher-pr.yml:30-32`, and the script header (`check-publisher-paths.mjs:62-64`): "the parser Astro uses, so the check and the build can never read a different `kind`". Same library, different block extraction (B1). `scripts/frontmatter.mjs:25` says its fence is "Like Astro's"; it is not (Astro also accepts `+++`/TOML and ends at any line starting `---`/`+++`).
- M2. ADR 0018 decision 2: "so Astro's id is the file name" — not when the frontmatter has `slug` (B2).
- M3. ADR 0018 decision 3 lists what "cannot be read … fails" but the name-clash collection skips nested author files (`ANY_AUTHOR_FILE`, `check-publisher-paths.mjs:139`, is `[^/]+`), while the collection's glob is `**/*.{md,mdx}`. A nested profile on main (maintainer-only) is invisible to the clash rule. Say so, or include nested files.

## Informational

- I1. The install step (`check-publisher-pr.yml:92-105`) keys on the author only, not sender/action/branch; a posts-App-authored PR pushed by someone else installs main's lockfile. Harmless (main's `package.json`/`package-lock.json`, no `.npmrc` in the repo, no git/file dependencies in the lockfile, `--ignore-scripts`), and documented as intentional.
- I2. The bash test (`[[:space:]]`) and JS `trim()` accept slightly different whitespace in `POSTS_ACTOR_ID`; a mismatch only skips the install → fail closed.
- I3. If `POSTS_ACTOR_ID` were set to the publisher's id, the publisher would get the authors lane on `desk/authors-*` branches instead of its own lanes. A configuration error, not reachable by a PR; ADR decision 6 could say "never the publisher's id".
- I4. The lane parses untrusted YAML with js-yaml 4.3.2 in the privileged job. Default schema, no functions; with a 64 KiB cap per file. Acceptable. Alias-expansion denial of service was not probed; its worst case is a slow or failed run for the posts App's own pull request (fail closed), not a pass.
- I5. Side effect of this review: `astro sync` in the probe copy wrote Vite's dependency cache and Astro's data store into the **shared** `node_modules` (`node_modules/.vite/deps`, `node_modules/.astro/data-store.json`) through the symlink. I re-ran the sync without the hijack file; the store no longer contains "Hijack Writer" and contains "Wiz Cat" again. Both are regenerable caches; the next real build reconciles them.

## Refuted hypotheses

- Code from the PR head executing in the privileged job: the checkout is `github.sha` (main), `persist-credentials: false`; the head is only fetched as objects (`refs/remotes/pull/head`), read with `git diff --name-status`, `ls-tree`, `cat-file`; `npm ci` reads main's manifest and lockfile; `.gitattributes`/git config come from main's checkout; `--name-status` runs no textconv or external diff. A lockfile, `package.json`, `.npmrc` or workflow change in the PR has no effect.
- Install gating before the lane: the install runs only when the author id equals `POSTS_ACTOR_ID`; its absence fails closed (reader import throws `UnjudgeableError`, tested).
- Identity: `reopened`, `edited`, a different sender, an unset/blank/non-numeric/`042` variable, an upper-case hex digest, a trailing newline in the branch — all give no lane (probe of `authorsLaneScope`). Maintainer exemption is evaluated first and unchanged; forks and Dependabot cannot author as the App.
- Paths: two files, `.mdx`, nested, upper case, delete, rename (`-M`), type change (`T`), symlink (`120000`), submodule (`160000`), executable (`100755`), mode-only change → all refused by `authorPathProblems`. Copies are not detected (`-C` not passed) so they appear as `A` and get the add rules — fine.
- Duplicate keys, a direct `kind` change, `Kind: AI`/`"ai "`, BOM, CRLF, leading blank lines: same js-yaml, strict string compare; any disagreement here fails closed (the check refuses or the build's `z.enum` does).
- A second frontmatter block after the first: both readers take the first; only the prefix-cut in B1 differs.
- Crash into a pass: `main` is async and awaited at top level; any non-`UnjudgeableError` rejects → node exits non-zero.
- Existing rules: the publisher lanes are unchanged (`changeProblems` untouched, lane only when `lane.applies`); the deploy's push guard still copies just the script and `slug.mjs` and runs standalone — I ran the target's script from an isolated directory in `push` mode over the PR's own range: it judged and refused (exit 1) as it should.

VERDICT: BLOCKED
