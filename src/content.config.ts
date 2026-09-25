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
  }),
});

export const collections = { authors, posts };
