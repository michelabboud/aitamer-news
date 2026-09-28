# Cold read — PR #46 (authors lane), target 49236a3, base 1e5f4e9

Written after reading the brief, the diff of the workflow and the script, and ADR 0018; before running anything.

## What I think the change does
- `publisher-paths` (pull_request_target, main's workflow + script) gains a third lane for the posts App:
  author == sender == POSTS_ACTOR_ID, action opened/synchronize, head ref `desk/authors-<desk>-<16hex>-<id>`,
  exactly one `src/content/authors/<id>.md`, A or M, mode 100644, id == branch id.
- Honesty: kind at merge base (M) / head (A) must be ai|bot; M keeps kind, name, id; A: id field == file id,
  name not colliding (NFKC/trim/space/casefold) with other authors' names at the head.
- Parsed with scripts/frontmatter.mjs (js-yaml load, default schema) imported dynamically; workflow runs
  `npm ci --ignore-scripts` from main's checkout when PR author id == POSTS_ACTOR_ID.

## Where I expect the risk to be (hypotheses to test)
1. Install gate vs. lane gate mismatch: install keys on author only (not sender/action/branch). Fine as long as
   the checkout is main and nothing from the head is on disk. Check: does anything in the workspace come from the
   head? `git fetch` of refs/pull/N/head does not touch the worktree. `.npmrc` is main's. OK in principle.
2. Parser disagreement Astro vs frontmatter.mjs: does Astro's content layer (glob loader for authors) use the same
   fence regex and js-yaml load? Differences: BOM, leading blank lines, `---` followed by trailing chars, CRLF,
   Astro possibly using `yaml`/gray-matter for .md in content collections. Also the authors schema may
   transform `kind` (e.g. z.enum with preprocess lowercasing/trim) — if the schema normalizes, then
   `kind: "AI "` vs `kind: ai` could differ from the check's view (check compares strictly; a strict check is
   fail-closed for the lane, but for a *human* at the merge base with `kind: Human` would be refused anyway).
   Key question: can the head read as kind ai to the check but human to Astro? Only if the parsers differ.
3. Name compare on M uses isDeepStrictEqual on raw values: a schema that transforms name (trim) — keeps equal.
   But what if the site's rendered name comes from a different field (e.g. `displayName`, `title`, `aka`,
   `byline`)? Then "keeps its name" would be bypassable by adding another name-bearing field. Must check the
   authors schema.
4. The "human" exemption in the rendered-body gate keys on the author's kind — can an AI file claim to be the
   author of something else, e.g. an `id` field mismatch on M when base had no id? M requires same id presence.
5. Added file: name collision only against other authors' names; case where another author file has no parseable
   name, or name collision against a human's *id* or displayed alias. Also `.mdx` others are included.
6. Rename detection: `-M` means a delete+add of similar content shows as R -> refused; a copy needs -C (not
   passed) so copies appear as A. Two files -> refused. Fine.
7. Merge base vs PR base: base file read at merge base; if main changed the file's kind to human after the merge
   base, the M check reads the old (ai) kind — a PR branched before a maintainer re-kinded an author to human
   would be judged against stale ai kind and could pass; on merge, git's 3-way merge would ... the PR head
   keeps kind ai, main has human: conflict or not depending on edits. Worth a probe. Also the name clash for A
   is judged at the head, not at main's tip: a human added on main after the merge base with the same name
   is invisible.
8. Crash-to-pass: main() is now async; top-level `process.exitCode = await main()`. An uncaught non-Unjudgeable
   throw → node exits non-zero (fail). Good, but verify.
9. POSTS_ACTOR_ID == MAINTAINER_ID or == publisher id: odd config; scope order.
10. Symlinks in head: mode check catches 120000 at path level before content is read; cat-file on a symlink
    blob reads the link text, never follows. Other authors' files read at head could be symlinks/submodules
    (cat-file on a gitlink fails -> Unjudgeable => DoS only for the posts App, fine).
