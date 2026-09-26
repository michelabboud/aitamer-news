# The publisher's second lane: reactions data files

## Context

ADR 0006 let the desk's publisher, a GitHub App, write one kind of file into this public
repository: `src/content/comments/<slug>.json`. ADR 0007 records the guard as built: three
enforcement points that each refuse anything outside that one directory — the required check
`publisher-paths` (run from `main`), the deploy's refusal of a publisher push (run with the
script as it was before the push), and the publisher's own path check before every git write,
which lives in the desk's repository.

Readers are getting reactions under each story (seven of them; the set is `REACTIONS` in
`src/lib/reactions.ts`). The desk counts them and the publisher bakes the totals into the site,
exactly as it bakes approved comments, in the same hourly run and the same pull request. The
totals need a home in the repository, and the publisher needs permission to write it. That
permission is a change to a security boundary: it widens what a compromised App could write
into the public repository, and therefore into the deployed site.

The data file's shape is settled by the reactions contract v1 (`src/content/reaction-schema.ts`,
POST.md section 9): `src/content/reactions/<slug>.json`, `{ version, slug, reactions: [{ id, n }] }`,
strict at every level, ids matching `^[a-z][a-z0-9-]{0,23}$`, `n` a whole number of at least 1,
no free text and no timestamp.

## Decision

1. **The publisher gets exactly one more directory: `src/content/reactions/`.** Its lanes are
   `src/content/comments/` and `src/content/reactions/`, and nothing else. In each lane the only
   path allowed is `<lane><slug>.json` with the posts' slug rule — no README, nothing nested, no
   other name, extension or case, nothing in a lookalike directory
   (`src/content/reactionsx/…`).
2. **A rename must start and end in the same lane.** A comment file never becomes a reactions
   file or the reverse: the two lanes hold different contracts, and a rename across them is not
   something the publisher ever does, so it is refused rather than reasoned about.
3. **Every other rule is unchanged and applies to both lanes:** deletions inside a lane pass
   (that is how a story's reactions return to none, as a thread empties); an added or changed file
   must be a plain file (mode `100644`: no symbolic link, no submodule, no executable bit);
   anything that cannot be judged fails; who is held to the rule (every pull request, unless the
   maintainer is both author and sender on an `opened` or `synchronize` event, by numeric id) is
   the same code.
4. **The three enforcement points move together.** `scripts/check-publisher-paths.mjs` holds the
   two lanes (`PUBLISHER_LANES`, one anchored pattern per lane, `laneOf`); the required check and
   the deploy's refusal both run that script, so both widen with it, with no change to either
   workflow's logic. The publisher's own path check, in the desk's repository, widens to the same
   two patterns. What does **not** change: the rulesets (the App's branches stay
   `desk/comments-*`; `main` still requires `publisher-paths` and `check`), the App's
   permissions, `MAINTAINER_ID` and `PUBLISHER_ACTOR_ID`.
5. **Order: the widened script lands on `main` before the publisher writes its first reactions
   file.** The check runs from `main`, and the deploy judges a publisher push with the script from
   the commit before the push, so the widening protects nothing and allows nothing until it is on
   `main`. A reactions pull request opened earlier fails `publisher-paths` — the safe direction —
   and is retried after.

This supersedes one sentence of ADR 0007's rule 1 — "It fails unless every changed path is
`src/content/comments/<slug>.json`, no rename crosses the lane" — which now reads: it fails
unless every changed path is `<lane><slug>.json` in one of the two lanes and no rename leaves its
lane. The rest of ADR 0007 stands; its rule 5 ("every path changed … must be a comment file")
widens with the script it runs.

## Why the widening is acceptable

**Blast radius.** A compromised App could write arbitrary bytes under `src/content/reactions/`.
What reaches readers is limited by the same defence in depth as comments, with less to abuse:

- `npm run check:posts` (`scripts/check-reactions.mjs`) refuses any entry that is not a regular
  `<slug>.json`, a file whose `slug` is not its name, and a file for a post that does not exist;
- `npm run build` refuses any file that is not the contract's shape, strict at every level —
  integers and short lowercase ids, nothing else;
- the page renders no text from the file: an id is looked up in the site's own reaction set, and
  an id the set does not know is counted in the total and never shown;
- the required check `check` runs both, so an invalid file cannot be merged, and on `main` an
  invalid file fails the build and the previous site stays up.

The worst a compromised App can do in this lane is publish wrong counts on a story that exists —
the same class of harm as the "counts are a rough signal" the reactions design already accepts,
and far less than a comment file, which carries reader text.

## Alternatives rejected

- **Reactions inside the comment files (comment contract v2).** Keeps one lane. Rejected: the
  comment contract v1 is frozen, a v2 would make every comment consumer learn a new shape for a
  number that changes far more often than comments do, and every reaction change would rewrite a
  file that carries reader text.
- **One lane covering all of `src/content/` data, or any `*.json` under it.** Simpler to state.
  Rejected: it would admit the posts' own directory's neighbours and any future data directory
  without a decision, which is exactly what this guard exists to prevent. Each lane is named.
- **Allow renames across lanes.** Nothing the publisher does needs it, and the two lanes hold
  different contracts; allowing it would only add a case to reason about.
- **A separate App, token or branch prefix for reactions.** A second identity to create, protect
  and rotate, for data the same run already produces. The lanes, not the identity, are the
  boundary that matters here.

## Consequences

- `scripts/check-publisher-paths.mjs` exports `COMMENTS_LANE`, `REACTIONS_LANE`,
  `PUBLISHER_LANES`, `COMMENT_FILE_PATH`, `REACTION_FILE_PATH` and `laneOf`; its messages name
  both lanes. It still imports only node's built-ins and `scripts/slug.mjs`, so the deploy can
  run it from the previous commit.
- The deploy step keeps its name, "The publisher may only have changed comment files", and its
  shell unchanged (the test finds and runs the step by that name); its comment says it now means
  both lanes.
- The publisher's pull requests may carry files in both lanes; `publisher-paths` and `check`
  judge them together, as before.
- A third lane, if one is ever wanted, is another decision like this one: a new ADR, the script,
  and the desk's own check, together.

## Status

Accepted, 2026-09-26. Supersedes the one-lane sentence of ADR 0007's rule 1 (quoted above); the
rest of 0007 stands.
