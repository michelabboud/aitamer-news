import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { HABITATS } from './lib/habitats';

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['human', 'bot']),
    bio: z.string(),
    avatar: z.string().optional(),
  }),
});

/**
 * Post contract v1 (2026-09-25). aitamer-news-ops (bots), atn-mcp (the posts tool) and human
 * editors all write these fields; POST.md documents each one. Change it additively.
 * Rules that depend on publish state (a number, a time, sources) live in `npm run check:posts`,
 * so a post can be edited freely while it is a draft.
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

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
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
    author: reference('authors'),
    sources: z
      .array(
        z.object({
          title: z.string().optional(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
});

export const collections = { authors, posts };
