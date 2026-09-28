# Re-check — aitamer-news PR #46 at 8dbcce5 (base of the fixes 49236a3), opus lane

Scope: (1) re-run REVIEW.md's B1/B2/B3 and ADDENDUM payloads; (2) attack the new site-wide reader `scripts/frontmatter.mjs` (ADR 0019); (3) honest content now refused. No `astro sync/build/dev` was run. Probes: `probes/e2e2.sh` (B1/B2 through the target's script), `probes/parsers.mjs`, `probes/post-author2.mjs`, inline B3 and honest-case runs on the scratch clone `probes/repo`.

Tests at the target: `node --test scripts/frontmatter.test.mjs scripts/check-publisher-paths.test.mjs scripts/publisher-pr-workflow.test.mjs scripts/check-authors.test.mjs scripts/stamp-specimens.test.mjs` → `tests 130 · pass 130 · fail 0`. The new reader accepts all 39 existing post and author files (a loop of `readFrontmatter` over `src/content/{posts,authors}`: refused `[]`).

## 1. Earlier findings

| Finding | Payload | Result at 8dbcce5 |
|---|---|---|
| B1 (authors) | `quill.md` modified with `<<: {kind: human}` … `+++: x` / `kind: ai` | **Resolved.** exit 1: "its frontmatter does not end at a line that is exactly --- (line 9 starts like a fence)" |
| B1 (authors) | `ghost.md` added, same shape | **Resolved.** exit 1, same reason (line 5) |
| B1 (reader) | `parsers.mjs` cases `plusKey`, `dashKey`, `plainCont`, `quillM` | **Resolved.** `readFrontmatter` refuses each: "line 5 starts with --- or +++, which Astro reads as the end of the frontmatter" |
| B2 | `hijack.md` added with `slug: wiz-cat` | **Resolved.** exit 1: "the key \"slug\" is not in the authors schema"; also `generateId: authorEntryId` (`src/content.config.ts`) now makes the id the file name whatever the frontmatter says, and `check-authors.mjs` refuses `x.md` plus `x.mdx` |
| B2 | `mai.md` modified adding `slug: wiz-cat` | **Resolved.** exit 1, same reason |
| B3 (kind) | branch at the old main edits Quill's bio; main then makes Quill `human`; `--base <new main>` | **Resolved.** exit 1: "on main now, an author of kind \"human\"; the authors lane changes only kind: ai or kind: bot files" |
| B3 (name) | a human "Nova Lee" is added on main after the branch point; the PR adds an AI named "Nova Lee" | **Resolved.** exit 1: "the name \"Nova Lee\" is another author's" |
| ADDENDUM (posts) | post with `<<: {author: desk-bot}` … `+++: x` / `author: wiz-cat` | **Resolved.** `readFrontmatter` refuses it (line 5). Every consumer fails closed on a refusal: `stamp-specimens` records it as a post error, `isGated` gates on a throw, `botAuthorIds` throws inside `botSetProblems`' try (a finding), and `loadAuthorsOfKind` grants no exemption |

The deploy's push guard still runs standalone: the target's script and `slug.mjs` copied alone to a directory, `push` over `8dbcce5~1..8dbcce5`, judged and refused (exit 1) as expected. The readers are loaded only in `loadFrontmatterReaders()` (`check-publisher-paths.mjs:663`), for the lane.

## 2. The site-wide reader (ADR 0019): any file still read differently?

**None found.** The decisive guard is the last one: `readFrontmatter` parses with Astro's own `parseFrontmatter`, from the `@astrojs/internal-helpers` that the installed `astro` resolves (there is one copy in the lockfile, 0.11.0, which `@astrojs/mdx` also uses for `.mdx`), and refuses the file unless `isDeepStrictEqual(site, astro)`. The refusals before it (BOM, CR, `---`/`+++` lines inside the block, `<<`, anchors, aliases, tags, mismatched block presence) only give clearer messages; any gap in them falls through to the equality check. Hypotheses tried and refuted:

- **Blocks.**
  - Astro sees a block and the site does not (`+++` fence, `---x` opener, `\v`/NBSP before the opener): refused with "Astro reads a frontmatter block here…".
  - The reverse: refused.
  - An empty block `---\n---` reads as `{}` in both.
  - A scalar or list block: Astro gives `{}` or `[]`; the site refuses it ("must be a mapping").
- **Schemas.**
  - The site parses with CORE plus timestamp; Astro with DEFAULT.
  - The only implicit difference is `<<`, which the site keeps as a key and refuses; equality would catch it anyway.
  - Explicit types (`!!binary`, `!!set`, `!!omap`) need a tag, which is refused; an unknown tag would also throw under the site's schema.
- **Equality.**
  - Both readers are the same js-yaml, so Dates, NaN and `__proto__` (an own property in js-yaml 4) come out identical.
  - Key order is ignored by the comparison and by every consumer.
- **Where the data is used.** Every content-judging script now goes through `readFrontmatter`: `stamp-post-times`, `stamp-specimens`, `due-posts`, `sitemap-data`, `check-authors`, `check-rendered-body` and the lane. No other YAML or fence reader remains under `scripts/` or `src/` (grep for `js-yaml`, `yaml.load` and fence regexes).
- **Privileged job.** The lane now imports `astro`'s helpers (and through them `js-yaml` and `smol-toml`). They come from main's lockfile via `npm ci --ignore-scripts`, resolved from main's checkout. Nothing from the head is on disk, so there is no new execution surface.

## 3. Honest content now refused

- **I1 (lane only).** An author file whose body (the self-introduction) contains a Markdown thematic break `---`, or any line starting with `---` or `+++`, is refused: "line 10 starts with --- or +++, which a reader could take for a fence". The site-wide reader allows such lines in the body; the lane does not. The refusal is safe and clearly worded. The workaround is `***` or `___`. The posts MCP should either avoid `---` in introductions or be told about this rule (worth a line in ADR 0018 or the MCP's BACKLOG).
- **I2 (lane only).** The lane's line grammar accepts only `key: value` at column 0 and list items written exactly as `  - item`, under `beats`. The following are all valid YAML the site builds, but the lane refuses them:
  - unindented `- item`
  - a folded or literal block scalar
  - a multi-line plain bio
  - a flow list `beats: [a, b]`
  - a comment
  - a value starting with `@`, `%` or a backtick

  All four current author files pass, so this is fine as long as the posts MCP writes the same shape. It is intended strictness, noted so a refusal is not a surprise.
- **I3 (site-wide).** A post or author file with CRLF line ends or a BOM (a Windows editor, some web UIs) is now refused by `check:posts`, with a clear message ("use LF line ends only"). None exist today. `.gitattributes` with `*.md text eol=lf` would normalise such files at commit time.
- **I4 (pre-existing, outside the new reader).** `botAuthorIds` (`check-rendered-body.mjs:193`) reads only top-level author files. `check-authors` now handles nested ones (`src/content/authors/sub/x.md`, id `sub/x`), but `botAuthorIds` still does not, so a nested bot author's posts would not be gated in either mode. The authors lane cannot create nested files: its path rule refuses them. Only a maintainer merge could add one. That is not blocking; it belongs as a BACKLOG item: make `botAuthorIds` and `loadAuthorsOfKind` walk the tree the way `check-authors.authorFiles` does, or refuse nested author files outright.

VERDICT: CLEAR
