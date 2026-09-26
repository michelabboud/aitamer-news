import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';
import { REACTION_ID } from '../lib/reactions.ts';
import { COMMENT_SLUG, COMMENT_SLUG_MAX } from './comment-schema.ts';

/**
 * Reactions data file contract v1 (2026-09-26): `src/content/reactions/<slug>.json`, one file per
 * post whose readers' reactions add up to more than zero. The desk's publisher writes these files
 * from its database — the permanent anonymous totals plus the live reactions — and editors only
 * ever remove a file. The format is documented for writers in POST.md section 9 and in
 * `src/content/reactions/README.md`. Change it additively (ADR 0004's rule applies unchanged).
 *
 * The comment contract's twin (`./comment-schema.ts`), and built the same way: this schema is the
 * single source of the published JSON Schema (`reactionsFileJsonSchema` below, served at
 * `/contract/reactions.schema.json` and `/contract/v1/reactions.schema.json`), so what the
 * publisher validates against before it commits can never drift from what the build enforces; it
 * has no `astro:content` import, so `src/lib/reaction-contract.test.ts` runs it under plain
 * `node:test`.
 *
 * **v1 is frozen.** `src/content/reaction-schema.v1.snapshot.json` holds the bytes
 * `/contract/v1/reactions.schema.json` serves, and the test fails on any difference: an additive
 * change needs a new snapshot and a deliberate review, a breaking change needs v2.
 *
 * **Deterministic by design.** No timestamp, ids sorted, `n ≥ 1` only: the same totals always make
 * the same bytes, so the publisher's "the tree equals `main`'s, open no pull request" rule
 * (ADR 0007) keeps a count that did not change from deploying the site again.
 *
 * **Unknown ids are allowed.** The reaction set (`src/lib/reactions.ts`) can be swapped, and a
 * retired id keeps its permanent total, so the contract checks an id's shape
 * ({@link REACTION_ID}), not its membership. The page counts an unknown id in the total and shows
 * no chip for it (`reactionTotals`).
 *
 * Every object is `.strict()`: an unknown key fails the build naming the file. The rules that need
 * the file name (`slug` equals it) or the posts directory (the post exists) are enforced by
 * `scripts/check-reactions.mjs` (part of `npm run check:posts`) and the collection loader
 * (`src/content/data-file-loader.ts`); the rules that need two items at once (ids unique, sorted)
 * are a zod refinement here and prose in the JSON Schema's `description`.
 */

/** The reactions contract's version. Bump it, and add a sibling schema route, rather than editing this one in place. */
export const REACTION_CONTRACT_VERSION = 1;

/** The routes the contract is served at, relative to the site root; `$id` is the site URL plus the route. */
export const REACTIONS_SCHEMA_ROUTES = Object.freeze({
  /** Always the newest version of the contract. */
  current: '/contract/reactions.schema.json',
  /** Version 1, pinned: keeps serving v1 after a v2 exists. */
  v1: '/contract/v1/reactions.schema.json',
});
export type ReactionsSchemaRoute = keyof typeof REACTIONS_SCHEMA_ROUTES;

/** A post slug: the same shape and cap as the comment contract's, because both name the same posts. */
export const REACTION_SLUG = COMMENT_SLUG;
export const REACTION_SLUG_MAX = COMMENT_SLUG_MAX;

/**
 * Distinct reaction ids in one file. Far above the seven of today's set, so retired ids can
 * accumulate across several swaps; far below anything that could make a file large (each entry is
 * a few dozen bytes).
 */
export const REACTIONS_PER_FILE_MAX = 64;

export const reactionCountSchema = z
  .object({
    /** A reaction id: {@link REACTION_ID}. Known to the current set or not. */
    id: z.string().regex(REACTION_ID, 'id must be a lowercase letter then up to 23 lowercase letters, digits or hyphens'),
    /** How many readers chose it, permanent totals and live reactions together. A zero is left out, never written. */
    n: z.int({ error: 'n must be a whole number' }).min(1, 'n must be at least 1; a reaction nobody chose is left out'),
  })
  .strict();

export type ReactionCount = z.infer<typeof reactionCountSchema>;

/**
 * ids unique in the file, and sorted ascending (by UTF-16 code unit, which for these ASCII ids is
 * plain alphabetical order with `-` before digits before letters): one order, so the same totals
 * are always the same bytes.
 */
function uniqueSortedIds(reactions: ReactionCount[], ctx: z.RefinementCtx) {
  const firstIndexOf = new Map<string, number>();
  reactions.forEach((reaction, index) => {
    const earlier = firstIndexOf.get(reaction.id);
    if (earlier !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `id ${reaction.id} is also on reaction ${earlier}; ids are unique in a file`,
      });
      return;
    }
    firstIndexOf.set(reaction.id, index);
    if (index > 0 && reaction.id < reactions[index - 1].id) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: 'reactions must be sorted by id, ascending',
      });
    }
  });
}

export const reactionsFileSchema = z
  .object({
    version: z.literal(REACTION_CONTRACT_VERSION),
    /** The post's slug. Must equal the file name (checked by `npm run check:posts` and the loader). */
    slug: z
      .string()
      .regex(REACTION_SLUG, 'slug must be lowercase letters, digits and hyphens, starting with a letter or digit')
      .max(REACTION_SLUG_MAX, `slug must be at most ${REACTION_SLUG_MAX} characters`),
    /** Every reaction with a count above zero, sorted by id. A post with none has no file at all. */
    reactions: z
      .array(reactionCountSchema)
      .min(1, 'a file with no reactions must not exist; the desk deletes it')
      .max(REACTIONS_PER_FILE_MAX, `a file holds at most ${REACTIONS_PER_FILE_MAX} reactions`)
      .superRefine(uniqueSortedIds),
  })
  .strict();

export type ReactionsFile = z.infer<typeof reactionsFileSchema>;

const REACTIONS_SCHEMA_TITLE = 'AI Tamer reactions data file';
const REACTIONS_SCHEMA_DESCRIPTION =
  'The contract every reactions data file (src/content/reactions/<slug>.json) on aitamer.news ' +
  'satisfies. Generated from the same zod schema the build validates against, so it cannot drift. ' +
  'Each n is the total for one reaction id: the desk\'s permanent anonymous totals plus its live reactions. ' +
  'Five rules cannot be expressed here and the build enforces them too: ' +
  '(1) the slug equals the file name; ' +
  '(2) a post with that slug exists; ' +
  '(3) a post whose reactions add up to zero has no file, so a file is never published empty; ' +
  '(4) ids are unique within a file; ' +
  '(5) reactions are sorted by id, ascending, by UTF-16 code unit. ' +
  'The file carries no timestamp, so the same totals always produce the same bytes. ' +
  'An id need not be in the site\'s current reaction set (src/lib/reactions.ts): a retired id keeps ' +
  'its total, which the page counts in the story\'s total without showing it. ' +
  'The format is documented in POST.md: https://github.com/michelabboud/aitamer-news/blob/main/POST.md';

/**
 * `reactionsFileSchema` as JSON Schema, for `/contract/reactions.schema.json` and
 * `/contract/v1/reactions.schema.json` — each route gets its own `$id`. `io: 'input'`, and the
 * `unrepresentable` handler set to throw, for the same reasons as the comment contract. zod writes
 * `n` as `type: integer` with `minimum: 1` and `maximum: 9007199254740991` (the largest integer a
 * JSON number carries exactly, which zod's `int()` enforces too).
 */
export function reactionsFileJsonSchema(route: ReactionsSchemaRoute = 'current'): Record<string, unknown> {
  const generated = z.toJSONSchema(reactionsFileSchema, { io: 'input', unrepresentable: 'throw' });
  return {
    $id: `${SITE.url}${REACTIONS_SCHEMA_ROUTES[route]}`,
    title: REACTIONS_SCHEMA_TITLE,
    description: REACTIONS_SCHEMA_DESCRIPTION,
    'x-contract-version': REACTION_CONTRACT_VERSION,
    ...generated,
  };
}

/** The exact bytes a route serves — and, for `v1`, the bytes the snapshot freezes. Two-space indent, one trailing newline. */
export function reactionsFileJsonSchemaDocument(route: ReactionsSchemaRoute = 'current'): string {
  return `${JSON.stringify(reactionsFileJsonSchema(route), null, 2)}\n`;
}
