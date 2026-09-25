# Comments are baked static, from data files the desk publishes into this repository

## Context

Disqus is being replaced (phase 2 plan, approved 2026-09-25: the free tier injects advertising
trackers into the comments frame and loads a counting script on every page). Our replacement
keeps the writing side in the private operations repository — a small Worker at
`comments.aitamer.news` accepts a comment, and the desk moderates it in Cloudflare's D1 database
before anyone sees it — and leaves this repository with one question: **how do approved comments
get onto a static page?**

The constraints, in the order they matter:

1. **Page views must cost nothing on the server.** Workers Free gives the whole account
   100,000 requests a day, shared with the contact form. A comment section that is fetched on
   every page view would spend that budget on readers instead of writers, and a flood of views
   would take the contact form down with it.
2. **This repository is public.** Its CI holds one deploy token for Cloudflare Pages and nothing
   that can read or write the comments database. A token that reads D1 would sit in a public
   repository's secrets and in every fork's imagination.
3. **The build must be reproducible offline.** `npm run build` on a laptop, in a worktree, or in
   a pull-request check has no network access to anything but the npm registry, and what it
   produces must be exactly what production shows.
4. **Deploys are incremental** (ADR 0005 and the Bestiary plan): adding one post rebuilds one
   post page and the always-rebuilt lists. A new comment must not rebuild the site.
5. **Comments are read by search engines and language models**, like everything else on this
   site. They belong in the HTML and in the JSON-LD, not behind a script.

## Decision

**Approved comments reach this repository as data files, committed by the desk's publisher, and
the build bakes them into the post pages.**

- **The file.** One JSON file per post that has at least one approved comment:
  `src/content/comments/<slug>.json`, format v1, holding only what the page shows — the comment
  id, the display name, the text, the time, and whether the writer was signed in. Never an email
  address, an IP address, a hash, or a moderation note. A post with zero approved comments has
  no file: the publisher deletes it. The format is a public contract like the post contract
  (ADR 0004): validated by a strict zod schema at every level (`src/content/comment-schema.ts`),
  published as JSON Schema at `/contract/comments.schema.json` and `/contract/v1/`, and only ever
  changed additively. Removing a comment is deleting its entry, or the whole file; `POST.md`
  section 8 and `src/content/comments/README.md` say so.
- **Zero Worker reads.** A page view touches no Worker. The only Worker traffic is a reader
  posting a comment (and, later, opening the form while signed in). The comment count and the
  comments themselves are static HTML and JSON-LD, generated at build time from the collection.
- **The publisher is its own Worker with no route.** The thing that holds a credential able to
  write to this repository runs on a cron trigger and cannot be reached from the internet; the
  public-facing comments Worker holds no GitHub credential at all. The publisher commits at most
  a batch of files per run.
- **The publisher writes through a pull request, never to `main`.** Its credential is a GitHub
  App installation with **Contents: write** and **Pull requests: write**, **no Workflows
  permission**, and it is on no ruleset bypass list. It pushes a `desk/comments-*` branch, opens
  a pull request into `main`, and auto-merge lands the pull request once the required checks
  pass. Three rules make that safe, each of them enough on its own for the case it covers:
  1. **A required check, `publisher-paths`, refuses anything that is not a comment file.** It is
     a `pull_request_target` workflow, so the code that runs is `main`'s copy of the workflow,
     never the pull request's, and it never checks out or executes anything from the pull
     request: it reads the list of changed files through the API and fails unless every change
     is a regular file at `src/content/comments/<slug>.json` — no path outside that directory,
     no symbolic link, no submodule, no executable bit, no rename in or out. It enforces on
     **every** pull request, unless both the pull request's author and the event's sender are
     the maintainer, compared by numeric account id (repository variable `MAINTAINER_ID`; when
     it is unset, the check enforces on every pull request, including the maintainer's). Author
     alone is not enough: the App could push a commit into someone else's open pull request —
     Dependabot's, say — and an author-only test would wave it through.
  2. **A branch ruleset lets the App update only `desk/comments-*` branches** (the maintainer
     keeps a bypass). It cannot push to `main`, to a release branch, or to anyone else's branch,
     whatever its token permissions say.
  3. **The deploy workflow refuses a push to `main` by the publisher App whose range touches
     anything outside `src/content/comments/`.** Defence in depth for the day a ruleset is
     edited by mistake: the deploy does not happen, and the push is reported.

  Michel's own pushes to `main` keep working through the ruleset's administrator bypass; the
  required check and the ruleset constrain the App, not him.

  **Why a guard that runs after the push was rejected** (that is what the first draft of this
  decision said). A post-push guard sees the commit when it is already on `main`. Refusing the
  deploy does not remove it: the next push by anyone — a post, a fix — deploys `main` with the
  refused commit in it, so the guard would have to revert, and a CI job that reverts is itself
  a writer on `main` with everything that implies. And a credential that can push to `main` and
  carries the `workflows` permission can rewrite the guard in the same push. A pull request with
  a required check moves the decision **before** the write lands, runs the check's code from
  `main` so the pull request cannot alter its own gate, and gives the App no way to reach `main`
  at all. The deploy-time refusal stays only as the third layer, not as the design.
- **`check:posts` refuses an orphan, and anything in the directory that is not a comment file.**
  A comment file whose slug has no post, or whose `slug` field disagrees with its file name,
  fails `npm run check:posts` naming the file, before the build runs; so does any entry in
  `src/content/comments/` other than `README.md` and regular `<slug>.json` files (a symbolic
  link, a folder, `x.JSON`, `x.json.bak`, a dotfile). A file that breaks the format fails
  `npm run build` naming the file.

## Alternatives rejected

- **The build reads D1 through Cloudflare's REST API, with a token in this repository's CI
  secrets.** No files in git, always current. Rejected: it puts a database-reading token into a
  public repository's secrets, which every workflow run and every future contributor's pull
  request pipeline is one misconfiguration away from exposing; the build then depends on the
  network and on D1's daily read cap (which fails hard since 2026-09-01), so a laptop build or a
  pull-request check shows a different site from production; and every build would rebuild
  every post page, because Astro cannot know which threads changed without a per-entry digest.
- **The publisher writes a JSON snapshot to R2, and the build fetches it.** No token in this
  repository (the bucket would be public-read). Rejected for the same offline and incremental
  reasons: the build needs the network, a snapshot has one digest for all threads so any
  approval rebuilds every post, and comments are no longer reviewable, diffable or revertible
  the way posts are. It also gives the site a second content store to keep consistent with git.
- **Read comments at view time — the page fetches them from the Worker, or an edge function
  renders them.** Always current, nothing in git. Rejected first by constraint 1: page views
  would spend the account-wide Worker budget, and a scraping run or a traffic spike would take
  the contact form down with the comments. It also hides comments from anything that does not
  run JavaScript, which is exactly the crawlers and language models this site is written for.
- **The publisher pushes straight to `main`, and the deploy workflow refuses a push that touches
  anything else.** Simpler: no App, no pull request, no ruleset. Rejected for the reasons in the
  decision: the refused commit is already on `main` and ships with the next push, and a
  credential that can push to `main` can push a change to the guard.

## Consequences

- **Published comments are also in this repository's public git history.** Deleting a file
  removes the comment from the site, not from history. Mitigations, all of them deliberate: only
  displayed data is ever written to a file; the privacy page says that published comments are
  public and kept in the site's public source history; a takedown that must vanish from history
  too is a GitHub support request, which the site does not promise. This is the one real cost of
  the decision, and it is accepted with eyes open (phase 2 plan, risk R1).
- **A bot opens pull requests against this repository.** Every publisher run is a
  `desk/comments-*` branch, a pull request and an auto-merge, so the history carries a merge per
  batch when readers are active. The required check, the ruleset and the App's narrow
  permissions are what make that acceptable. It also means the publisher needs the pull
  request's checks to pass to land anything: a GitHub outage or a red check on `main` holds
  comments back, and that is the right failure.
- **Deploys become more frequent.** Each publisher batch is a deploy. The incremental build keeps
  each one small: a changed `grok-4-7.json` rebuilds `/posts/grok-4-7/` and the always-rebuilt
  pages, nothing else, because the collection entry carries its own digest.
- **One bad comment file blocks every deploy until it is fixed.** The build validates every
  comment file, not only the changed one, and fails naming the file. In the normal path that
  happens on the publisher's pull request (`check-posts.yml` runs `npm run build` on every pull
  request), so a bad file never lands. If one does land — a direct push, a check not marked
  required — no deploy of `main` succeeds until the file is repaired or removed; the previous
  site stays up meanwhile. A publisher that validates against the published contract before it
  commits never gets there.
- **The site cannot show a comment the desk has not published.** Moderation latency is the
  publisher's schedule; there is no "live" path and there is not meant to be one.
- **Two repositories share a contract.** The publisher validates every file against
  `/contract/comments.schema.json` before it commits, and the schema only grows (ADR 0004's rule
  applies unchanged). A breaking change means a new version and a sibling schema route. v1 is
  frozen byte for byte (`src/content/comment-schema.v1.snapshot.json`, checked by the contract
  test); an additive change is a new snapshot and a deliberate review.

## Status

Accepted, 2026-09-25; guard section superseded by 0007.

**Note, 2026-09-25 (later the same day).** The guard in the "Decision" section was rewritten
before anything was built against it, so this is a correction of a same-day draft, not a
supersession: the draft said the publisher would push to `main` and the deploy workflow would
refuse a push touching anything outside `src/content/comments/`; the deep review of the
contract showed why that is not a guard (see "Why a guard that runs after the push was
rejected"), and the review of the comment form refined the required check's author-and-sender
test and added the branch ruleset. As of this note, what exists in this repository is the
contract, the collection, `check:posts` and the rendering; the `publisher-paths` workflow and
the deploy-time refusal are being implemented in a separate lane, and the GitHub App, the
`MAINTAINER_ID` variable, the branch ruleset and auto-merge are repository settings that the
maintainer applies by hand. Nothing in this ADR should be read as already enforced until the
workflow is on `main` and the settings are recorded.
