import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREADS_VERSION, buildThreadsFile, threadState, threadStates, type ThreadPost } from './comment-threads.ts';

const now = new Date('2026-09-25T12:00:00Z');
const past = new Date('2026-09-20T09:15:00Z');

const post = (id: string, data: Partial<ThreadPost['data']> = {}): ThreadPost => ({
  id,
  data: { draft: false, pubDate: past, ...data },
});

test('a live post is open', () => {
  assert.equal(threadState(post('grok-4-7').data), 'open');
  assert.equal(threadState(post('grok-4-7', { comments: { closed: false } }).data), 'open');
});

test('a withdrawn post is closed', () => {
  assert.equal(threadState(post('gone', { withdrawn: { date: past, reason: 'Wrong vendor.' } }).data), 'closed');
});

test('comments: { closed: true } closes the thread', () => {
  assert.equal(threadState(post('quiet', { comments: { closed: true } }).data), 'closed');
});

test('every live post is listed; drafts and future posts are absent', () => {
  const threads = threadStates(
    [
      post('live-one'),
      post('a-draft', { draft: true }),
      post('scheduled', { pubDate: new Date('2026-09-25T12:00:01Z') }),
      post('withdrawn-one', { withdrawn: { date: past, reason: 'r' } }),
      post('closed-one', { comments: { closed: true } }),
      post('a-draft-closed', { draft: true, comments: { closed: true } }),
    ],
    now,
  );
  assert.deepEqual(threads, {
    'closed-one': 'closed',
    'live-one': 'open',
    'withdrawn-one': 'closed',
  });
});

test('a post published at exactly build time is listed', () => {
  assert.deepEqual(threadStates([post('now', { pubDate: now })], now), { now: 'open' });
});

test('slugs are sorted so the file changes only when the content does', () => {
  assert.deepEqual(Object.keys(threadStates([post('zebra'), post('apple'), post('mango')], now)), ['apple', 'mango', 'zebra']);
});

test('no posts gives an empty map, not a missing key', () => {
  assert.deepEqual(buildThreadsFile([], now), { version: 1, generatedAt: '2026-09-25T12:00:00.000Z', threads: {} });
});

test('the file carries version 1, the build time and the map (plan §5.3)', () => {
  const file = buildThreadsFile([post('grok-4-7'), post('quiet', { comments: { closed: true } })], now);
  assert.equal(THREADS_VERSION, 1);
  assert.deepEqual(file, {
    version: 1,
    generatedAt: '2026-09-25T12:00:00.000Z',
    threads: { 'grok-4-7': 'open', quiet: 'closed' },
  });
  // Exactly these three keys: the Worker parses this shape.
  assert.deepEqual(Object.keys(file), ['version', 'generatedAt', 'threads']);
});
