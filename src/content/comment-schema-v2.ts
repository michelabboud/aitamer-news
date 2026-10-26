import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';
import { commentSchema, commentsFileSchema } from './comment-schema.ts';
import { COMMENTS_PER_FILE_MAX } from './comment-limits.ts';
import { COMMENT_V2_CONTRACT_VERSION, COMMENT_V2_REVISION_MAX_DIGITS, COMMENT_V2_REVISION_PATTERN } from './comment-v2-limits.ts';

/** V2 adds monotonic revisions and permanent empty withdrawals; the baked v1 schema is frozen. */
export const commentRevisionSchema = z.string().max(COMMENT_V2_REVISION_MAX_DIGITS).regex(COMMENT_V2_REVISION_PATTERN, 'revision must be a canonical positive decimal string of at most 40 digits');
export const COMMENTS_V2_SCHEMA_ROUTES = Object.freeze({ current: '/contract/comments.schema.json', v2: '/contract/v2/comments.schema.json' });
export type CommentsV2SchemaRoute = keyof typeof COMMENTS_V2_SCHEMA_ROUTES;

export const commentsFileV2Schema = z.object({
  version: z.literal(COMMENT_V2_CONTRACT_VERSION),
  revision: commentRevisionSchema,
  slug: commentsFileSchema.shape.slug,
  generatedAt: commentsFileSchema.shape.generatedAt,
  comments: z.array(commentSchema).max(COMMENTS_PER_FILE_MAX),
}).strict().superRefine((file, ctx) => {
  const ids = new Set<string>();
  file.comments.forEach((comment, position) => {
    if (ids.has(comment.id)) ctx.addIssue({ code: 'custom', path: ['comments', position, 'id'], message: 'ids must be unique within a file' });
    ids.add(comment.id);
    if (position > 0 && Date.parse(comment.at) < Date.parse(file.comments[position - 1].at)) {
      ctx.addIssue({ code: 'custom', path: ['comments', position, 'at'], message: 'comments must be sorted oldest first' });
    }
    if (Date.parse(comment.at) > Date.parse(file.generatedAt)) {
      ctx.addIssue({ code: 'custom', path: ['comments', position, 'at'], message: 'at must be no later than generatedAt' });
    }
  });
});
export type CommentsFileV2 = z.infer<typeof commentsFileV2Schema>;

export function commentsFileV2JsonSchema(route: CommentsV2SchemaRoute = 'current'): Record<string, unknown> {
  return {
    $id: `${SITE.url}${COMMENTS_V2_SCHEMA_ROUTES[route]}`,
    title: 'AI Tamer comment data file v2',
    description: 'Public v2/comments/<slug>.json envelope. Revision is a canonical positive decimal string of at most 40 digits, parsed as BigInt and never a floating-point number. Empty comments permanently withdraw a story projection. generatedAt is informational UTC metadata, never a concurrency fence. The slug equals the object filename and names an existing story; ids are unique; comments are oldest first; every at is no later than generatedAt. Text, slug and Unicode code-point bounds retain the frozen v1 rules. Revision and generatedAt do not participate in semantic content equality.',
    'x-contract-version': COMMENT_V2_CONTRACT_VERSION,
    ...z.toJSONSchema(commentsFileV2Schema, { io: 'input', unrepresentable: 'throw' }),
  };
}
export function commentsFileV2JsonSchemaDocument(route: CommentsV2SchemaRoute = 'current'): string {
  return `${JSON.stringify(commentsFileV2JsonSchema(route), null, 2)}\n`;
}
