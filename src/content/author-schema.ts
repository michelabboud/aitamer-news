import { z } from 'astro/zod';
import { AUTHOR_KINDS } from '../lib/author-kinds.ts';

/** Author presentation metadata, shared with behavioral tests (ADR 0032). */
export const authorSchema = z.object({
  name: z.string(),
  kind: z.enum(AUTHOR_KINDS),
  bio: z.string(),
  /** AI writers are featured by default; humans opt in. Bots remain desk profiles. */
  featured: z.boolean().optional(),
  /** Editorial card and menu order; existing AI writers retain their default positions. */
  writerOrder: z.number().int().nonnegative().optional(),
  /** Author-wide disclosure only: factual claims still need sources and fact checks. */
  personalOpinion: z.boolean().default(false),
  /** Public author website; HTTPS only so links cannot execute script or downgrade readers. */
  website: z.string().url().refine((url) => {
    if (!URL.canParse(url)) return false;
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
  }, { message: 'website must be an HTTPS URL without credentials' }).optional(),
  avatar: z.string().optional(),
  /**
   * A featured writer's own page (`/<id>/`, ADR 0032): a tall portrait and its alt text, both
   * or neither, and the beats they cover. The file's body is their self-introduction.
   */
  portrait: z.string().regex(/^\/authors\/[a-z0-9-]+\.(jpg|png|webp)$/).optional(),
  portraitAlt: z.string().min(1).optional(),
  beats: z.array(z.string().min(1)).optional(),
}).refine((a) => (a.portrait === undefined) === (a.portraitAlt === undefined), {
  message: 'portrait and portraitAlt go together: a portrait needs its alt text',
});
