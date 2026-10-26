import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COMMENTS_INDEX_CONTRACT_VERSION,
  COMMENTS_INDEX_KEY,
  COMMENTS_INDEX_RECENT_MAX,
  COMMENTS_INDEX_SCHEMA_ROUTES,
  COMMENTS_INDEX_STORIES_MAX,
  COMMENTS_INDEX_TEXT_MAX,
  COMMENTS_INDEX_TITLE_MAX,
  commentsIndexJsonSchema,
  commentsIndexJsonSchemaDocument,
  commentsIndexSchema,
} from '../content/comments-index-schema.ts';
import { COMMENT_NAME_MAX, COMMENT_SLUG, COMMENT_SLUG_MAX, COMMENTS_PER_FILE_MAX } from '../content/comment-schema.ts';
import { commentsIndexV2JsonSchemaDocument } from '../content/comments-index-schema-v2.ts';
import { GET as currentRoute } from '../pages/contract/comments-index.schema.json.ts';
import { GET as v1Route } from '../pages/contract/v1/comments-index.schema.json.ts';

/**
 * `commentsIndexSchema` has no `astro:content` import, so it is tested here with `node:test`.
 * Cases: a valid index, every way an index can be wrong (task S1 of the comments-on-R2 plan names
 * an unknown key, unsorted counts, `n: 0`, more than 60 `recent`, a bad slug and an over-length
 * text), the rules that need two fields at once, the published document's shape, and its frozen
 * v1 bytes served by both routes.
 */

const SNAPSHOT = new URL('../content/comments-index-schema.v1.snapshot.json', import.meta.url);

// ULIDs are time-ordered and the contract orders ties by id descending.
const ID_NEW = '01K63M4Q40000000000000000C';
const ID_MID = '01K63M4Q3ZJ8W3Y8N5V2R7T9AB';
const ID_OLD = '01K63M4Q3Y000000000000000A';

const entry = (overrides: Record<string, unknown> = {}) => ({
  slug: 'grok-4-7',
  title: 'Grok 4.7 ships',
  id: ID_NEW,
  name: 'Ada',
  text: 'Worth reading.',
  at: '2026-09-25T11:00:00Z',
  ...overrides,
});

const validIndex = () => ({
  version: 1,
  site: 'aitamer',
  generatedAt: '2026-09-25T11:00:00Z',
  counts: { 'claude-code-tips': 1, 'grok-4-7': 3 },
  recent: [
    entry({ signedIn: true }),
    entry({ slug: 'claude-code-tips', title: 'Claude Code tips', id: ID_MID, name: 'Bob', text: 'Thanks.', at: '2026-09-25T10:00:00Z' }),
    entry({ id: ID_OLD, name: 'Cy', text: 'First.', at: '2026-09-24T09:00:00Z' }),
  ],
});

const withChange = (change: (index: ReturnType<typeof validIndex>) => void) => {
  const index = validIndex();
  change(index);
  return index;
};

const messagesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.message);

const assertRefused = (input: unknown, fragment: string) => {
  const result = commentsIndexSchema.safeParse(input);
  assert.equal(result.success, false, `expected a refusal containing "${fragment}"`);
  const messages = messagesOf(result);
  assert.ok(messages.some((message) => message.includes(fragment)), `"${fragment}" not in ${JSON.stringify(messages)}`);
};

// --- happy paths ------------------------------------------------------------------------------

test('a valid index parses and keeps its order', () => {
  const result = commentsIndexSchema.safeParse(validIndex());
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.deepEqual(result.data, validIndex());
});

test('an index with no comments at all is valid: empty counts, empty recent, any generatedAt', () => {
  const index = { version: 1, site: 'aitamer', generatedAt: '2026-09-25T00:00:00Z', counts: {}, recent: [] };
  const result = commentsIndexSchema.safeParse(index);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
});

test('counts may list stories that recent does not show', () => {
  const index = withChange((i) => {
    i.counts = { 'a-story': 2, 'claude-code-tips': 1, 'grok-4-7': 3 };
  });
  assert.equal(commentsIndexSchema.safeParse(index).success, true);
});

test('the limits are inclusive: 60 recent, a 400-character text, a 200-character title, a 60-character name, a 120-character slug, a count of 2,000', () => {
  const slug = 'a'.repeat(COMMENT_SLUG_MAX);
  const ids = Array.from({ length: COMMENTS_INDEX_RECENT_MAX }, (_, i) => `01K63M4Q40${String(1000 - i).padStart(16, '0')}`);
  const recent = ids.map((id, i) =>
    entry({
      slug,
      id,
      title: 't'.repeat(COMMENTS_INDEX_TITLE_MAX),
      name: 'n'.repeat(COMMENT_NAME_MAX),
      text: 'x'.repeat(COMMENTS_INDEX_TEXT_MAX),
      truncated: true,
      at: '2026-09-25T11:00:00Z',
    }),
  );
  const index = { version: 1, site: 'aitamer', generatedAt: '2026-09-25T11:00:00Z', counts: { [slug]: COMMENTS_PER_FILE_MAX }, recent };
  const result = commentsIndexSchema.safeParse(index);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  assert.equal(recent.length, COMMENTS_INDEX_RECENT_MAX);
});

test('text counts code points, not UTF-16 units: 400 emoji are within the cap, 401 are not', () => {
  const emoji = '\u{1F600}';
  const within = withChange((i) => {
    i.recent[0] = entry({ text: emoji.repeat(COMMENTS_INDEX_TEXT_MAX), truncated: true });
  });
  assert.equal(commentsIndexSchema.safeParse(within).success, true);
  const over = withChange((i) => {
    i.recent[0] = entry({ text: emoji.repeat(COMMENTS_INDEX_TEXT_MAX + 1), truncated: true });
  });
  assertRefused(over, `text must be at most ${COMMENTS_INDEX_TEXT_MAX} characters`);
});

test('a digit-only slug is a legal story, and the order check accepts how JavaScript lists it', () => {
  const index = withChange((i) => {
    i.counts = { '10': 1, '2': 1, 'claude-code-tips': 1, 'grok-4-7': 3 };
  });
  const result = commentsIndexSchema.safeParse(index);
  assert.equal(result.success, true, JSON.stringify(result.error?.issues));
});

test('a story named like an Object member is looked up as its own key', () => {
  const index = withChange((i) => {
    i.counts = { constructor: 1, 'grok-4-7': 3 };
    i.recent = [entry(), entry({ slug: 'constructor', title: 'A story', id: ID_MID, at: '2026-09-25T10:00:00Z' })];
  });
  assert.equal(commentsIndexSchema.safeParse(index).success, true);
  const missing = withChange((i) => {
    i.counts = { 'grok-4-7': 3 };
    i.recent = [entry(), entry({ slug: 'constructor', title: 'A story', id: ID_MID, at: '2026-09-25T10:00:00Z' })];
  });
  assertRefused(missing, 'slug constructor is in recent but not in counts');
});

// --- failure paths: the ones the plan names ------------------------------------------------------

test('an unknown key is refused at the top level, in an entry, and nowhere is private data accepted', () => {
  assert.equal(commentsIndexSchema.safeParse({ ...validIndex(), extra: 1 }).success, false);
  for (const key of ['email', 'ipHash', 'trust', 'note', 'authorId']) {
    const index = withChange((i) => {
      (i.recent[0] as Record<string, unknown>)[key] = 'x';
    });
    assert.equal(commentsIndexSchema.safeParse(index).success, false, `${key} must be refused`);
  }
  assert.equal(commentsIndexSchema.safeParse({ ...validIndex(), counts: undefined }).success, false, 'counts is required');
});

test('unsorted counts are refused, naming the first slug out of place', () => {
  const index = withChange((i) => {
    i.counts = { 'grok-4-7': 3, 'claude-code-tips': 1 };
  });
  const result = commentsIndexSchema.safeParse(index);
  assert.equal(result.success, false);
  assert.deepEqual(messagesOf(result), ['counts must be sorted by slug, ascending']);
  assert.deepEqual(result.error?.issues[0].path, ['counts', 'grok-4-7'], 'names the first slug that is out of place');
});

test('a count of 0, a negative, a fraction and a count above one file\'s capacity are refused', () => {
  for (const [n, fragment] of [
    [0, 'a count must be at least 1'],
    [-1, 'a count must be at least 1'],
    [1.5, 'a count must be a whole number'],
    [COMMENTS_PER_FILE_MAX + 1, `a count is at most ${COMMENTS_PER_FILE_MAX}`],
    ['3', 'a count must be a whole number'],
  ] as const) {
    const index = withChange((i) => {
      (i.counts as Record<string, unknown>)['grok-4-7'] = n;
    });
    assertRefused(index, fragment);
  }
});

test('more than 60 recent comments are refused', () => {
  const index = withChange((i) => {
    i.recent = Array.from({ length: COMMENTS_INDEX_RECENT_MAX + 1 }, (_, n) =>
      entry({ id: `01K63M4Q40${String(2000 - n).padStart(16, '0')}` }),
    );
  });
  assertRefused(index, `recent holds at most ${COMMENTS_INDEX_RECENT_MAX} comments`);
});

test('a bad slug is refused in counts, in an entry and as the site id', () => {
  for (const bad of ['Grok', '-grok', 'grok_4', 'grok 4', '', 'a'.repeat(COMMENT_SLUG_MAX + 1), '../etc']) {
    assert.equal(COMMENT_SLUG.test(bad) && bad.length <= COMMENT_SLUG_MAX, false, `fixture ${JSON.stringify(bad)} must be a bad slug`);
    const inCounts = withChange((i) => {
      i.counts = { [bad]: 1, 'grok-4-7': 3 };
    });
    assert.equal(commentsIndexSchema.safeParse(inCounts).success, false, `counts key ${JSON.stringify(bad)}`);
    const inEntry = withChange((i) => {
      i.recent[0].slug = bad;
    });
    assert.equal(commentsIndexSchema.safeParse(inEntry).success, false, `entry slug ${JSON.stringify(bad)}`);
    const asSite = { ...validIndex(), site: bad };
    assert.equal(commentsIndexSchema.safeParse(asSite).success, false, `site ${JSON.stringify(bad)}`);
  }
});

test('a text over 400 code points is refused whether or not it says truncated', () => {
  const long = 'x'.repeat(COMMENTS_INDEX_TEXT_MAX + 1);
  for (const extra of [{}, { truncated: true }]) {
    const index = withChange((i) => {
      i.recent[0] = entry({ text: long, ...extra });
    });
    assertRefused(index, `text must be at most ${COMMENTS_INDEX_TEXT_MAX} characters`);
  }
});

test('truncated may only be true, and so may signedIn', () => {
  for (const key of ['truncated', 'signedIn']) {
    for (const value of [false, 'true', 1, null]) {
      const index = withChange((i) => {
        i.recent[0] = entry({ [key]: value });
      });
      assert.equal(commentsIndexSchema.safeParse(index).success, false, `${key}: ${JSON.stringify(value)}`);
    }
  }
});

// --- failure paths: the text rules the comment contract states, applied to the index -----------------

test('names, titles and texts refuse what the comment contract refuses', () => {
  const cases: [string, unknown, string][] = [
    ['text', '<script>alert(1)</script>', 'text must not contain HTML'],
    ['text', 'hi‮evil', 'text may contain newlines but no other'],
    ['text', 'zero​ width', 'text may contain newlines but no other'],
    ['text', '\ud800 lone surrogate', 'text may contain newlines but no other'],
    ['text', '   \n  ', 'text must contain at least one visible character'],
    ['text', '', 'text must not be empty'],
    ['name', 'two\nlines', 'name must be one line'],
    ['name', '<b>Ada</b>', 'name must not contain HTML'],
    ['name', 'ㅤ', 'name must be one line'],
    ['title', 'two\nlines', 'title must be one line'],
    ['title', '', 'title must not be empty'],
    ['title', 'x'.repeat(COMMENTS_INDEX_TITLE_MAX + 1), `title must be at most ${COMMENTS_INDEX_TITLE_MAX} characters`],
    ['title', 7, 'Invalid input'],
  ];
  for (const [field, value, fragment] of cases) {
    const index = withChange((i) => {
      (i.recent[0] as Record<string, unknown>)[field] = value;
    });
    const result = commentsIndexSchema.safeParse(index);
    assert.equal(result.success, false, `${field}=${JSON.stringify(value)}`);
    const messages = messagesOf(result);
    assert.ok(
      messages.some((message) => message.includes(fragment) || (fragment === 'Invalid input' && message.includes('expected string'))),
      `${field}=${JSON.stringify(value)}: ${JSON.stringify(messages)}`,
    );
  }
});

test('an id that is not a ULID, a time without Z, and a wrong version are refused', () => {
  const badId = withChange((i) => {
    i.recent[0].id = 'not-a-ulid';
  });
  assertRefused(badId, 'id must be a ULID');
  const offset = withChange((i) => {
    i.recent[0].at = '2026-09-25T11:00:00+02:00';
  });
  assertRefused(offset, 'must be an ISO-8601 UTC time ending in Z');
  assert.equal(commentsIndexSchema.safeParse({ ...validIndex(), version: 2 }).success, false);
  assert.equal(commentsIndexSchema.safeParse({ ...validIndex(), generatedAt: 'yesterday' }).success, false);
});

// --- failure paths: rules that need two fields -------------------------------------------------------

test('recent must be newest first; the same second is ordered by id descending', () => {
  const unordered = withChange((i) => {
    i.recent.reverse();
    i.generatedAt = i.recent[0].at;
  });
  assertRefused(unordered, 'recent must be newest first');
  const sameSecondWrongWay = withChange((i) => {
    i.recent = [entry({ id: ID_MID }), entry({ id: ID_NEW })];
  });
  assertRefused(sameSecondWrongWay, 'recent must be newest first');
  const sameSecondRightWay = withChange((i) => {
    i.recent = [entry({ id: ID_NEW }), entry({ id: ID_MID })];
  });
  assert.equal(commentsIndexSchema.safeParse(sameSecondRightWay).success, true);
});

test('a repeated id in recent is refused', () => {
  const index = withChange((i) => {
    i.recent[1] = { ...i.recent[0], at: '2026-09-25T10:00:00Z' };
  });
  assertRefused(index, 'appears twice in recent');
});

test('generatedAt must equal the newest comment\'s at, earlier or later', () => {
  for (const generatedAt of ['2026-09-25T11:00:01Z', '2026-09-25T10:59:59Z']) {
    assertRefused({ ...validIndex(), generatedAt }, 'must equal the newest comment');
  }
});

test('a recent comment of a story that counts does not list is refused, and so is one that outnumbers its count', () => {
  const missing = withChange((i) => {
    i.counts = { 'claude-code-tips': 1 };
  });
  assertRefused(missing, 'slug grok-4-7 is in recent but not in counts');
  const outnumbered = withChange((i) => {
    i.counts['grok-4-7'] = 1;
  });
  assertRefused(outnumbered, 'slug grok-4-7 has 2 comments in recent but a count of 1');
});

test('more than the allowed stories in counts is refused', () => {
  const counts: Record<string, number> = {};
  for (let n = 0; n <= COMMENTS_INDEX_STORIES_MAX; n++) counts[`s${String(n).padStart(5, '0')}`] = 1;
  const result = commentsIndexSchema.safeParse({ version: 1, site: 'aitamer', generatedAt: '2026-09-25T00:00:00Z', counts, recent: [] });
  assert.equal(result.success, false);
  assert.deepEqual(messagesOf(result), [`counts holds at most ${COMMENTS_INDEX_STORIES_MAX} stories`]);
});

// --- the published document ----------------------------------------------------------------------------

test('the document is JSON Schema with its own $id per route, the version, and the rules it cannot express', () => {
  assert.equal(COMMENTS_INDEX_CONTRACT_VERSION, 1);
  assert.equal(COMMENTS_INDEX_KEY, 'v1/comments-index.json');
  for (const route of ['current', 'v1'] as const) {
    const schema = commentsIndexJsonSchema(route) as Record<string, any>;
    assert.equal(schema.$id, `https://aitamer.news${COMMENTS_INDEX_SCHEMA_ROUTES[route]}`);
    assert.equal(schema['x-contract-version'], 1);
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(schema.required, ['version', 'site', 'generatedAt', 'counts', 'recent']);
    assert.equal(schema.properties.recent.maxItems, COMMENTS_INDEX_RECENT_MAX);
    assert.equal(schema.properties.recent.items.additionalProperties, false);
    assert.equal(schema.properties.recent.items.properties.text.maxLength, COMMENTS_INDEX_TEXT_MAX);
    assert.equal(schema.properties.counts.maxProperties, COMMENTS_INDEX_STORIES_MAX);
    assert.equal(schema.properties.counts.propertyNames.maxLength, COMMENT_SLUG_MAX);
    assert.equal(schema.properties.counts.additionalProperties.minimum, 1);
    assert.equal(schema.properties.counts.additionalProperties.maximum, COMMENTS_PER_FILE_MAX);
    for (const rule of ['sorted ascending', 'newest first', 'ids in recent are unique', 'generatedAt equals', 'truncated true', 'left out of recent']) {
      assert.ok(schema.description.includes(rule), `description states: ${rule}`);
    }
  }
});

test('the slug caps and the text rules agree with the comment contract they reuse', () => {
  const schema = commentsIndexJsonSchema('v1') as Record<string, any>;
  const entryProps = schema.properties.recent.items.properties;
  assert.equal(entryProps.slug.pattern, COMMENT_SLUG.source);
  assert.equal(entryProps.name.maxLength, COMMENT_NAME_MAX);
});

/** Every deliberate change to the frozen v1 snapshot, newest last. */
const V1_SNAPSHOT_REVISIONS = ['2026-10-24: first frozen'];

test('the v1 document is frozen: it matches the committed snapshot byte for byte', () => {
  const snapshot = readFileSync(SNAPSHOT, 'utf8');
  const document = commentsIndexJsonSchemaDocument('v1');
  assert.match(document, /^[\x0A\x20-\x7E]*$/, 'the document is ASCII');
  assert.ok(document.endsWith('}\n'), 'one trailing newline');
  if (document !== snapshot) {
    const expected = snapshot.split('\n');
    const actual = document.split('\n');
    const line = actual.findIndex((text, i) => text !== expected[i]);
    assert.fail(
      `the v1 comments index contract changed (first difference at line ${line + 1}: ${JSON.stringify(actual[line])} instead of ${JSON.stringify(expected[line])}). ` +
        'Additive changes need a new snapshot (src/content/comments-index-schema.v1.snapshot.json), a line in V1_SNAPSHOT_REVISIONS and a deliberate review; ' +
        `breaking changes need v2. Revisions so far: ${V1_SNAPSHOT_REVISIONS.join(' | ')}.`,
    );
  }
  assert.equal(
    commentsIndexJsonSchemaDocument('current'),
    document.replace(COMMENTS_INDEX_SCHEMA_ROUTES.v1, COMMENTS_INDEX_SCHEMA_ROUTES.current),
  );
});

test('the pinned route serves frozen v1 bytes and the current route serves v2', async () => {
  const v1 = await v1Route({} as never);
  assert.equal(v1.headers.get('Content-Type'), 'application/schema+json; charset=utf-8');
  assert.equal(await v1.text(), readFileSync(SNAPSHOT, 'utf8'));
  const current = await currentRoute({} as never);
  assert.equal(current.headers.get('Content-Type'), 'application/schema+json; charset=utf-8');
  assert.equal(await current.text(), commentsIndexV2JsonSchemaDocument('current'));
});
