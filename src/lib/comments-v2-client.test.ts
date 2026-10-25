import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commentsFileUrl, commentsIndexUrl, commentsIndexReader, countFor, aroundTheFire, initialThreadState, threadTransition, validateCommentsIndex } from './comments-client.ts';
import { initialLoadState, loadTransition, fetchDataFile } from './data-host.ts';
import { validateCommentFile } from './comment-dom.ts';

const slug = 'a-story';
const at = '2026-10-25T09:00:00Z';
const generatedAt = '2026-10-25T10:00:00Z';
const comment = { id: '01K5ZQ8M3A0000000000000000', name: 'Ada', text: 'Hello', at };
const story = (extra: Record<string, unknown> = {}) => ({ version: 2, revision: '1', slug, generatedAt, comments: [comment], ...extra });
const index = (extra: Record<string, unknown> = {}) => ({ version: 2, revision: '1', site: 'aitamer', generatedAt, counts: { [slug]: 1 }, recent: [{ ...comment, slug, title: 'A story' }], ...extra });
const read = (body: unknown) => threadTransition(initialThreadState(), { type: 'response', status: 200, attempt: 1, body }, slug);

test('v2 browser URLs select only the v2 namespace', () => {
  assert.equal(commentsFileUrl('https://data.aitamer.news/', slug), `https://data.aitamer.news/v2/comments/${slug}.json`);
  assert.equal(commentsIndexUrl('https://data.aitamer.news/'), 'https://data.aitamer.news/v2/comments-index.json');
});

test('v2 story envelopes accept a list and a permanent empty withdrawal; metadata is never rendered', () => {
  const loaded = read(story({ revision: '9'.repeat(40) }));
  assert.equal(loaded.phase, 'list');
  if (loaded.phase === 'list') assert.deepEqual(Object.keys(loaded.comments[0]), ['id', 'name', 'text', 'at', 'signedIn']);
  assert.deepEqual(read(story({ comments: [] })), { phase: 'empty', attempt: 1 });
  assert.equal(validateCommentFile({ ...story(), version: 1, revision: undefined }, slug).ok, true, 'the shared v1 validator remains usable');
});

test('v2 browsers refuse noncanonical, numeric, overflowing or absent revisions without using v1', () => {
  for (const revision of [undefined, null, 1, 1n, '', '0', '01', '+1', '-1', '1.0', '1e2', ' 1', '1\n', '9'.repeat(41)]) {
    assert.equal(read(story({ revision })).phase, 'failed', String(revision));
    assert.equal(validateCommentsIndex(index({ revision })).ok, false, String(revision));
  }
  assert.equal(read(story({ version: 1 })).phase, 'failed');
  assert.equal(validateCommentsIndex(index({ version: 1 })).ok, false);
});

test('v2 timestamps are UTC instants, stories retain their time ceiling and order', () => {
  for (const value of ['yesterday', '2026-02-30T10:00:00Z', '2026-10-25T10:00:00+00:00', '2026-10-25T10:00Z', undefined]) {
    assert.equal(read(story({ generatedAt: value })).phase, 'failed');
    assert.equal(validateCommentsIndex(index({ generatedAt: value })).ok, false);
  }
  assert.equal(read(story({ generatedAt: '2026-10-25T08:00:00Z' })).phase, 'failed');
  assert.equal(read(story({ comments: [{ ...comment, at: generatedAt }, { ...comment, id: '01K5ZQ8M3B0000000000000000' }] })).phase, 'failed');
  assert.equal(validateCommentsIndex(index()).ok, true, 'index generation need not equal the latest comment time');
});

test('a valid empty v2 index clears count and newest-comment projections', () => {
  const state = loadTransition(initialLoadState(), { type: 'response', attempt: 1, status: 200, body: index({ counts: {}, recent: [] }) }, commentsIndexReader);
  assert.equal(state.phase, 'ready');
  if (state.phase !== 'ready') return;
  assert.equal(countFor(state.value.counts, slug), 0);
  assert.deepEqual(aroundTheFire(state.value.recent, new Map([[slug, '/story/a-story/']])), []);
});

test('v2 missing, invalid and network failures make one request, with no v1 fallback', async () => {
  for (const status of [404, 500, 403, 200]) {
    const urls: string[] = [];
    const event = await fetchDataFile(commentsFileUrl('https://data.aitamer.news/', slug), 1, async (url) => {
      urls.push(url);
      return { ok: status === 200, status, json: async () => ({ ...story(), version: 1 }) };
    });
    const result = threadTransition(initialThreadState(), event, slug);
    assert.equal(result.phase, status === 404 ? 'empty' : 'failed');
    assert.deepEqual(urls, [`https://data.aitamer.news/v2/comments/${slug}.json`]);
  }
});
