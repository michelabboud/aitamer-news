# The posts App's authors lane: one honest author file per pull request

## Context

The posts MCP (the desk's posting server, private repository, its ADR 0024) can change an
author's profile only by pull request: `author_create` (a human asks for a new author) and
`author_update` (a human edits any author's name, bio, beats or introduction; an AI writer edits
its own bio, beats and introduction) push one commit to a `desk/authors-<desk>-<digest>-<id>`
branch of this repository with the posts GitHub App's token and open a pull request that a human
merges. The desk never merges one.

As the site stood, those pull requests could not land: the required check `publisher-paths`
(ADR 0007) holds every pull request not both opened and pushed by the maintainer to the desk
publisher's two lanes (comments and reactions, ADR 0008), and `src/content/authors/` is in neither.

Opening that directory is a trust-boundary change. The site trusts an author file's `kind`: the
rendered-body gate (ADR 0009, ADR 0011) exempts a post whose author says `kind: human`. An App
that may propose author files may propose a human, or turn a bot into one, or give an AI writer
another author's name. Michel approved the change on 2026-09-28, "with guardrails of honesty",
enforced here on the site and never trusting the tool.

## Decision

1. **A third lane, for the posts App only.** A pull request gets the authors lane when its author
   **and** this event's sender are the posts App, compared by numeric account id with the
   repository variable **`POSTS_ACTOR_ID`**, on an `opened` or `synchronize` event, from a head
   branch that is exactly the posts MCP's `author_branch` shape:
   `desk/authors-<desk: 1–16 lowercase letters or digits>-<16 lowercase hex>-<id>`. The variable
   is the one the posts MCP's runbook already names for this App's bot id; unset, empty or not a
   number, nobody gets the lane. Sender and action are required for the same reason the
   maintainer's exemption requires them (ADR 0007): the publisher pushing into the posts App's
   branch sends that `synchronize` itself, and an `edited` or `reopened` event's sender did not
   put the head there. Outside the lane, the posts App is held to the publisher's rule like
   everyone else, which refuses any author file.
2. **In the lane, exactly one path, and only that rule.** One changed path,
   `src/content/authors/<id>.md`: Markdown, never `.mdx` (whose body runs code at build time),
   not nested, `<id>` the posts MCP's author id rule (`[a-z0-9]+(-[a-z0-9]+)*`, at most 64
   characters, a subset of the site's slug rule), and the id the branch name ends with. The
   entry's id in the build is the file name, and only since the deep review of 49236a3 (finding
   B2): until then the authors collection used the glob loader's default id, which takes a
   `slug` field from the frontmatter when there is one, and a duplicate id is only a warning (the
   later entry wins), so an AI's file with `slug: wiz-cat` replaced a human's profile. The
   collection now sets `generateId` to `authorEntryId` (`src/content/author-id.ts`: the file's
   path without `.md`/`.mdx`), `npm run check:posts` fails when two author files give one id
   (`x.md` and `x.mdx`), and the lane refuses a `slug` key anyway (decision 4). The posts
   collection is not changed here; whether it has the same hole is its own change. Added or modified only: no delete, no rename, no copy, no type change;
   a plain file (mode `100644`). A pull request in the lane is judged by this rule **instead of**
   the publisher's, so the posts App gains nothing but this one file, and the publisher's lanes do
   not gain author files.
3. **Honesty, judged on content.** The file at the merge base and at the head are read from the
   fetched objects (`git cat-file`, at most 64 KiB each), never checked out or run:
   - **only AI writers' and bots' files**: a modified file must say `kind: ai` or `kind: bot` at
     the merge base, an added one at the head. A file whose kind at the merge base is `human`, or
     anything else (an unknown or missing kind: fail closed), is refused through the App whatever
     changed, a bio-only edit included: a human author's file changes only through the
     maintainer, and a new human is the maintainer's to add (the coordinator's ruling of
     2026-09-28, which narrowed the first draft that let the App edit a human's prose);
   - a modified author keeps its `kind` and its `name` (no AI writer or bot renames itself, or
     passes as a person);
   - an added author's name may not be another author's, compared after Unicode NFKC, trimming,
     collapsing whitespace and case folding (`Ｗｉｚ  Ｃａｔ` is `wiz cat`).
   Anything that cannot be read (a file over the cap, another author's file that neither reader
   can parse) fails.
4. **The frontmatter must read the same to the site and to Astro, or it is refused** (amended
   after the deep review of 49236a3, finding B1). The first draft said the site's reader,
   `scripts/frontmatter.mjs`, could never disagree with the build because both use js-yaml. That
   was wrong: Astro's content layer (`parseFrontmatter` in `@astrojs/internal-helpers`) ends the
   block at the first line that merely starts with `---` or `+++`, the site's reader only at a
   line that is exactly `---`, and a YAML merge key (`<<: {kind: human}`) then let the build see
   `kind: human` where the check saw `kind: ai`. Now every file the lane judges must first be in
   one plain form, and is refused otherwise, before any judgement: a first line of exactly `---`;
   `key: <one-line scalar>` lines only (double- or single-quoted, or plain and starting with no
   YAML indicator), with keys from the authors schema (`name`, `kind`, `bio`, `avatar`,
   `portrait`, `portraitAlt`, `beats`; a test pins the list to `src/content.config.ts`), each
   once, and `beats` as `  - <scalar>` items; so no merge key, anchor, alias, tag, flow
   collection, block scalar, comment, continuation line or unknown key (`slug` and `id`
   included); no byte-order mark and no carriage return; and no line after the first starting
   with `---` or `+++` except the one closing `---` (the body's too). Then both the site's reader
   and Astro's own function, resolved from the installed `astro` package and called as Astro calls
   it, parse the file, and their data must be identical; every value must be a string (`beats` a
   list of strings). The posts MCP writes exactly this form. Both readers need the lockfile, so
   the `publisher-paths` job runs `npm ci --ignore-scripts` from `main`'s lockfile, and only for a
   pull request whose author is the posts App; the script imports the readers dynamically, only
   when the lane applies. Every other pull request is judged
   as before by a bare `node`, and the deploy's push guard, which copies only the script and
   `scripts/slug.mjs`, is unchanged. A posts App pull request without the install fails closed.
5. **Everything else about an author file stays with the required check `check`**, which runs
   `npm run check:posts` (whose `check-authors.mjs` refuses a post naming an author with no
   profile) and builds the site (the authors schema; a writer page's clash with a page or public
   folder). Nothing here weakens it. A human merge still stands between every proposal and `main`.
6. **The GitHub side is a separate step, taken by the coordinator after this merges:** set the
   repository variable `POSTS_ACTOR_ID` to the posts App's bot id
   (`gh api 'users/<app-slug>[bot]' --jq .id`), and widen the posts App's branch ruleset to allow
   `desk/authors-*` next to `desk/posts-*`. Until both are done, the lane gives nothing to anyone,
   which is the safe direction.

## Alternatives rejected

- **Trust the posts MCP's own checks** (it already refuses a kind change and an AI writer's
  rename). The site cannot see the tool's code, and a compromised App key bypasses the tool. The
  site enforces its own boundary.
- **Key on the author alone, or on the branch name alone.** The author alone lets another App
  push into the posts App's pull request and pass on its next `edited` event; a branch name is
  chosen by whoever pushes it.
- **A small hand-written frontmatter parser, so the job keeps installing nothing.** A second YAML
  reader that disagrees with Astro on one edge case (a comment, a duplicated key, a flow mapping)
  is a way to show the check one `kind` and the build another; the site already retired its regex
  readers for that reason (`scripts/frontmatter.mjs`, header). Installing the pinned lockfile
  with no install scripts, only for the posts App, costs less than that risk.
- **Let the publisher App carry author files.** It has no reason to, and every widening of its
  reach widens what a leak of its key can do.
- **Let the App edit a human author's prose (bio, beats, introduction), keeping the kind and
  forbidding a borrowed name** (this ADR's first draft). The human merging the pull request would
  have been the only check on words published under a person's name. Refused by the
  coordinator's ruling of 2026-09-28: a human's file changes only through the maintainer.
- **Allow `.mdx` author files.** An `.mdx` body runs code at build time; the posts MCP writes
  `.md` only.

## Consequences

- The posts App's `author_create` and `author_update` pull requests can pass `publisher-paths`
  once the GitHub side is set; a human still merges each one.
- In the posts App's pull requests, js-yaml (pinned 4.3.2, vetted in
  `docs/reports/2026-09-25-yaml-vetting.md`) parses untrusted YAML inside the privileged
  `pull_request_target` job, whose token can only read contents. Before, nothing from the
  lockfile ran there. js-yaml 4's default schema constructs no functions or classes; the install
  runs no scripts.
- The posts MCP's `author_update` on a human author's file (which the MCP allows a human caller)
  opens a pull request that this check refuses; a human's profile changes only by the maintainer
  editing it directly. Until the MCP refuses human targets up front with that reason, such a call
  ends in a failed pull request (BACKLOG, atn-ops). `author_create` already creates humans only in
  the MCP, so it too is refused here: the maintainer adds humans.
- `POSTS_ACTOR_ID` is shared with the posts MCP's own documentation for the posts lane; one
  variable per App.
- Tests: `scripts/check-publisher-paths.test.mjs` (every guardrail refused, a human's file
  refused even for a bio-only edit, one and two files,
  `.mdx`, delete, rename, copy, wrong branch, wrong bot id, another sender, `edited`, the variable
  unset, oversized and unreadable files, the reader missing) and
  `scripts/publisher-pr-workflow.test.mjs` (the install step's own shell).

## Status

Accepted 2026-09-28 (Michel: the posts App may open pull requests that change author files, "with
guardrails of honesty"); narrowed the same day, before merge, to AI writers' and bots' files only
(the coordinator's ruling). The GitHub side (decision 6) is pending, after merge.
