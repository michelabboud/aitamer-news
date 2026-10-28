import type { APIContext } from 'astro';
import { reactionsFileV2JsonSchemaDocument } from '../../../content/reaction-schema-v2.ts';

/** Explicit v2 contract; the unversioned and frozen v1 routes remain unchanged during rollout. */
export async function GET(_context: APIContext) {
  return new Response(reactionsFileV2JsonSchemaDocument(), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
}
