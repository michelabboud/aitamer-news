import assert from 'node:assert/strict';
import test from 'node:test';
import { droppedPinWarnings, pinCacheMark, pinCardIdSet, resolvePinCard, splitPinned } from './home-pins.ts';
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

test('the Pinned badge is the homepage card: a lead, an expired pin, a proposed pin and a pin past two slots stay off it', () => {
  const crowd = ['newest', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id }));
  const now = new Date('2026-11-01T12:00:00.000Z');
  const pins = file(
    pin('newest', '2026-11-01T11:00:00Z'),
    pin('b', '2026-11-01T10:00:00Z'),
    pin('c', '2026-11-01T09:00:00Z'),
    pin('d', '2026-11-01T08:00:00Z', { source: 'auto', pinnedBy: 'eic' }),
    pin('e', '2026-11-01T07:00:00Z', { until: '2026-11-01T11:59:59Z' }),
    pin('f', '2026-11-01T06:00:00Z', { state: 'proposed', source: 'auto', pinnedBy: 'eic' }),
  );
  const card = resolvePinCard(crowd, pins, now);
  assert.deepEqual(ids(card.pinned), ['b', 'c']);
  assert.deepEqual([...card.ids], ['b', 'c']);
  assert.equal(pinCardIdSet(crowd, pins, now).has('newest'), false);
  assert.equal(card.ids.has('d'), false);
  assert.equal(card.ids.has('e'), false);
  assert.equal(card.ids.has('f'), false);
});

test('an automatic pin fills a free slot, in auto mode and when approve mode has already made it active', () => {
  const few = ['newest', 'b', 'c'].map((id) => ({ id }));
  const manual = pin('b', '2026-10-31T09:00:00Z');
  const autoPin = pin('c', '2026-10-31T08:00:00Z', { source: 'auto', pinnedBy: 'eic' });
  assert.deepEqual([...pinCardIdSet(few, { mode: 'auto', pins: [manual, autoPin] }, NOW)], ['b', 'c']);
  assert.deepEqual([...pinCardIdSet(few, { mode: 'approve', pins: [autoPin] }, NOW)], ['c']);
  const proposed = pin('c', '2026-10-31T08:00:00Z', { source: 'auto', pinnedBy: 'eic', state: 'proposed' });
  assert.equal(pinCardIdSet(few, { mode: 'approve', pins: [proposed] }, NOW).size, 0);
});

test('the badge keeps a pin at its until instant and drops it one millisecond later', () => {
  const few = ['newest', 'b'].map((id) => ({ id }));
  const until = '2026-11-01T10:00:00Z';
  const pins = file(pin('b', '2026-10-31T09:00:00Z', { until }));
  assert.equal(pinCardIdSet(few, pins, new Date(until)).has('b'), true);
  assert.equal(pinCardIdSet(few, pins, new Date(Date.parse(until) + 1)).has('b'), false);
});

test('a bare until date is read in Israel time for the badge', () => {
  const few = ['newest', 'b'].map((id) => ({ id }));
  const pins = file(pin('b', '2026-10-31T09:00:00Z', { until: '2026-11-01' }));
  // 1 Nov 2026 is winter time in Asia/Jerusalem (UTC+2): the pin lasts through 21:59:59.999Z.
  assert.equal(pinCardIdSet(few, pins, new Date('2026-11-01T21:59:59.999Z')).has('b'), true);
  assert.equal(pinCardIdSet(few, pins, new Date('2026-11-01T22:00:00.000Z')).has('b'), false);
});

test('pinCacheMark names only this page\'s card posts, in slug order', () => {
  const shown = new Set(['b', 'a']);
  assert.equal(pinCacheMark(['c', 'a', 'b'], shown), 'pin-card:a,b');
  assert.equal(pinCacheMark(['c'], shown), 'pin-card:');
  assert.equal(pinCacheMark(['b', 'a'], shown), pinCacheMark(['a', 'b'], shown));
});

test('a pinned lead does not cost the card a slot: the next eligible pin fills it', () => {
  const out = splitPinned(posts, file(
    pin('newest', '2026-10-31T10:00:00Z'), pin('c', '2026-10-31T09:00:00Z'), pin('d', '2026-10-31T08:00:00Z'),
  ), NOW);
  assert.deepEqual(ids(out.pinned), ['c', 'd']);
  assert.deepEqual(ids(out.feedPosts), ['newest', 'b', 'e']);
});
