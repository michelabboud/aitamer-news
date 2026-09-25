import { z } from 'astro/zod';
import { HABITATS } from '../lib/habitats.ts';
import { SITE } from '../lib/site-meta.ts';
import { WILDNESS_MAX, WILDNESS_MIN } from '../lib/wildness.ts';

/**
 * Post contract v1 (2026-09-25). atn-ops (bots), atn-mcp (the posts tool) and human
 * editors all write these fields; POST.md documents each one. Change it additively.
 * Rules that depend on publish state (a number, a time, sources) live in `npm run check:posts`,
 * so a post can be edited freely while it is a draft.
 *
 * This schema is also the source `/contract/post.schema.json` is generated from
 * (`postFrontmatterJsonSchema` below, served by `src/pages/contract/post.schema.json.ts` and
 * `src/pages/contract/v1/post.schema.json.ts`), so the published contract can never drift from
 * what the build actually enforces.
 *
 * No `astro:content` import: `postSchema` here validates every field except `author`, which
 * `content.config.ts` adds with `.extend({ author: reference('authors') })` before handing the
 * result to `defineCollection`. That keeps this file — and its own test,
 * `src/lib/post-contract.test.ts` — importable from plain `node:test`, with no Astro runtime.
 *
 * Every nested object below, and the post object itself, is `.strict()`: an unknown key fails the
 * build naming the file, rather than vanishing silently (docs/adr/0004-post-contract-is-strict.md,
 * from docs/reviews/2026-09-25-batch-a-deep-review.md finding B5).
 */

/**
 * sunset.date / corrections[].date / withdrawn.date: a YAML date node (js-yaml resolves an
 * unquoted `2026-09-25` to a `Date` at frontmatter-parse time), or a strict `YYYY-MM-DD` / full
 * ISO-8601 UTC string. Unlike `z.coerce.date()` — kept as-is for `pubDate`/`updatedDate`, which
 * are always written by a human or by `npm run stamp`, never by an arbitrary bot input — this
 * never accepts a bare number (read as a Unix-epoch timestamp) or a boolean (finding B5).
 */
function strictDate() {
  return z
    .union([z.date(), z.iso.date(), z.iso.datetime()])
    .transform((value) => (value instanceof Date ? value : new Date(value)));
}

/** How tamed the claims are: 1 independently verified … 5 vendor claim only (src/lib/wildness.ts). */
const wildness = z
  .object({
    rating: z.number().int().min(WILDNESS_MIN).max(WILDNESS_MAX),
    /** What the sources verify, in a few words. */
    verified: z.string().min(1).max(120),
    /** What rests on a claim only, in a few words. */
    claimed: z.string().min(1).max(120),
  })
  .strict();

/** Something going away on a date: feeds Extinction Watch. */
const sunset = z
  .object({
    date: strictDate(),
    what: z.string().min(1).max(160),
    /** Omit when the vendor names none; the page then says so. */
    replacement: z.string().min(1).max(160).optional(),
  })
  .strict();

/** A YouTube video embedded in the post. Only the ID; the page builds the embed. */
const video = z
  .object({
    youtube: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'youtube must be the 11-character video ID, not a URL'),
    title: z.string().min(1).max(200),
    channel: z.string().min(1).max(120),
  })
  .strict();

const correction = z
  .object({
    date: strictDate(),
    text: z.string().min(1).max(500),
  })
  .strict();

const withdrawal = z
  .object({
    date: strictDate(),
    reason: z.string().min(1).max(500),
  })
  .strict();

/**
 * Per-post comment settings (phase 2 plan D7). An object rather than a bare boolean so a
 * `reason` or a `closesAt` can be added later without renaming anything. `closed: true` stops
 * new comments: the page shows "comments are closed" instead of the form, and
 * `/comments/threads.json` marks the thread closed so the Worker refuses posts to it.
 * Approved comments already published stay on the page. A withdrawn post is closed regardless.
 */
const comments = z
  .object({
    closed: z.boolean(),
  })
  .strict();

export const postSchema = z
  .object({
    // Non-empty and bounded: they become the h1, the <title>, the feed item and the JSON-LD headline.
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(400),
    // A plain date while drafting, a full UTC time once stamped; never a bare number (review N-minor 9, info 7).
    pubDate: strictDate(),
    updatedDate: strictDate().optional(),
    section: z.enum(HABITATS),
    subsection: z.string().optional(),
    tags: z.array(z.string().min(1).max(60)).default([]),
    draft: z.boolean().default(false),
    /** `/heroes/<slug>.jpg` in this repo, or an absolute https URL (R2, later). */
    heroImage: z
      .string()
      .regex(
        /^(?:\/heroes\/[a-z0-9-]+\.jpg|https:\/\/\S+)$/,
        'heroImage must be /heroes/<slug>.jpg in this repo, or an absolute https:// URL',
      )
      .optional(),
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
    /** `{ closed: true }` closes the post's comment thread. Absent means open (unless withdrawn). */
    comments: comments.optional(),
    /**
     * The id of an entry under `src/content/authors/`, e.g. `desk-bot`. A plain string here:
     * `content.config.ts` replaces this field with `reference('authors')` before the schema
     * reaches `defineCollection`, so the build also checks the id actually exists.
     */
    author: z
      .string()
      .min(1)
      .describe('The id of an entry under src/content/authors/, e.g. "desk-bot" (see POST.md).'),
    sources: z
      .array(
        z
          .object({
            title: z.string().optional(),
            /** http(s) only: a `javascript:` or `data:` link must never reach an href. */
            url: z.string().regex(/^https?:\/\/\S+$/, 'source url must start with http:// or https://'),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

/** The post contract's version. Bump it, and add a sibling schema route, rather than editing this one in place. */
export const POST_CONTRACT_VERSION = 1;

const POST_SCHEMA_ID = `${SITE.url}/contract/post.schema.json`;
const POST_SCHEMA_TITLE = 'AI Tamer post frontmatter';
const POST_SCHEMA_DESCRIPTION =
  'The frontmatter contract every published post on aitamer.news satisfies. Generated from the ' +
  'same zod schema the build validates against, so it cannot drift. Field-by-field documentation, ' +
  'examples and the publishing workflow are in POST.md: https://github.com/michelabboud/aitamer-news/blob/main/POST.md';

/**
 * `postSchema` as JSON Schema, for `/contract/post.schema.json` and `/contract/v1/post.schema.json`
 * — the shape of what a human or bot actually writes in frontmatter, before parsing fills in
 * defaults. `io: 'input'` is what makes that the shape zod emits: with the default `io: 'output'`,
 * a field with `.default(...)` (`tags`, `draft`, `corrections`) comes out `required`, because it
 * is always present *after* parsing — which would make this contract reject the very frontmatter
 * POST.md documents as valid (those fields omitted entirely).
 *
 * `author` is a plain string here (see the field comment above), so it needs no override: the
 * generic zod-to-JSON-Schema conversion already represents it correctly.
 *
 * One thing the generic converter still cannot represent as-is: every `z.date()` branch (inside
 * `pubDate`, `updatedDate`, and the `strictDate()` union used by `sunset`/`corrections`/`withdrawn`)
 * has no canonical JSON representation as a zod type, in either io mode, so `unrepresentable` —
 * matched by the exact message zod raises for it — turns it into an ISO 8601 date-time string.
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
  });

  return {
    $id: POST_SCHEMA_ID,
    title: POST_SCHEMA_TITLE,
    description: POST_SCHEMA_DESCRIPTION,
    'x-contract-version': POST_CONTRACT_VERSION,
    ...generated,
  };
}
