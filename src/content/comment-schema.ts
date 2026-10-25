import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';
import {
  COMMENT_CONTRACT_VERSION,
  COMMENT_NAME_MAX,
  COMMENT_SLUG,
  COMMENT_SLUG_MAX,
  COMMENT_TEXT_MAX,
  COMMENTS_PER_FILE_MAX,
  HAS_VISIBLE,
  NO_HTML,
  ONE_LINE,
  PLAIN_LINES,
  ULID,
} from './comment-limits.ts';

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
 * **v1 is frozen.** `src/content/comment-schema.v1.snapshot.json` holds the bytes
 * `/contract/v1/comments.schema.json` serves, and the test fails on any difference: an additive
 * change needs a new snapshot and a deliberate review, a breaking change needs v2 (a new
 * `COMMENT_CONTRACT_VERSION`, a sibling route, and this schema left as it is).
 *
 * Every object is `.strict()`: an unknown key fails the build naming the file. The rules that
 * need the file name (`slug` equals it) or the posts directory (the post exists) cannot live in a
 * schema; `scripts/check-comments.mjs` (part of `npm run check:posts`) and the collection loader
 * (`src/content/data-file-loader.ts`) enforce those. The rules that need two fields at once
 * (unique ids, oldest first, every `at` no later than `generatedAt`) are zod refinements here
 * and prose in the JSON Schema's `description`.
 *
 * Defence in depth: the desk normalises and strips before it publishes (Unicode NFC, control
 * characters, bidirectional controls, invisible and format characters, HTML). This schema
 * refuses what the desk should have stripped, so a misbehaving publisher fails the build instead
 * of putting markup or invisible text into a page. Rendering (`src/lib/comment-text.ts`) escapes
 * everything again.
 *
 * Every pattern here is written for ECMA-262 *without* the `u` flag — that is what zod's
 * `.regex()` runs at build time and what the JSON Schema `pattern` keywords carry — and is
 * verified in both modes by the test (`new RegExp(p)` and `new RegExp(p, 'u')` over the same
 * corpus). The two modes agree on every character in the Basic Multilingual Plane and on lone
 * surrogates. They cannot agree on *ranges* of characters outside it: a range of code points
 * above U+FFFF is either a surrogate-pair alternation (which the `u` flag never matches, because
 * it sees code points, not UTF-16 units) or a `\u{…}` range (a syntax error without the flag).
 * So the patterns are exact without the flag, and with the flag they let the refused characters
 * above U+FFFF (format characters, plane 14, private use, noncharacters) through — the build
 * then refuses the file. `FORBIDDEN_CHARACTERS.unicodeClass`
 * is the exact `u`-mode class for a consumer that wants the same list there.
 */

/**
 * The contract's constants and character rules live in `./comment-limits.ts`, which has no zod, so
 * the browser can import them without the schema builder (S3). Re-exported here unchanged.
 */
export {
  COMMENT_CONTRACT_VERSION,
  COMMENT_NAME_MAX,
  COMMENT_PATTERNS,
  COMMENT_SLUG,
  COMMENT_SLUG_MAX,
  COMMENT_TEXT_MAX,
  COMMENTS_PER_FILE_MAX,
  FORBIDDEN_CHARACTERS,
  ULID,
  type CodePointRange,
} from './comment-limits.ts';

/** The routes the contract is served at, relative to the site root; `$id` is the site URL plus the route. */
export const COMMENTS_SCHEMA_ROUTES = Object.freeze({
  /** Always the newest version of the contract. */
  current: '/contract/comments.schema.json',
  /** Version 1, pinned: keeps serving v1 after a v2 exists. */
  v1: '/contract/v1/comments.schema.json',
});
export type CommentsSchemaRoute = keyof typeof COMMENTS_SCHEMA_ROUTES;

const FORBIDDEN_MESSAGE = 'control, invisible, format, private-use or bidirectional characters, and no joiner first, last, alone or next to another joiner';

/**
 * A length cap counted in Unicode code points, which is what JSON Schema's `maxLength` counts,
 * so the published contract and the build agree exactly. zod's own `.max()` counts UTF-16 code
 * units (an emoji is two), which would have made the build stricter than the contract it
 * publishes for strings near the cap. Stops counting at `max + 1`, so it costs the same for a
 * megabyte as for a line. `.meta({ maxLength })` puts the cap into the JSON Schema.
 */
function withinCodePoints(max: number) {
  return (value: string) => {
    let count = 0;
    for (const _ of value) if (++count > max) return false;
    return true;
  };
}

/**
 * The length check runs first and aborts: an over-long string reports only its length and never
 * reaches a pattern, so the patterns only ever see at most `max` code points. Exported for the
 * comments index contract (`./comments-index-schema.ts`), which bounds its titles and cut texts
 * the same way; exporting it changes no behaviour and no published byte.
 */
export const boundedString = (max: number, field: string) =>
  z.string().refine(withinCodePoints(max), { message: `${field} must be at most ${max} characters`, abort: true });

const name = boundedString(COMMENT_NAME_MAX, 'name')
  .min(1, 'name must not be empty')
  .regex(ONE_LINE, `name must be one line with no ${FORBIDDEN_MESSAGE}`)
  .regex(NO_HTML, 'name must not contain HTML')
  .regex(HAS_VISIBLE, 'name must contain at least one visible character')
  .meta({ maxLength: COMMENT_NAME_MAX });

const text = boundedString(COMMENT_TEXT_MAX, 'text')
  .min(1, 'text must not be empty')
  .regex(PLAIN_LINES, `text may contain newlines but no other ${FORBIDDEN_MESSAGE}`)
  .regex(NO_HTML, 'text must not contain HTML')
  .regex(HAS_VISIBLE, 'text must contain at least one visible character')
  .meta({ maxLength: COMMENT_TEXT_MAX });

/** An ISO-8601 instant in UTC with a `Z` suffix: `2026-09-25T10:00:00Z`. An offset is refused. */
const utcInstant = () => z.iso.datetime({ error: 'must be an ISO-8601 UTC time ending in Z' });

export const commentSchema = z
  .object({
    id: z.string().regex(ULID, 'id must be a ULID: 26 uppercase Crockford base32 characters, the first 0–7'),
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

/**
 * No comment is written after the file that carries it. Not "not in the future": that would make
 * the build depend on the clock, and a file that was fine yesterday must be fine tomorrow. zod
 * skips this refinement when a field failed, so every value here has parsed.
 */
function nothingAfterGeneratedAt(file: { generatedAt: string; comments: Comment[] }, ctx: z.RefinementCtx) {
  const generatedAt = Date.parse(file.generatedAt);
  file.comments.forEach((comment, index) => {
    if (Date.parse(comment.at) > generatedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['comments', index, 'at'],
        message: `at ${comment.at} is later than generatedAt ${file.generatedAt}; a comment is never newer than the file`,
      });
    }
  });
}

export const commentsFileSchema = z
  .object({
    version: z.literal(COMMENT_CONTRACT_VERSION),
    /** The post's slug. Must equal the file name (checked by `npm run check:posts` and the loader). */
    slug: z
      .string()
      .regex(COMMENT_SLUG, 'slug must be lowercase letters, digits and hyphens, starting with a letter or digit')
      .max(COMMENT_SLUG_MAX, `slug must be at most ${COMMENT_SLUG_MAX} characters`),
    /** When the desk generated this file. */
    generatedAt: utcInstant(),
    /** Every approved comment, oldest first. A post with none has no file at all. */
    comments: z
      .array(commentSchema)
      .min(1, 'a file with no comments must not exist; the desk deletes it')
      .max(COMMENTS_PER_FILE_MAX, `a file holds at most ${COMMENTS_PER_FILE_MAX} comments`)
      .superRefine(uniqueIdsOldestFirst),
  })
  .strict()
  .superRefine(nothingAfterGeneratedAt);

export type CommentsFile = z.infer<typeof commentsFileSchema>;

const COMMENTS_SCHEMA_TITLE = 'AI Tamer comment data file';
const COMMENTS_SCHEMA_DESCRIPTION =
  'The contract every comment data file (src/content/comments/<slug>.json) on aitamer.news ' +
  'satisfies. Generated from the same zod schema the build validates against, so it cannot drift. ' +
  'Lengths are counted in Unicode code points. ' +
  'Six rules cannot be expressed here and the build enforces them too: ' +
  '(1) the slug equals the file name; ' +
  '(2) a post with that slug exists; ' +
  '(3) a post with no approved comments has no file, so a file is never published empty; ' +
  '(4) ids are unique within a file; ' +
  '(5) comments are sorted oldest first by at; ' +
  '(6) every at is no later than generatedAt. ' +
  'The patterns are ECMA-262 without the u flag, which is how the build runs them. Compiled with ' +
  'the u flag they agree for every character up to U+FFFF and refuse lone surrogates, but let ' +
  'refused characters above U+FFFF (the format characters above U+FFFF, plane 14, the ' +
  'supplementary private use areas, the supplementary noncharacters) through; the build refuses those, so a validator using the u ' +
  'flag should also refuse the code-point ranges in FORBIDDEN_CHARACTERS.ranges ' +
  '(src/content/comment-schema.ts). The format is documented in POST.md: ' +
  'https://github.com/michelabboud/aitamer-news/blob/main/POST.md';

/**
 * `commentsFileSchema` as JSON Schema, for `/contract/comments.schema.json` and
 * `/contract/v1/comments.schema.json` — each route gets its own `$id`. `io: 'input'` for the
 * same reason as the post contract: the shape a writer produces, before parsing. Nothing here is
 * unrepresentable (every field is a JSON string, number, boolean or array), so the converter runs
 * with no overrides; the `unrepresentable` handler is set to throw so a future field that is not
 * representable fails this function's test instead of silently publishing a looser contract.
 */
export function commentsFileJsonSchema(route: CommentsSchemaRoute = 'current'): Record<string, unknown> {
  const generated = z.toJSONSchema(commentsFileSchema, { io: 'input', unrepresentable: 'throw' });
  return {
    $id: `${SITE.url}${COMMENTS_SCHEMA_ROUTES[route]}`,
    title: COMMENTS_SCHEMA_TITLE,
    description: COMMENTS_SCHEMA_DESCRIPTION,
    'x-contract-version': COMMENT_CONTRACT_VERSION,
    ...generated,
  };
}

/** The exact bytes a route serves — and, for `v1`, the bytes the snapshot freezes. Two-space indent, one trailing newline. */
export function commentsFileJsonSchemaDocument(route: CommentsSchemaRoute = 'current'): string {
  return `${JSON.stringify(commentsFileJsonSchema(route), null, 2)}\n`;
}
