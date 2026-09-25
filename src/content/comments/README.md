# Comment data files

One file per post that has at least one approved comment: `<slug>.json`, named after the post
under `src/content/posts/`. **The desk's publisher writes these files, and regenerates them from
the desk's database on every run.** Nobody writes, rewords, reorders or removes anything here by
hand in the normal course: a hand edit is overwritten by the next publish. To remove a comment,
see "Removing a comment" below. Why this directory exists at all, and what it costs:
`docs/adr/0006-comments-are-baked-static-from-published-data-files.md` and
`docs/adr/0007-the-publisher-guard-as-built.md`.

This directory is empty of `.json` files until the first comment is published. That is normal:
the build passes, and this `README.md` keeps the directory in git. **Nothing else belongs here:**
every entry other than `README.md` must be a regular file named `<slug>.json` (lowercase slug,
`.json` exactly). A symbolic link, a folder, `x.JSON`, `x.jsonc`, `x.json.bak` or a dotfile
fails `npm run check:posts` naming the entry; links are never followed.

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
| `slug` | Lowercase letters, digits and hyphens, starting with a letter or digit, at most 120 characters; equal to the file name; a post with that slug exists. |
| `generatedAt` | When the desk wrote the file. ISO-8601, UTC, ending in `Z`. No comment's `at` is later than this. |
| `comments` | At least one and at most 2,000, sorted oldest first by `at`. A post with zero approved comments has **no file**. |
| `comments[].id` | A ULID: 26 uppercase Crockford base32 characters, the first `0`–`7`. Unique in the file. Readers quote it when they ask for a removal. |
| `comments[].name` | 1–60 characters, one line, at least one visible character. No control, invisible, format, private-use or bidirectional characters (the list below); no HTML. |
| `comments[].text` | 1–2,000 characters, at least one visible character. Paragraphs are separated by a blank line; `\n` is the only control character allowed (no tab, no `\r`). Same character rules as `name`; no HTML. Links are plain `https://…` text; the page turns them into links. |
| `comments[].at` | When the comment was written. ISO-8601, UTC, ending in `Z`; never later than `generatedAt`. |
| `comments[].signedIn` | Optional boolean. `true` when the writer was signed in. Absent means anonymous. |

Lengths are counted in Unicode code points (what JSON Schema's `maxLength` counts). No other key
is allowed at any level. A file holds only what the page shows: never an email address, an IP
address, a hash, or a moderation note.

### Characters

Text is Unicode (NFC, as the desk normalises it). These are refused anywhere in `name` and
`text` — they hide text, spoof a name, reverse a line, or render as nothing:

- control characters U+0000–001F and U+007F–009F (text may hold U+000A, the newline);
- the soft hyphen U+00AD, the combining grapheme joiner U+034F, the Arabic letter mark U+061C;
- the Hangul fillers U+115F, U+1160, U+3164 and U+FFA0, the Khmer inherent vowels U+17B4–17B5,
  the Mongolian selectors U+180B–180F, the Braille blank U+2800;
- U+200B–200F (zero-width space, the joiners on their own, the left-to-right and right-to-left
  marks), U+2028–202E (line and paragraph separators, bidirectional embeddings and overrides),
  U+2060–206F (word joiner, invisible operators, bidirectional isolates), U+FEFF;
- variation selectors U+FE00–FE0D (U+FE0E and U+FE0F, text and emoji presentation, are allowed);
- the private use areas (U+E000–F8FF, planes 15 and 16), the noncharacters, U+FFF0–FFFB, and
  all of plane 14 (tags and variation selectors 17–256);
- the format characters above U+FFFF: the Kaithi number signs U+110BD and U+110CD, the Egyptian
  hieroglyph format controls U+13430–1343F, the shorthand format controls U+1BCA0–1BCA3 and the
  musical beam, tie, slur and phrase controls U+1D173–1D17A (checked against every character of
  Unicode category Cf, Unicode 17.0; the Arabic-script number signs U+0600–0605, U+06DD, U+070F,
  U+0890–0891 and U+08E2 are visible and allowed);
- a lone surrogate.

**One joiner, U+200C or U+200D, is allowed between two other characters** — Persian and Indic
words and emoji sequences need one there — never first, never last, never on its own, and never
two in a row.

**HTML:** `<` may not be followed by a letter, `/`, `!` or `?`. `a < b`, `<3` and a trailing `<`
are fine.

The full list, as code-point ranges and as ready-made character classes, is
`FORBIDDEN_CHARACTERS` in `src/content/comment-schema.ts`; the renderer and the desk's
normaliser use the same one.

## What enforces it

- `npm run check:posts` (`scripts/check-comments.mjs`): every entry in this directory is
  `README.md` or a regular `<slug>.json` file; the file parses as JSON, its `slug` field equals
  the file name, and a post with that slug exists. An orphan — a file for a post that was deleted
  or renamed — fails the check naming the file.
- `npm run build`: the strict schema (`src/content/comment-schema.ts`) on every file, through the
  `comments` collection. A bad file fails the build naming the file; on a pull request that is
  `check-posts.yml`, so it never lands; on `main` it blocks every deploy until the file is fixed,
  and the previous site stays up.
- The published contract, generated from the same schema: `/contract/comments.schema.json`
  (always the newest version) and `/contract/v1/comments.schema.json` (v1, frozen byte for byte
  by `src/content/comment-schema.v1.snapshot.json` and its test). The desk validates against it
  before it commits. Its patterns are ECMA-262 without the `u` flag; a validator that compiles
  them with the flag agrees for every character up to U+FFFF but lets the refused characters
  above it through, so such a validator should also apply `FORBIDDEN_CHARACTERS.ranges` — the
  build refuses them either way.

## Removing a comment

**Use the desk's delete command** (part of the desk's moderation tool), with the comment's id.
It takes the comment out of the desk's database and erases the stored name and text there; the
next publish rewrites this file without it (or deletes the file, if it was the last comment), and
the comment leaves the site at the deploy that follows.

**Do not delete the entry here and stop.** The publisher regenerates every file from the desk's
database, so a comment removed only from this file comes back on the next publish. A hand edit
is an emergency stopgap, for a comment that must leave the site before the next publish: delete
its object from `comments` (or the whole file, if it was the last), commit it to `main`, and run the
desk's delete for the same id **the same day**, or the comment returns.

Either way, a published comment stays in this repository's public git history, which removal
cannot erase; the privacy page says so.
