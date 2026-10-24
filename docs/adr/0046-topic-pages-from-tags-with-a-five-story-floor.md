# 0046 · Topic pages come from tags, with a five-story floor and one optional details file

2026-10-24 · accepted under the SEO plan approved by Michel (audit finding M4).

## Context

The audit (M4) found no page that gathers the coverage of one subject, which is what a search or answer engine needs to learn "what AI Tamer says about X". Stories already carry free-text tags (`openai`, `litigation`). Tags are typed by bots and writers, so spelling varies, and a library grows: an address that changes when other stories change would strand inbound links.

## Decision

- **A topic is a tag after normalising** (accents folded, lower case, single spaces), counted once per story. It gets `/topics/<slug>/` (24 to a page, `/topics/<slug>/2/`) when at least **five** published, non-withdrawn stories carry it; below that a page is a thin list. `/topics/` lists them and is `noindex` while there are none.
- **A slug depends only on its own tag.** A tag already written in slug form (lower case ascii letters, digits and single hyphens: `openai`, `grok-4-7`) owns that plain address; any other tag gets `<readable>-<8 hex of the normalised tag's SHA-256>` (longer only if that exact address is somehow taken). So no new tag, withdrawn story or change of floor can move a topic. Checked against the real library on 2026-10-24: 1,031 posts, 195 topics, every tag already in slug form, so every address is plain. Sorting, labels and ties use code-point order, never a locale's collation, so every machine builds the same site.
- **Details are one optional hand-kept file**, `src/data/topics.json`, keyed by slug: a plain-text `summary` of at most 400 characters and `sameAs` links restricted to Wikipedia and Wikidata https pages. A missing or empty file gives a factual listing ("N stories tagged X") and no external identity claim; markup says `about … sameAs` only when a person has put a link there. A malformed entry fails the build naming the slug; an entry for a slug that is not a topic is ignored with a warning.
- Story pages link their tags that have a topic page, and the incremental-build key of a story page includes those slugs, because a tag can gain a page when other stories change.

## Alternatives rejected

- **A content collection with a loader, schema and published JSON Schema per topic (the comments and reactions pattern, ADR 0006 and 0008).** Those files are written by a publisher service and need a contract; topic details are a few hand-checked lines, and a collection would add a loader, a contract file and a check script for them.
- **Plain slug for whichever tag sorts first, suffixing only on a clash.** Simpler and prettier for odd tags, but an address would move when a competing tag first appeared ("c++" at `/topics/c/` until the first story tagged "c"). The first draft of this ADR did this; a mechanical review caught it.
- **A lower floor (two or three).** More pages, but thin ones; the plan set five.
- **Inventing entity links.** Rejected: unverified identity facts are omitted across this plan.

## Consequences

Normalising merges only case, spacing and accents: `fixture topic` and `fixture-topic` are two topics, and a maintainer who wants them one fixes the tags. A tag with spaces or punctuation (`Grok 4.7`) gets a hashed address, the price of stability. The topics file is a maintainer-owned input that the sync must carry (`src/data/`). Topics are computed once per build over all published posts.
