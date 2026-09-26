import type { APIContext } from 'astro';
import { reactionsFileJsonSchemaDocument } from '../../content/reaction-schema.ts';

/**
 * The published reactions data file contract, as JSON Schema — generated from the same zod schema
 * the `reactions` collection validates files against (`reactionsFileJsonSchema` in
 * `src/content/reaction-schema.ts`), so this can never drift from what the build enforces. The
 * desk's publisher validates a file against this before it commits it.
 *
 * This route always serves the newest version, with `$id` at this path. The version-pinned
 * `/contract/v1/reactions.schema.json` (`src/pages/contract/v1/reactions.schema.json.ts`) serves v1
 * with its own `$id` and is frozen byte for byte by `src/content/reaction-schema.v1.snapshot.json`.
 * The schema carries its version as `x-contract-version`.
 */
export async function GET(_context: APIContext) {
  return new Response(reactionsFileJsonSchemaDocument('current'), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
