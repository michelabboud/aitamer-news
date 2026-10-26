import type { APIContext } from 'astro';
import { commentsIndexV2JsonSchemaDocument } from '../../content/comments-index-schema-v2.ts';

/** V2 comments contract. The /contract/v1/ routes and baked collection remain frozen. */
export async function GET(_context: APIContext) {
  return new Response(commentsIndexV2JsonSchemaDocument('current'), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
