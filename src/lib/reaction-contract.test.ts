import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  REACTIONS_PER_FILE_MAX,
  REACTIONS_SCHEMA_ROUTES,
  REACTION_CONTRACT_VERSION,
  REACTION_SLUG,
  REACTION_SLUG_MAX,
  reactionsFileJsonSchema,
  reactionsFileJsonSchemaDocument,
  reactionsFileSchema,
} from '../content/reaction-schema.ts';
import { COMMENT_SLUG, COMMENT_SLUG_MAX } from '../content/comment-schema.ts';
import { commentEntryId, reactionEntryId, reactionsLoader } from '../content/data-file-loader.ts';
import { GET as currentRoute } from '../pages/contract/reactions.schema.json.ts';
import { GET as v1Route } from '../pages/contract/v1/reactions.schema.json.ts';
import { REACTION_ID, reactionTotals } from './reactions.ts';

/**
 * `reactionsFileSchema` has no `astro:content` import, so it is tested here with `node:test`: no
 * Astro runtime, no collection, no build. The cases are the ones task RB1 of the reactions plan
 * names — a valid file, sorted ids, and every way a file can be wrong — plus the published
 * document's shape and its frozen v1 bytes.
 */

const SNAPSHOT = new URL('../content/reaction-schema.v1.snapshot.json', import.meta.url);

const validFile = {
  version: 1,
  slug: 'grok-4-7',
  reactions: [
    { id: 'love', n: 3 },
    { id: 'overhyped', n: 7 },
    { id: 'wow', n: 2 },
  ],
};

const withReactions = (reactions: unknown) => ({ ...validFile, reactions });

const messagesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.message);

// --- happy paths ------------------------------------------------------------------------------

test('a valid file parses and keeps its order', () => {
  const result = reactionsFileSchema.safeParse(validFile);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.deepEqual(result.data, validFile);
});

test('an id the reaction set does not know is allowed, and the page counts it in the total', () => {
  const file = withReactions([
    { id: 'love', n: 1 },
    { id: 'retired', n: 4 },
  ]);
  const result = reactionsFileSchema.safeParse(file);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.equal(reactionTotals(result.data).total, 5);
});

test('the limits are inclusive: 64 distinct ids, a 120-character slug, a count at the safe-integer edge', () => {
  const ids = Array.from({ length: REACTIONS_PER_FILE_MAX }, (_, i) => `r${String(i).padStart(2, '0')}`);
  assert.equal(reactionsFileSchema.safeParse(withReactions(ids.map((id) => ({ id, n: 1 })))).success, true);
  assert.equal(reactionsFileSchema.safeParse({ ...validFile, slug: 'a'.repeat(REACTION_SLUG_MAX) }).success, true);
  assert.equal(reactionsFileSchema.safeParse(withReactions([{ id: 'love', n: Number.MAX_SAFE_INTEGER }])).success, true);
});

// --- failure paths ----------------------------------------------------------------------------

test('unsorted ids are refused, naming the entry', () => {
  const result = reactionsFileSchema.safeParse(withReactions([
    { id: 'wow', n: 2 },
    { id: 'love', n: 3 },
  ]));
  assert.equal(result.success, false);
  assert.deepEqual(messagesOf(result), ['reactions must be sorted by id, ascending']);
  assert.deepEqual(result.error?.issues[0].path, ['reactions', 1, 'id']);
});

test('a duplicate id is refused as a duplicate, not as a sorting mistake', () => {
  const result = reactionsFileSchema.safeParse(withReactions([
    { id: 'love', n: 3 },
    { id: 'love', n: 1 },
  ]));
  assert.deepEqual(messagesOf(result), ['id love is also on reaction 0; ids are unique in a file']);
});

test('a count must be a whole number of at least 1', () => {
  const cases: [unknown, string][] = [
    [0, 'n must be at least 1; a reaction nobody chose is left out'],
    [-2, 'n must be at least 1; a reaction nobody chose is left out'],
    [1.5, 'n must be a whole number'],
    ['3', 'n must be a whole number'],
    [null, 'n must be a whole number'],
    [Number.MAX_SAFE_INTEGER + 1, 'n must be a whole number'],
  ];
  for (const [n, message] of cases) {
    const result = reactionsFileSchema.safeParse(withReactions([{ id: 'love', n }]));
    assert.deepEqual(messagesOf(result), [message], JSON.stringify(n));
  }
});

test('an unknown key is refused at every level', () => {
  assert.equal(reactionsFileSchema.safeParse({ ...validFile, generatedAt: '2026-09-26T00:00:00Z' }).success, false);
  assert.equal(reactionsFileSchema.safeParse(withReactions([{ id: 'love', n: 1, emoji: 'x' }])).success, false);
});

test('an empty list and more than 64 entries are refused', () => {
  assert.deepEqual(messagesOf(reactionsFileSchema.safeParse(withReactions([])))[0], 'a file with no reactions must not exist; the desk deletes it');
  const ids = Array.from({ length: REACTIONS_PER_FILE_MAX + 1 }, (_, i) => `r${String(i).padStart(2, '0')}`);
  assert.deepEqual(messagesOf(reactionsFileSchema.safeParse(withReactions(ids.map((id) => ({ id, n: 1 }))))), [
    `a file holds at most ${REACTIONS_PER_FILE_MAX} reactions`,
  ]);
});

test('a malformed id is refused', () => {
  for (const id of ['', 'Love', '1love', '-love', 'lo_ve', 'a'.repeat(25), '❤️', 'love ']) {
    assert.equal(reactionsFileSchema.safeParse(withReactions([{ id, n: 1 }])).success, false, JSON.stringify(id));
  }
});

test('the version is 1, and the slug is a slug of at most 120 characters', () => {
  for (const version of [2, 0, '1', undefined]) {
    assert.equal(reactionsFileSchema.safeParse({ ...validFile, version }).success, false, String(version));
  }
  for (const slug of ['', 'Grok', '-grok', 'grok_4', 'a'.repeat(REACTION_SLUG_MAX + 1), 'grok/4']) {
    assert.equal(reactionsFileSchema.safeParse({ ...validFile, slug }).success, false, slug);
  }
  assert.equal(reactionsFileSchema.safeParse({ version: 1, slug: 'grok-4-7' }).success, false, 'reactions is required');
});

test('the slug rule is the comment contract\'s: both name the same posts', () => {
  assert.equal(REACTION_SLUG, COMMENT_SLUG);
  assert.equal(REACTION_SLUG_MAX, COMMENT_SLUG_MAX);
});

// --- the collection loader --------------------------------------------------------------------

test('the entry id is the file name, and a slug field that disagrees fails naming the reactions file', () => {
  assert.equal(reactionEntryId({ entry: 'grok-4-7.json', data: { slug: 'grok-4-7' } }), 'grok-4-7');
  assert.throws(
    () => reactionEntryId({ entry: 'grok-4-7.json', data: { slug: 'other' } }),
    /^Error: \.\/src\/content\/reactions\/grok-4-7\.json: its slug field is "other" but the file is named "grok-4-7"; a reaction file is named after the post it belongs to \(POST\.md section 9\)$/,
  );
  assert.throws(
    () => commentEntryId({ entry: 'grok-4-7.json', data: { slug: 'other' } }),
    /src\/content\/comments\/grok-4-7\.json: .* a comment file is named after the post it belongs to \(POST\.md section 8\)$/,
    'the comment loader keeps its own directory and words',
  );
});

test('with zero reaction files the loader logs nothing; a missing directory still warns', async () => {
  const loaderContext = (root: string) => {
    const warnings: string[] = [];
    const rootUrl = pathToFileURL(`${root}/`);
    return {
      warnings,
      context: {
        collection: 'reactions',
        config: { root: rootUrl, srcDir: new URL('src/', rootUrl) },
        store: { keys: () => [], delete: () => {} },
        logger: { warn: (m: string) => warnings.push(m), info: () => {}, error: () => {}, debug: () => {} },
      } as unknown as Parameters<ReturnType<typeof reactionsLoader>['load']>[0],
    };
  };
  const root = mkdtempSync(join(tmpdir(), 'reactions-loader-'));
  mkdirSync(join(root, 'src/content/reactions'), { recursive: true });
  writeFileSync(join(root, 'src/content/reactions/README.md'), '# not a reactions file\n');
  const empty = loaderContext(root);
  await reactionsLoader().load(empty.context);
  assert.deepEqual(empty.warnings, []);

  const missing = loaderContext(mkdtempSync(join(tmpdir(), 'reactions-loader-')));
  await reactionsLoader().load(missing.context);
  assert.equal(missing.warnings.length, 1, JSON.stringify(missing.warnings));
  assert.match(missing.warnings[0], /The base directory .*reactions.* does not exist/);
});

// --- the published JSON Schema ----------------------------------------------------------------

/** Every object schema in the tree, however nested. */
function objectSchemas(node: unknown, found: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    for (const item of node) objectSchemas(item, found);
  } else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    if (record.type === 'object') found.push(record);
    for (const value of Object.values(record)) objectSchemas(value, found);
  }
  return found;
}

test('the JSON Schema is identified per route, versioned, and strict at every object level', () => {
  const current = reactionsFileJsonSchema();
  assert.equal(current.$id, 'https://aitamer.news/contract/reactions.schema.json');
  const v1 = reactionsFileJsonSchema('v1');
  assert.equal(v1.$id, 'https://aitamer.news/contract/v1/reactions.schema.json');
  assert.deepEqual(REACTIONS_SCHEMA_ROUTES, { current: '/contract/reactions.schema.json', v1: '/contract/v1/reactions.schema.json' });
  assert.deepEqual({ ...v1, $id: current.$id }, current, 'the two routes differ only in $id');
  assert.equal(current['x-contract-version'], REACTION_CONTRACT_VERSION);
  assert.equal(current.$schema, 'https://json-schema.org/draft/2020-12/schema');
  const objects = objectSchemas(current);
  assert.equal(objects.length, 2, 'the file and one reaction');
  for (const object of objects) assert.equal(object.additionalProperties, false);
});

test('the JSON Schema carries the same rules the build enforces', () => {
  const schema = reactionsFileJsonSchema() as { properties: Record<string, any>; required: string[]; description: string };
  assert.deepEqual(schema.required, ['version', 'slug', 'reactions']);
  assert.equal(schema.properties.version.const, 1);
  assert.equal(schema.properties.slug.pattern, REACTION_SLUG.source);
  assert.equal(schema.properties.slug.maxLength, REACTION_SLUG_MAX);
  assert.equal(schema.properties.reactions.minItems, 1);
  assert.equal(schema.properties.reactions.maxItems, REACTIONS_PER_FILE_MAX);
  const item = schema.properties.reactions.items;
  assert.deepEqual(item.required, ['id', 'n']);
  assert.equal(item.properties.id.pattern, REACTION_ID.source);
  assert.deepEqual(item.properties.n, { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER });
  for (const { pattern } of [schema.properties.slug, item.properties.id]) {
    assert.doesNotThrow(() => new RegExp(pattern, 'u'), 'the patterns mean the same with the u flag');
  }
  for (const rule of ['slug equals the file name', 'a post with that slug exists', 'never published empty', 'ids are unique', 'sorted by id, ascending', 'no timestamp', 'retired id']) {
    assert.ok(schema.description.includes(rule), `description states: ${rule}`);
  }
});

/** Every deliberate change to the frozen v1 snapshot, newest last. */
const V1_SNAPSHOT_REVISIONS = ['2026-09-26: first frozen'];

test('the v1 document is frozen: it matches the committed snapshot byte for byte', () => {
  const snapshot = readFileSync(SNAPSHOT, 'utf8');
  const document = reactionsFileJsonSchemaDocument('v1');
  assert.match(document, /^[\x0A\x20-\x7E]*$/, 'the document is ASCII');
  assert.ok(document.endsWith('}\n'), 'one trailing newline');
  if (document !== snapshot) {
    const expected = snapshot.split('\n');
    const actual = document.split('\n');
    const line = actual.findIndex((text, i) => text !== expected[i]);
    assert.fail(
      `the v1 reactions contract changed (first difference at line ${line + 1}: ${JSON.stringify(actual[line])} instead of ${JSON.stringify(expected[line])}). ` +
        'Additive changes need a new snapshot (src/content/reaction-schema.v1.snapshot.json), a line in V1_SNAPSHOT_REVISIONS and a deliberate review; ' +
        `breaking changes need v2. Revisions so far: ${V1_SNAPSHOT_REVISIONS.join(' | ')}.`,
    );
  }
  assert.equal(reactionsFileJsonSchemaDocument('current'), document.replace(REACTIONS_SCHEMA_ROUTES.v1, REACTIONS_SCHEMA_ROUTES.current));
});

test('the routes serve those bytes as JSON Schema: v1 is the snapshot, the current route its twin', async () => {
  const v1 = await v1Route({} as never);
  assert.equal(v1.headers.get('Content-Type'), 'application/schema+json; charset=utf-8');
  assert.equal(await v1.text(), readFileSync(SNAPSHOT, 'utf8'));
  const current = await currentRoute({} as never);
  assert.equal(current.headers.get('Content-Type'), 'application/schema+json; charset=utf-8');
  assert.equal(await current.text(), reactionsFileJsonSchemaDocument('current'));
});
