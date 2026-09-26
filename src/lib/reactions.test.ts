import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REACTIONS,
  REACTION_ID,
  REACTION_REQUEST_FIELDS,
  REACTION_STORAGE_PREFIX,
  applyChoice,
  encodeStoredReaction,
  expiredReactionKeys,
  reactionOutcome,
  settledRecord,
  nextChoice,
  reactEndpoint,
  reactionCaption,
  REACTION_MEMORY_DAYS,
  isKnownReaction,
  parseStoredReaction,
  reactionById,
  reactionCount,
  reactionLabel,
  reactionStorageKey,
  reactionTotals,
  summaryLabel,
  topReactions,
} from './reactions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-26T12:00:00.000Z');

// --- the set ------------------------------------------------------------------------------------

test('the set is the approved seven, in display order, with no thumbs-down', () => {
  assert.deepEqual(
    REACTIONS.map((r) => r.id),
    ['love', 'wow', 'funny', 'angry', 'skeptical', 'overhyped', 'underrated'],
  );
  assert.deepEqual(
    REACTIONS.map((r) => [...r.emoji].map((c) => c.codePointAt(0)!.toString(16).toUpperCase())),
    [['2764', 'FE0F'], ['1F92F'], ['1F602'], ['1F621'], ['1F914'], ['1F388'], ['1F48E']],
  );
  assert.ok(!REACTIONS.some((r) => r.emoji.includes('\u{1F44E}')), 'no thumbs-down');
});

test('every id of the set matches REACTION_ID, and the set cannot be changed at run time', () => {
  for (const { id } of REACTIONS) assert.match(id, REACTION_ID);
  assert.equal(new Set(REACTIONS.map((r) => r.id)).size, REACTIONS.length, 'ids are unique');
  assert.ok(Object.isFrozen(REACTIONS));
  for (const reaction of REACTIONS) assert.ok(Object.isFrozen(reaction), reaction.id);
});

test('REACTION_ID: a lowercase letter, then up to 23 lowercase letters, digits or hyphens', () => {
  for (const id of ['a', 'love', 'retired-2', 'a'.repeat(24), 'x-y-z']) assert.match(id, REACTION_ID, id);
  for (const id of ['', '1love', '-love', 'Love', 'lo_ve', 'lo ve', 'a'.repeat(25), 'love\n', 'lové', '❤️']) {
    assert.doesNotMatch(id, REACTION_ID, JSON.stringify(id));
  }
  assert.equal(REACTION_ID.flags, '', 'no flags: the pattern is the same in the published contract');
});

test('isKnownReaction and reactionById know the set and nothing else', () => {
  assert.equal(isKnownReaction('overhyped'), true);
  assert.equal(reactionById('overhyped')?.label, 'Overhyped');
  for (const id of ['retired', 'Love', '', 'constructor', '__proto__', 'toString']) {
    assert.equal(isKnownReaction(id), false, id);
    assert.equal(reactionById(id), undefined, id);
  }
});

// --- totals -------------------------------------------------------------------------------------

test('reactionTotals: no file is zero', () => {
  const totals = reactionTotals(undefined);
  assert.equal(totals.total, 0);
  assert.equal(totals.known.size, 0);
  assert.equal(totals.unknown.size, 0);
});

test('reactionTotals: known ids in set order, a retired id counted in the total but kept apart', () => {
  const totals = reactionTotals({
    reactions: [
      { id: 'love', n: 3 },
      { id: 'overhyped', n: 7 },
      { id: 'retired', n: 4 },
      { id: 'wow', n: 2 },
    ],
  });
  assert.deepEqual([...totals.known], [['love', 3], ['wow', 2], ['overhyped', 7]]);
  assert.deepEqual([...totals.unknown], [['retired', 4]]);
  assert.equal(totals.total, 16);
});

test('reactionTotals: a file of only retired ids has a total and nothing to show', () => {
  const totals = reactionTotals({ reactions: [{ id: 'meh', n: 4 }] });
  assert.equal(totals.total, 4);
  assert.equal(totals.known.size, 0);
  assert.equal(summaryLabel(totals), '4 reactions');
});

// --- the summary ----------------------------------------------------------------------------------

test('topReactions: highest counts first, ties in set order, at most three, zeros never', () => {
  const known = new Map([
    ['underrated', 5],
    ['love', 5],
    ['wow', 9],
    ['funny', 1],
    ['angry', 0],
  ] as const);
  assert.deepEqual(topReactions(known), ['wow', 'love', 'underrated']);
  assert.deepEqual(topReactions(known, 5), ['wow', 'love', 'underrated', 'funny']);
  assert.deepEqual(topReactions(new Map()), []);
  assert.deepEqual(topReactions(new Map([['angry', 0]] as const)), []);
});

test('reactionCount and reactionLabel: singular, plural, thousands', () => {
  assert.equal(reactionCount(0), '0 reactions');
  assert.equal(reactionCount(1), '1 reaction');
  assert.equal(reactionCount(1204), '1,204 reactions');
  assert.equal(reactionLabel('overhyped', 12), 'Overhyped, 12 reactions');
  assert.equal(reactionLabel('love', 1), 'Love, 1 reaction');
  assert.throws(() => reactionLabel('retired', 3), RangeError);
});

test('summaryLabel: total, then the top three joined in plain English', () => {
  const file = (entries: [string, number][]) => reactionTotals({ reactions: entries.map(([id, n]) => ({ id, n })) });
  assert.equal(summaryLabel(file([['overhyped', 7], ['love', 3], ['wow', 2]])), '12 reactions: Overhyped, Love and Wow');
  assert.equal(summaryLabel(file([['love', 1]])), '1 reaction: Love');
  assert.equal(summaryLabel(file([['love', 2], ['funny', 2]])), '4 reactions: Love and Funny');
  assert.equal(summaryLabel(file([['love', 1], ['wow', 1], ['funny', 1], ['angry', 1]])), '4 reactions: Love, Wow and Funny');
  assert.equal(summaryLabel(file([['love', 1], ['retired', 5]])), '6 reactions: Love');
  assert.equal(summaryLabel(reactionTotals(undefined)), 'No reactions yet');
});

// --- the reader's own choice ------------------------------------------------------------------

test('reactionStorageKey names the story', () => {
  assert.equal(reactionStorageKey('grok-4-7'), 'atn:react:grok-4-7');
  assert.notEqual(reactionStorageKey('a'), reactionStorageKey('b'));
});

test('parseStoredReaction: a fresh choice of a known id is remembered', () => {
  const at = new Date(NOW.getTime() - DAY_MS).toISOString();
  assert.deepEqual(parseStoredReaction(JSON.stringify({ r: 'overhyped', at }), NOW), { r: 'overhyped', at });
  assert.deepEqual(parseStoredReaction(JSON.stringify({ r: 'love', at: NOW.toISOString() }), NOW), { r: 'love', at: NOW.toISOString() });
});

test('parseStoredReaction: forgotten at exactly the desk\'s retention, not a moment later', () => {
  const edge = new Date(NOW.getTime() - REACTION_MEMORY_DAYS * DAY_MS).toISOString();
  const past = new Date(NOW.getTime() - REACTION_MEMORY_DAYS * DAY_MS - 1).toISOString();
  assert.notEqual(parseStoredReaction(JSON.stringify({ r: 'wow', at: edge }), NOW), null);
  assert.equal(parseStoredReaction(JSON.stringify({ r: 'wow', at: past }), NOW), null);
  assert.equal(REACTION_MEMORY_DAYS, 30, 'the privacy page promises 30 days; change it only with the page');
});

test('parseStoredReaction: anything the page did not write is forgotten, never trusted', () => {
  const at = NOW.toISOString();
  const cases: (string | null)[] = [
    null,
    '',
    'not json',
    '"love"',
    'null',
    '[]',
    '42',
    JSON.stringify({ r: 'retired', at }),
    JSON.stringify({ r: 'Love', at }),
    JSON.stringify({ r: 7, at }),
    JSON.stringify({ at }),
    JSON.stringify({ r: 'love' }),
    JSON.stringify({ r: 'love', at: 12345 }),
    JSON.stringify({ r: 'love', at: 'yesterday' }),
    JSON.stringify({ r: 'love', at: new Date(NOW.getTime() + 60_000).toISOString() }),
    JSON.stringify({ r: '__proto__', at }),
  ];
  for (const stored of cases) assert.equal(parseStoredReaction(stored, NOW), null, JSON.stringify(stored));
});

// --- the page's side of POST /react ------------------------------------------------------------

test('reactEndpoint is /react on the comments Worker, wherever that Worker is', () => {
  assert.equal(reactEndpoint('https://comments.aitamer.news/'), 'https://comments.aitamer.news/react');
  assert.equal(reactEndpoint('http://localhost:8787/'), 'http://localhost:8787/react');
  assert.equal(reactEndpoint('http://localhost:8787'), 'http://localhost:8787/react');
  assert.throws(() => reactEndpoint('comments.aitamer.news'), TypeError);
  assert.deepEqual({ ...REACTION_REQUEST_FIELDS }, { slug: 'slug', reaction: 'reaction' });
});

test('reactionCaption: label and count for the hovered choice', () => {
  assert.equal(reactionCaption('overhyped', 12), 'Overhyped · 12');
  assert.equal(reactionCaption('love', 1204), 'Love · 1,204');
  assert.throws(() => reactionCaption('retired', 1), RangeError);
});

test('nextChoice: tapping the current reaction removes it, anything else replaces it', () => {
  assert.equal(nextChoice(null, 'love'), 'love');
  assert.equal(nextChoice('love', 'wow'), 'wow');
  assert.equal(nextChoice('love', 'love'), null);
});

test('applyChoice: +1 new, -1 old, never below zero, input untouched', () => {
  const baked = new Map([['love', 3], ['wow', 1]]);
  assert.deepEqual([...applyChoice(baked, null, 'love')], [['love', 4], ['wow', 1]]);
  assert.deepEqual([...applyChoice(baked, 'love', 'wow')], [['love', 2], ['wow', 2]]);
  assert.deepEqual([...applyChoice(baked, 'love', null)], [['love', 2], ['wow', 1]]);
  assert.deepEqual([...applyChoice(baked, 'angry', null)], [['love', 3], ['wow', 1], ['angry', 0]], 'a choice the file does not count yet stays at zero');
  assert.deepEqual([...applyChoice(baked, 'love', 'love')], [['love', 3], ['wow', 1]]);
  assert.deepEqual([...baked], [['love', 3], ['wow', 1]]);
});

// --- unsent records, answers, the sweep -------------------------------------------------------

test('parseStoredReaction keeps an unsent choice and an unsent removal (a tombstone), and nothing looser', () => {
  const at = NOW.toISOString();
  assert.deepEqual(parseStoredReaction(JSON.stringify({ r: 'wow', at, unsent: true }), NOW), { r: 'wow', at, unsent: true });
  assert.deepEqual(parseStoredReaction(JSON.stringify({ r: null, at, unsent: true }), NOW), { r: null, at, unsent: true });
  for (const bad of [
    { r: null, at },
    { r: null, at, unsent: false },
    { r: 'wow', at, unsent: 'yes' },
    { r: 'wow', at, unsent: 1 },
    { r: 'retired', at, unsent: true },
    { r: null, at: new Date(NOW.getTime() - 31 * DAY_MS).toISOString(), unsent: true },
  ]) {
    assert.equal(parseStoredReaction(JSON.stringify(bad), NOW), null, JSON.stringify(bad));
  }
});

test('encodeStoredReaction round-trips through parseStoredReaction', () => {
  const at = NOW.toISOString();
  for (const record of [{ r: 'love', at }, { r: 'love', at, unsent: true }, { r: null, at, unsent: true }] as const) {
    assert.deepEqual(parseStoredReaction(encodeStoredReaction(record), NOW), record);
  }
  assert.equal(encodeStoredReaction({ r: 'love', at }), `{"r":"love","at":"${at}"}`);
});

test('reactionOutcome: 2xx is ok, 410 closes, 400/403/404 are permanent, the rest (and no answer) transient', () => {
  assert.equal(reactionOutcome(200), 'ok');
  assert.equal(reactionOutcome(204), 'ok');
  assert.equal(reactionOutcome(410), 'closed');
  for (const status of [400, 403, 404]) assert.equal(reactionOutcome(status), 'rejected', String(status));
  for (const status of [401, 405, 408, 413, 415, 429, 500, 502, 503, 0, null]) assert.equal(reactionOutcome(status), 'failed', String(status));
});

test('settledRecord: an ok confirms only the record that was sent', () => {
  const at = NOW.toISOString();
  const later = new Date(NOW.getTime() + 1000).toISOString();
  assert.deepEqual(settledRecord({ r: 'wow', at, unsent: true }, { r: 'wow', at, unsent: true }), { r: 'wow', at });
  assert.equal(settledRecord({ r: null, at, unsent: true }, { r: null, at, unsent: true }), null, 'a confirmed removal deletes the key');
  assert.equal(settledRecord({ r: 'love', at: later, unsent: true }, { r: 'wow', at, unsent: true }), undefined, 'a newer choice is still owed');
  assert.equal(settledRecord({ r: 'wow', at: later, unsent: true }, { r: 'wow', at, unsent: true }), undefined);
  assert.equal(settledRecord(null, { r: 'wow', at, unsent: true }), undefined, 'storage cleared meanwhile: nothing to write');
});

test('settledRecord: a permanent refusal drops the record sent; a transient one keeps it unsent', () => {
  const at = NOW.toISOString();
  const later = new Date(NOW.getTime() + 1000).toISOString();
  const sent = { r: 'wow', at, unsent: true } as const;
  assert.equal(settledRecord(sent, sent, 'rejected'), null);
  assert.equal(settledRecord(sent, sent, 'closed'), null);
  assert.equal(settledRecord({ r: null, at, unsent: true }, { r: null, at, unsent: true }, 'rejected'), null);
  assert.equal(settledRecord(sent, sent, 'failed'), undefined);
  assert.equal(settledRecord({ r: 'love', at: later, unsent: true }, sent, 'rejected'), undefined, 'a newer choice is not dropped with the refused one');
});

test('expiredReactionKeys: only this site\'s reaction records that would be forgotten', () => {
  const fresh = JSON.stringify({ r: 'wow', at: NOW.toISOString() });
  const old = JSON.stringify({ r: 'wow', at: new Date(NOW.getTime() - 31 * DAY_MS).toISOString() });
  const entries: [string, string | null][] = [
    [`${REACTION_STORAGE_PREFIX}a`, fresh],
    [`${REACTION_STORAGE_PREFIX}b`, old],
    [`${REACTION_STORAGE_PREFIX}c`, 'garbage'],
    [`${REACTION_STORAGE_PREFIX}d`, JSON.stringify({ r: null, at: NOW.toISOString(), unsent: true })],
    ['theme', old],
    ['atn:other', 'garbage'],
  ];
  assert.deepEqual(expiredReactionKeys(entries, NOW), [`${REACTION_STORAGE_PREFIX}b`, `${REACTION_STORAGE_PREFIX}c`]);
});

