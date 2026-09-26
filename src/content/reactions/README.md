# Reactions data files

One file per post whose readers' reactions add up to more than zero: `<slug>.json`, named after
the post under `src/content/posts/`. **The desk's publisher writes these files**, from the desk's
database: for each reaction, the permanent anonymous total plus the reactions still live there.
Nobody writes or changes a count here by hand: the next publish would overwrite it. Edit this
directory only to remove a file (below).

This directory is empty of `.json` files until the desk publishes a first total. That is normal:
the build passes, a story with no file reads as zero reactions, and this `README.md` keeps the
directory in git. **Nothing else belongs here:** every entry other than `README.md` must be a
regular file named `<slug>.json` (lowercase slug, `.json` exactly). A symbolic link, a folder,
`x.JSON`, `x.jsonc`, `x.json.bak` or a dotfile fails `npm run check:posts` naming the entry;
links are never followed.

## Format v1

```json
{
  "version": 1,
  "slug": "grok-4-7",
  "reactions": [
    { "id": "love", "n": 3 },
    { "id": "overhyped", "n": 7 },
    { "id": "wow", "n": 2 }
  ]
}
```

| Field | Rule |
|---|---|
| `version` | Always `1`. |
| `slug` | Lowercase letters, digits and hyphens, starting with a letter or digit, at most 120 characters; equal to the file name; a post with that slug exists. |
| `reactions` | At least one and at most 64 entries, **sorted by `id`**, ascending, each `id` once. A post whose reactions add up to zero has **no file**. |
| `reactions[].id` | A lowercase letter, then up to 23 lowercase letters, digits or hyphens. Usually one of the site's reaction set (`src/lib/reactions.ts`); an id the set no longer has is allowed, because totals are permanent — the page counts it in the story's total and shows no button for it. |
| `reactions[].n` | A whole number, at least 1. A reaction nobody chose is left out, never written as `0`. |

No other key is allowed at any level, and there is no timestamp: the same totals always produce
the same bytes, so a publish that changes no count changes no file. A file holds only counts:
never a reader, an address, a hash or a time.

## What enforces it

- `npm run check:posts` (`scripts/check-reactions.mjs`): every entry in this directory is
  `README.md` or a regular `<slug>.json` file; the file parses as JSON, its `slug` field equals
  the file name, and a post with that slug exists. An orphan — a file for a post that was deleted
  or renamed — fails the check naming the file.
- `npm run build`: the strict schema (`src/content/reaction-schema.ts`) on every file, through the
  `reactions` collection. A bad file fails the build naming the file; on a pull request that is
  `check-posts.yml`, so it never lands; on `main` it blocks every deploy until the file is fixed,
  and the previous site stays up.
- The published contract, generated from the same schema: `/contract/reactions.schema.json`
  (always the newest version) and `/contract/v1/reactions.schema.json` (v1, frozen byte for byte
  by `src/content/reaction-schema.v1.snapshot.json` and its test). The desk validates against it
  before it commits.

## Removing a file

A reactions file carries no reader text, so there is nothing to take down for a reader's sake.
The one case is an orphan: a file left behind for a post that was deleted or renamed. The
publisher deletes it on its next run; deleting it by hand in the same commit that removes or
renames the post is also fine. Changing a count by hand is never the fix: the next publish
rewrites the file from the desk's database.
