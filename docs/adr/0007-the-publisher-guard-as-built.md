# The publisher guard as built

## Context

ADR 0006 decided that approved comments reach this repository as data files written by the
desk's publisher, a GitHub App, and that three rules keep that App inside
`src/content/comments/`: a required check, a branch ruleset, and a refusal in the deploy. Its
"Decision" section described that guard before it existed, and was corrected in place later the
same day. Two things in it are now wrong:

- it says the required check "reads the list of changed files through the API"; the check as
  built reads them with a local `git diff` on fetched objects, and never calls the API;
- its closing note says the `publisher-paths` workflow and the deploy-time refusal "are being
  implemented"; both are implemented and on `main`.

The deep review of batch A (on `bc4f21b`) also found four things the guard does or does not do
that 0006 never says, and one it gets slightly wrong (the deploy identified the publisher by
login). An accepted ADR is superseded, never edited again (the rule for this log), so this record
**supersedes the guard part of 0006's "Decision" section** — the numbered rules 1 to 3 and the
closing note — and nothing else. 0006's reasons for rejecting a post-push guard, its
alternatives and its consequences stand.

## Decision

The guard is what follows. `CONTRIBUTING.md` ("The desk's publisher and the `publisher-paths`
check") is the operating manual; this is the record of why it has this shape.

1. **The required check `publisher-paths`** (`.github/workflows/check-publisher-pr.yml`, logic in
   the dependency-free `scripts/check-publisher-paths.mjs`) runs on `pull_request_target`, so the
   workflow and the script always come from `main`, never from the pull request. It checks out
   `main` only, installs nothing, and never runs anything from the pull request. It fetches
   `refs/pull/<n>/head`, fails unless that is exactly the event's head commit, and reads the
   changes with `git diff --name-status -z -M` from the merge base to that commit and the file
   modes with `git ls-tree -r` on it — objects that are fetched, never checked out. There is no
   API listing and so no file-count cap. It fails unless every changed path is
   `src/content/comments/<slug>.json`, no rename crosses the lane, and every added or changed file
   is a plain file (mode `100644`: no symbolic link, no submodule, no executable bit). Deletions
   inside the lane pass. It holds every pull request to that rule unless the pull request's author
   and the event's sender are both the maintainer by numeric account id (`vars.MAINTAINER_ID`) on
   an `opened` or `synchronize` event.
2. **The ruleset requires two checks, not one: `publisher-paths` and `check`** (the job of the
   `Check posts` workflow, `.github/workflows/check-posts.yml`: `npm test`, `npm run check:posts`
   and `npm run build`). `publisher-paths` confines the App to comment files; `check` is what
   refuses a comment file that breaks the contract, names a post that does not exist, or breaks
   the build. With only the first required, auto-merge would land a well-placed but invalid file,
   and every deploy of `main` would fail until someone repaired it.
3. **Both required checks are pinned to GitHub Actions as their source** in the ruleset's
   "Require status checks to pass" rule (the check's app, not "any source"). A required check is
   matched by name; with any source allowed, anything that can post a commit status or a check
   run called `publisher-paths` satisfies it — including the App itself, if it ever holds the
   Commit statuses or Checks permission. With the source pinned, only a run of a workflow in this
   repository counts, and the App cannot add or change workflows (no Workflows permission). The
   App is still given neither permission.
4. **The branch ruleset lets the App create and push only `desk/comments-*` branches**; the
   maintainer keeps an administrator bypass, so his direct pushes to `main` keep working.
5. **The deploy's refusal, the second line** (`.github/workflows/deploy-pages.yml`, the first
   step after checkout, before `npm ci` or anything from the pushed tree). The publisher is
   identified by **numeric account id**: the step compares `github.actor_id`, the account that
   pushed, with the repository variable **`PUBLISHER_ACTOR_ID`** (the App's bot account id,
   `gh api users/<app-slug>[bot] --jq .id`). Unset or blank: a notice, and the step skips. Set but
   not a numeric id: the deploy fails, because a typo must not switch the guard off silently. A
   publisher run that is not a push fails, and so does a publisher push whose `before` is all
   zeros or cannot be fetched. Otherwise every path changed between `before` and `after` must be a
   comment file, judged by `check-publisher-paths.mjs` as it was **in the commit before the
   push**, read with `git show` and never checked out, because the pushed tree is what is being
   judged. The who-is-the-publisher decision is inline shell in the workflow, not a script, for
   the same reason; `scripts/deploy-publisher-guard.test.mjs` runs that shell as it stands in the
   workflow file.

## What the guard does not do

These are properties of the design, recorded so nobody relies on the guard for more than it gives.

- **The App can merge any pull request that passes the required checks — the maintainer's own
  included.** It holds Pull requests: write and Contents: write, which is what lets it enable
  auto-merge on its own pull requests; GitHub does not limit that to pull requests the App
  opened. The maintainer's pull requests are exempt from `publisher-paths` (rule 1), so a code
  change of his whose checks are green is mergeable by the App before he means to merge it. The
  mitigation is operational: keep a pull request of your own a **draft** until you mean to merge
  it (a draft cannot be merged by anyone), and do not leave green, unfinished work open as a
  ready pull request. A compromised App could merge ready, green work early; it cannot merge
  anything that fails a required check, and it cannot write anything to `main` of its own.
- **The deploy refusal judges one push, and only that push.** It stops that deploy. The refused
  commit stays on `main`, and the next push by anyone — a post, a fix — deploys `main` with the
  refused commit in it, because that push's own range is judged, not the history before it. So
  after a refusal the **first** thing to do, before any other push to `main`, is revert the
  refused commit; then rotate the App's private key and find out how it reached `main`. The
  refusal is an alarm and a brake, not a repair (0006 explains why a CI job that reverts was
  rejected: it would itself be a writer on `main`).
- **A re-run keeps the original pusher's id.** `github.actor_id` is the account that pushed, and
  GitHub gives no numeric id for the account that re-ran a workflow. So a re-run of a publisher
  push is still judged, but a re-run *by* the App of someone else's push is not. The App is given
  no Actions permission, so it cannot re-run workflows.
- **The workflow file itself comes from the pushed commit.** A push that changes
  `deploy-pages.yml` could change the guard. The App cannot push such a change (no Workflows
  permission, and the ruleset keeps it off `main`), which is why the deploy refusal is only the
  second line and `publisher-paths`, run from `main`, is the first.

## Alternatives rejected

- **Identify the publisher in the deploy by login (`PUBLISHER_ACTOR`, `<app-slug>[bot]`), as the
  first build did.** Readable, but a login is a name: an App can be renamed and its old slug
  taken by another App, and a mistyped login fails open with no signal. The numeric id never
  changes hands, and a value that is not one fails the deploy.
- **Move the who-is-the-publisher decision into `check-publisher-paths.mjs`.** One tested
  language instead of shell. Rejected: the decision has to be made before the step knows whether
  to fetch the previous commit, so the script would have to come from the pushed tree, which is
  the thing being judged. The shell is kept short and is tested by running it from the workflow
  file.
- **List a pull request's changed files through the REST API** (0006's first text). Rejected
  when it was built: the listing is paginated and capped at 3,000 files, and it does not carry
  file modes, so a symbolic link or an executable bit would need a second call per file. A local
  `git diff` on the fetched head has neither limit.
- **Require only `publisher-paths`.** Simpler ruleset. Rejected: rule 2.

## Consequences

- **Setting up the guard is four repository settings, applied by hand:** the variable
  `MAINTAINER_ID`; the variable `PUBLISHER_ACTOR_ID` once the App exists; a branch ruleset on
  `main` requiring `publisher-paths` and `check`, both from GitHub Actions; and a ruleset that
  confines the App to `desk/comments-*`. Until they are applied, the guard is code waiting for
  its settings (`BACKLOG.md` tracks each).
- **Removing a comment goes through the desk, not through this repository.** The publisher
  regenerates each comment file from the desk's database on every run, so 0006's sentence
  "Removing a comment is deleting its entry, or the whole file" is not a removal: the comment
  returns with the next publish. Removal is the desk's delete command, which also erases the
  stored name and text; a hand edit of a file is an emergency stopgap that must be followed the
  same day by the desk's delete (`POST.md` section 8, `src/content/comments/README.md`).
- **The maintainer works with draft pull requests** for anything not ready to merge.

## Status

Accepted, 2026-09-26. Supersedes the guard part of ADR 0006's "Decision" section (rules 1 to 3
and the closing note); the rest of 0006 stands.
