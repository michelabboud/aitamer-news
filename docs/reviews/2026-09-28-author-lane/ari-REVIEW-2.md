# Re-review — aitamer-news PR #46 after both reviews

**Target:** `8dbcce5bc231c97eb16987e6f2741d57a1e3a7cb` (detached checkout). **Requested base:** `49236a32a0df565c31e0ef0897c878690ae36de5`. **Scope:** review only, including ADR 0018 and ADR 0019. The independent [cold read](COLD-READ-2.md) was written before opening the prior [review](REVIEW.md). No repository file, GitHub setting, or `node_modules` target was changed; no Astro sync, build, or dev command ran. The checkout already had an untracked `node_modules` symlink.

**Evidence status:** CONFIRMED for the two findings below and the focused pure-function/reader probes. Git-backed fixture tests are **UNVERIFIED** in this sandbox: `scripts/check-publisher-paths.test.mjs` ran 73 tests, 45 passed and 28 failed before their scenario at `git init`, each with `spawnSync git EPERM` from `scripts/test-support.mjs:36-41`. This matches the prior review's sandbox limit, but is not an integration pass or a product failure. The installed packages were read through the existing symlink; the checkout was not built. GitHub branch-rule settings and live Actions were not inspected.

## Blocking findings

### B1 — an invisible character bypasses the new-author name clash

**Location:** `scripts/check-publisher-paths.mjs:230-245,419-422`; contract in `docs/adr/0018-the-posts-apps-authors-lane.md` decision 3.

**Reproduction:** With an existing author whose `name` is `Nova`, add one otherwise valid `src/content/authors/nova2.md` through the App lane whose `name` is `No\u200Dva` (U+200D ZERO WIDTH JOINER between `o` and `v`). The pure `authorContentProblems({status:'A', ..., otherNames:['Nova']})` returned `[]`; `comparableName('Nova')` returned `"nova"`, while `comparableName('No\u200Dva')` returned `"no\u200Dva"`. The strict author reader accepts that scalar. This makes a visually matching author name pass as new. The ADR claims the implemented fold covers at least Unicode NFKC_Casefold; [Unicode 17's normative NFKC_CF data](https://www.unicode.org/Public/17.0.0/ucd/DerivedNormalizationProps.txt) maps the range `200B..200F`, including U+200D, to the empty string. `String.normalize('NFKC')` plus case conversions does not remove it. U+200C, U+FE0F and other default-ignorable characters show the same gap in the local fold, though the full lane probe here used U+200D.

**Impact:** The specific rule that a new author may not take another author's name is bypassed. The earlier `STRASSE`/`Straße` bug is fixed, but this is another equivalence class the replacement misses.

**Fix:** Compare using a pinned Unicode NFKC_Casefold mapping, or explicitly remove default-ignorable code points as part of a conservative clash key and verify that implementation against the normative mapping. Add a lane-level regression for `Nova`/`No\u200Dva` and similar invisible characters. If the project intentionally wants a narrower name policy, revise the approved decision and address the displayed-name impersonation risk explicitly.

### B2 — the authors lane accepts inline YAML comments despite its plain-form limit

**Location:** `scripts/check-publisher-paths.mjs:264-272,305-320,322-342`; contract in `docs/adr/0018-the-posts-apps-authors-lane.md` decision 4 and `CONTRIBUTING.md`'s authors-lane paragraph.

**Reproduction:** `readAuthorFile('---\nname: Nova # hidden note\nkind: ai\nbio: x\n---\n', readers)` returns `{data:{name:'Nova',kind:'ai',bio:'x'}}`. Likewise `kind: ai # human` and a `beats` item `  - reporting # hidden note` are accepted. `isPlainScalarText` checks the first character and lack of trailing whitespace; it never rejects an unquoted ` #` comment. Both js-yaml and Astro strip the comment, so deep equality also passes. A full App PR with this content can reach the content decision as if it used the mandated no-comment form; the path and other content checks do not reject it.

**Impact:** The approved strict input limit explicitly disallows comments. This does **not** produce a demonstrated Astro/site value split, but it weakens the lane's stated plain-form safeguard and permits hidden text next to the fields used for the honesty decision.

**Fix:** Reject YAML comment tokens in unquoted author scalars and list items, while preserving `#` inside a correctly quoted string or as a literal without YAML comment syntax. Add positive and negative tests through `readAuthorFile` and a complete lane fixture when Git-backed fixtures are available.

## Reproduction ledger from the first review

| Prior finding | Re-check at `8dbcce5` |
| --- | --- |
| 1. Stale branch edits a now-human file | **Resolved at event time.** `authorContentProblems` compares merge-base and current-main text (`scripts/check-publisher-paths.mjs:394-412,644-650`); a merge-base `ai`, current-main `human`, head `ai` bio change returned an explicit human-kind refusal. Git-backed end-to-end fixture unavailable. |
| 2. New author's name collides with a later main author | **Resolved at event time.** The scan includes the event's base tree (`:630-643`); supplying a newer main name to the pure content check refused it (`:419-422`). Git-backed tree scan unavailable. The new Unicode gap is B1 above. |
| 3. `STRASSE` versus `Straße` | **Resolved for that pair.** Both fold to `strasse` and the pure added-author check refuses the collision (`:241-245`). B1 shows the fold is still incomplete relative to the ADR. |
| 4. Copy of an existing profile read as an add | **Mechanism corrected, runtime unverified.** The authors lane calls `collectPullRequest(... copies:true)` and `collect` uses `-M -C --find-copies-harder` (`:577-594,763-768`); a `C` status is rejected by `authorPathProblems` (`:214-216`). The actual Git similarity reproduction was attempted via the test file but stopped by `spawnSync git EPERM` before the fixture existed. Git's default similarity threshold remains an acknowledged tripwire limit in ADR 0018. |
| 5. Unreadable existing author silently skipped | **Resolved in the source path; Git integration unverified.** `namesIn` returns no names for no frontmatter or non-string `name`, and the caller now throws `UnjudgeableError` when neither reader supplies a name (`:351-365,630-642`). Pure probes returned `[]` for those inputs; the caller's no-name branch is visible but Git-backed exercise was unavailable. |
| 6. Architecture says the privileged job installs nothing | **Resolved.** `ARCHITECTURE.md` now states the posts App exception, and `.github/workflows/check-publisher-pr.yml:91-104` installs the base lockfile only when the PR author id matches the configured posts App id. The workflow shell test file passed. |

## The independent review's three blockers

- **Reader split (B1): resolved for the reported payloads.** `readFrontmatter` rejects BOM and CR (`scripts/frontmatter.mjs:106-108`), checks Astro's block detection and fence-like lines (`:109-122`), rejects merge keys, anchors, aliases, tags and duplicate keys (`:123-144`), and compares its data to Astro's parser (`:149-156`). The reported post and author merge-key/`+++` payloads were refused in probes. A 405-case focused fence matrix found no accepted data or offset disagreement. The author lane adds its strict grammar and the second reader comparison (`scripts/check-publisher-paths.mjs:288-342`). No accepted site/Astro split was found; this is not a proof for all YAML inputs. B2 concerns acceptance of comments, with equal parsed values.
- **`slug:` moves an author id (B2): resolved.** The authors glob uses `authorEntryId`, which takes the file path without `.md`/`.mdx` (`src/content.config.ts:15-16`, `src/content/author-id.ts:13-15`). A `slug:` key is also refused in the App lane (`scripts/check-publisher-paths.mjs:311-315`), and `check-authors` detects `.md`/`.mdx` pairs that give one id (`scripts/check-authors.mjs:35-56`). A `hijack.md` with `slug: wiz-cat` still computes `hijack` in the pure helper. The duplicate-id test file passed; Astro sync/build was expressly prohibited in this checkout.
- **Merge-base-only judgement (B3): resolved for the event's base commit.** The content check reads both merge base and event `BASE_SHA`, requires a modified file still to exist on main, rejects a newly added path already on main, and scans names in head and current-main trees (`scripts/check-publisher-paths.mjs:383-423,630-652`). This cannot protect against `main` advancing *after* a successful run. ADR 0018 decision 6 and `BACKLOG.md` explicitly call for an up-to-date branch requirement or merge queue; that GitHub-side gate remains unverified and must be in place before relying on the lane after merge.

## Regression and boundary checks

- Current content: all **39** checked-in post/author files passed `readFrontmatter`; the four checked-in authors also passed `readAuthorFile`. `node scripts/check-authors.mjs`, `node scripts/stamp-post-times.mjs --check`, `node scripts/stamp-specimens.mjs --check`, `node scripts/check-comments.mjs`, `node scripts/check-reactions.mjs` and `node scripts/check-diagrams.mjs` exited 0. Decisive messages included “every published post has a publish time,” “35 published posts numbered; ledger holds 35 lines,” and zero comment, reaction and diagram files. This does not establish that every future honest file is accepted.
- `scripts/frontmatter.test.mjs`, `scripts/check-authors.test.mjs`, and `scripts/publisher-pr-workflow.test.mjs` passed as test files. `git diff --check 49236a3..8dbcce5` reported no whitespace errors. The Git-backed `check-publisher-paths` suite has the sandbox failure described in the header, so its 28 failures are **not** treated as product regressions.
- The ordinary publisher lanes still use `-M` and the dependency-free guard imports (`scripts/check-publisher-paths.mjs:80-84,577-581,763-768`); the posts App alone dynamically imports the site and Astro readers (`:663-673`). The privileged workflow checks out base code and installs its lockfile with `--ignore-scripts` only for posts App-authored pull requests (`.github/workflows/check-publisher-pr.yml:60-68,91-104`). No PR-head code execution route was found in this read.
- The maintainer exemption still occurs before the authors-lane test (`scripts/check-publisher-paths.mjs:733-751`); the deploy push guard still reads only the prior commit's dependency-free script and `slug.mjs` (`.github/workflows/deploy-pages.yml:125-130`). These were source checks, not a live GitHub Action execution.
- The author introduction remains plain text on the writer page (`src/pages/[writer].astro:1-4,32,68-75`), and the regular profile page escapes its bio (`src/pages/authors/[id].astro:41-54`); raw Markdown/HTML execution through a newly added author introduction was a refuted hypothesis.

## Refuted hypotheses and informational boundary

- **A surviving site/Astro frontmatter split:** No accepted split was found in the reported payloads, the reader tests, or the focused fence matrix. The reader's deep data comparison is a final fail-closed check; B2 accepts comments only when both readers agree. This is bounded evidence, not an exhaustive YAML proof.
- **Existing checked-in content broken by the reader:** Refuted for the 39 current post/author files and all four current author profiles in the stricter lane. Future files using the newly refused syntax will intentionally fail under ADR 0019.
- **The new Astro import breaks publisher and maintainer checks:** Refuted by source isolation and the passing workflow test file; the non-author paths do not load the reader. A live Action was not run.
- **Executable author introduction markup:** Refuted by the writer page's plain-text rendering described above.
- **Informational external gate:** An up-to-date-branch rule or merge queue is still required to prevent main from advancing after the event-time `BASE_SHA` judgement. The ADR assigns that GitHub setting to the coordinator after merge; its current state was not verified here.

VERDICT: BLOCKED
