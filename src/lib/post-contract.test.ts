import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST_CONTRACT_VERSION, postSchema } from '../content/post-schema.ts';

/**
 * `postSchema` has no `astro:content` import (see the file's own header comment), so it is tested
 * directly here with `node:test` — no Astro runtime, no content collection, no build. `author` is
 * a plain string in this schema; `content.config.ts` is the only place that upgrades it to
 * `reference('authors')` before handing the schema to `defineCollection`.
 *
 * Cases below are the ones named in the deep review that led to
 * docs/adr/0004-post-contract-is-strict.md (finding B5) and the accompanying date hardening.
 */

const validPost = {
  title: 'Grok 4.7 keeps $2/$6 rates',
  description: 'One sentence that states the news.',
  pubDate: '2026-09-25',
  section: 'models',
  author: 'desk-bot',
} as const;

test('a minimal valid post passes', () => {
  const result = postSchema.safeParse(validPost);
  assert.equal(result.success, true);
});

test('a fully populated valid post passes', () => {
  const result = postSchema.safeParse({
    ...validPost,
    updatedDate: '2026-09-26T10:00:00Z',
    subsection: 'cli',
    tags: ['grok-4-7', 'api-pricing'],
    draft: false,
    heroImage: '/heroes/grok-4-7-pricing.jpg',
    heroAlt: 'Paper-cut price tags pinned to a night sky.',
    specimen: 12,
    wildness: { rating: 2, verified: 'Rates on the pricing page', claimed: 'Benchmark jump is a vendor number' },
    verdict: 'Same price, better agent scores: worth a rerun of your evals.',
    sunset: { date: '2026-10-23', what: 'grok-3 API', replacement: 'grok-4-7' },
    video: { youtube: 'dQw4w9WgXcQ', title: 'Launch talk', channel: 'xAI' },
    corrections: [{ date: '2026-09-27', text: 'Fixed a typo in the price.' }],
    sources: [{ title: 'xAI API pricing', url: 'https://docs.x.ai/developers/pricing' }],
  });
  assert.equal(result.success, true, JSON.stringify(result.success ? null : result.error.issues));
});

test('POST_CONTRACT_VERSION is the published contract version', () => {
  assert.equal(POST_CONTRACT_VERSION, 1);
});

test('wildness.rating above the scale (6) is rejected', () => {
  const result = postSchema.safeParse({
    ...validPost,
    wildness: { rating: 6, verified: 'v', claimed: 'c' },
  });
  assert.equal(result.success, false);
});

test('wildness.rating below the scale (0) is rejected', () => {
  const result = postSchema.safeParse({
    ...validPost,
    wildness: { rating: 0, verified: 'v', claimed: 'c' },
  });
  assert.equal(result.success, false);
});

test('a YouTube URL in video.youtube is rejected — only the bare 11-character ID is accepted', () => {
  const result = postSchema.safeParse({
    ...validPost,
    video: { youtube: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: 't', channel: 'c' },
  });
  assert.equal(result.success, false);
});

test('a retired section value is rejected', () => {
  const result = postSchema.safeParse({ ...validPost, section: 'video' });
  assert.equal(result.success, false);
});

test('an unknown top-level key is rejected (the contract is strict)', () => {
  const result = postSchema.safeParse({ ...validPost, verdit: 'a misspelling of verdict' });
  assert.equal(result.success, false);
});

test('a misspelled key inside a nested object is rejected (the contract is strict)', () => {
  const result = postSchema.safeParse({
    ...validPost,
    sunset: { date: '2026-10-23', what: 'grok-3 API', replacment: 'grok-4-7' },
  });
  assert.equal(result.success, false);
});

test('a numeric sunset.date is rejected, not read as a Unix timestamp', () => {
  const result = postSchema.safeParse({
    ...validPost,
    sunset: { date: 20261023, what: 'grok-3 API' },
  });
  assert.equal(result.success, false);
});

test('a boolean sunset.date is rejected', () => {
  const result = postSchema.safeParse({
    ...validPost,
    sunset: { date: true, what: 'grok-3 API' },
  });
  assert.equal(result.success, false);
});

test('sunset.date accepts a YAML date node (a Date instance, as js-yaml produces for an unquoted date)', () => {
  const result = postSchema.safeParse({
    ...validPost,
    sunset: { date: new Date('2026-10-23T00:00:00Z'), what: 'grok-3 API' },
  });
  assert.equal(result.success, true);
});

test('sunset.date accepts a strict YYYY-MM-DD string', () => {
  const result = postSchema.safeParse({
    ...validPost,
    sunset: { date: '2026-10-23', what: 'grok-3 API' },
  });
  assert.equal(result.success, true);
});

test('sunset.date accepts a full ISO-8601 UTC string', () => {
  const result = postSchema.safeParse({
    ...validPost,
    sunset: { date: '2026-10-23T09:15:00Z', what: 'grok-3 API' },
  });
  assert.equal(result.success, true);
});

test('sunset.date rejects an ISO string with a non-UTC offset', () => {
  const result = postSchema.safeParse({
    ...validPost,
    sunset: { date: '2026-10-23T09:15:00-05:00', what: 'grok-3 API' },
  });
  assert.equal(result.success, false);
});

test('corrections[].date and withdrawn.date use the same strict date rule', () => {
  const badCorrection = postSchema.safeParse({
    ...validPost,
    corrections: [{ date: 20260925, text: 'A fix.' }],
  });
  assert.equal(badCorrection.success, false);

  const badWithdrawal = postSchema.safeParse({
    ...validPost,
    withdrawn: { date: false, reason: 'Copyright.' },
  });
  assert.equal(badWithdrawal.success, false);

  const goodWithdrawal = postSchema.safeParse({
    ...validPost,
    withdrawn: { date: '2026-09-25', reason: 'Copyright.' },
  });
  assert.equal(goodWithdrawal.success, true);
});

test('a heroImage that is neither the local pattern nor an https URL is rejected', () => {
  const result = postSchema.safeParse({ ...validPost, heroImage: '/img.png' });
  assert.equal(result.success, false);
});

test('heroImage accepts the local /heroes/<slug>.jpg pattern', () => {
  const result = postSchema.safeParse({ ...validPost, heroImage: '/heroes/grok-4-7-pricing.jpg' });
  assert.equal(result.success, true);
});

test('heroImage accepts an absolute https URL', () => {
  const result = postSchema.safeParse({ ...validPost, heroImage: 'https://r2.example.com/hero.jpg' });
  assert.equal(result.success, true);
});

test('heroImage rejects an http (non-https) URL', () => {
  const result = postSchema.safeParse({ ...validPost, heroImage: 'http://example.com/hero.jpg' });
  assert.equal(result.success, false);
});

test('source links must be http(s); dates may not be bare numbers', async () => {
  const { postSchema } = await import('../content/post-schema.ts');
  const base = { title: 't', description: 'd', pubDate: '2026-09-25', section: 'models', author: 'desk-bot' };
  assert.equal(postSchema.safeParse({ ...base, sources: [{ url: 'https://example.com/a' }] }).success, true);
  assert.equal(postSchema.safeParse({ ...base, sources: [{ url: 'javascript:alert(1)' }] }).success, false);
  assert.equal(postSchema.safeParse({ ...base, sources: [{ url: 'data:text/html,x' }] }).success, false);
  assert.equal(postSchema.safeParse({ ...base, pubDate: 20261023 }).success, false);
  assert.equal(postSchema.safeParse({ ...base, updatedDate: 20261023 }).success, false);
  assert.equal(postSchema.safeParse({ ...base, pubDate: '2026-09-25T09:15:12Z' }).success, true);
});
