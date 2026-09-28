# The site's scripts read frontmatter exactly as Astro does, or refuse the file

## Context

The build scripts judge content that Astro then builds: whether a post is a draft and when it is
published (`stamp-post-times`, `due-posts`), its specimen number and whether it may omit sources
(`stamp-specimens`: a human editor's `opinion`, an AI writer's `poem`, the Voices rule), whether
its author is a machine and so gated (`check-rendered-body`), whether its author exists
(`check-authors`), its sitemap dates (`sitemap-data`), and, for the posts App's authors lane,
an author's kind and name (`check-publisher-paths`, ADR 0018). All of them read frontmatter
through one function, `readFrontmatter` in `scripts/frontmatter.mjs`, which used js-yaml with
Astro's schema (docs/reviews/2026-09-25-batch-a-deep-review.md, B1).

The deep review of PR #46 (finding B1, and its addendum of 2026-09-28) found that the two still
read some files differently. Astro's content layer (`parseFrontmatter` in
`@astrojs/internal-helpers/frontmatter`, which its Markdown content type calls) ends the block at
the first line that merely starts with `---` or `+++`, and takes a `+++` fence as TOML; the site's
reader ended the block only at a line of exactly `---`. With a YAML merge key, which an explicit
key overrides without a duplicate-key error, any field could read one way to the scripts and
another to the build:

```
---
title: T
tags: [opinion]
<<: {author: desk-bot}
+++: x
author: wiz-cat
---
```

The scripts read `author: wiz-cat`, a human, and granted a human editor's opinion piece its
exemption from sources; Astro published the post under `desk-bot`, a bot, with no sources. The
same shape worked for `draft`, `pubDate`, `specimen`, `tags`, `section` and an author file's
`kind` and `name`. This was live on the site before PR #46; its only barrier was a human reading
the frontmatter diff (the rendered-body gate's after-build mode still gated such a post).

## Decision

1. **One reader, and it agrees with Astro or refuses.** `readFrontmatter` stays the only way the
   scripts read frontmatter (every consumer already went through it; nothing else parses it by
   hand). It now:
   - refuses a byte-order mark or a carriage return anywhere in the file (LF only);
   - refuses a file where Astro's own `extractFrontmatter` finds a block and the site's fence
     does not (a `+++` fence; text after the opening `---` on its line), or the reverse;
   - refuses, inside the block, any line starting with `---` or `+++` (only the closing `---`
     may), so both readers end the block at the same line;
   - refuses a YAML merge key (`<<`, found by parsing with js-yaml's schema minus the merge type),
     an anchor, an alias or a tag (found through js-yaml's `listener`: a node whose text starts
     with `&`, `*` or `!`, which a plain scalar never can), and a key written twice (js-yaml
     already refuses it);
   - then parses the file with Astro's own `parseFrontmatter`, resolved from the installed
     `astro` package so it is the copy the build runs, called as Astro calls it, and refuses the
     file unless both readers return deeply equal data.
   Each refusal names what to remove. An empty block (`---` then `---`) reads as `{}`, as in Astro.
2. **The scripts fail closed on a refused file**: a refused post is not stamped, numbered, exempted
   or published by `due-posts`; `check:posts` fails. None of the site's 39 content files uses a
   refused form (checked when this landed), and the full build still passes.
3. **The posts App's authors lane (ADR 0018) keeps its own stricter form on top**: schema keys only,
   one-line values; it runs this reader and Astro's too.

## Alternatives rejected

- **Make the site's fence match Astro's regex, and keep js-yaml alone.** It would agree today and
  drift silently when Astro changes its cut; calling Astro's own function and comparing data does
  not drift.
- **Use only Astro's parser in the scripts.** The stampers need the raw block's exact position to
  edit one line in place; Astro's function returns the raw text but not where it sits, and with
  `+++` or text after the opening fence its block is not a line range at all. Refusing those forms
  and comparing both readings keeps the in-place edits and the agreement.
- **Refuse only in the authors lane.** The disagreement was live for posts, with a real bypass of
  the sources rule and of the human/AI exemptions; it had to close for every script.
- **Accept CRLF and a BOM, as the reader did.** Astro's cut and the site's differ on them in edge
  cases, and the site's content uses neither; refusing is simpler than proving equivalence.

## Consequences

- A file written with a merge key, an anchor, an alias, a tag, a TOML fence, CRLF line ends or a
  BOM is refused by `check:posts` with a message saying what to change; an editor's tool that
  saves CRLF must be set to LF.
- `scripts/frontmatter.mjs` now needs the installed `astro` (it already needed js-yaml), and
  resolves `@astrojs/internal-helpers` through it at import time.
- The anchor, alias and tag detection relies on js-yaml 4's `listener` reporting a node's start
  before its properties (pinned 4.3.2); the tests cover every property position (a value, a list
  item, a flow item, a key, a mapping), so an upgrade that changes it fails the tests.
- The posts MCP (desk repository) must refuse the same forms before it opens a pull request, or
  its pull requests fail `check` (BACKLOG).
- Tests: `scripts/frontmatter.test.mjs` (the reviewer's post and author payloads for `author`,
  `kind`, `draft`, `pubDate`, `specimen`, `tags` and `name`, which failed before; every refused
  form; ordinary YAML still read as Astro reads it), and `scripts/stamp-specimens.test.mjs` (the
  opinion exemption is not granted on the split post).

## Status

Accepted 2026-09-28 (the coordinator's ruling on the review's addendum: fix it at the root,
site-wide). A security fix of the live site, shipped in 0.2.44 with PR #46.
