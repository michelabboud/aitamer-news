import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  COMMENT_CONTRACT_VERSION,
  COMMENT_NAME_MAX,
  COMMENT_PATTERNS,
  COMMENT_SLUG,
  COMMENT_SLUG_MAX,
  COMMENT_TEXT_MAX,
  COMMENTS_PER_FILE_MAX,
  COMMENTS_SCHEMA_ROUTES,
  FORBIDDEN_CHARACTERS,
  ULID,
  commentSchema,
  commentsFileJsonSchema,
  commentsFileJsonSchemaDocument,
  commentsFileSchema,
} from '../content/comment-schema.ts';
import { commentEntryId, commentsLoader, isEmptyDataFilesWarning } from '../content/data-file-loader.ts';
import { SLUG } from '../../scripts/frontmatter.mjs';
import { SLUG_MAX_LENGTH } from '../../scripts/slug.mjs';

/**
 * `commentsFileSchema` has no `astro:content` import (see the file's header), so it is tested
 * here with `node:test`: no Astro runtime, no collection, no build. The cases are the ones task
 * A1 of the phase 2 plan names, the rules the schema states beyond them, and the fix lane's
 * findings (invisible characters, joiners, HTML variants, the frozen v1 document, the two regex
 * modes). Invisible characters are written as `\u` escapes so the file itself stays readable.
 */

const ID_A = '01K63M4Q3ZJ8W3Y8N5V2R7T9AB';
const ID_B = '01K63M4Q40000000000000000C';
const SNAPSHOT = new URL('../content/comment-schema.v1.snapshot.json', import.meta.url);

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

const messagesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.message);

/** Crockford base32, for building distinct ULIDs. */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function ulidNumber(n: number): string {
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix = CROCKFORD[n % 32] + suffix;
    n = Math.floor(n / 32);
  }
  return `01K63M4Q3ZJ8W3Y8N5V2R${suffix}`;
}

// --- happy paths ------------------------------------------------------------------------------

test('a valid file parses, keeps its order, and signedIn stays optional', () => {
  const result = commentsFileSchema.safeParse(validFile);
  assert.equal(result.success, true, issuesOf(result));
  assert.equal(result.data?.comments.length, 2);
  assert.equal(result.data?.comments[0].signedIn, true);
  assert.equal(result.data?.comments[1].signedIn, undefined);
});

test('COMMENT_CONTRACT_VERSION is 1 — v1 is frozen; a breaking change is v2, never an edit — and the slug shape matches the scripts', () => {
  assert.equal(COMMENT_CONTRACT_VERSION, 1, 'the v1 schema is frozen; a breaking change needs a v2 schema and a sibling route, not a bump here');
  assert.equal(COMMENT_SLUG.source, SLUG.source);
  assert.equal(COMMENT_SLUG.flags, SLUG.flags);
  assert.equal(COMMENT_SLUG_MAX, SLUG_MAX_LENGTH, 'the comment contract caps the slug where check:posts caps a post\'s file name');
  assert.equal(COMMENT_SLUG_MAX, 120, 'the comments Worker accepts slugs of at most 120 characters');
});

test('text may hold paragraphs and single line breaks; `<` that is not HTML is fine', () => {
  for (const text of ['One.\n\nTwo.', 'One.\nTwo.', 'a < b and b > c', 'I <3 this', '5 <= 6', 'ends with <', '< / not a tag', 'x <<<<<3', 'Emoji \u{1F98A} and joiners \u{1F469}\u200D\u{1F4BB}']) {
    assert.equal(commentSchema.safeParse(comment({ text })).success, true, text);
  }
});

test('real scripts and emoji sequences pass: joiners between characters, presentation selectors, skin tones, flags', () => {
  for (const name of [
    'Ada',
    'می\u200Cخواهم', // Persian with a ZWNJ inside a word
    'क्\u200Dष', // Devanagari with a ZWJ
    '\u{1F469}\u200D\u{1F4BB}', // woman technologist: ZWJ between two emoji
    '\u{1F468}\u200D❤\uFE0F\u200D\u{1F468}', // couple with heart: ZWJ next to a presentation selector
    '\u{1F44B}\u{1F3FE}', // waving hand with a skin tone (its trail unit is DFFE)
    '\u{1F1EB}\u{1F1F7}', // a flag
    '❤\uFE0E', // text presentation
    'Zoë', // NFC accented letter
  ]) {
    assert.equal(commentSchema.safeParse(comment({ name })).success, true, JSON.stringify(name));
  }
});

test('lengths are counted in code points: 2,000 emoji pass, 2,001 characters fail', () => {
  assert.equal(commentSchema.safeParse(comment({ text: '\u{1F98A}'.repeat(COMMENT_TEXT_MAX) })).success, true);
  assert.equal(commentSchema.safeParse(comment({ text: 'x'.repeat(COMMENT_TEXT_MAX) })).success, true);
  assert.equal(commentSchema.safeParse(comment({ text: 'x'.repeat(COMMENT_TEXT_MAX + 1) })).success, false);
  assert.equal(commentSchema.safeParse(comment({ name: '\u{1F98A}'.repeat(COMMENT_NAME_MAX) })).success, true);
  assert.equal(commentSchema.safeParse(comment({ name: 'x'.repeat(COMMENT_NAME_MAX + 1) })).success, false);
});

test('the length check runs first and alone: an over-long string reports only its length, never a pattern', () => {
  const huge = `${'x'.repeat(5_000_000)}<script>\u202E`;
  const text = commentSchema.safeParse(comment({ text: huge }));
  assert.deepEqual(messagesOf(text), [`text must be at most ${COMMENT_TEXT_MAX} characters`]);
  const name = commentSchema.safeParse(comment({ name: huge }));
  assert.deepEqual(messagesOf(name), [`name must be at most ${COMMENT_NAME_MAX} characters`]);
});

test('two comments at the same instant are in order', () => {
  const same = { ...validFile, comments: [comment(), comment({ id: ID_B, at: validFile.comments[0].at })] };
  assert.equal(commentsFileSchema.safeParse(same).success, true);
});

test('a file holds up to 2,000 comments, and a comment may be written at the instant the file was generated', () => {
  const generatedAt = '2026-09-25T12:37:00Z';
  const many = (count: number) =>
    Array.from({ length: count }, (_, i) => comment({ id: ulidNumber(i), at: i === count - 1 ? generatedAt : '2026-09-25T10:00:00Z' }));
  assert.equal(COMMENTS_PER_FILE_MAX, 2000);
  const full = commentsFileSchema.safeParse({ ...validFile, generatedAt, comments: many(COMMENTS_PER_FILE_MAX) });
  assert.equal(full.success, true, issuesOf(full));
  const over = commentsFileSchema.safeParse({ ...validFile, generatedAt, comments: many(COMMENTS_PER_FILE_MAX + 1) });
  assert.deepEqual(messagesOf(over), [`a file holds at most ${COMMENTS_PER_FILE_MAX} comments`]);
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

test('a slug is at most 120 characters, the cap the comments Worker and check:posts apply', () => {
  const longest = `a${'-b'.repeat((COMMENT_SLUG_MAX - 2) / 2)}c`;
  assert.equal(longest.length, COMMENT_SLUG_MAX);
  assert.equal(commentsFileSchema.safeParse({ ...validFile, slug: longest }).success, true);
  const over = commentsFileSchema.safeParse({ ...validFile, slug: `${longest}c` });
  assert.deepEqual(messagesOf(over), [`slug must be at most ${COMMENT_SLUG_MAX} characters`]);
});

test('generatedAt and at must be UTC instants ending in Z', () => {
  assert.equal(commentsFileSchema.safeParse({ ...validFile, generatedAt: '2026-09-25T12:37:00+02:00' }).success, false);
  assert.equal(commentsFileSchema.safeParse({ ...validFile, generatedAt: '2026-09-25' }).success, false);
  assert.equal(commentSchema.safeParse(comment({ at: '2026-09-25T10:00:00' })).success, false);
  assert.equal(commentSchema.safeParse(comment({ at: 1758794400 })).success, false);
  assert.equal(commentSchema.safeParse(comment({ at: '2026-09-25T10:00:00.250Z' })).success, true);
});

test('a comment written after the file was generated is rejected, pointing at it; the clock plays no part', () => {
  const late = { ...validFile, comments: [comment(), comment({ id: ID_B, at: '2026-09-25T12:37:00.001Z' })] };
  const result = commentsFileSchema.safeParse(late);
  assert.equal(result.success, false);
  const issue = result.error?.issues.find((i) => i.message.includes('is later than generatedAt'));
  assert.ok(issue, issuesOf(result));
  assert.deepEqual(issue?.path, ['comments', 1, 'at']);
  // A file from the far future is fine: the build must not depend on today's date.
  const future = { ...validFile, generatedAt: '2999-01-01T00:00:00Z', comments: [comment({ at: '2998-12-31T23:59:59Z' })] };
  assert.equal(commentsFileSchema.safeParse(future).success, true);
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

test('a non-ULID id is rejected: lowercase, wrong length, I/L/O/U, a first character above 7', () => {
  assert.equal(ULID.source, '^[0-7][0-9A-HJKMNP-TV-Z]{25}$');
  for (const id of ['01k63m4q3zj8w3y8n5v2r7t9ab', '01K63M4Q3ZJ8W3Y8N5V2R7T9A', '01K63M4Q3ZJ8W3Y8N5V2R7T9ABC', '01K63M4Q3ZJ8W3Y8N5V2R7T9IL', '81K63M4Q3ZJ8W3Y8N5V2R7T9AB', 'Z1K63M4Q3ZJ8W3Y8N5V2R7T9AB', '']) {
    assert.equal(commentSchema.safeParse(comment({ id })).success, false, id);
  }
  assert.equal(commentSchema.safeParse(comment({ id: '7ZZZZZZZZZZZZZZZZZZZZZZZZZ' })).success, true);
});

test('HTML in text is rejected: a script tag, an anchor, a closing tag, a comment, a processing instruction', () => {
  for (const text of ['<script>alert(1)</script>', 'see <a href="https://x.example">here</a>', 'end</p>', '<!-- hidden -->', '<img src=x onerror=alert(1)>', '<?xml version="1.0"?>', '<?php echo 1 ?>', 'x<<<<b', '<é>']) {
    assert.equal(commentSchema.safeParse(comment({ text })).success, text === '<é>', text);
  }
});

test('HTML in a name is rejected too', () => {
  assert.equal(commentSchema.safeParse(comment({ name: 'Eve <b>' })).success, false);
  assert.equal(commentSchema.safeParse(comment({ name: 'Eve <?' })).success, false);
});

test('a name with a newline, a tab or a carriage return is rejected: one line only', () => {
  for (const name of ['Ada\nLovelace', 'Ada\tL', 'Ada\r', 'Ada\u2028L']) {
    assert.equal(commentSchema.safeParse(comment({ name })).success, false, JSON.stringify(name));
  }
});

test('text may hold only \\n as a control character: tab, CR and CRLF are rejected', () => {
  for (const text of ['a\tb', 'a\r\nb', 'a\rb', 'a\u0000b', 'a\u0085b', 'a\u2029b']) {
    assert.equal(commentSchema.safeParse(comment({ text })).success, false, JSON.stringify(text));
  }
});

/** One representative of every refused block, as a `\u` escape, with what it is. */
const REFUSED_SAMPLES: [string, string][] = [
  ['\u00AD', 'soft hyphen'],
  ['\u034F', 'combining grapheme joiner'],
  ['\u061C', 'Arabic letter mark'],
  ['\u115F', 'Hangul choseong filler'],
  ['\u1160', 'Hangul jungseong filler'],
  ['\u17B4', 'Khmer inherent vowel'],
  ['\u180B', 'Mongolian free variation selector'],
  ['\u180E', 'Mongolian vowel separator'],
  ['\u200B', 'zero-width space'],
  ['\u200E', 'left-to-right mark'],
  ['\u200F', 'right-to-left mark'],
  ['\u202A', 'left-to-right embedding'],
  ['\u202E', 'right-to-left override'],
  ['\u2060', 'word joiner'],
  ['\u2066', 'left-to-right isolate'],
  ['\u2069', 'pop directional isolate'],
  ['\u206F', 'nominal digit shapes'],
  ['\u2800', 'Braille blank'],
  ['\u3164', 'Hangul filler'],
  ['\uD83D', 'a lone lead surrogate'],
  ['\uDE00', 'a lone trail surrogate'],
  ['\uE000', 'private use'],
  ['\uF8FF', 'private use, last'],
  ['\uFDD0', 'noncharacter'],
  ['\uFE00', 'variation selector 1'],
  ['\uFE0D', 'variation selector 14'],
  ['\uFEFF', 'byte-order mark'],
  ['\uFFA0', 'halfwidth Hangul filler'],
  ['\uFFF0', 'unassigned special'],
  ['\uFFF9', 'interlinear annotation anchor'],
  ['\uFFFE', 'noncharacter'],
  ['\uFFFF', 'noncharacter'],
];

/** Refused code points above U+FFFF: exact without the `u` flag, let through with it (see the schema header). */
const REFUSED_ASTRAL_SAMPLES: [string, string][] = [
  ['\u{110BD}', 'Kaithi number sign (format)'],
  ['\u{110CD}', 'Kaithi number sign above (format)'],
  ['\u{13430}', 'Egyptian hieroglyph vertical joiner (format)'],
  ['\u{13438}', 'Egyptian hieroglyph end segment (format)'],
  ['\u{1343F}', 'Egyptian hieroglyph end walled enclosure (format)'],
  ['\u{1BCA0}', 'shorthand format letter overlap'],
  ['\u{1BCA3}', 'shorthand format up step'],
  ['\u{1D173}', 'musical symbol begin beam (format)'],
  ['\u{1D17A}', 'musical symbol end phrase (format)'],
  ['\u{1FFFE}', 'plane 1 noncharacter'],
  ['\u{DFFFF}', 'plane 13 noncharacter'],
  ['\u{E0001}', 'tag: language'],
  ['\u{E007F}', 'tag: cancel'],
  ['\u{E0100}', 'variation selector 17'],
  ['\u{E01EF}', 'variation selector 256'],
  ['\u{E0080}', 'plane 14, unassigned'],
  ['\u{F0000}', 'plane 15 private use'],
  ['\u{10FFFD}', 'plane 16 private use, last'],
  ['\u{10FFFF}', 'plane 16 noncharacter'],
];

test('invisible, format, private-use, noncharacter and bidirectional characters are rejected in text and name, in any position', () => {
  for (const [bad, what] of [...REFUSED_SAMPLES, ...REFUSED_ASTRAL_SAMPLES]) {
    for (const value of [`safe${bad}text`, `${bad}text`, `text${bad}`, bad]) {
      assert.equal(commentSchema.safeParse(comment({ text: value })).success, false, `${what} in text ${JSON.stringify(value)}`);
      assert.equal(commentSchema.safeParse(comment({ name: value })).success, false, `${what} in name ${JSON.stringify(value)}`);
    }
  }
});

test('a joiner is allowed only between two other characters: never first, never last, never alone, never two in a row', () => {
  for (const joiner of ['\u200C', '\u200D']) {
    for (const bad of [
      joiner,
      `${joiner}${joiner}`,
      `${joiner}Ada`,
      `Ada${joiner}`,
      `${joiner}Ada${joiner}`,
      `A${joiner}${joiner}da`,
      `A\u200C\u200Dda`,
      `A\u200D\u200Cda`,
      `A${joiner.repeat(40)}da`,
    ]) {
      assert.equal(commentSchema.safeParse(comment({ name: bad })).success, false, JSON.stringify(bad));
      assert.equal(commentSchema.safeParse(comment({ text: bad })).success, false, JSON.stringify(bad));
    }
    assert.equal(commentSchema.safeParse(comment({ name: `A${joiner}da` })).success, true);
    assert.equal(commentSchema.safeParse(comment({ text: `line one\n${joiner}line two` })).success, true, 'a newline is a character too');
  }
});

test('an empty or blank name or text is rejected, and so is one made only of fillers', () => {
  for (const value of ['', ' ', '\n\n', '   \n  ', '\u00A0', '\u3000', '\u0301', '\u0301\u0301', '\u0301\u200D\u0301', '\uFE0F', ' \uFE0E ']) {
    assert.equal(commentSchema.safeParse(comment({ text: value })).success, false, JSON.stringify(value));
    assert.equal(commentSchema.safeParse(comment({ name: value })).success, false, JSON.stringify(value));
  }
  for (const value of ['-', '?', '\u{1F98A}', 'e\u0301', 'ل']) {
    assert.equal(commentSchema.safeParse(comment({ name: value })).success, true, JSON.stringify(value));
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

// --- the forbidden character list, in every form ---------------------------------------------

const isForbidden = (codePoint: number) => FORBIDDEN_CHARACTERS.ranges.some(([first, last]) => codePoint >= first && codePoint <= last);
const isSurrogate = (codePoint: number) => codePoint >= 0xd800 && codePoint <= 0xdfff;

/** Every range boundary and its neighbours, every plane's edges, and a coarse stride over everything. */
function codePointSample(): number[] {
  const points = new Set<number>();
  for (const [first, last] of FORBIDDEN_CHARACTERS.ranges) for (const p of [first - 1, first, first + 1, last - 1, last, last + 1]) points.add(p);
  for (let plane = 0; plane <= 16; plane++) {
    const base = plane * 0x10000;
    for (const offset of [0, 1, 0x3ff, 0x400, 0x7fff, 0xfffd, 0xfffe, 0xffff]) points.add(base + offset);
  }
  for (let p = 0; p <= 0x10ffff; p += 97) points.add(p);
  return [...points].filter((p) => p >= 0 && p <= 0x10ffff).sort((a, b) => a - b);
}

test('the ranges are sorted, disjoint, and hold the joiners, the bidi marks and the Arabic letter mark', () => {
  let previousLast = -1;
  for (const [first, last, what] of FORBIDDEN_CHARACTERS.ranges) {
    assert.ok(first > previousLast, `${what}: ranges must ascend without overlapping`);
    assert.ok(last >= first, what);
    assert.equal(typeof what, 'string');
    previousLast = last;
  }
  assert.deepEqual([...FORBIDDEN_CHARACTERS.joiners], [0x200c, 0x200d]);
  for (const codePoint of [0x200c, 0x200d, 0x200e, 0x200f, 0x061c, 0x202e, 0x2066, 0xfeff, 0xe0001, 0xf0000, 0x10ffff]) {
    assert.equal(isForbidden(codePoint), true, codePoint.toString(16));
  }
  for (const codePoint of [0x0020, 0x0041, 0x00e9, 0xfe0e, 0xfe0f, 0xfffd, 0x1f98a, 0x1f3fe, 0xdfffd]) {
    assert.equal(isForbidden(codePoint), false, codePoint.toString(16));
  }
  assert.equal(isForbidden(0x000a), true, 'the newline is a control character; only the text pattern lets it through, as an exception');
});

/**
 * The format characters (general category Cf) the list deliberately allows: the prepended
 * concatenation marks in the Basic Multilingual Plane, which are visible (an Arabic number sign
 * is drawn under the digits that follow it) and appear in real Arabic, Syriac and related text.
 */
const ALLOWED_FORMAT_CHARACTERS: ReadonlySet<number> = new Set([0x0600, 0x0601, 0x0602, 0x0603, 0x0604, 0x0605, 0x06dd, 0x070f, 0x0890, 0x0891, 0x08e2]);

test('every format character (Unicode category Cf) is refused, except the visible prepended concatenation marks below U+FFFF', () => {
  const format = /^\p{General_Category=Format}$/u;
  const missing: string[] = [];
  let astral = 0;
  for (let codePoint = 0; codePoint <= 0x10ffff; codePoint++) {
    if (isSurrogate(codePoint) || !format.test(String.fromCodePoint(codePoint))) continue;
    if (codePoint > 0xffff) astral++;
    if (!isForbidden(codePoint) && !ALLOWED_FORMAT_CHARACTERS.has(codePoint)) missing.push(`U+${codePoint.toString(16).toUpperCase()}`);
  }
  assert.deepEqual(missing, [], `format characters the list lets through (Unicode ${process.versions.unicode})`);
  assert.ok(astral >= 127, `${astral} format characters above U+FFFF checked`);
  for (const codePoint of ALLOWED_FORMAT_CHARACTERS) assert.equal(format.test(String.fromCodePoint(codePoint)), true, `U+${codePoint.toString(16)} is still Cf`);
});

test('the u-flag class and the no-flag alternation agree with the ranges at every boundary and across a stride of every plane', () => {
  const unicodeClass = new RegExp(`^${FORBIDDEN_CHARACTERS.unicodeClass}$`, 'u');
  const allowedUnicode = new RegExp(`^${FORBIDDEN_CHARACTERS.allowedUnicode}$`, 'u');
  const allowedNonUnicode = new RegExp(`^${FORBIDDEN_CHARACTERS.allowedNonUnicode}$`);
  const sample = codePointSample();
  assert.ok(sample.length > 11_000, `${sample.length} code points sampled`);
  for (const codePoint of sample) {
    const character = String.fromCodePoint(codePoint);
    const forbidden = isForbidden(codePoint);
    assert.equal(allowedNonUnicode.test(character), !forbidden, `no flag, U+${codePoint.toString(16).toUpperCase()}`);
    if (isSurrogate(codePoint)) continue; // a lone surrogate is not a code point the u flag can class-match either way
    assert.equal(unicodeClass.test(character), forbidden, `u flag, U+${codePoint.toString(16).toUpperCase()}`);
    assert.equal(allowedUnicode.test(character), !forbidden, `u flag allowed, U+${codePoint.toString(16).toUpperCase()}`);
  }
  // Every allowed pair is exactly one character: the alternation never splits or merges pairs.
  assert.equal(allowedNonUnicode.test('\u{1F98A}\u{1F98A}'), false);
  assert.equal(new RegExp(`^${FORBIDDEN_CHARACTERS.allowedNonUnicode}{2}$`).test('\u{1F98A}\u{1F98A}'), true);
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

/** Every `pattern` in the tree, with the property path it applies to. */
function patternsIn(node: unknown, path = '$', found: { path: string; pattern: string }[] = []): { path: string; pattern: string }[] {
  if (Array.isArray(node)) {
    node.forEach((item, i) => patternsIn(item, `${path}[${i}]`, found));
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === 'pattern' && typeof value === 'string') found.push({ path, pattern: value });
      else patternsIn(value, `${path}.${key}`, found);
    }
  }
  return found;
}

test('the JSON Schema is identified per route, versioned, and strict at every object level', () => {
  const current = commentsFileJsonSchema();
  assert.equal(current.$id, 'https://aitamer.news/contract/comments.schema.json');
  assert.equal(commentsFileJsonSchema('current').$id, current.$id);
  const v1 = commentsFileJsonSchema('v1');
  assert.equal(v1.$id, 'https://aitamer.news/contract/v1/comments.schema.json');
  assert.deepEqual(COMMENTS_SCHEMA_ROUTES, { current: '/contract/comments.schema.json', v1: '/contract/v1/comments.schema.json' });
  assert.deepEqual({ ...v1, $id: current.$id }, current, 'the two routes differ only in $id');
  assert.equal(current['x-contract-version'], COMMENT_CONTRACT_VERSION);
  assert.equal(current.$schema, 'https://json-schema.org/draft/2020-12/schema');
  const objects = objectSchemas(current);
  assert.equal(objects.length, 2, 'the file and one comment');
  for (const object of objects) assert.equal(object.additionalProperties, false);
});

test('the JSON Schema carries the same rules the build enforces', () => {
  const schema = commentsFileJsonSchema() as { properties: Record<string, any>; required: string[]; description: string };
  assert.deepEqual(schema.required, ['version', 'slug', 'generatedAt', 'comments']);
  assert.equal(schema.properties.version.const, 1);
  assert.equal(schema.properties.slug.pattern, COMMENT_SLUG.source);
  assert.equal(schema.properties.generatedAt.format, 'date-time');
  assert.equal(schema.properties.comments.minItems, 1);
  assert.equal(schema.properties.comments.maxItems, COMMENTS_PER_FILE_MAX);

  const item = schema.properties.comments.items;
  assert.deepEqual(item.required, ['id', 'name', 'text', 'at']);
  assert.equal(item.properties.id.pattern, ULID.source);
  assert.equal(item.properties.name.maxLength, COMMENT_NAME_MAX);
  assert.equal(item.properties.name.minLength, 1);
  assert.equal(item.properties.text.maxLength, COMMENT_TEXT_MAX);
  assert.equal(item.properties.text.minLength, 1);
  assert.equal(item.properties.signedIn.type, 'boolean');

  // The character rules travel as patterns, in the order the build applies them.
  const patterns = (property: { allOf?: { pattern: string }[] }) => (property.allOf ?? []).map((p) => p.pattern);
  assert.deepEqual(patterns(item.properties.name), [COMMENT_PATTERNS.name.oneLine.source, COMMENT_PATTERNS.name.noHtml.source, COMMENT_PATTERNS.name.hasVisible.source]);
  assert.deepEqual(patterns(item.properties.text), [COMMENT_PATTERNS.text.plainLines.source, COMMENT_PATTERNS.text.noHtml.source, COMMENT_PATTERNS.text.hasVisible.source]);
  assert.equal(COMMENT_PATTERNS.text.noHtml.source, '^(?:[^<]|<+[^<A-Za-z!/?])*<*$', 'no lookahead');
  assert.ok(COMMENT_PATTERNS.text.plainLines.source.includes('\\u2028-\\u202E'), 'text carries the bidi rule as an escape');

  // The rules the schema cannot express are stated for the publisher.
  for (const rule of ['slug equals the file name', 'a post with that slug exists', 'never published empty', 'ids are unique', 'oldest first', 'no later than generatedAt', 'FORBIDDEN_CHARACTERS.ranges']) {
    assert.ok(schema.description.includes(rule), `description states: ${rule}`);
  }
});

test('every published pattern compiles with and without the u flag, needs no \\p{…}, and is plain ASCII', () => {
  const found = patternsIn(commentsFileJsonSchema());
  // slug, id, three each for name and text, and zod's own date-time pattern on generatedAt and at.
  assert.equal(found.length, 10, JSON.stringify(found.map((f) => f.path)));
  for (const { path, pattern } of found) {
    assert.doesNotThrow(() => new RegExp(pattern), `${path} without the u flag`);
    assert.doesNotThrow(() => new RegExp(pattern, 'u'), `${path} with the u flag`);
    assert.ok(!pattern.includes('\\p{'), `${path} must not need the Unicode flag`);
    assert.match(pattern, /^[\x20-\x7E]*$/, `${path} carries escapes, never raw invisible characters`);
  }
});

/**
 * The differential test: the same corpus through every published pattern compiled without the
 * `u` flag (what the build runs), with it (what ajv and @cfworker/json-schema run), and through
 * zod. The three agree on everything except refused characters above U+FFFF, where the `u` flag
 * alone lets them through — the divergence the schema header and description document, pinned
 * here so it cannot silently widen.
 */
test('the published patterns give the same verdict with and without the u flag, except the documented astral residue', () => {
  const schema = commentsFileJsonSchema() as { properties: Record<string, any> };
  const item = schema.properties.comments.items;
  const suite = (field: 'name' | 'text') =>
    (item.properties[field].allOf as { pattern: string }[]).map(({ pattern }) => ({
      pattern,
      plain: new RegExp(pattern),
      unicode: new RegExp(pattern, 'u'),
    }));
  const verdict = (compiled: ReturnType<typeof suite>, mode: 'plain' | 'unicode', value: string) => compiled.every((p) => p[mode].test(value));

  const accept = [
    'Ada',
    'a < b',
    '<3',
    'ends with <',
    'e\u0301',
    'می\u200Cخ',
    '\u{1F469}\u200D\u{1F4BB}',
    '\u{1F468}\u200D❤\uFE0F\u200D\u{1F468}',
    '\u{1F44B}\u{1F3FE}',
    '\u{1F1EB}\u{1F1F7}',
    '\u{1F98A}'.repeat(COMMENT_NAME_MAX),
    '\uFFFD',
    '❤\uFE0E',
    '-',
  ];
  const refuse = [
    '',
    ' ',
    '\u0301',
    '\uFE0F',
    '<b>',
    'a</b',
    '<!--',
    '<?php',
    'a\tb',
    'a\u0085b',
    '\u200D',
    '\u200Da',
    'a\u200D',
    'a\u200D\u200D',
    'a\u200C\u200Db',
    'a\u200D\u200Db',
    ...REFUSED_SAMPLES.map(([bad]) => `a${bad}b`),
    ...REFUSED_SAMPLES.map(([bad]) => bad),
  ];
  const astralResidue = [...REFUSED_ASTRAL_SAMPLES.map(([bad]) => `a${bad}b`), ...REFUSED_ASTRAL_SAMPLES.map(([bad]) => bad)];

  for (const field of ['name', 'text'] as const) {
    const compiled = suite(field);
    for (const value of accept) {
      assert.equal(verdict(compiled, 'plain', value), true, `${field} accepts ${JSON.stringify(value)} without u`);
      assert.equal(verdict(compiled, 'unicode', value), true, `${field} accepts ${JSON.stringify(value)} with u`);
      assert.equal(commentSchema.safeParse(comment({ [field]: value })).success, true, `zod accepts ${field} ${JSON.stringify(value)}`);
    }
    for (const value of refuse) {
      assert.equal(verdict(compiled, 'plain', value), false, `${field} refuses ${JSON.stringify(value)} without u`);
      assert.equal(verdict(compiled, 'unicode', value), false, `${field} refuses ${JSON.stringify(value)} with u`);
      assert.equal(commentSchema.safeParse(comment({ [field]: value })).success, false, `zod refuses ${field} ${JSON.stringify(value)}`);
    }
    for (const value of astralResidue) {
      assert.equal(verdict(compiled, 'plain', value), false, `${field} refuses ${JSON.stringify(value)} without u`);
      assert.equal(verdict(compiled, 'unicode', value), true, `${field} with u lets ${JSON.stringify(value)} through: the documented residue`);
      assert.equal(commentSchema.safeParse(comment({ [field]: value })).success, false, `the build refuses ${field} ${JSON.stringify(value)}`);
    }
  }
  // text alone: newlines
  const text = suite('text');
  for (const value of ['a\nb', 'a\n\nb', 'a\n\u200Db']) {
    assert.equal(verdict(text, 'plain', value), true, JSON.stringify(value));
    assert.equal(verdict(text, 'unicode', value), true, JSON.stringify(value));
  }
  for (const value of ['\n', '\n\n', 'a\r\nb']) {
    assert.equal(verdict(text, 'plain', value), false, JSON.stringify(value));
    assert.equal(verdict(text, 'unicode', value), false, JSON.stringify(value));
  }
});

test('the JSON Schema is plain JSON: serialising and parsing it changes nothing', () => {
  const schema = commentsFileJsonSchema();
  assert.deepEqual(JSON.parse(JSON.stringify(schema)), schema);
});

/**
 * Every deliberate change to the frozen v1 snapshot, newest last. v1 may change only before a
 * file has been published against it, or additively; each entry says which and why.
 */
const V1_SNAPSHOT_REVISIONS = [
  '2026-09-25: first frozen',
  '2026-09-26: tightened before any comment file was published (batch A deep review B3, M3): slug maxLength 120 (the comments Worker\'s cap); at most one joiner between two other characters; the format characters above U+FFFF (Kaithi number signs, Egyptian hieroglyph format controls, shorthand format controls, musical beam and phrase controls) refused',
];

test('the v1 document is frozen: it matches the committed snapshot byte for byte', () => {
  const snapshot = readFileSync(SNAPSHOT, 'utf8');
  const document = commentsFileJsonSchemaDocument('v1');
  assert.match(document, /^[\x0A\x20-\x7E]*$/, 'the document is ASCII: every non-ASCII character travels as an escape');
  assert.ok(document.endsWith('}\n'), 'one trailing newline');
  if (document !== snapshot) {
    const expected = snapshot.split('\n');
    const actual = document.split('\n');
    const line = actual.findIndex((text, i) => text !== expected[i]);
    assert.fail(
      `the v1 contract changed (first difference at line ${line + 1}: ${JSON.stringify(actual[line])} instead of ${JSON.stringify(expected[line])}). ` +
        'Additive changes need a new snapshot (src/content/comment-schema.v1.snapshot.json), a line in V1_SNAPSHOT_REVISIONS and a deliberate review; ' +
        `breaking changes need v2. Revisions so far: ${V1_SNAPSHOT_REVISIONS.join(' | ')}.`,
    );
  }
  assert.deepEqual(JSON.parse(snapshot), commentsFileJsonSchema('v1'));
  assert.equal(commentsFileJsonSchemaDocument('current'), document.replace(COMMENTS_SCHEMA_ROUTES.v1, COMMENTS_SCHEMA_ROUTES.current));
});

// --- the collection loader --------------------------------------------------------------------

test('only the glob loader\'s empty-match warning for *.json is recognised', () => {
  assert.equal(isEmptyDataFilesWarning('No files found matching "*.json" in directory "src/content/comments"'), true);
  assert.equal(isEmptyDataFilesWarning('No files found matching "**/*.{md,mdx}" in directory "src/content/posts"'), false);
  assert.equal(isEmptyDataFilesWarning('The base directory "/x/src/content/comments" does not exist.'), false);
  assert.equal(isEmptyDataFilesWarning(''), false);
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
