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
- **The publisher is its own Worker with no route.** The thing that holds a token able to push
  to this repository runs on a cron trigger and cannot be reached from the internet; the
  public-facing comments Worker holds no GitHub token at all. The publisher commits at most a
  batch of files per run, which triggers the normal deploy.
- **This repository defends itself.** The deploy workflow fails any push by the publisher's
  identity whose diff touches a path outside `src/content/comments/`. A flaw in the
  public-facing Worker can at worst write rows to D1; a flaw in the publisher can at worst
  publish comment files, never code.
- **`check:posts` refuses an orphan.** A comment file whose slug has no post, or whose `slug`
  field disagrees with its file name, fails `npm run check:posts` naming the file, before the
  build runs. A file that breaks the format fails `npm run build` naming the file, and the
  previous site stays up.

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

## Consequences

- **Published comments are also in this repository's public git history.** Deleting a file
  removes the comment from the site, not from history. Mitigations, all of them deliberate: only
  displayed data is ever written to a file; the privacy page says that published comments are
  public and kept in the site's public source history; a takedown that must vanish from history
  too is a GitHub support request, which the site does not promise. This is the one real cost of
  the decision, and it is accepted with eyes open (phase 2 plan, risk R1).
- **A bot commits to this repository.** Every publisher run is a commit on `main` by the
  publisher's identity, so the history carries hourly `comments:` commits when readers are
  active. The path guard above is what makes that acceptable.
- **Deploys become more frequent.** Each publisher batch is a deploy. The incremental build keeps
  each one small: a changed `grok-4-7.json` rebuilds `/posts/grok-4-7/` and the always-rebuilt
  pages, nothing else, because the collection entry carries its own digest.
- **The site cannot show a comment the desk has not published.** Moderation latency is the
  publisher's schedule; there is no "live" path and there is not meant to be one.
- **Two repositories share a contract.** The publisher validates every file against
  `/contract/comments.schema.json` before it commits, and the schema only grows (ADR 0004's rule
  applies unchanged). A breaking change means a new version and a sibling schema route.

## Status

Accepted, 2026-09-25.
