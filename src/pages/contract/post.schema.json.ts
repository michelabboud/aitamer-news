import type { APIContext } from 'astro';
import { postFrontmatterJsonSchema } from '../../content/post-schema';

/**
 * The published post contract, as JSON Schema — generated from the same zod schema
 * `content.config.ts` validates posts against (`postFrontmatterJsonSchema` in
 * `src/content/post-schema.ts`), so this can never drift from what the build actually enforces.
 * atn-mcp validates a post against this before writing it.
 *
 * Also served at the versioned path `/contract/v1/post.schema.json`
 * (`src/pages/contract/v1/post.schema.json.ts`, which re-exports this same handler) so a future
 * `POST_CONTRACT_VERSION` bump can add `/contract/v2/post.schema.json` beside it without breaking
 * a writer pinned to v1. The schema itself carries its version as `x-contract-version`.
 */
export async function GET(_context: APIContext) {
  return new Response(JSON.stringify(postFrontmatterJsonSchema(), null, 2), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
