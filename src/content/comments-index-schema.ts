import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';
import {
  COMMENTS_PER_FILE_MAX,
  COMMENT_NAME_MAX,
  COMMENT_PATTERNS,
  COMMENT_SLUG,
  COMMENT_SLUG_MAX,
  ULID,
  boundedString,
} from './comment-schema.ts';
import {
  COMMENTS_INDEX_CONTRACT_VERSION,
  COMMENTS_INDEX_KEY,
  COMMENTS_INDEX_RECENT_MAX,
  COMMENTS_INDEX_SITE_MAX,
  COMMENTS_INDEX_STORIES_MAX,
  COMMENTS_INDEX_TEXT_MAX,
  COMMENTS_INDEX_TITLE_MAX,
} from './comment-limits.ts';

/**
 * Comments index contract v1 (2026-10-24): `v1/comments-index.json` in the public data bucket
 * (docs/plans/2026-10-24-comments-on-r2.md section 2.3 in the desk repository). One small file
 * holding what a list page needs and the story pages do not: how many approved comments each
 * story has (the home page's cards, the Campfire page's counts) and the newest comments site-wide
 * ("Around the fire"). The desk's moderation app writes it whenever it publishes a comment file;
 * a browser reads it. No built page reads it yet: the browser scripts that do (`CommentIndexLive.astro`)
 * are rendered only when the switch `COMMENTS_SOURCE` in `src/lib/site.ts` is `'r2'`, and it ships as `'baked'`.
 *
 * The comment contract's sibling (`./comment-schema.ts`), and built the same way: this schema is
 * the single source of the published JSON Schema (`commentsIndexJsonSchema` below, served at
 * `/contract/comments-index.schema.json` and `/contract/v1/comments-index.schema.json`), so what
 * the desk validates before it writes can never drift from what a reader checks. It has no
 * `astro:content` import, so `src/lib/comments-index-contract.test.ts` runs under plain
 * `node:test`.
 *
 * **v1 is frozen.** `src/content/comments-index-schema.v1.snapshot.json` holds the bytes
 * `/contract/v1/comments-index.schema.json` serves, and the test fails on any difference: an
 * additive change needs a new snapshot and a deliberate review, a breaking change needs v2.
 *
 * **Deterministic by design.** `counts` sorted, `recent` in one total order, `generatedAt` taken
 * from the data and never from a clock: the same state of the desk's database always makes the
 * same bytes, so the desk's compare-and-swap write can tell "nothing changed" from "changed".
 *
 * **Public data only.** Every field is something the story page shows anyway. The index never
 * carries an email, a hash, a trust score or a moderation note, and a schema that is `.strict()`
 * everywhere refuses a writer that tries.
 *
 * Every object is `.strict()`. The texts reuse the comment contract's patterns, so a recent
 * comment is held to the same rules as the same comment in its story's file: no control, invisible,
 * format, private-use or bidirectional characters, no HTML. The client renders it with
 * `textContent` regardless (defence in depth, as in `comment-schema.ts`).
 */

/** The index contract's limits live in `./comment-limits.ts` (no zod, so the browser can import them). Re-exported here unchanged. */
export {
  COMMENTS_INDEX_CONTRACT_VERSION,
  COMMENTS_INDEX_KEY,
  COMMENTS_INDEX_RECENT_MAX,
  COMMENTS_INDEX_SITE_MAX,
  COMMENTS_INDEX_STORIES_MAX,
  COMMENTS_INDEX_TEXT_MAX,
  COMMENTS_INDEX_TITLE_MAX,
} from './comment-limits.ts';

/** The routes the contract is served at, relative to the site root; `$id` is the site URL plus the route. */
export const COMMENTS_INDEX_SCHEMA_ROUTES = Object.freeze({
  /** Always the newest version of the contract. */
  current: '/contract/comments-index.schema.json',
  /** Version 1, pinned: keeps serving v1 after a v2 exists. */
  v1: '/contract/v1/comments-index.schema.json',
});
export type CommentsIndexSchemaRoute = keyof typeof COMMENTS_INDEX_SCHEMA_ROUTES;

/** An ISO-8601 instant in UTC with a `Z` suffix: `2026-09-25T10:00:00Z`. An offset is refused. */
const utcInstant = () => z.iso.datetime({ error: 'must be an ISO-8601 UTC time ending in Z' });

const slug = () =>
  z
    .string()
    .regex(COMMENT_SLUG, 'slug must be lowercase letters, digits and hyphens, starting with a letter or digit')
    .max(COMMENT_SLUG_MAX, `slug must be at most ${COMMENT_SLUG_MAX} characters`);

/** Story title: one line, 1 to 200 code points, something that shows. */
const title = boundedString(COMMENTS_INDEX_TITLE_MAX, 'title')
  .min(1, 'title must not be empty')
  .regex(COMMENT_PATTERNS.name.oneLine, 'title must be one line with no control, invisible, format, private-use or bidirectional characters')
  .regex(COMMENT_PATTERNS.name.hasVisible, 'title must contain at least one visible character')
  .meta({ maxLength: COMMENTS_INDEX_TITLE_MAX });

/** The comment contract's display name rules, unchanged. */
const name = boundedString(COMMENT_NAME_MAX, 'name')
  .min(1, 'name must not be empty')
  .regex(COMMENT_PATTERNS.name.oneLine, 'name must be one line with no control, invisible, format, private-use or bidirectional characters')
  .regex(COMMENT_PATTERNS.name.noHtml, 'name must not contain HTML')
  .regex(COMMENT_PATTERNS.name.hasVisible, 'name must contain at least one visible character')
  .meta({ maxLength: COMMENT_NAME_MAX });

/** The comment contract's text rules with the index's shorter cap: what a cut text may hold. */
const text = boundedString(COMMENTS_INDEX_TEXT_MAX, 'text')
  .min(1, 'text must not be empty')
  .regex(COMMENT_PATTERNS.text.plainLines, 'text may contain newlines but no other control, invisible, format, private-use or bidirectional characters')
  .regex(COMMENT_PATTERNS.text.noHtml, 'text must not contain HTML')
  .regex(COMMENT_PATTERNS.text.hasVisible, 'text must contain at least one visible character')
  .meta({ maxLength: COMMENTS_INDEX_TEXT_MAX });

export const recentCommentSchema = z
  .object({
    slug: slug(),
    /** The story's title, for the link text. The desk leaves a comment out when it cannot get the title. */
    title,
    id: z.string().regex(ULID, 'id must be a ULID: 26 uppercase Crockford base32 characters, the first 0–7'),
    name,
    /** At most 400 code points. A longer comment is cut at a grapheme boundary and `truncated` is `true`. */
    text,
    at: utcInstant(),
    /** `true` when the writer was signed in. Absent means anonymous; `false` is never written. */
    signedIn: z.literal(true).optional(),
    /** `true` when `text` is the start of a longer comment. Absent means the whole comment. */
    truncated: z.literal(true).optional(),
  })
  .strict();

export type RecentComment = z.infer<typeof recentCommentSchema>;

/** One story's approved-comment count: 1 up to a file's capacity. A story with none is left out, never written as 0. */
const countSchema = z
  .int({ error: 'a count must be a whole number' })
  .min(1, 'a count must be at least 1; a story with no approved comment is left out')
  .max(COMMENTS_PER_FILE_MAX, `a count is at most ${COMMENTS_PER_FILE_MAX}, the most comments one story file holds`);

const countsSchema = z
  .record(slug(), countSchema)
  .superRefine(storiesBoundedAndSorted)
  .meta({ maxProperties: COMMENTS_INDEX_STORIES_MAX });

/**
 * At most `COMMENTS_INDEX_STORIES_MAX` stories, keys sorted ascending by UTF-16 code unit.
 *
 * JavaScript lists a canonical array index key (a slug of digits only, such as `2026`) before every
 * other key, in numeric order, however the JSON text ordered them; no reader in JavaScript can see
 * where such a key stood in the text. So the order checked is the one a JavaScript object can show:
 * the keys sorted by code unit, rebuilt as an object, enumerated. For every other slug that is
 * plain code-unit order, and a writer in any language writes code-unit order.
 */
function storiesBoundedAndSorted(counts: Record<string, number>, ctx: z.RefinementCtx) {
  const keys = Object.keys(counts);
  if (keys.length > COMMENTS_INDEX_STORIES_MAX) {
    ctx.addIssue({
      code: 'custom',
      message: `counts holds at most ${COMMENTS_INDEX_STORIES_MAX} stories`,
    });
    return;
  }
  const expected = Object.keys(Object.fromEntries([...keys].sort().map((key) => [key, 0])));
  const firstOut = keys.findIndex((key, index) => key !== expected[index]);
  if (firstOut !== -1) {
    ctx.addIssue({
      code: 'custom',
      path: [keys[firstOut]],
      message: 'counts must be sorted by slug, ascending',
    });
  }
}

export const commentsIndexSchema = z
  .object({
    version: z.literal(COMMENTS_INDEX_CONTRACT_VERSION),
    /** The desk's id for the site this index belongs to, such as `aitamer`. */
    site: z
      .string()
      .regex(COMMENT_SLUG, 'site must be lowercase letters, digits and hyphens, starting with a letter or digit')
      .max(COMMENTS_INDEX_SITE_MAX, `site must be at most ${COMMENTS_INDEX_SITE_MAX} characters`),
    /** The newest `at` in `recent`, taken from the data and not from a clock, so the same state makes the same bytes. */
    generatedAt: utcInstant(),
    /** Approved comments per story, only stories with at least one, keys sorted. */
    counts: countsSchema,
    /** The newest comments site-wide, newest first, at most 60. */
    recent: z.array(recentCommentSchema).max(COMMENTS_INDEX_RECENT_MAX, `recent holds at most ${COMMENTS_INDEX_RECENT_MAX} comments`),
  })
  .strict()
  .superRefine(recentAgreesWithCounts);

export type CommentsIndex = z.infer<typeof commentsIndexSchema>;

/**
 * The rules that need two fields at once, checked in one pass. zod skips this when a field
 * failed, so every value here has parsed.
 *
 * - `recent` is newest first: `at` never increases down the list, and comments with the same `at`
 *   go by id, descending (a ULID is time-ordered, and `at` has one-second resolution);
 * - ids are unique;
 * - `generatedAt` equals the newest `at`, which is the first entry (an empty `recent` leaves
 *   `generatedAt` to the desk);
 * - every recent comment's story is in `counts`, and `counts` is at least the number of recent
 *   comments of that story: a story shown in "Around the fire" has at least that many comments.
 */
function recentAgreesWithCounts(index: CommentsIndex, ctx: z.RefinementCtx) {
  const seenIds = new Set<string>();
  const recentPerSlug = new Map<string, number>();
  index.recent.forEach((comment, position) => {
    if (seenIds.has(comment.id)) {
      ctx.addIssue({ code: 'custom', path: ['recent', position, 'id'], message: `id ${comment.id} appears twice in recent; ids are unique` });
    }
    seenIds.add(comment.id);

    if (position > 0) {
      const before = index.recent[position - 1];
      const later = Date.parse(comment.at) - Date.parse(before.at);
      if (later > 0 || (later === 0 && comment.id > before.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['recent', position, 'at'],
          message: 'recent must be newest first, comments with the same at ordered by id descending',
        });
      }
    }

    // hasOwn, not a bare lookup: a slug such as `constructor` is legal and must not find Object's own member.
    const total = Object.hasOwn(index.counts, comment.slug) ? index.counts[comment.slug] : undefined;
    const shown = (recentPerSlug.get(comment.slug) ?? 0) + 1;
    recentPerSlug.set(comment.slug, shown);
    if (total === undefined) {
      ctx.addIssue({ code: 'custom', path: ['recent', position, 'slug'], message: `slug ${comment.slug} is in recent but not in counts` });
    } else if (shown > total) {
      ctx.addIssue({
        code: 'custom',
        path: ['recent', position, 'slug'],
        message: `slug ${comment.slug} has ${shown} comments in recent but a count of ${total}`,
      });
    }
  });

  if (index.recent.length > 0 && index.generatedAt !== index.recent[0].at) {
    ctx.addIssue({
      code: 'custom',
      path: ['generatedAt'],
      message: `generatedAt ${index.generatedAt} must equal the newest comment's at ${index.recent[0].at}`,
    });
  }
}

const COMMENTS_INDEX_SCHEMA_TITLE = 'AI Tamer comments index';
const COMMENTS_INDEX_SCHEMA_DESCRIPTION =
  'The contract the comments index (v1/comments-index.json in the public data bucket) on aitamer.news ' +
  'satisfies. Generated from the same zod schema a reader validates against, so it cannot drift. ' +
  'It carries public data only: counts of approved comments per story and the newest comments site-wide. ' +
  'Lengths are counted in Unicode code points. ' +
  'Eight rules cannot be expressed here. A reader enforces the first seven; the eighth is the desk\'s alone, because a reader cannot know which story titles the desk could not find: ' +
  '(1) counts holds only stories with at least one approved comment, and its keys are sorted ascending by UTF-16 code unit ' +
  '(a slug of digits only, such as 2026, is the one case a JavaScript reader cannot see the order of); ' +
  '(2) counts holds at most 10000 stories; ' +
  '(3) recent holds the 60 newest approved comments site-wide at most, newest first by at, comments with the same at ordered by id descending; ' +
  '(4) ids in recent are unique; ' +
  '(5) every slug in recent is a key of counts, and recent holds no more comments of a story than its count; ' +
  '(6) when recent is not empty, generatedAt equals the at of its first entry, so the same state makes the same bytes; ' +
  '(7) a text longer than 400 code points is cut at a grapheme boundary and marked truncated true, so no text is longer than 400 and truncated is never false; ' +
  '(8) an entry whose story title cannot be found is left out of recent. ' +
  'The patterns are ECMA-262 without the u flag, exactly as in the comment contract (/contract/v1/comments.schema.json), whose name, text and slug rules this contract reuses. ' +
  'The format is documented in POST.md: https://github.com/michelabboud/aitamer-news/blob/main/POST.md';

/**
 * `commentsIndexSchema` as JSON Schema, for `/contract/comments-index.schema.json` and
 * `/contract/v1/comments-index.schema.json` — each route gets its own `$id`. `io: 'input'` and the
 * `unrepresentable` handler set to throw, for the same reasons as the comment contract.
 */
export function commentsIndexJsonSchema(route: CommentsIndexSchemaRoute = 'current'): Record<string, unknown> {
  const generated = z.toJSONSchema(commentsIndexSchema, { io: 'input', unrepresentable: 'throw' });
  return {
    $id: `${SITE.url}${COMMENTS_INDEX_SCHEMA_ROUTES[route]}`,
    title: COMMENTS_INDEX_SCHEMA_TITLE,
    description: COMMENTS_INDEX_SCHEMA_DESCRIPTION,
    'x-contract-version': COMMENTS_INDEX_CONTRACT_VERSION,
    ...generated,
  };
}

/** The exact bytes a route serves — and, for `v1`, the bytes the snapshot freezes. Two-space indent, one trailing newline. */
export function commentsIndexJsonSchemaDocument(route: CommentsIndexSchemaRoute = 'current'): string {
  return `${JSON.stringify(commentsIndexJsonSchema(route), null, 2)}\n`;
}
