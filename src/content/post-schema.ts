import { reference } from 'astro:content';
import { z } from 'astro/zod';
import { HABITATS } from '../lib/habitats';
import { SITE } from '../lib/site';

/**
 * Post contract v1 (2026-09-25). aitamer-news-ops (bots), atn-mcp (the posts tool) and human
 * editors all write these fields; POST.md documents each one. Change it additively.
 * Rules that depend on publish state (a number, a time, sources) live in `npm run check:posts`,
 * so a post can be edited freely while it is a draft.
 *
 * This schema is also the source `/contract/post.schema.json` is generated from
 * (`postFrontmatterJsonSchema` below, served by `src/pages/contract/post.schema.json.ts`), so the
 * published contract can never drift from what the build actually enforces.
 */

/** How tamed the claims are: 1 independently verified … 5 vendor claim only (src/lib/wildness.ts). */
const wildness = z.object({
  rating: z.number().int().min(1).max(5),
  /** What the sources verify, in a few words. */
  verified: z.string().min(1).max(120),
  /** What rests on a claim only, in a few words. */
  claimed: z.string().min(1).max(120),
});

/** Something going away on a date: feeds Extinction Watch. */
const sunset = z.object({
  date: z.coerce.date(),
  what: z.string().min(1).max(160),
  /** Omit when the vendor names none; the page then says so. */
  replacement: z.string().min(1).max(160).optional(),
});

/** A YouTube video embedded in the post. Only the ID; the page builds the embed. */
const video = z.object({
  youtube: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'youtube must be the 11-character video ID, not a URL'),
  title: z.string().min(1).max(200),
  channel: z.string().min(1).max(120),
});

const correction = z.object({
  date: z.coerce.date(),
  text: z.string().min(1).max(500),
});

const withdrawal = z.object({
  date: z.coerce.date(),
  reason: z.string().min(1).max(500),
});

/** The one `reference()` field in the contract: captured so the JSON Schema export below can spot it. */
const author = reference('authors');

export const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  section: z.enum(HABITATS),
  subsection: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  /** `/heroes/<slug>.jpg` in this repo, or an absolute https URL (R2, later). */
  heroImage: z.string().optional(),
  /** What the cover art shows, for screen readers and search. Falls back to the title. */
  heroAlt: z.string().min(1).max(300).optional(),
  /** Permanent citable number, assigned by `npm run stamp`. Never set or change it by hand. */
  specimen: z.number().int().positive().optional(),
  wildness: wildness.optional(),
  /** The Tamer's verdict: one line on what the news means for the reader. */
  verdict: z.string().min(1).max(240).optional(),
  sunset: sunset.optional(),
  video: video.optional(),
  /** Dated corrections, shown on the post. Add one; never edit or remove an old one. */
  corrections: z.array(correction).default([]),
  /** Set to take a post down: its URL stays with this notice; it leaves every list and feed. */
  withdrawn: withdrawal.optional(),
  author,
  sources: z
    .array(
      z.object({
        title: z.string().optional(),
        url: z.string(),
      }),
    )
    .optional(),
});

const POST_SCHEMA_ID = `${SITE.url}/contract/post.schema.json`;
const POST_SCHEMA_TITLE = 'AI Tamer post frontmatter';
const POST_SCHEMA_DESCRIPTION =
  'The frontmatter contract every published post on aitamer.news satisfies. Generated from the ' +
  'same zod schema the build validates against, so it cannot drift. Field-by-field documentation, ' +
  'examples and the publishing workflow are in POST.md: https://github.com/michelabboud/aitamer-news/blob/main/POST.md';

/**
 * `postSchema` as JSON Schema, for `/contract/post.schema.json` — the shape of what a human or
 * bot actually writes in frontmatter, before parsing fills in defaults or Astro resolves the
 * author reference. `io: 'input'` is what makes that the shape zod emits: with the default
 * `io: 'output'`, a field with `.default(...)` (`tags`, `draft`, `corrections`) comes out
 * `required`, because it is always present *after* parsing — which would make this contract
 * reject the very frontmatter POST.md documents as valid (those fields omitted entirely).
 *
 * Two things zod's generic converter still cannot represent as-is:
 *
 * - Every `z.coerce.date()` field (pubDate, updatedDate, sunset/correction/withdrawn dates) has no
 *   canonical JSON representation as a zod type, in either io mode, so `unrepresentable` — matched
 *   by the exact message zod raises for it — turns it into an ISO 8601 date-time string.
 * - `author` is `reference('authors')`, a union Astro resolves to a `{ id, collection }` object at
 *   build time. Under `io: 'input'` its union of accepted shapes (string / number / two object
 *   forms) would come through as-is, but what a human or bot actually writes is always a plain
 *   string id (e.g. `desk-bot`), so `override` — matched by identity against the exact schema
 *   instance below — replaces it with that.
 */
export function postFrontmatterJsonSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(postSchema, {
    io: 'input',
    unrepresentable(ctx) {
      if (ctx.message === 'Date cannot be represented in JSON Schema') {
        return { type: 'string', format: 'date-time', description: 'ISO 8601, UTC.' };
      }
      return 'throw';
    },
    override(ctx) {
      if (ctx.zodSchema === author) {
        for (const key of Object.keys(ctx.jsonSchema)) delete ctx.jsonSchema[key];
        Object.assign(ctx.jsonSchema, {
          type: 'string',
          description: "The id of an entry under src/content/authors/, e.g. \"desk-bot\" (see POST.md).",
        });
      }
    },
  });

  return {
    $id: POST_SCHEMA_ID,
    title: POST_SCHEMA_TITLE,
    description: POST_SCHEMA_DESCRIPTION,
    ...generated,
  };
}
