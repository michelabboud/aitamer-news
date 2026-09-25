import type { APIContext } from 'astro';
import { commentsFileJsonSchemaDocument } from '../../content/comment-schema';

/**
 * The published comment data file contract, as JSON Schema — generated from the same zod schema
 * the `comments` collection validates files against (`commentsFileJsonSchema` in
 * `src/content/comment-schema.ts`), so this can never drift from what the build enforces. The
 * desk's publisher validates a file against this before it commits it (ADR 0006).
 *
 * This route always serves the newest version, with `$id` at this path. The version-pinned
 * `/contract/v1/comments.schema.json` (`src/pages/contract/v1/comments.schema.json.ts`) serves
 * v1 with its own `$id` and is frozen byte for byte by `src/content/comment-schema.v1.snapshot.json`,
 * so a future `COMMENT_CONTRACT_VERSION` bump can add `/contract/v2/comments.schema.json` and move
 * this route on without breaking a writer pinned to v1. The schema carries its version as
 * `x-contract-version`.
 */
export async function GET(_context: APIContext) {
  return new Response(commentsFileJsonSchemaDocument('current'), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
