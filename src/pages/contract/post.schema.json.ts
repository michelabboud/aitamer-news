import type { APIContext } from 'astro';
import { postFrontmatterJsonSchema } from '../../content/post-schema';

/**
 * The published post contract, as JSON Schema — generated from the same zod schema
 * `content.config.ts` validates posts against (`postFrontmatterJsonSchema` in
 * `src/content/post-schema.ts`), so this can never drift from what the build actually enforces.
 * atn-mcp validates a post against this before writing it.
 */
export async function GET(_context: APIContext) {
  return new Response(JSON.stringify(postFrontmatterJsonSchema(), null, 2), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
