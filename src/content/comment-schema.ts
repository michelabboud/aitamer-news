import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';

/**
 * Comment data file contract v1 (2026-09-25): `src/content/comments/<slug>.json`, one file per
 * post that has at least one approved comment. The desk's publisher writes these files
 * (docs/adr/0006-comments-are-baked-static-from-published-data-files.md); editors only ever
 * remove an entry or a file. The format is documented for writers in POST.md section 8 and in
 * `src/content/comments/README.md`. Change it additively (ADR 0004's rule applies unchanged).
 *
 * Like the post contract, this schema is the single source of the published JSON Schema
 * (`commentsFileJsonSchema` below, served at `/contract/comments.schema.json` and
 * `/contract/v1/comments.schema.json`), so what the publisher validates against before it
 * commits can never drift from what the build enforces. And like the post contract it has no
 * `astro:content` import, so `src/lib/comment-contract.test.ts` runs it under plain `node:test`.
 *
 * Every object is `.strict()`: an unknown key fails the build naming the file. The rules that
 * need the file name (`slug` equals it) or the posts directory (the post exists) cannot live in a
 * schema; `scripts/check-comments.mjs` (part of `npm run check:posts`) and the collection loader
 * (`src/content/comments-loader.ts`) enforce those.
 *
 * Defence in depth: the desk normalises and strips before it publishes (Unicode NFC, control
 * characters, bidirectional overrides, zero-width characters, HTML). This schema refuses what
 * the desk should have stripped, so a misbehaving publisher fails the build instead of putting
 * markup or invisible text into a page. Rendering (lane A2) escapes everything again.
 */

/** The comment contract's version. Bump it, and add a sibling schema route, rather than editing this one in place. */
export const COMMENT_CONTRACT_VERSION = 1;

/**
 * A post slug, as the file name and the `slug` field carry it. The same shape as `SLUG` in
 * `scripts/frontmatter.mjs` (the test asserts they agree): lowercase letters, digits and
 * hyphens, starting with a letter or digit.
 */
export const COMMENT_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** A ULID: 26 characters of Crockford base32, uppercase — time-ordered, so ids sort with the thread. */
export const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/** Display name: 1–60 characters (Unicode code points) on one line. */
export const COMMENT_NAME_MAX = 60;
/** Comment text: 1–2,000 characters (Unicode code points); paragraphs separated by blank lines. */
export const COMMENT_TEXT_MAX = 2000;

/**
 * Characters no published comment may carry, as a character-class body: control characters
 * (C0, DEL, C1 — written out rather than as `\p{Cc}`, so the pattern needs no Unicode flag and
 * validates the same in every JSON Schema validator), the line and paragraph separators, the
 * zero-width space and the byte-order mark, and the bidirectional controls (U+202A–U+202E
 * embeddings and overrides, U+2066–U+2069 isolates). U+200C and U+200D (joiners) are allowed:
 * real scripts and emoji sequences need them.
 */
const FORBIDDEN = '\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029\\u200B\\uFEFF\\u202A-\\u202E\\u2066-\\u2069';
const FORBIDDEN_MESSAGE = 'control, line-separator, zero-width or bidirectional characters';

/** One line: nothing from FORBIDDEN, so no newline or tab either. */
const ONE_LINE = new RegExp(`^[^${FORBIDDEN}]*$`);
/** Lines: nothing from FORBIDDEN except `\n` (the only control character text may hold). */
const PLAIN_LINES = new RegExp(`^(?:[^${FORBIDDEN}]|\\n)*$`);
/**
 * HTML is not plain text: refuse `<` followed by a letter (a tag), `/` (a closing tag) or `!`
 * (a comment or doctype). `a < b` and `<3` stay legal. Each alternative is disjoint from the
 * other, so the pattern is linear in the input.
 */
const NO_HTML = /^(?:[^<]|<(?![A-Za-z!/]))*$/;
/** At least one character that is not whitespace. */
const NOT_BLANK = /\S/;

/**
 * A length cap counted in Unicode code points, which is what JSON Schema's `maxLength` counts,
 * so the published contract and the build agree exactly. zod's own `.max()` counts UTF-16 code
 * units (an emoji is two), which would have made the build stricter than the contract it
 * publishes for strings near the cap. `.meta({ maxLength })` puts the cap into the JSON Schema.
 */
function withinCodePoints(max: number) {
  return (value: string) => {
    let count = 0;
    for (const _ of value) if (++count > max) return false;
    return true;
  };
}

const name = z
  .string()
  .min(1, 'name must not be empty')
  .regex(ONE_LINE, `name must be one line with no ${FORBIDDEN_MESSAGE}`)
  .regex(NO_HTML, 'name must not contain HTML')
  .regex(NOT_BLANK, 'name must not be blank')
  .refine(withinCodePoints(COMMENT_NAME_MAX), `name must be at most ${COMMENT_NAME_MAX} characters`)
  .meta({ maxLength: COMMENT_NAME_MAX });

const text = z
  .string()
  .min(1, 'text must not be empty')
  .regex(PLAIN_LINES, `text may contain newlines but no other ${FORBIDDEN_MESSAGE}`)
  .regex(NO_HTML, 'text must not contain HTML')
  .regex(NOT_BLANK, 'text must not be blank')
  .refine(withinCodePoints(COMMENT_TEXT_MAX), `text must be at most ${COMMENT_TEXT_MAX} characters`)
  .meta({ maxLength: COMMENT_TEXT_MAX });

/** An ISO-8601 instant in UTC with a `Z` suffix: `2026-09-25T10:00:00Z`. An offset is refused. */
const utcInstant = () => z.iso.datetime({ error: 'must be an ISO-8601 UTC time ending in Z' });

export const commentSchema = z
  .object({
    id: z.string().regex(ULID, 'id must be a ULID: 26 uppercase Crockford base32 characters'),
    name,
    text,
    /** When the comment was written, as the desk recorded it. */
    at: utcInstant(),
    /** True when the writer was signed in (batch C). Absent means anonymous. */
    signedIn: z.boolean().optional(),
  })
  .strict();

export type Comment = z.infer<typeof commentSchema>;

/** ids unique in the file; comments in the order the page shows them, oldest first. */
function uniqueIdsOldestFirst(comments: Comment[], ctx: z.RefinementCtx) {
  const firstIndexOf = new Map<string, number>();
  comments.forEach((comment, index) => {
    const earlier = firstIndexOf.get(comment.id);
    if (earlier === undefined) {
      firstIndexOf.set(comment.id, index);
    } else {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `id ${comment.id} is also on comment ${earlier}; ids are unique in a file`,
      });
    }
    if (index > 0 && Date.parse(comment.at) < Date.parse(comments[index - 1].at)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'at'],
        message: 'comments must be sorted oldest first',
      });
    }
  });
}

export const commentsFileSchema = z
  .object({
    version: z.literal(COMMENT_CONTRACT_VERSION),
    /** The post's slug. Must equal the file name (checked by `npm run check:posts` and the loader). */
    slug: z.string().regex(COMMENT_SLUG, 'slug must be lowercase letters, digits and hyphens, starting with a letter or digit'),
    /** When the desk generated this file. */
    generatedAt: utcInstant(),
    /** Every approved comment, oldest first. A post with none has no file at all. */
    comments: z.array(commentSchema).min(1, 'a file with no comments must not exist; the desk deletes it').superRefine(uniqueIdsOldestFirst),
  })
  .strict();

export type CommentsFile = z.infer<typeof commentsFileSchema>;

const COMMENTS_SCHEMA_ID = `${SITE.url}/contract/comments.schema.json`;
const COMMENTS_SCHEMA_TITLE = 'AI Tamer comment data file';
const COMMENTS_SCHEMA_DESCRIPTION =
  'The contract every comment data file (src/content/comments/<slug>.json) on aitamer.news ' +
  'satisfies. Generated from the same zod schema the build validates against, so it cannot drift. ' +
  'Lengths are counted in Unicode code points. Two rules live outside the schema: the slug equals ' +
  'the file name, and a post with that slug exists. The format is documented in POST.md: ' +
  'https://github.com/michelabboud/aitamer-news/blob/main/POST.md';

/**
 * `commentsFileSchema` as JSON Schema, for `/contract/comments.schema.json` and
 * `/contract/v1/comments.schema.json`. `io: 'input'` for the same reason as the post contract:
 * the shape a writer produces, before parsing. Nothing here is unrepresentable (every field is
 * a JSON string, number, boolean or array), so the converter runs with no overrides; the
 * `unrepresentable` handler is set to throw so a future field that is not representable fails
 * this function's test instead of silently publishing a looser contract.
 */
export function commentsFileJsonSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(commentsFileSchema, { io: 'input', unrepresentable: 'throw' });
  return {
    $id: COMMENTS_SCHEMA_ID,
    title: COMMENTS_SCHEMA_TITLE,
    description: COMMENTS_SCHEMA_DESCRIPTION,
    'x-contract-version': COMMENT_CONTRACT_VERSION,
    ...generated,
  };
}
