import { z } from 'astro/zod';
import { SITE } from '../lib/site-meta.ts';
import { reactionCountSchema, reactionsFileSchema, REACTIONS_PER_FILE_MAX } from './reaction-schema.ts';
import { REACTION_V2_CONTRACT_VERSION, REACTION_V2_MAX_BYTES, REACTION_V2_MAX_GENERATION } from '../lib/reactions.ts';

/** JSON Schema cannot compare decimal strings numerically: encode the exact int64 ceiling. */
function generationPattern(maximum: string): string {
  const alternatives = ['[1-9][0-9]{0,17}'];
  for (let position = 0; position < maximum.length; position++) {
    const minimum = position === 0 ? 1 : 0;
    const smaller = Number(maximum[position]) - 1;
    if (smaller < minimum) continue;
    const digit = minimum === smaller ? String(minimum) : `[${minimum}-${smaller}]`;
    alternatives.push(`${maximum.slice(0, position)}${digit}[0-9]{${maximum.length - position - 1}}`);
  }
  alternatives.push(maximum);
  // A negative any-character lookahead is an exact end, unlike $, which permits a final newline.
  return `^(?:${alternatives.join('|')})(?![\\s\\S])`;
}

export const REACTIONS_V2_SCHEMA_ROUTES = Object.freeze({ v2: '/contract/v2/reactions.schema.json' });
export const reactionGenerationV2Schema = z.string().max(REACTION_V2_MAX_GENERATION.length).regex(new RegExp(generationPattern(REACTION_V2_MAX_GENERATION)));
export const reactionsFileV2Schema = z.object({
  version: z.literal(REACTION_V2_CONTRACT_VERSION),
  slug: reactionsFileSchema.shape.slug.regex(/^[a-z0-9][a-z0-9-]*(?![\s\S])/),
  generation: reactionGenerationV2Schema,
  reactions: z.array(reactionCountSchema.extend({ id: reactionCountSchema.shape.id.regex(/^[a-z][a-z0-9-]{0,23}(?![\s\S])/) })).max(REACTIONS_PER_FILE_MAX),
}).strict().superRefine((file, context) => {
  file.reactions.forEach((entry, index) => {
    if (index > 0 && entry.id <= file.reactions[index - 1].id) context.addIssue({ code: 'custom', path: ['reactions', index, 'id'], message: 'reaction ids must be unique and sorted ascending' });
  });
});
export type ReactionsFileV2 = z.infer<typeof reactionsFileV2Schema>;

export function reactionsFileV2JsonSchema(): Record<string, unknown> {
  return {
    $id: `${SITE.url}${REACTIONS_V2_SCHEMA_ROUTES.v2}`,
    title: 'AI Tamer reactions data file v2',
    description: 'Public v2/reactions/<slug>.json envelope. The generation is a canonical positive signed-64-bit decimal string from 1 to 9223372036854775807, compared with BigInt. Empty reactions is a permanent zero-state barrier. Reaction ids are unique and sorted ascending; retired ids remain valid. The slug equals the object filename and names a story. Bytes are canonical JSON in version, slug, generation, reactions key order, each reaction in id, n order, with one trailing newline; duplicate keys and noncanonical bytes are invalid. The reader retains the last accepted generation through retries, refuses older or changed same-generation payloads, and never falls back to v1.',
    'x-contract-version': REACTION_V2_CONTRACT_VERSION,
    'x-max-utf8-bytes': REACTION_V2_MAX_BYTES,
    ...z.toJSONSchema(reactionsFileV2Schema, { io: 'input', unrepresentable: 'throw' }),
  };
}
export function reactionsFileV2JsonSchemaDocument(): string {
  return `${JSON.stringify(reactionsFileV2JsonSchema(), null, 2)}\n`;
}
