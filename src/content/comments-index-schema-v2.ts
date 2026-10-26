import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';
import { commentsIndexSchema, recentCommentSchema } from './comments-index-schema.ts';
import { COMMENTS_INDEX_RECENT_MAX } from './comment-limits.ts';
import { COMMENT_V2_CONTRACT_VERSION } from './comment-v2-limits.ts';
import { commentRevisionSchema } from './comment-schema-v2.ts';

export const COMMENTS_INDEX_V2_SCHEMA_ROUTES = Object.freeze({ current: '/contract/comments-index.schema.json', v2: '/contract/v2/comments-index.schema.json' });
export type CommentsIndexV2SchemaRoute = keyof typeof COMMENTS_INDEX_V2_SCHEMA_ROUTES;

/** Shared field definitions retain every frozen v1 text/count rule, without its generation-time equality. */
export const commentsIndexV2Schema = z.object({
  version: z.literal(COMMENT_V2_CONTRACT_VERSION),
  revision: commentRevisionSchema,
  site: commentsIndexSchema.shape.site,
  generatedAt: commentsIndexSchema.shape.generatedAt,
  counts: commentsIndexSchema.shape.counts,
  recent: z.array(recentCommentSchema).max(COMMENTS_INDEX_RECENT_MAX),
}).strict().superRefine((index, ctx) => {
  const ids = new Set<string>();
  const shownPerSlug = new Map<string, number>();
  index.recent.forEach((comment, position) => {
    if (ids.has(comment.id)) ctx.addIssue({ code: 'custom', path: ['recent', position, 'id'], message: 'ids must be unique in recent' });
    ids.add(comment.id);
    if (position > 0) {
      const before = index.recent[position - 1];
      const later = Date.parse(comment.at) - Date.parse(before.at);
      if (later > 0 || (later === 0 && comment.id > before.id)) {
        ctx.addIssue({ code: 'custom', path: ['recent', position, 'at'], message: 'recent must be newest first, equal times by id descending' });
      }
    }
    const total = Object.hasOwn(index.counts, comment.slug) ? index.counts[comment.slug] : undefined;
    const shown = (shownPerSlug.get(comment.slug) ?? 0) + 1;
    shownPerSlug.set(comment.slug, shown);
    if (total === undefined || shown > total) {
      ctx.addIssue({ code: 'custom', path: ['recent', position, 'slug'], message: 'every recent slug must have a count covering its recent entries' });
    }
    if (Date.parse(comment.at) > Date.parse(index.generatedAt)) {
      ctx.addIssue({ code: 'custom', path: ['recent', position, 'at'], message: 'at must be no later than generatedAt' });
    }
  });
});
export type CommentsIndexV2 = z.infer<typeof commentsIndexV2Schema>;

export function commentsIndexV2JsonSchema(route: CommentsIndexV2SchemaRoute = 'current'): Record<string, unknown> {
  return {
    $id: `${SITE.url}${COMMENTS_INDEX_V2_SCHEMA_ROUTES[route]}`,
    title: 'AI Tamer comments index v2',
    description: 'Public v2/comments-index.json envelope. Revision is a canonical positive decimal string of at most 40 digits, parsed as BigInt and never a floating-point number. Empty counts and recent are valid permanent withdrawals. generatedAt is informational UTC metadata, never a concurrency fence, and need not equal the newest at. Every recent at is no later than generatedAt. Counts retain the v1 slug, positive count, capacity and sorted-key rules. Recent retains the v1 text, title, truncation, uniqueness and newest-first rules, equal times by id descending; each slug must occur in counts, covering all recent entries for that slug. Entries with unavailable story titles are omitted. Revision and generatedAt do not participate in semantic content equality.',
    'x-contract-version': COMMENT_V2_CONTRACT_VERSION,
    ...z.toJSONSchema(commentsIndexV2Schema, { io: 'input', unrepresentable: 'throw' }),
  };
}
export function commentsIndexV2JsonSchemaDocument(route: CommentsIndexV2SchemaRoute = 'current'): string {
  return `${JSON.stringify(commentsIndexV2JsonSchema(route), null, 2)}\n`;
}
