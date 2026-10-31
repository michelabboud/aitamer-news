import assert from 'node:assert/strict';
import test from 'node:test';
import { droppedPinWarnings, splitPinned } from './home-pins.ts';
import type { Pin, PinsFile } from './pins.ts';

const NOW = new Date('2026-11-01T10:00:00Z');
const posts = ['newest', 'b', 'c', 'd', 'e'].map((id) => ({ id }));
const pin = (slug: string, pinnedAt: string, extra: Partial<Pin> = {}): Pin =>
  ({ slug, source: 'manual', state: 'active', pinnedBy: 'michel', pinnedAt, ...extra });
const file = (...pins: Pin[]): PinsFile => ({ mode: 'auto', pins });
const ids = (list: readonly { id: string }[]) => list.map((p) => p.id);

test('no pins: the feed is every post, the card is empty', () => {
  const out = splitPinned(posts, file(), NOW);
  assert.deepEqual(out.pinned, []);
  assert.deepEqual(ids(out.feedPosts), ids(posts));
});

test('pinned posts leave the feed and fill the card newest pin first', () => {
  const out = splitPinned(posts, file(pin('d', '2026-10-31T08:00:00Z'), pin('c', '2026-10-31T09:00:00Z')), NOW);
  assert.deepEqual(ids(out.pinned), ['c', 'd']);
  assert.deepEqual(ids(out.feedPosts), ['newest', 'b', 'e']);
});

test('a pinned post that is the lead stays the lead and is not repeated in the card', () => {
  const out = splitPinned(posts, file(pin('newest', '2026-10-31T09:00:00Z'), pin('c', '2026-10-31T08:00:00Z')), NOW);
  assert.deepEqual(ids(out.pinned), ['c']);
  assert.deepEqual(ids(out.feedPosts), ['newest', 'b', 'd', 'e']);
});

test('a pin naming a post that is not published is dropped with a warning, never a failure', () => {
  const out = splitPinned(posts, file(pin('gone', '2026-10-31T09:00:00Z'), pin('b', '2026-10-31T08:00:00Z')), NOW);
  assert.deepEqual(ids(out.pinned), ['b']);
  const warnings = droppedPinWarnings(out.dropped);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /"gone" is pinned but is not a published post/);
});

test('expired and proposed pins leave the card silently and their posts return to the feed', () => {
  const out = splitPinned(posts, file(
    pin('b', '2026-10-30T09:00:00Z', { until: '2026-10-31' }),
    pin('c', '2026-10-31T09:00:00Z', { state: 'proposed', source: 'auto', pinnedBy: 'eic' }),
  ), NOW);
  assert.deepEqual(out.pinned, []);
  assert.deepEqual(ids(out.feedPosts), ids(posts));
  assert.deepEqual(droppedPinWarnings(out.dropped), []);
});

test('an empty site has no lead and no card', () => {
  const out = splitPinned([], file(pin('b', '2026-10-31T09:00:00Z')), NOW);
  assert.deepEqual(out.pinned, []);
  assert.deepEqual(out.feedPosts, []);
});
