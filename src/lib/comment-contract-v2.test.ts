import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { commentsFileV2Schema, commentsFileV2JsonSchema, commentsFileV2JsonSchemaDocument } from '../content/comment-schema-v2.ts';
import { commentsIndexV2Schema, commentsIndexV2JsonSchema, commentsIndexV2JsonSchemaDocument } from '../content/comments-index-schema-v2.ts';
import { commentsFileSchema, commentsFileJsonSchemaDocument } from '../content/comment-schema.ts';
import { commentsIndexSchema, commentsIndexJsonSchemaDocument } from '../content/comments-index-schema.ts';
import { parseCommentRevision } from '../content/comment-v2-limits.ts';
import { GET as storyV2Route } from '../pages/contract/v2/comments.schema.json.ts';
import { GET as indexV2Route } from '../pages/contract/v2/comments-index.schema.json.ts';
import { GET as storyCurrentRoute } from '../pages/contract/comments.schema.json.ts';
import { GET as indexCurrentRoute } from '../pages/contract/comments-index.schema.json.ts';
import { GET as indexV1Route } from '../pages/contract/v1/comments-index.schema.json.ts';

const at = '2026-10-25T09:00:00Z';
const generatedAt = '2026-10-25T10:00:00Z';
const comment = { id: '01K5ZQ8M3A0000000000000000', name: 'Ada', text: 'A comment', at };
const next = { ...comment, id: '01K5ZQ8M3B0000000000000000' };
const story = (extra: Record<string, unknown> = {}) => ({ version: 2, revision: '1', slug: 'a-story', generatedAt, comments: [comment], ...extra });
const index = (extra: Record<string, unknown> = {}) => ({ version: 2, revision: '1', site: 'aitamer', generatedAt, counts: { 'a-story': 2 }, recent: [{ ...next, slug: 'a-story', title: 'A story' }, { ...comment, slug: 'a-story', title: 'A story' }], ...extra });
const invalidRevisions: unknown[] = [undefined, null, 1, 1n, '', '0', '00', '01', '-1', '+1', '1.0', '1e2', ' 1', '1 ', '1\n', '1\r\n', '١', '9'.repeat(41)];

for (const [label, schema, envelope] of [['story', commentsFileV2Schema, story], ['index', commentsIndexV2Schema, index]] as const) {
  test(`v2 ${label}: canonical decimal revisions are required and BigInt preserves their exact values`, () => {
    for (const revision of invalidRevisions) assert.equal(schema.safeParse(envelope({ revision })).success, false, String(revision));
    for (const revision of ['1', '9007199254740993', '9'.repeat(40)]) {
      assert.equal(schema.safeParse(envelope({ revision })).success, true, revision);
      assert.equal(parseCommentRevision(revision), BigInt(revision));
    }
    for (const revision of invalidRevisions) assert.equal(parseCommentRevision(revision), null, String(revision));
  });
  test(`v2 ${label}: strict envelope, version and UTC metadata validation`, () => {
    assert.equal(schema.safeParse(envelope()).success, true);
    for (const extra of [{ version: 1 }, { version: 3 }, { privateNote: 'never public' }, { generatedAt: '2026-02-30T10:00:00Z' }, { generatedAt: '2026-10-25T10:00:00+00:00' }, { generatedAt: 'yesterday' }]) {
      assert.equal(schema.safeParse(envelope(extra)).success, false, JSON.stringify(extra));
    }
  });
}

test('v2 story: empty envelopes remain valid without weakening v1 baked file validation', () => {
  assert.equal(commentsFileV2Schema.safeParse(story({ comments: [] })).success, true);
  const { revision: _revision, ...v1 } = story({ comments: [], version: 1 });
  assert.equal(commentsFileSchema.safeParse(v1).success, false);
});

test('v2 story: original comment text, bounds, identity, order and time ceiling remain enforced', () => {
  const invalid = [
    { comments: [comment, comment] },
    { comments: [{ ...comment, at: generatedAt }, next] },
    { generatedAt: '2026-10-25T08:00:00Z' },
    { slug: '../a' },
    { comments: Array.from({ length: 2001 }, () => comment) },
    ...[{ name: '<script>' }, { text: '<img src=x>' }, { text: 'x'.repeat(4001) }, { name: 'x'.repeat(61) }, { name: '\u200b' }, { text: '\u202e' }, { id: 'not-an-id' }, { email: 'private' }].map((change) => ({ comments: [{ ...comment, ...change }] })),
  ];
  for (const extra of invalid) assert.equal(commentsFileV2Schema.safeParse(story(extra)).success, false, JSON.stringify(extra).slice(0, 160));
  assert.equal(commentsFileV2Schema.safeParse(story({ comments: [comment, next] })).success, true);
});

test('v2 index: empty withdrawals and generation after the latest entry are valid', () => {
  assert.equal(commentsIndexV2Schema.safeParse(index({ counts: {}, recent: [] })).success, true);
  assert.equal(commentsIndexV2Schema.safeParse(index()).success, true);
  const { revision: _revision, ...v1 } = index({ version: 1 });
  assert.equal(commentsIndexSchema.safeParse(v1).success, false, 'the frozen v1 equality rule remains enforced');
  assert.equal(commentsIndexV2Schema.safeParse(index({ generatedAt: '2026-10-25T08:00:00Z' })).success, false);
});

test('v2 index: count order, limits, positive totals, recent identity/order/count consistency and text rules remain enforced', () => {
  const recent = (index().recent as Record<string, unknown>[]);
  const invalid = [
    { counts: { z: 1, 'a-story': 2 } }, { counts: { 'a-story': 0 } }, { counts: { 'a-story': 1.5 } }, { counts: { 'a-story': 2001 } },
    { counts: {} }, { counts: { 'a-story': 1 } }, { counts: { '../a': 1 } },
    { recent: [recent[0], recent[0]] }, { recent: [...recent].reverse() },
    { recent: [{ ...recent[0], text: '<script>' }] }, { recent: [{ ...recent[0], text: 'x'.repeat(401) }] },
    { recent: [{ ...recent[0], title: 'x'.repeat(201) }] }, { recent: [{ ...recent[0], truncated: false }] },
    { recent: [{ ...recent[0], signedIn: false }] }, { recent: [{ ...recent[0], email: 'private' }] },
    { recent: Array.from({ length: 61 }, () => recent[0]) }, { counts: Object.fromEntries(Array.from({ length: 10001 }, (_, i) => [`s-${String(i).padStart(5, '0')}`, 1])) },
  ];
  for (const extra of invalid) assert.equal(commentsIndexV2Schema.safeParse(index(extra)).success, false, JSON.stringify(extra).slice(0, 160));
});

for (const [label, document, schema, pinned, current, snapshot] of [
  ['story', commentsFileV2JsonSchemaDocument, commentsFileV2JsonSchema, storyV2Route, storyCurrentRoute, '../content/comment-schema.v2.snapshot.json'],
  ['index', commentsIndexV2JsonSchemaDocument, commentsIndexV2JsonSchema, indexV2Route, indexCurrentRoute, '../content/comments-index-schema.v2.snapshot.json'],
] as const) {
  test(`v2 ${label}: published current and pinned schemas match their frozen bytes and enforce revision syntax`, async () => {
    assert.equal(document('v2'), readFileSync(new URL(snapshot, import.meta.url), 'utf8'));
    const json = schema('v2') as Record<string, any>;
    assert.equal(json['x-contract-version'], 2);
    assert.equal(json.additionalProperties, false);
    assert.equal(json.properties.revision.type, 'string');
    assert.equal(json.properties.revision.maxLength, 40);
    const patterns = json.properties.revision.pattern ? [json.properties.revision.pattern] : json.properties.revision.allOf.map((entry: any) => entry.pattern).filter(Boolean);
    for (const revision of ['1\n', '01', '0', '9'.repeat(41)]) assert.equal(patterns.every((pattern: string) => new RegExp(pattern).test(revision)), false, revision);
    for (const [route, path] of [[pinned, 'v2'], [current, 'current']] as const) {
      const response = await route({} as never);
      assert.equal(response.headers.get('Content-Type'), 'application/schema+json; charset=utf-8');
      assert.equal(await response.text(), document(path));
    }
  });
}

test('pinned v1 story and index contracts preserve exactly their pre-v2 public bytes', async () => {
  for (const [document, route, snapshot, expectedDigest] of [
    [commentsFileJsonSchemaDocument, undefined, '../content/comment-schema.v1.snapshot.json', '988935c41cc3b5935faf6239eb84d70d4258d64d9ef60df1c7e684f1697e66f7'],
    [commentsIndexJsonSchemaDocument, indexV1Route, '../content/comments-index-schema.v1.snapshot.json', '5019be2f56023a97ca1a68f53dc3f468c75642621d5dff863fbc6ccde6295b09'],
  ] as const) {
    const bytes = readFileSync(new URL(snapshot, import.meta.url), 'utf8');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedDigest);
    assert.equal(document('v1'), bytes);
    if (route) assert.equal(await (await route({} as never)).text(), bytes);
  }
});

test('pinned v1 route comments.schema.json.ts remains byte-identical', () => {
  assert.equal(createHash('sha256').update(readFileSync(new URL('../pages/contract/v1/comments.schema.json.ts', import.meta.url))).digest('hex'), 'd1f6f632882f680bd40a96705f872519c11c20ac44049652deb479468a7f1e9c');
});

test('pinned v1 route comments-index.schema.json.ts remains byte-identical', () => {
  assert.equal(createHash('sha256').update(readFileSync(new URL('../pages/contract/v1/comments-index.schema.json.ts', import.meta.url))).digest('hex'), 'd46c3ff46e7dbc9a2040dcaf7579a7265f97f30a7da52a1e372a10adc331c9fd');
});
