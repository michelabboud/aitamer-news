# Security review — aitamer-news PR #46, posts App authors lane

**Target:** `49236a32a0df565c31e0ef0897c878690ae36de5` (`site/author-lane`), against `1e5f4e93d57b6f0a4b19717c9da1b956a5101eff` (`main`). **Scope:** read-only review of the target diff, its workflow, script, ADR 0018, and the relevant base behavior. The cold-read note was written before probes. `node_modules` was not changed.

**Evidence status:** CONFIRMED findings below are supported by the pinned source and focused pure-function probes. Git-backed fixture tests were UNVERIFIED in this sandbox: the existing test file reported 39 passes and 19 failures, all 19 failing at test fixture `spawnSync git EPERM` during `git init`, before exercising the intended scenario. `scripts/publisher-pr-workflow.test.mjs` passed as a test-file run. No GitHub ruleset settings or live Action executions were available for inspection.

## Findings

### 1. BLOCKING — a stale branch can edit a profile that is now human

**Location:** `scripts/check-publisher-paths.mjs:445-450,493-495` (target).

**Reproduction:** Start the App branch while `quill.md` has `kind: ai`, then have the App edit only its introduction, far from the frontmatter. Before the PR is opened or synchronized, the maintainer changes `quill.md` on main to `kind: human`. The workflow supplies the new base SHA, but `collectPullRequest` computes the old merge base, and `authorsLaneProblems` reads the protected kind only from that merge base and the App's head. A direct call with merge-base `kind: ai`, head `kind: ai` plus changed introduction, and current-base `kind: human` returned `[]`. The current base is never read for this decision. The two edits can merge without conflict, leaving a human profile with App-authored prose; the author schema accepts that result. This contradicts the rule that a human's file changes only through the maintainer. A branch-up-to-date ruleset could force a rebase, but the check itself does not enforce that condition; the ruleset state was not inspected.

**Fix:** For a modified author, read the file at the event's current base SHA as well. Reject if its protected identity or eligibility differs from the merge-base version, or validate the resulting merge tree against current main and the App contribution. Require a new App head after such a conflict and test a cleanly merging `ai`-to-`human` base change.

### 2. BLOCKING — an added author's name can collide with a newer main author

**Location:** `scripts/check-publisher-paths.mjs:472-489` (target).

**Reproduction:** Cut an App branch from main. The maintainer then adds a different author file on main with `name: Nova`. The App adds `src/content/authors/other-id.md` with `name: Nova` to its old branch. This is one added path; the name scan enumerates only the App head tree, where the newer main file does not exist. The pure content check returns `[]` when given the head's other names and rejects the same new file when `Nova` is included. The files merge at different paths. `src/content.config.ts:10-26` validates each profile's fields but has no cross-author name uniqueness check, so the other required build check does not supply this rule.

**Fix:** Check names in the current base tree as well as the PR head, excluding the proposed path and applying the same normalization. Prefer judging the prospective merge tree, so the exact result to be merged is checked. Add a base-advanced regression case.

### 3. BLOCKING — lowercase conversion is not Unicode case folding

**Location:** `scripts/check-publisher-paths.mjs:223-225,278-280` (target).

**Reproduction:** Put an existing author named `STRASSE` in the head and add an AI author named `Straße`. The ADR requires NFKC plus case folding for clash detection. Unicode full case folding maps `ß` to `ss`, so the names collide under that rule. The code's `.toLowerCase()` produces `strasse` and `straße`; `authorContentProblems` returned `[]` for this pair. Both entries have distinct IDs and valid author fields, so the build's per-entry schema does not reject the collision.

**Fix:** Use a pinned, tested Unicode NFKC case-fold implementation for both names, with a regression test for `STRASSE`/`Straße` and other multi-code-point folds. If the intended policy is only lowercase comparison, narrow the documented rule explicitly and assess the impersonation risk.

### 4. BLOCKING — copying an existing profile can pass as a new file

**Location:** `scripts/check-publisher-paths.mjs:435,196-218` (target).

**Reproduction:** Copy an unchanged existing AI profile to `src/content/authors/nova.md`, change its `name` to a unique value, and use a matching `desk/authors-...-nova` branch. The stated lane forbids copies. The collector runs `git diff --name-status -M`, which enables rename detection only; Git's own `git diff -h` distinguishes `-C` (detect copies) and `--find-copies-harder` (consider unchanged sources). Thus the one new path reaches `authorPathProblems` as `A`, not `C`; a pure probe of that `A` path and valid content returned no problems. The unit test that refuses status `C` does not make the collector emit `C`.

**Fix:** Detect copies from unchanged sources before accepting `A` (for example, `-C --find-copies-harder`, with explicit similarity semantics and a Git-backed regression). If all derivative copies must be excluded, define a deterministic content-provenance rule; Git similarity detection alone has a threshold and cannot prove that no edited copy exists.

### 5. BLOCKING (conditional) — an unreadable existing author is skipped during name checking

**Location:** `scripts/check-publisher-paths.mjs:480-489` (target).

**Reproduction:** If main already contains `src/content/authors/broken.md` with no frontmatter, add a valid `nova.md` through the App lane. `readFrontmatter()` returns `null` for `broken.md`; the loop neither records its name nor rejects it, and the new-file content check can return no problems. A non-string `name` is likewise skipped. ADR 0018 explicitly says that no frontmatter or another author's file that cannot be parsed fails. This condition requires an invalid preexisting main file; whether the separate build job rejects that state was not verified here.

**Fix:** Treat `null` frontmatter and a missing/non-string `name` on every other author as unjudgeable, with a focused regression case. Keep the build check as a separate safety net.

### 6. MINOR — architecture text says the privileged job installs nothing

**Location:** `ARCHITECTURE.md:9` (target).

**Reproduction:** The paragraph still says the `pull_request_target` job is “installing nothing,” then later in the same paragraph says the posts App case installs the lockfile. The workflow installs with `npm ci --ignore-scripts` when the PR author id matches `POSTS_ACTOR_ID` (`.github/workflows/check-publisher-pr.yml:92-105`).

**Fix:** Qualify the earlier sentence: other PRs install nothing; posts App-authored PRs install base-main dependencies without lifecycle scripts.

## Refuted hypotheses and boundaries

- **PR-head code in the privileged job:** No direct route found. `pull_request_target` checks out `github.sha` at the base (`check-publisher-pr.yml:61-68`); the head is fetched as Git objects but not checked out (`:75-90`). The install reads the checked-out base `package.json` and lockfile, not the PR's `.npmrc`, workflow, package files, or symlinks. `--ignore-scripts` disables npm lifecycle scripts. The dynamic import names the checked-out `scripts/frontmatter.mjs`; author bytes are passed to the YAML reader as data. This does not rule out a vulnerability in a trusted dependency or Git/npm itself.
- **Identity and event bypass:** The script requires the configured positive numeric id for both PR author and sender, an `opened` or `synchronize` action, and the branch shape before entering the authors lane. An unset or malformed `POSTS_ACTOR_ID`, a publisher/Dependabot/fork PR under its own account, `edited`, and `reopened` do not receive it. The install step checks the author id before `npm ci` and may install on an App-authored PR whose sender does not qualify for the lane; that still uses only base files. Misconfiguring `POSTS_ACTOR_ID` to another account's id would grant that account the lane, but is not a code bypass.
- **YAML tricks:** Focused comparisons against the lockfile-pinned Astro frontmatter helper showed the same effective `kind` for tested anchors, quoted/cased/spaced scalars, BOM, CRLF, and a second frontmatter-looking body block. Duplicate keys failed in both. The reader's narrower fence recognition can refuse some Astro-accepted forms, which fails closed. No parser split yielding reviewer `ai` and site `human` was found; this is not an exhaustive parser proof.
- **Paths and failures:** The one-path count rejects two files; `R`/`D`/`T` statuses reject renames, deletions and type changes; a changed target's mode must be `100644`, rejecting symlinks, submodules and executables. Unjudgeable Git/YAML input and uncaught exceptions exit nonzero; no route from a crafted PR to an exit-zero crash or to another PR's concurrency group was found. Copy detection is the exception in finding 4.
- **Existing boundaries:** The maintainer exemption is still checked first with author plus sender ids; publisher comment/reaction lane logic is unchanged for other PRs. The deploy workflow has no diff, and its push guard still invokes the prior commit's script in `push` mode; that path does not import `frontmatter.mjs`. Git-backed runtime confirmation of these paths was unavailable because of `EPERM` above.

VERDICT: BLOCKED
