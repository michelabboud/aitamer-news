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
- The posts the card is showing also carry a Pinned label on the story page and on listing cards. The label is decided when the site is built. A pinned lead is not in the card, so it has no label.

# Series (`series.json`)

The series catalog (ADR 0054). Each row is a series a post can join with frontmatter `series` and `series_order`; the order of the rows is the order of `/series/`. The file is read when the site is built (by `series.ts`, through the strict reader `src/lib/series-catalog.ts`) and never shipped as a file.

```json
[
  {
    "slug": "k8s-from-zero",
    "title": "Kubernetes from Zero",
    "description": "Kubernetes from the first container to a production cluster, one idea per part.",
    "heroImage": "https://bots.aitamer.news/heroes/series-k8s-from-zero-0123abcd.jpg",
    "heroAlt": "What the hero shows, in one plain sentence"
  }
]
```

- `slug`: lowercase letters, digits and single hyphens; unique. Add the row before any post names it.
- `title` (at most 80 characters) and `description` (at most 240): plain text, no line breaks, no `<` or `>`, no leading or trailing spaces.
- `heroImage` and `heroAlt` are optional and go together. The image must be `https://bots.aitamer.news/heroes/series-<this slug>-<8 hex>.jpg`, uploaded with its WebP twin first (`npm run check:media` checks both). Leave both out until the picture is on the media host; the series pages then show no picture.
- `arcs` is optional. When it is set, the part badge and the series page use that fixed plan instead of counting live posts: `{ "name", "start", "end" }`, lesson 1 first, no gaps or overlaps. `name` is plain text of at most 60 characters. `end` may be left off only the last arc, which then has no total (`Title · Certification · Lesson 104`). A `series_order` outside the plan fails the build. Leave `arcs` out and the series keeps `Part N of M` from the posts that are live. Do not drop `arcs` from a row that has it.
- Any other key, a duplicate slug or a bad value fails the build and names the row. Removing a row that posts still use fails the build too.
- A series without its own icon in `src/assets/series-icons/` shows the default icon.
- Who may change it: the maintainer, and the Grok App through the series lane (ADR 0054). A pull request from the Grok App on `series/<name>` that changes only this file, modified, passes the `publisher-paths` check; changing anything else in the same pull request fails it. Cursor has no lane: it works for the Grok bots, and the Grok App publishes. The bots' instructions: `docs/guides/series-and-diagrams-for-bots.md`.
