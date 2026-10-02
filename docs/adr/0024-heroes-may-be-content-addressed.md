# 0024 · A replaced hero may be content-addressed

Status: accepted 2026-10-02 (Michel: "yes for hashed"; the uploader side is atn-ops ADR 0043). Relaxes ADR 0020 in part.

## Context

ADR 0020 fixed a hero at `https://media.aitamer.news/heroes/<slug>.jpg`. That address never changes, browsers and the
CDN keep the picture for a day, and the uploader refuses to overwrite a published key, so a live post could not get a
better or corrected hero.

## Decision

`heroImage` is either the legacy `https://media.aitamer.news/heroes/<slug>.jpg` or
`https://media.aitamer.news/heroes/<slug>-<8 lowercase hex>.jpg`, the slug being the post's own file name. Everything else in
ADR 0020 stays: the byte-for-byte media host, no query, fragment, encoding, port or other extension, and the post's own
slug. `isOwnHeroUrl` in `src/lib/media.ts` is the one place that says so; `check:posts` uses it. `check:media` already took any
`heroes/<name>.jpg` key and still requires a 200 `image/jpeg`. The hashed form is uploaded with
`Cache-Control: public, max-age=31536000, immutable`; the new address is what makes that safe. Existing posts keep their legacy
URL, and only a new or replaced hero uses the new form.

## Alternatives rejected

- **Overwrite the same key.** Readers and the CDN would keep the old picture for a day, and the bucket token must not overwrite.
- **A version query (`?v=2`).** Refused by the byte-for-byte rule on purpose; a query is exactly what ADR 0020 shut out.
- **Any hash length or case.** One shape (8 lowercase hex) is one regular expression and nothing to normalise.

## Consequences

- A hero can be replaced on a live post: upload the new file, change one line.
- Old hero files stay in the bucket (nothing deletes them); they are the cost of immutability.
- Known edge: post `a` could name post `a-<8 hex>`'s legacy hero as its own hashed form. Both are slugs in this repo, so it takes a
  deliberate act and is visible in review; not worth a second rule.
