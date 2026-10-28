import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NARRATION_DEFAULT_VOICE, postFrontmatterJsonSchema, postSchema } from '../content/post-schema.ts';
import { isoDuration, narrationAudioObject, narrationLength, narrationUrl } from './narration.ts';

/** The optional `narration` frontmatter object and the helpers that turn it into a URL, a label and JSON-LD. */

const validPost = {
  title: 'Grok 4.7 keeps $2/$6 rates',
  description: 'One sentence that states the news.',
  pubDate: '2026-09-25',
  section: 'models',
  author: 'desk-bot',
} as const;

const DISCLOSURE =
  'AI use: this narration is a synthetic voice (Kokoro-82M). The text was written and checked by the aitamer.news desk.';
const narration = { key: 'grok-4-7-pricing', file: 'grok-4-7-pricing-v1', durationSeconds: 245, disclosure: DISCLOSURE };
const parse = (extra: Record<string, unknown>) => postSchema.safeParse({ ...validPost, narration: { ...narration, ...extra } });

test('a post without narration still passes and has no narration field', () => {
  const result = postSchema.safeParse(validPost);
  assert.equal(result.success, true);
  assert.equal(result.success && result.data.narration, undefined);
});

test('a valid narration passes and voice defaults to the house voice', () => {
  const result = parse({});
  assert.equal(result.success, true, JSON.stringify(result.success ? null : result.error.issues));
  assert.equal(result.success && result.data.narration?.voice, NARRATION_DEFAULT_VOICE);
  assert.equal(NARRATION_DEFAULT_VOICE, 'Kokoro-82M af_heart');
});

test('an explicit voice is kept', () => {
  const result = parse({ voice: 'Kokoro-82M af_heart' });
  assert.equal(result.success && result.data.narration?.voice, 'Kokoro-82M af_heart');
});

for (const [name, key] of [
  ['a URL', 'https://bots.aitamer.news/audio/x'],
  ['a path', 'audio/x'],
  ['upper case', 'Grok-Pricing'],
  ['an underscore', 'grok_pricing'],
  ['a leading hyphen', '-grok'],
  ['a trailing hyphen', 'grok-'],
  ['a double hyphen', 'grok--pricing'],
  ['a dot', 'grok.pricing'],
  ['traversal', '..'],
  ['empty', ''],
  ['121 characters', 'a'.repeat(121)],
] as const) {
  test(`narration.key with ${name} is rejected`, () => {
    assert.equal(parse({ key }).success, false);
  });
}

test('narration.key at 120 characters and file at 140 characters pass', () => {
  assert.equal(parse({ key: 'a'.repeat(120), file: 'b'.repeat(140) }).success, true);
});

for (const [name, file] of [
  ['an .mp3 extension', 'grok-pricing.mp3'],
  ['a URL', 'https://example.com/a'],
  ['a slash', 'a/b'],
  ['upper case', 'Grok'],
  ['empty', ''],
  ['141 characters', 'b'.repeat(141)],
] as const) {
  test(`narration.file with ${name} is rejected`, () => {
    assert.equal(parse({ file }).success, false);
  });
}

for (const [name, durationSeconds] of [['zero', 0], ['negative', -5], ['a fraction', 12.5], ['a string', '245'], ['over two hours', 7201]] as const) {
  test(`narration.durationSeconds ${name} is rejected`, () => {
    assert.equal(parse({ durationSeconds }).success, false);
  });
}

test('narration needs key, file, durationSeconds and disclosure', () => {
  for (const field of ['key', 'file', 'durationSeconds', 'disclosure'] as const) {
    const { [field]: _omitted, ...rest } = narration;
    assert.equal(postSchema.safeParse({ ...validPost, narration: rest }).success, false, field);
  }
});

test('narration.disclosure and voice are bounded and non-empty', () => {
  assert.equal(parse({ disclosure: '' }).success, false);
  assert.equal(parse({ disclosure: 'x'.repeat(301) }).success, false);
  assert.equal(parse({ voice: '' }).success, false);
  assert.equal(parse({ voice: 'v'.repeat(81) }).success, false);
});

test('narration is strict: an unknown key (a url) fails', () => {
  assert.equal(parse({ url: 'https://bots.aitamer.news/audio/a/b.mp3' }).success, false);
});

test('the published JSON Schema documents narration with voice optional', () => {
  const schema = postFrontmatterJsonSchema() as { properties: Record<string, { required?: string[]; additionalProperties?: boolean }> };
  const field = schema.properties.narration;
  assert.ok(field);
  assert.deepEqual([...(field.required ?? [])].sort(), ['disclosure', 'durationSeconds', 'file', 'key']);
  assert.equal(field.additionalProperties, false);
});

test('narrationUrl builds the fixed bot bucket path', () => {
  assert.equal(narrationUrl(narration), 'https://bots.aitamer.news/audio/grok-4-7-pricing/grok-4-7-pricing-v1.mp3');
});

test('narrationLength is M:SS, or H:MM:SS from one hour', () => {
  assert.equal(narrationLength(5), '0:05');
  assert.equal(narrationLength(245), '4:05');
  assert.equal(narrationLength(600), '10:00');
  assert.equal(narrationLength(3725), '1:02:05');
});

test('isoDuration is an ISO 8601 duration', () => {
  assert.equal(isoDuration(5), 'PT5S');
  assert.equal(isoDuration(245), 'PT4M5S');
  assert.equal(isoDuration(600), 'PT10M');
  assert.equal(isoDuration(3725), 'PT1H2M5S');
});

test('narrationAudioObject is undefined without narration, an AudioObject with it', () => {
  assert.equal(narrationAudioObject(undefined), undefined);
  assert.equal(JSON.stringify({ a: 1, audio: narrationAudioObject(undefined) }), '{"a":1}');
  assert.deepEqual(narrationAudioObject(narration), {
    '@type': 'AudioObject',
    contentUrl: 'https://bots.aitamer.news/audio/grok-4-7-pricing/grok-4-7-pricing-v1.mp3',
    encodingFormat: 'audio/mpeg',
    duration: 'PT4M5S',
  });
});
