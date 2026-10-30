import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reactionsFileV2Schema, reactionsFileV2JsonSchema, reactionsFileV2JsonSchemaDocument } from '../content/reaction-schema-v2.ts';
import { GET } from '../pages/contract/v2/reactions.schema.json.ts';
import { validateReactionV2File } from './reactions.ts';

const slug = 'a-story';
const file = { version: 2, slug, generation: '1', reactions: [{ id: 'love', n: 2 }] };

test('v2 schema agrees with reader on empty barriers, exact int64 bounds, hostile keys and sorted unique ids', () => {
  const values = [file, { ...file, reactions: [] }, { ...file, generation: '9007199254740993' }, { ...file, generation: '9223372036854775807' }, { ...file, private: true }, { ...file, reactions: [{ id: 'love', n: 0 }] }, { ...file, reactions: [{ id: 'love', n: 2 ** 53 }] }, { ...file, reactions: [{ id: 'wow', n: 1 }, { id: 'love', n: 2 }] }, { ...file, reactions: [{ id: 'love', n: 1 }, { id: 'love', n: 2 }] }];
  for (const generation of [undefined, null, 1, '', '0', '01', '+1', '-1', '1.0', '1e2', '1\n', '9223372036854775808', '9'.repeat(20)]) values.push({ ...file, generation } as typeof file);
  for (const separator of ['\n', '\r', '\u2028', '\u2029']) {
    values.push({ ...file, generation: '1' + separator });
    values.push({ ...file, reactions: [{ id: 'love' + separator, n: 1 }] });
    assert.equal(reactionsFileV2Schema.safeParse({ ...file, slug: slug + separator }).success, false);
  }
  for (const value of values) assert.equal(reactionsFileV2Schema.safeParse(value).success, validateReactionV2File(value, slug).ok, JSON.stringify(value));
});

test('v2 published generation pattern enforces exact int64 bounds and route serves frozen snapshot', async () => {
  const schema = reactionsFileV2JsonSchema() as { properties: Record<string, any>; [key: string]: unknown };
  assert.equal(schema.$id, 'https://aitamer.news/contract/v2/reactions.schema.json');
  assert.equal(schema['x-contract-version'], 2); assert.equal(schema['x-max-utf8-bytes'], 8192);
  const generationPattern = new RegExp(schema.properties.generation.pattern, 'u');
  for (const generation of ['1', '9', '99', '999999999999999999', '9007199254740993', '9223372036854775807']) assert.equal(generationPattern.test(generation), true, generation);
  for (const generation of ['0', '01', '+1', '1\n', '9223372036854775808', '9999999999999999999']) assert.equal(generationPattern.test(generation), false, generation);
  assert.equal(reactionsFileV2JsonSchemaDocument(), readFileSync(new URL('../content/reaction-schema.v2.snapshot.json', import.meta.url), 'utf8'));
  const response = await GET({} as never);
  assert.equal(response.headers.get('Content-Type'), 'application/schema+json; charset=utf-8');
  assert.equal(await response.text(), reactionsFileV2JsonSchemaDocument());
});
