import type { APIContext } from 'astro';
import { reactionsFileJsonSchemaDocument } from '../../../content/reaction-schema.ts';

/**
 * The v1 reactions data file contract, at a version-pinned path with its own `$id`. Frozen: the
 * bytes this route serves are `src/content/reaction-schema.v1.snapshot.json`, and the contract test
 * fails on any difference. When the contract ever needs a breaking change, this path keeps serving
 * v1 while `/contract/reactions.schema.json` (and a new `/contract/v2/...`) move on.
 */
export async function GET(_context: APIContext) {
  return new Response(reactionsFileJsonSchemaDocument('v1'), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
