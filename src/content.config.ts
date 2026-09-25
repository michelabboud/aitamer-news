import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { commentsFileSchema } from './content/comment-schema';
import { commentsLoader } from './content/comments-loader';
import { postSchema } from './content/post-schema';

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
 * Post contract v1 (2026-09-25): the schema lives in `./content/post-schema.ts`, which also
 * generates `/contract/post.schema.json` from the very same definition, so the published JSON
 * Schema contract can never drift from what this build enforces. `postSchema` carries no
 * `astro:content` import of its own (so it stays importable from a plain `node:test` run,
 * `src/lib/post-contract.test.ts`); `author` is added here as the one field that needs Astro's
 * own `reference()`, which also checks that the id actually exists under `src/content/authors/`.
 */
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: postSchema.extend({ author: reference('authors') }),
});

/**
 * Comment data files, contract v1 (2026-09-25): `src/content/comments/<slug>.json`, one per post
 * with at least one approved comment, written by the desk's publisher (ADR 0006). The schema in
 * `./content/comment-schema.ts` also generates `/contract/comments.schema.json`. The loader is
 * Astro's glob loader with the entry id fixed to the file name and the empty-directory warning
 * silenced (`./content/comments-loader.ts`): zero files is the normal state until the first
 * comment is published, and the build must pass on it.
 */
const comments = defineCollection({
  loader: commentsLoader(),
  schema: commentsFileSchema,
});

export const collections = { authors, posts, comments };
