import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLive } from './schedule.ts';

const now = new Date('2026-09-25T12:00:00Z');

test('a draft is never live, regardless of pubDate', () => {
  assert.equal(isLive({ draft: true, pubDate: new Date('2026-01-01T00:00:00Z') }, now), false);
  assert.equal(isLive({ draft: true, pubDate: now }, now), false);
});

test('a non-draft post is live once its pubDate has passed', () => {
  assert.equal(isLive({ draft: false, pubDate: new Date('2026-09-25T11:59:59Z') }, now), true);
});

test('a non-draft post at exactly build time is live', () => {
  assert.equal(isLive({ draft: false, pubDate: now }, now), true);
});

test('a non-draft post with a future pubDate is not live yet', () => {
  assert.equal(isLive({ draft: false, pubDate: new Date('2026-09-25T12:00:01Z') }, now), false);
  assert.equal(isLive({ draft: false, pubDate: new Date('2026-10-01T00:00:00Z') }, now), false);
});
