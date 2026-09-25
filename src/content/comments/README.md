# Comment data files

One file per post that has at least one approved comment: `<slug>.json`, named after the post
under `src/content/posts/`. **The desk's publisher writes these files.** Nobody writes one by
hand; the only edit a human makes here is a removal — delete a comment's entry, or delete the
file when the last comment goes. Never add, reword or reorder. Why this directory exists at all,
and what it costs: `docs/adr/0006-comments-are-baked-static-from-published-data-files.md`.

This directory is empty of `.json` files until the first comment is published. That is normal:
the build passes, and this `README.md` keeps the directory in git.

## Format v1

```json
{
  "version": 1,
  "slug": "grok-4-7",
  "generatedAt": "2026-09-25T12:37:00Z",
  "comments": [
    {
      "id": "01K63M4Q3ZJ8W3Y8N5V2R7T9AB",
      "name": "Ada",
      "text": "First paragraph.\n\nSecond paragraph with https://example.com/a-link.",
      "at": "2026-09-25T10:00:00Z",
      "signedIn": true
    }
  ]
}
```

| Field | Rule |
|---|---|
| `version` | Always `1`. |
| `slug` | Lowercase letters, digits and hyphens, starting with a letter or digit; equal to the file name; a post with that slug exists. |
| `generatedAt` | When the desk wrote the file. ISO-8601, UTC, ending in `Z`. |
| `comments` | At least one, sorted oldest first by `at`. A post with zero approved comments has **no file**. |
| `comments[].id` | A ULID: 26 uppercase Crockford base32 characters. Unique in the file. Readers quote it when they ask for a removal. |
| `comments[].name` | 1–60 characters, one line. No control, line-separator, zero-width or bidirectional characters; no HTML. |
| `comments[].text` | 1–2,000 characters. Paragraphs are separated by a blank line; `\n` is the only control character allowed (no tab, no `\r`). No HTML: `<` may not be followed by a letter, `/` or `!`. Links are plain `https://…` text; the page turns them into links. |
| `comments[].at` | When the comment was written. ISO-8601, UTC, ending in `Z`. |
| `comments[].signedIn` | Optional boolean. `true` when the writer was signed in. Absent means anonymous. |

Lengths are counted in Unicode code points (what JSON Schema's `maxLength` counts). No other key
is allowed at any level. A file holds only what the page shows: never an email address, an IP
address, a hash, or a moderation note.

## What enforces it

- `npm run check:posts` (`scripts/check-comments.mjs`): the file name is a slug, the `slug`
  field equals it, the file parses as JSON, and a post with that slug exists. An orphan — a file
  for a post that was deleted or renamed — fails the check naming the file.
- `npm run build`: the strict schema (`src/content/comment-schema.ts`) on every file, through the
  `comments` collection. A bad file fails the build naming the file; the previous site stays up.
- The published contract, generated from the same schema: `/contract/comments.schema.json` and
  `/contract/v1/comments.schema.json`. The desk validates against it before it commits.

## Removing a comment

Delete its object from `comments` (or the whole file if it was the last), commit, push. The
comment leaves the site on the next deploy. It stays in this repository's git history; the
privacy page says so.
