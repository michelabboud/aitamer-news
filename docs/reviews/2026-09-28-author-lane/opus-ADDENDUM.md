# Addendum to REVIEW.md — PR #46, opus lane (2026-09-28)

Answers to the coordinator's follow-up questions. Read-only apart from the probe files under `opus/probes/`.

## 1. Correction to B2: from Blocking to Minor for the PR as a whole

`publisher-paths` passes an author file with `slug:`, as REVIEW.md says (`probes/e2e.sh`, cases 3 and 4). But the required check `check` refuses it:

- `npm run check:posts` ends with `node scripts/check-rendered-body.mjs`. Run with no arguments, that script calls `botSetProblems()`, which calls `authorFilesWithSlug()` (`scripts/check-rendered-body.mjs:457-490`, added after the review of PR #29, finding I1).
- On the scratch clone at `49236a3` with `hijack.md` added (`name: Hijack Writer`, `kind: ai`, `slug: wiz-cat`), `botSetProblems` returned: `an author file may not set slug: an author's id must be its file name, or a machine author could take a human's id (ADR 0011)`.
- B1's fence trick cannot hide a `slug` from this check. Astro's frontmatter block is always a prefix of the site reader's, so every key Astro sees, the site reader also sees.

What remains is Minor:
- `publisher-paths` does not refuse `slug:` itself.
- ADR 0018 decision 2, "so Astro's id is the file name", is true only because of a different check that the ADR does not mention.

The fix is the same as before: refuse keys outside the authors schema, in the lane. B1 and B3 stay Blocking, so the verdict stays **BLOCKED**.

## 2. Does B2 apply to posts?

The loader does the same thing: posts use `glob({ base: './src/content/posts', … })` with the default id rule (`src/content.config.ts:38`), so a post's `slug:` would become its Astro id. It is refused twice today:

1. **The schema.** `postSchema` is `.strict()` (`src/content/post-schema.ts:97-161`, ADR 0004). Astro passes the raw frontmatter, `slug` included, to `schema.safeParseAsync` (`astro/dist/content/utils.js`, `getEntryData`), and I found nothing in the content layer that strips it. So an unknown `slug` key fails the build.
2. **`scripts/stamp-specimens.mjs:126`**, part of `check:posts`, rejects it with: "remove the `slug:` field: the file name is the slug, and Astro would use this field as the URL instead".

`check-rendered-body.mjs` checks `slug` only on author files. A post cannot take another post's id today.

## 3. New finding, pre-existing, outside PR #46: a post can name one author to the site's checks and another to Astro

**Cause.** This is B1 applied to posts. `scripts/frontmatter.mjs` ends the frontmatter block only at a line that is exactly `---`. Astro (`@astrojs/internal-helpers/frontmatter`) ends it at the first line that starts with `---` or `+++`. Add a YAML merge key, which a later explicit key overrides without a duplicate-key error, and any field can read differently to the two:

```
---
title: T
tags: [opinion]
<<: {author: desk-bot}
+++: x
author: wiz-cat
---
body
```
- Site reader: `{"title":"T","tags":["opinion"],"author":"wiz-cat","+++":"x"}`
- Astro: `{"title":"T","tags":["opinion"],"author":"desk-bot"}`

(`probes/post-author.mjs`; an earlier variant without tags: `probes/parsers.mjs`.)

**What each check sees.**
- **Rendered-body gate, source-file mode** (`isGated`, `check-rendered-body.mjs:228`, run by `check:posts`): reads `author: wiz-cat`, a human, and **skips** the post.
- **Rendered-body gate, after-build mode** (`checkAgainstBuild`, run as `check:bodies:build` in `check-posts.yml` after `npm run build`): gates a post if *either* the site's reading or the author Astro stored names a bot (`storedAuthorIsBot`, around line 588). It sees `desk-bot` and **gates** it. So the HTML-allowlist gate still holds, through this one mode only.
- **Sources rule** (`scripts/stamp-specimens.mjs:137, 287, 370`): reads the post's author and tags with the site reader. It sees a human editor's piece tagged `opinion`, which may be published without sources (ADR 0013). **The exemption is granted.** I found no after-build counterpart to this rule. Astro publishes the post under `desk-bot`, a bot, with no sources.
- The same shape works for an AI writer's `poem` exemption (ADR 0015) and for the Voices section rule (`stamp-specimens.mjs:366`). It also works for every other field the site's scripts judge and Astro renders: `draft`, `pubDate`, `specimen`, `sources`, `section`, `tags`. The scripts and the build can disagree on whether a post is live, when it was published, and what its specimen number is.

**What stops it today.** Only the human merge. The trick is visible in the diff (`<<:` and a `+++:` line in the frontmatter), and Astro renders the leftover lines (`+++: x`, `author: wiz-cat`, `---`) as the first lines of the post's body. Posts come in through the posts App's pull requests and must pass `check` before a human merges them.

**Not done.** I did not run a full `astro build` on such a post. The Astro view comes from the exact function Astro's markdown content type calls (`content-entry-type.js` → `safeParseFrontmatter` → `parseFrontmatter`). The strict post schema should accept Astro's view, because the extra keys are cut off before Astro sees them.

**Severity.** Medium, pre-existing. It is a real bypass of the sources rule and of the human/AI exemptions, and a disagreement on publish state. Its only barrier is a human reading the frontmatter diff. It is not introduced by PR #46 and should not block it, but it is the same root cause as B1.

**Fix, and a proposed BACKLOG item.** Make `scripts/frontmatter.mjs` cut the block with Astro's own `extractFrontmatter`/`parseFrontmatter` from `@astrojs/internal-helpers/frontmatter`, which is already in the lockfile, and refuse YAML merge keys, anchors and aliases, and `+++`/TOML fences site-wide in `check:posts`. Until then, the source-file gate could adopt the after-build mode's "either reading" rule, and the sources rule needs an after-build pass over Astro's stored data. This is a design-level change touching several modules, so it should be its own task, not part of PR #46.

## 4. Side effect: what my probes wrote to the shared node_modules

My two `astro sync` runs from `opus/probes/site` (whose `node_modules` is a symlink to `/home/michel/projects/aitamer-news/node_modules`) wrote to two places, both at 05:30 on 2026-09-28:

- **`node_modules/.astro/data-store.json`**, Astro's content cache.
  - The first sync included `hijack.md` (kind ai, `slug: wiz-cat`, name "Hijack Writer"), which replaced Wiz Cat's entry.
  - The second sync, without that file, rewrote the store. Checked afterwards: it contains no "Hijack Writer" and no "Ghost Person" (a second probe file), and contains "Wiz Cat" again.
  - Because the second sync ran on the PR's tree, the store now holds the PR's authors and posts, not those of the branch checked out in the main repo (`post/mai-scroll-and-clock`).
- **`node_modules/.vite/deps/`** (`_metadata.json`, `astro-B36-G_7S.js`): Vite's pre-bundled dependency cache, re-optimised because the config path changed. It holds no site content; a search for "Hijack" found nothing.

Not touched:
- `node_modules/.astro/dist/` and `node_modules/.astro/incremental-build.json` still carry 02:37 and 02:52 timestamps, older than my probes.
- The repo's own `/home/michel/projects/aitamer-news/.astro/` was not touched.

**Can hijacked content be served later?** No. The store holds none now, and `astro build` and `astro dev` re-sync every entry by content digest and drop entries whose files are gone.

One effect remains:
- `npm run check:bodies:build` reads `node_modules/.astro/data-store.json`. Run on its own, without a fresh `npm run build` first, it would compare against the PR's content and report mismatches.
- That can only fail the check, never pass it. The next build rewrites the file anyway.
