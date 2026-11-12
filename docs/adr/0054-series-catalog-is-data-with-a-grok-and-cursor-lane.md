# 0054: The series catalog is data; the Grok App publishes series rows and diagrams, and Cursor works for it

## Status
Accepted 2026-11-12 by Michel. He asked on 2026-11-11 that Grok and Cursor be able to update the series catalog ("i want grok and cursor to be able to update that file"), and approved the JSON design the same day ("the json is used only in compile not sent to site"). On 2026-11-12 he asked for automation without approving each pull request, and set the shape: "cursor and grok bots are almost one, since grok bots give tasks to cursor", with one set of instructions both follow. This record keeps the file name it was drafted under. Its lanes sit beside those of 0018, 0030, 0036 and 0050 and change nothing for them.

## Context
The newsroom bots run multi-part series. Kubernetes from Zero is the first with 33 parts, each with diagrams. The bots need to add series rows, add diagrams and publish one part a day with no one approving each step.

Before this change:
- **The rows were code.** They lived in `src/data/series.ts`, which the site build, `npm run check:posts` and the tests all execute.
- **The Grok App publishes without a person.** Its article pull requests (`grok/*`) go through the admission workflow, which numbers them and merges them automatically. That workflow trusts exactly one identity for automatic admission, the Grok App's account id; anything else needs Michel's review. Its other pull requests merge once the required checks pass.
- **Cursor has never published without a person.** It is the Grok bots' coding hand: the bots give it tasks, it writes files. It opens its pull requests through Michel's login: the author of #452 and #454 is Michel's account, and only the pushes and edits come from the Cursor App (206951365). The path guard skipped pull requests whose author and sender were both Michel, so a pull request Cursor opened passed the path check until Cursor's next push.
- **No bot lane admitted diagrams,** although ADR 0016 made them safe for any writer: `check-diagrams.mjs` checks every SVG against strict allowlists, ships its own rewrite, and the served files run nothing.

## Decision
1. **The rows move to `src/data/series.json`.** `src/data/series.ts` stays as the code that reads it and exports `SERIES` and `seriesMeta` unchanged, so every caller keeps its import. The file is imported at build time and rendered into HTML. It is never copied into `dist/`, and no client script contains it.
2. **A strict reader, `src/lib/series-catalog.ts`.** The file is bot-writable, so `parseSeriesCatalog` trusts nothing in it:
   - It must be an array of objects, with only the keys `slug`, `title`, `description`, `heroImage`, `heroAlt` and optional `arcs`. `arcs` is a fixed lesson plan (`name`, `start`, `end`; `end` only optional on the last arc). A series that omits it still labels parts from the live count. A lesson number outside the plan fails the build.
   - The slug is lowercase, at most the site's slug length, and used once.
   - Title (80), description (240) and alt (200) are trimmed plain text: no control characters, no invisible formatting characters (zero-width, direction marks and overrides), no `<` or `>`.
   - A hero is allowed only as `https://bots.aitamer.news/heroes/series-<its own slug>-<8 hex>.jpg`, and always with its alt.

   Any problem throws and fails the build, the tests and `check:posts`, naming the row. `npm run check:media` still checks that a configured hero and its WebP twin are on the media host.
3. **One publisher: the Grok App.** The Grok bots and Cursor are one team. The bots direct and Cursor writes, but only the Grok App opens and merges pull requests to `main`. Cursor gets no lane and no new access to `main`. Its work reaches `main` because the Grok App takes the files Cursor produced and opens the pull request itself. Security comes from the repository's own gates (identity, lane, required checks), never from a bot following its instructions. The instructions (`docs/guides/series-and-diagrams-for-bots.md`) exist so the bots get it right the first time.
4. **Two Grok lanes in `scripts/check-publisher-paths.mjs`.** Each applies only when the pull request's author and this event's sender are both the Grok App (`GROK_ACTOR_ID`), on `opened` or `synchronize`, in this repository:
   - **Series, on `series/<suffix>`** (the pins lane's suffix rule): exactly one changed path, `src/data/series.json`, modified only, a plain file. The pins and series lanes share one implementation of that single-file rule.
   - **Diagrams, on `diagrams/<post-slug>`:** one to 40 paths, each `public/diagrams/<that slug>/<name>.svg`, added or redrawn, plain files. Deleting and renaming are refused. The lane collects without copy detection, because diagrams share boilerplate and a new file that resembles another is still an addition. What each SVG contains is `check-diagrams.mjs`'s job, in the required check `check`, which also refuses a folder no post is named for. So a part's diagrams merge after its post does.

   Neither branch is `grok/`. That prefix is woven into three workflows, the admission script and image approval as an observation route, and carving exceptions out of all of them would touch the trust-critical admission path.
5. **A bot branch is never the maintainer's.** A pull request from `cursor/`, `series/` or `diagrams/` (`BOT_BRANCH_PREFIXES`) is held to the rules whoever its author is. Cursor opens pull requests through Michel's login, so the author can't tell Cursor from Michel. The branch can: a live ruleset lets only the Cursor App and admins create `cursor/*`. Michel never opens a pull request from one of these branches. `eic/` is unchanged.
6. **More than one merge base fails closed.** The path guard used to judge a pull request against a single merge base, so a crafted criss-cross head could show only lane files there while reverting another parent's work in what `main` receives. `collectPullRequest` now refuses when `git merge-base --all` returns more than one commit. This tightens every lane, not only these.
7. **A series without its own icon shows a neutral default** (`src/assets/series-icons/default.svg`), so a bot can add a series without touching code. A person may draw its own icon later. A hero stays optional.
8. **Rulesets, as defence in depth.** Live rulesets let only the Grok App and admins create, update or delete `series/*` and `diagrams/*`, and both prefixes join the bot-branch exclusions of the two maintainer-branch rulesets. The numeric identity in the check is the rule.

## Alternatives rejected
- **Admit `src/data/series.ts` to a lane as it is.** That would let a self-merging bot change code the build runs. Refused for that reason alone.
- **A Cursor lane, with Cursor's pull requests merged automatically** (proposed 2026-11-12, then replaced). Because Cursor opens through Michel's login, the lane would have had to trust "author Michel, sender Cursor", and a workflow would have merged with a publishing App's token. That means a second publishing identity, a second merge path, and a lane keyed partly on the maintainer's identity, all to automate what the Grok App can already do. One publisher is less trust, not more.
- **Extend the article admission to Cursor.** Admission is the most security-sensitive code in the repository, and it pins the Grok App on purpose.
- **A post and its diagrams in one admission pull request.** Admission admits posts only. Widening it touches the same sensitive code. A diagrams pull request after the post costs one extra pull request per part.
- **`grok/series-*` and `grok/diagrams-*`.** These would need an exception in every `grok/` observation expression and in admission. A mistake there could hand an observation route to a non-article pull request.
- **A whole `src/data/` or `public/` lane.** `pins.json`, `topics.json` and `prepared-heroes.json` belong to other owners, and `public/` holds the site's own files.

## Consequences
- **Blast radius.** A holder of the Grok App's key can change the series catalog and add or redraw diagrams in a post's folder, and nothing else through these lanes. It already could publish articles. Every such pull request still needs every required check, and the build refuses any malformed row or unsafe SVG.
- **Cursor.** A holder of Cursor's key can push `cursor/*` branches and open pull requests that always fail the path check unless Michel overrides.
- **Missing diagrams block deploys.** A part whose diagrams have not merged by its `pubDate` fails the deploy's link check: the site stays on its last good version and no other post ships until it is fixed. The instructions therefore require the diagrams to merge right after the post, and the `pubDate` to be moved if they can't.
- **Rows can't be orphaned.** Removing a row that posts still name fails the build (`seriesProblems`), so a bot cannot orphan a series by deleting it.
- **Repository variables.** Anyone who can change them could point `GROK_ACTOR_ID` at another account, the same exposure every lane variable carries. `CURSOR_ACTOR_ID` stays defined but no lane reads it.
