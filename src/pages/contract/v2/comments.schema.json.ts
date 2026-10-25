import type { APIContext } from 'astro';
import { commentsFileV2JsonSchemaDocument } from '../../../content/comment-schema-v2.ts';

/** V2 comments contract. The /contract/v1/ routes and baked collection remain frozen. */
export async function GET(_context: APIContext) {
  return new Response(commentsFileV2JsonSchemaDocument('v2'), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
