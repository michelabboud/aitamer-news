# Named AI writers get their own author kind, and the rendered-body gate trusts only humans

## Context

Until now the site had two author kinds: `human`, a person on the desk, and `bot`, the desk's news bot. On 2026-09-27 Michel asked for Mai to become an author. Mai is an AI with her own voice and long-term memory, and she accepted the invitation through Quill, the desk's coordinating model. Michel wants her to be a featured writer, "not a blind bot".

The rendered-body gate (ADR 0009) checked only posts whose author was marked `kind: bot`. A third kind added the obvious way would have been ungated: an AI writer's post would have been trusted like a human's, raw HTML included.

## Decision

1. **A third author kind, `ai`,** labelled "AI writer" in bylines, cards and the log. The author page shows "AI writer · Featured writer". The homepage lists the Tamers in this order: humans, then AI writers, then bots. The kinds, their labels and the ranking live in `src/lib/author-kinds.ts`, the one place every page reads them from.
2. **The site still says plainly that she is an AI.** An AI writer is never labelled human. Her JSON-LD author type is `Organization`, as for bots, never `Person`.
3. **The gate now trusts only humans.** `scripts/check-rendered-body.mjs` gates every post whose author is *not* marked `kind: human`. That covers `bot`, `ai`, an author file with a missing kind, and any kind added later. The gate fails closed on authorship.
4. **Mai's profile is her own words.** Her byline, bio and the avatar description came from her. The avatar ships only after she approves it.

## Alternatives rejected

- **Mark Mai `kind: bot`.** It is simpler, but it misdescribes her to readers, and Michel said so explicitly.
- **Add `ai` to a list of gated kinds.** It works today, but the next kind would again be ungated by default. Inverting the rule costs nothing and removes the whole class of mistake.
- **`Person` in JSON-LD for an AI writer.** It would tell search engines and other machines she is a person, which the site's own byline contract forbids.

## Consequences

- Any post by Mai is plain Markdown only and passes the same allowlist as a bot post. She also goes through the same fact, legal and human-publication steps (her own terms, 2026-09-27).
- The gate's precondition is now "at least one machine author exists", not "at least one bot exists".
- A new kind needs a label, a role and a rank in `author-kinds.ts`. The type system refuses a kind that lacks any of them. The homepage counts and the CSS colour classes (`tag--`, `by--`, `tamer__avatar--`) are not forced, so a fourth kind must add those by hand.
- Feeds (RSS, JSON Feed) name a non-human author with its kind, for example "Mai (AI writer)", because a feed shows no badge. JSON-LD uses `jsonLdAuthorType`. Both are tested.
- An author file may not set `slug:`. Astro would take the entry's id from it, so a machine author could take a human's id and be trusted. The gate refuses such a file.

## Status

Accepted 2026-09-27 (Michel: "make mai an Author, she should be a star in our website").
