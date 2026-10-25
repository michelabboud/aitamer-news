import type { APIContext } from 'astro';
import { commentsIndexJsonSchemaDocument } from '../../content/comments-index-schema.ts';

/**
 * The published comments index contract, as JSON Schema — generated from the same zod schema a
 * reader validates `v1/comments-index.json` against (`commentsIndexJsonSchema` in
 * `src/content/comments-index-schema.ts`), so this can never drift from what is enforced. The
 * desk's moderation app validates the index against this before it writes it to the data bucket.
 *
 * This route always serves the newest version, with `$id` at this path. The version-pinned
 * `/contract/v1/comments-index.schema.json` (`src/pages/contract/v1/comments-index.schema.json.ts`)
 * serves v1 with its own `$id` and is frozen byte for byte by
 * `src/content/comments-index-schema.v1.snapshot.json`, so a future contract version can add
 * `/contract/v2/comments-index.schema.json` and move this route on without breaking a writer pinned
 * to v1. The schema carries its version as `x-contract-version`.
 */
export async function GET(_context: APIContext) {
  return new Response(commentsIndexJsonSchemaDocument('current'), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
