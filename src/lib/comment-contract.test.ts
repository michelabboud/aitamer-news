import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  COMMENT_CONTRACT_VERSION,
  COMMENT_NAME_MAX,
  COMMENT_SLUG,
  COMMENT_TEXT_MAX,
  commentSchema,
  commentsFileJsonSchema,
  commentsFileSchema,
} from '../content/comment-schema.ts';
import { commentEntryId, commentsLoader, isEmptyCommentsWarning } from '../content/comments-loader.ts';
import { SLUG } from '../../scripts/frontmatter.mjs';

/**
 * `commentsFileSchema` has no `astro:content` import (see the file's header), so it is tested
 * here with `node:test`: no Astro runtime, no collection, no build. The cases are the ones task
 * A1 of the phase 2 plan names, plus the rules the schema states beyond them.
 */

const ID_A = '01K63M4Q3ZJ8W3Y8N5V2R7T9AB';
const ID_B = '01K63M4Q40000000000000000C';

const comment = (overrides: Record<string, unknown> = {}) => ({
  id: ID_A,
  name: 'Ada',
  text: 'First paragraph.\n\nSecond paragraph with https://example.com/a-link.',
  at: '2026-09-25T10:00:00Z',
  ...overrides,
});

const validFile = {
  version: 1,
  slug: 'grok-4-7',
  generatedAt: '2026-09-25T12:37:00Z',
  comments: [comment({ signedIn: true }), comment({ id: ID_B, name: 'Bob', text: 'Later.', at: '2026-09-25T11:00:00Z' })],
};

function issuesOf(result: { success: boolean; error?: { issues: unknown[] } }) {
  return result.success ? 'no issues' : JSON.stringify(result.error?.issues);
}

// --- happy paths ------------------------------------------------------------------------------

test('a valid file parses, keeps its order, and signedIn stays optional', () => {
  const result = commentsFileSchema.safeParse(validFile);
  assert.equal(result.success, true, issuesOf(result));
  assert.equal(result.data?.comments.length, 2);
  assert.equal(result.data?.comments[0].signedIn, true);
  assert.equal(result.data?.comments[1].signedIn, undefined);
});

test('COMMENT_CONTRACT_VERSION is the published contract version; the slug shape matches the scripts', () => {
  assert.equal(COMMENT_CONTRACT_VERSION, 1);
  assert.equal(COMMENT_SLUG.source, SLUG.source);
  assert.equal(COMMENT_SLUG.flags, SLUG.flags);
});

test('text may hold paragraphs and single line breaks; `<` that is not HTML is fine', () => {
  for (const text of ['One.\n\nTwo.', 'One.\nTwo.', 'a < b and b > c', 'I <3 this', '5 <= 6', 'Emoji 🦊 and joiners 👩‍💻']) {
    assert.equal(commentSchema.safeParse(comment({ text })).success, true, text);
  }
});

test('lengths are counted in code points: 2,000 emoji pass, 2,001 characters fail', () => {
  assert.equal(commentSchema.safeParse(comment({ text: '🦊'.repeat(COMMENT_TEXT_MAX) })).success, true);
  assert.equal(commentSchema.safeParse(comment({ text: 'x'.repeat(COMMENT_TEXT_MAX) })).success, true);
  assert.equal(commentSchema.safeParse(comment({ text: 'x'.repeat(COMMENT_TEXT_MAX + 1) })).success, false);
  assert.equal(commentSchema.safeParse(comment({ name: '🦊'.repeat(COMMENT_NAME_MAX) })).success, true);
  assert.equal(commentSchema.safeParse(comment({ name: 'x'.repeat(COMMENT_NAME_MAX + 1) })).success, false);
});

test('two comments at the same instant are in order', () => {
  const same = { ...validFile, comments: [comment(), comment({ id: ID_B, at: validFile.comments[0].at })] };
  assert.equal(commentsFileSchema.safeParse(same).success, true);
});

// --- failure paths: the file ------------------------------------------------------------------

test('an unknown top-level key is rejected (the contract is strict)', () => {
  assert.equal(commentsFileSchema.safeParse({ ...validFile, generated: 'typo' }).success, false);
});

test('an unknown key inside a comment is rejected', () => {
  const result = commentsFileSchema.safeParse({ ...validFile, comments: [comment({ email: 'ada@example.com' })] });
  assert.equal(result.success, false);
});

test('a version other than 1 is rejected', () => {
  assert.equal(commentsFileSchema.safeParse({ ...validFile, version: 2 }).success, false);
  assert.equal(commentsFileSchema.safeParse({ ...validFile, version: '1' }).success, false);
});

test('a file with zero comments is rejected: it must not exist', () => {
  assert.equal(commentsFileSchema.safeParse({ ...validFile, comments: [] }).success, false);
});

test('a slug that is not lowercase letters, digits and hyphens is rejected', () => {
  for (const slug of ['Grok-4-7', '-grok', 'grok 4', 'grok_4', '']) {
    assert.equal(commentsFileSchema.safeParse({ ...validFile, slug }).success, false, slug);
  }
});

test('generatedAt and at must be UTC instants ending in Z', () => {
  assert.equal(commentsFileSchema.safeParse({ ...validFile, generatedAt: '2026-09-25T12:37:00+02:00' }).success, false);
  assert.equal(commentsFileSchema.safeParse({ ...validFile, generatedAt: '2026-09-25' }).success, false);
  assert.equal(commentSchema.safeParse(comment({ at: '2026-09-25T10:00:00' })).success, false);
  assert.equal(commentSchema.safeParse(comment({ at: 1758794400 })).success, false);
  assert.equal(commentSchema.safeParse(comment({ at: '2026-09-25T10:00:00.250Z' })).success, true);
});

test('a duplicate id is rejected, pointing at the second occurrence', () => {
  const result = commentsFileSchema.safeParse({ ...validFile, comments: [comment(), comment({ at: '2026-09-25T11:00:00Z' })] });
  assert.equal(result.success, false);
  const issue = result.error?.issues.find((i) => i.message.includes('is also on comment 0'));
  assert.ok(issue, issuesOf(result));
  assert.deepEqual(issue?.path, ['comments', 1, 'id']);
});

test('comments out of order (newest first) are rejected', () => {
  const result = commentsFileSchema.safeParse({ ...validFile, comments: [...validFile.comments].reverse() });
  assert.equal(result.success, false);
  assert.ok(result.error?.issues.some((i) => i.message === 'comments must be sorted oldest first'), issuesOf(result));
});

// --- failure paths: one comment ---------------------------------------------------------------

test('a non-ULID id is rejected', () => {
  for (const id of ['01k63m4q3zj8w3y8n5v2r7t9ab', '01K63M4Q3ZJ8W3Y8N5V2R7T9A', '01K63M4Q3ZJ8W3Y8N5V2R7T9ABC', '01K63M4Q3ZJ8W3Y8N5V2R7T9IL', '']) {
    assert.equal(commentSchema.safeParse(comment({ id })).success, false, id);
  }
});

test('HTML in text is rejected: a script tag, an anchor, a closing tag, a comment', () => {
  for (const text of ['<script>alert(1)</script>', 'see <a href="https://x.example">here</a>', 'end</p>', '<!-- hidden -->', '<img src=x onerror=alert(1)>']) {
    assert.equal(commentSchema.safeParse(comment({ text })).success, false, text);
  }
});

test('HTML in a name is rejected too', () => {
  assert.equal(commentSchema.safeParse(comment({ name: 'Eve <b>' })).success, false);
});

test('a name with a newline, a tab or a carriage return is rejected: one line only', () => {
  for (const name of ['Ada\nLovelace', 'Ada\tL', 'Ada\r', 'Ada L']) {
    assert.equal(commentSchema.safeParse(comment({ name })).success, false, JSON.stringify(name));
  }
});

test('text may hold only \\n as a control character: tab, CR and CRLF are rejected', () => {
  for (const text of ['a\tb', 'a\r\nb', 'a\rb', 'a\u0000b', 'a\u0085b', 'a b']) {
    assert.equal(commentSchema.safeParse(comment({ text })).success, false, JSON.stringify(text));
  }
});

test('bidirectional overrides and zero-width characters are rejected in text and name', () => {
  for (const bad of ['‮', '‪', '⁦', '⁩', '​', '﻿']) {
    assert.equal(commentSchema.safeParse(comment({ text: `safe${bad}text` })).success, false, JSON.stringify(bad));
    assert.equal(commentSchema.safeParse(comment({ name: `Eve${bad}` })).success, false, JSON.stringify(bad));
  }
});

test('an empty or blank name or text is rejected', () => {
  for (const value of ['', ' ', '\n\n', '   \n  ']) {
    assert.equal(commentSchema.safeParse(comment({ text: value })).success, false, JSON.stringify(value));
    assert.equal(commentSchema.safeParse(comment({ name: value })).success, false, JSON.stringify(value));
  }
});

test('signedIn must be a boolean when present', () => {
  assert.equal(commentSchema.safeParse(comment({ signedIn: 'yes' })).success, false);
  assert.equal(commentSchema.safeParse(comment({ signedIn: 1 })).success, false);
  assert.equal(commentSchema.safeParse(comment({ signedIn: null })).success, false);
  assert.equal(commentSchema.safeParse(comment({ signedIn: false })).success, true);
});

test('a missing required field is rejected', () => {
  for (const key of ['id', 'name', 'text', 'at']) {
    const { [key]: _omitted, ...rest } = comment();
    assert.equal(commentSchema.safeParse(rest).success, false, key);
  }
  for (const key of ['version', 'slug', 'generatedAt', 'comments']) {
    const { [key]: _omitted, ...rest } = validFile as Record<string, unknown>;
    assert.equal(commentsFileSchema.safeParse(rest).success, false, key);
  }
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

test('the JSON Schema is identified, versioned, and strict at every object level', () => {
  const schema = commentsFileJsonSchema();
  assert.equal(schema.$id, 'https://aitamer.news/contract/comments.schema.json');
  assert.equal(schema['x-contract-version'], COMMENT_CONTRACT_VERSION);
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  const objects = objectSchemas(schema);
  assert.equal(objects.length, 2, 'the file and one comment');
  for (const object of objects) assert.equal(object.additionalProperties, false);
});

test('the JSON Schema carries the same rules the build enforces', () => {
  const schema = commentsFileJsonSchema() as { properties: Record<string, any>; required: string[] };
  assert.deepEqual(schema.required, ['version', 'slug', 'generatedAt', 'comments']);
  assert.equal(schema.properties.version.const, 1);
  assert.equal(schema.properties.slug.pattern, COMMENT_SLUG.source);
  assert.equal(schema.properties.generatedAt.format, 'date-time');
  assert.equal(schema.properties.comments.minItems, 1);

  const item = schema.properties.comments.items;
  assert.deepEqual(item.required, ['id', 'name', 'text', 'at']);
  assert.equal(item.properties.id.pattern, '^[0-9A-HJKMNP-TV-Z]{26}$');
  assert.equal(item.properties.name.maxLength, COMMENT_NAME_MAX);
  assert.equal(item.properties.name.minLength, 1);
  assert.equal(item.properties.text.maxLength, COMMENT_TEXT_MAX);
  assert.equal(item.properties.text.minLength, 1);
  assert.equal(item.properties.signedIn.type, 'boolean');

  // The character rules travel as patterns, so a validator refuses HTML and control characters
  // before the file ever reaches the build. No pattern needs the Unicode flag.
  const patterns = (property: { allOf?: { pattern: string }[] }) => (property.allOf ?? []).map((p) => p.pattern);
  assert.ok(patterns(item.properties.text).some((p) => p.includes('<(?![A-Za-z!/])')), 'text carries the no-HTML pattern');
  assert.ok(patterns(item.properties.name).some((p) => p.includes('<(?![A-Za-z!/])')), 'name carries the no-HTML pattern');
  assert.ok(patterns(item.properties.text).some((p) => p.includes('\\u202A-\\u202E')), 'text carries the bidi rule');
  for (const p of [...patterns(item.properties.text), ...patterns(item.properties.name)]) {
    assert.doesNotThrow(() => new RegExp(p), p);
    assert.ok(!p.includes('\\p{'), `pattern must not need the Unicode flag: ${p}`);
  }
});

test('the JSON Schema is plain JSON: serialising and parsing it changes nothing', () => {
  const schema = commentsFileJsonSchema();
  assert.deepEqual(JSON.parse(JSON.stringify(schema)), schema);
});

// --- the collection loader --------------------------------------------------------------------

test('only the glob loader\'s empty-match warning for *.json is recognised', () => {
  assert.equal(isEmptyCommentsWarning('No files found matching "*.json" in directory "src/content/comments"'), true);
  assert.equal(isEmptyCommentsWarning('No files found matching "**/*.{md,mdx}" in directory "src/content/posts"'), false);
  assert.equal(isEmptyCommentsWarning('The base directory "/x/src/content/comments" does not exist.'), false);
  assert.equal(isEmptyCommentsWarning(''), false);
});

test('the entry id is the file name, and a slug field that disagrees fails naming the file', () => {
  assert.equal(commentEntryId({ entry: 'grok-4-7.json', data: { slug: 'grok-4-7' } }), 'grok-4-7');
  assert.throws(
    () => commentEntryId({ entry: 'grok-4-7.json', data: { slug: 'other' } }),
    /src\/content\/comments\/grok-4-7\.json: its slug field is "other" but the file is named "grok-4-7"/,
  );
  assert.throws(() => commentEntryId({ entry: 'grok-4-7.json', data: {} }), /slug field is undefined/);
});

/**
 * The smallest context Astro's glob loader needs for a directory with no matching file: it reads
 * `config.root`, `config.srcDir`, `store.keys()` and `logger`, and nothing else before it returns.
 * The real build is the proof for the non-empty path (a fixture build is part of task A1's
 * evidence); this pins the wiring — the filtered logger is the one the glob loader gets.
 */
function loaderContext(root: string) {
  const warnings: string[] = [];
  const rootUrl = pathToFileURL(`${root}/`);
  return {
    warnings,
    context: {
      collection: 'comments',
      config: { root: rootUrl, srcDir: new URL('src/', rootUrl) },
      store: { keys: () => [], delete: () => {} },
      logger: { warn: (m: string) => warnings.push(m), info: () => {}, error: () => {}, debug: () => {} },
    } as unknown as Parameters<ReturnType<typeof commentsLoader>['load']>[0],
  };
}

test('with zero comment files the loader logs nothing; a missing directory still warns', async () => {
  const root = mkdtempSync(join(tmpdir(), 'comments-loader-'));
  mkdirSync(join(root, 'src/content/comments'), { recursive: true });
  writeFileSync(join(root, 'src/content/comments/README.md'), '# not a comment file\n');
  const empty = loaderContext(root);
  await commentsLoader().load(empty.context);
  assert.deepEqual(empty.warnings, []);

  // A missing directory is a different warning (the glob loader skips its empty-match warning
  // for a directory that does not exist), and it must get through the filter.
  const missing = loaderContext(mkdtempSync(join(tmpdir(), 'comments-loader-')));
  await commentsLoader().load(missing.context);
  assert.equal(missing.warnings.length, 1, JSON.stringify(missing.warnings));
  assert.match(missing.warnings[0], /The base directory .* does not exist/);
});
