# Topic details (`topics.json`)

Optional, maintained by hand. Topic pages (`/topics/<slug>/`, ADR 0046) exist for every tag with at least five stories and work with this file empty. Add an entry to say something checkable about a topic:

```json
{
  "openai": {
    "summary": "One or two plain sentences, at most 400 characters.",
    "sameAs": ["https://en.wikipedia.org/wiki/OpenAI", "https://www.wikidata.org/wiki/Q21708200"]
  }
}
```

- The key is the topic's slug (the last part of its address), not the tag.
- `summary` replaces the page's default description. Plain text, no markup.
- `sameAs` takes Wikipedia or Wikidata https pages only, and only ones a person has opened and confirmed are the same subject. Leave it out rather than guess.
- A malformed entry fails the build and names the slug. An entry for a slug that is not a topic yet is ignored with a warning.

# Pins (`pins.json`)

The desk's pinned posts for the homepage card (plan `docs/plans/2026-10-31-top-nav-and-pinning.md`). Do not edit by hand: use `npm run pin -- <slug> --by <name> [--until <date|timestamp>] [--proposed] [--auto]` `npm run unpin -- <slug>` and `npm run approve-pin -- <slug>`, which validate, write atomically and print what the card will show. `npm run check:pins [-- --strict]` validates the file (`--strict` also fails on an active pin whose post is not published).

```json
{
  "mode": "auto",
  "pins": [
    { "slug": "a-post-id", "source": "manual", "state": "active", "pinnedBy": "michel", "pinnedAt": "2026-10-31T12:00:00Z", "until": "2026-11-05" }
  ]
}
```

- `mode`: `auto` (the editor pins directly) or `approve` (the editor's automatic pins must be `--proposed`; a person approves one with `npm run approve-pin -- <slug>`, which flips `state` to `active` and keeps it an auto pin). Pinning also removes any active pin whose post is no longer published, so a retraction never fails the next pin pull request.
- `state`: only `active` pins show; `proposed` pins are ignored by the site.
- `source`: `manual` pins take the two card slots before `auto` pins; within each kind the newest `pinnedAt` wins.
- `until` is optional: a timestamp with an offset or `Z`, or a bare `YYYY-MM-DD`, which means the end of that day in Israel time (`Asia/Jerusalem`). A timestamp without an offset is rejected. `pinnedAt` follows the same timestamp rule.
- Unknown keys, a duplicate slug and a bad value fail validation. A pin on an unpublished post is dropped with a warning at build time, never a failure.
