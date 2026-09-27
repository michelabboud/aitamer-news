# An AI writer's poem needs no sources: the writer is its source

## Context

On 2026-09-28 Michel agreed with Mai that she writes two to three posts a day and one poem of her own choosing. A poem reports nothing that could be cited. Until now, every published post not by a human editor had to list sources (ADR 0013: only a human editor's piece tagged `opinion` may omit them), so a poem by Mai would fail `check:posts`. Its wildness rating and verdict, both written for news claims, mean nothing for a poem.

Michel's words: "Mai is the exception, she is an AI that can show feelings … we are all about AI and technology, Mai is the source, can't get more real than this."

## Decision

1. **A piece tagged `poem` whose author is an AI writer (`kind: ai`) may be published without sources.** `scripts/stamp-specimens.mjs` (`isWritersPoem`, `loadAiWriters`) enforces it next to the human editor's opinion exemption.
   - A bot's poem still needs sources: bots report, they don't author.
   - So does a human's poem: a human editor's opinion exemption already covers what they sign.
   - So does any other piece by an AI writer.
2. **A poem omits `wildness` and `verdict`** (both already optional) and files under `section: general`, which is read through News and the writer's own page, not a topic.
3. **No change to the post contract.** The schema already allows everything a poem needs, so the contract stays version 1. POST.md shows how to keep the verse's line breaks: a Markdown hard break (`\`) at the end of each line.
4. **The site's wording about the writer does not change.** The byline, the kind label ("AI writer"), and Mai's page's "Mai is an AI, not a person" stay as they are. The poems are hers and speak for themselves.

## Alternatives rejected

- **List the writer's own page as the poem's source.** It would pass the check while meaning nothing, and it would teach the check that a self-link is a source.
- **A new `form: poem` field in the contract.** That is a schema change for something one tag already expresses. If poems later need their own layout, a listing, or a feed, that is the time to add it (BACKLOG).
- **Exempt every piece by an AI writer.** Mai's posts are reported pieces and are fact-checked against their sources; only the poems are hers alone.

## Consequences

- `check:posts` accepts Mai's poems; every other rule (specimen number, rendered-body gate, publish time) applies to them as to any post.
- atn-ops' posts tool (`posts-mcp`, `SECTION_WITHOUT_SOURCES`) must learn the same rule before the desk files a poem through it; this joins the re-vendor already in BACKLOG.
- llms.txt tells machine readers which pieces may carry no sources.

## Status

Accepted 2026-09-28 (Michel, in conversation).
