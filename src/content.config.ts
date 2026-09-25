import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['human', 'bot']),
    bio: z.string(),
    avatar: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    section: z.enum([
      'top',
      'models',
      'tools',
      'image',
      'video',
      'data',
      'databases',
      'rust',
      'policy',
      'opinion',
    ]),
    subsection: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
    author: reference('authors'),
    sources: z
      .array(
        z.object({
          title: z.string().optional(),
          url: z.string(),
        }),
      )
      .optional(),
    /** How verified the story's claims are: 1 tamed (independently checked) to 5 wild (vendor claim only). */
    wildness: z.number().int().min(1).max(5).optional(),
    /** Short phrase: what is verified. Shown on the tamed end of the meter. */
    wildnessTamed: z.string().optional(),
    /** Short phrase: what still rests on a vendor or self-published claim. */
    wildnessWild: z.string().optional(),
    /** Tamer's verdict: one line on why the story matters, and to whom. */
    verdict: z.string().optional(),
    /** A shutdown the story reports. Listed on Extinction Watch. */
    sunset: z
      .object({
        date: z.coerce.date(),
        /** The model IDs or product going away, terse. */
        what: z.string(),
        /** The replacement, or "No replacement listed". */
        note: z.string().optional(),
      })
      .optional(),
  }),
});

export const collections = { authors, posts };
