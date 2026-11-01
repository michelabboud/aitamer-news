import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PIN_CARD_CAPACITY,
  PIN_ZONE,
  parsePinsFile,
  parsePinsText,
  parseTimestamp,
  selectPinned,
  serializePinsFile,
  untilInstant,
  type Pin,
  type PinsFile,
} from './pins.ts';

const pin = (over: Partial<Pin> & { slug: string }): Pin => ({
  source: 'manual',
  state: 'active',
  pinnedBy: 'michel',
  pinnedAt: '2026-10-31T10:00:00Z',
  ...over,
});
const file = (...pins: Pin[]): PinsFile => ({ mode: 'auto', pins });
const bad = (raw: unknown, pattern: RegExp) => assert.throws(() => parsePinsFile(raw), pattern);

// ---------- parsePinsFile ----------

test('the empty file and a full file parse, keys written in the documented order', () => {
  assert.deepEqual(parsePinsFile({ mode: 'auto', pins: [] }), { mode: 'auto', pins: [] });
  const parsed = parsePinsFile({
    pins: [{ until: '2026-11-05', pinnedAt: '2026-10-31T10:00:00+02:00', pinnedBy: 'eic', state: 'proposed', source: 'auto', slug: 'a-post' }],
    mode: 'approve',
  });
  assert.deepEqual(Object.keys(parsed), ['mode', 'pins']);
  assert.deepEqual(Object.keys(parsed.pins[0]), ['slug', 'source', 'state', 'pinnedBy', 'pinnedAt', 'until']);
});

test('the file must be an object with a known mode and a pins array', () => {
  for (const raw of [null, [], 'x', 3]) bad(raw, /must be a JSON object/);
  bad({ mode: 'auto' }, /"pins" must be an array/);
  bad({ mode: 'auto', pins: {} }, /"pins" must be an array/);
  bad({ pins: [] }, /mode must be one of/);
  bad({ mode: 'manual', pins: [] }, /mode must be one of/);
});

test('an unknown key is rejected at the top level and on a pin', () => {
  bad({ mode: 'auto', pins: [], extra: 1 }, /the file: unknown key "extra"/);
  bad({ mode: 'auto', pins: [pin({ slug: 'a' }), { ...pin({ slug: 'b' }), note: 'x' }] }, /pins\[1\]: unknown key "note"/);
});

test('slug, source, state and pinnedBy are checked', () => {
  const one = (over: Record<string, unknown>) => ({ mode: 'auto', pins: [{ ...pin({ slug: 'a' }), ...over }] });
  bad(one({ slug: 'Upper' }), /slug must be a post slug/);
  bad(one({ slug: '../etc' }), /slug must be a post slug/);
  bad(one({ slug: '' }), /slug must be a post slug/);
  bad(one({ slug: 'a'.repeat(121) }), /slug must be a post slug/);
  bad(one({ slug: 7 }), /slug must be a post slug/);
  assert.equal(parsePinsFile(one({ slug: 'a'.repeat(120) })).pins[0].slug.length, 120);
  bad(one({ source: 'bot' }), /source must be one of/);
  bad(one({ state: 'pending' }), /state must be one of/);
  bad(one({ state: undefined }), /state must be one of/);
  bad(one({ pinnedBy: 'Michel' }), /pinnedBy must match/);
  bad(one({ pinnedBy: '-x' }), /pinnedBy must match/);
  bad(one({ pinnedBy: 'a'.repeat(41) }), /pinnedBy must match/);
  assert.equal(parsePinsFile(one({ pinnedBy: 'a'.repeat(40) })).pins[0].pinnedBy.length, 40);
  bad({ mode: 'auto', pins: ['a-post'] }, /pins\[0\] must be an object/);
});

test('a duplicate slug is rejected', () => {
  bad(file(pin({ slug: 'a' }), pin({ slug: 'b' }), pin({ slug: 'a', source: 'auto' })), /slug "a" is pinned twice/);
});

test('pinnedAt needs an offset or Z and a real moment', () => {
  const at = (pinnedAt: unknown) => file({ ...pin({ slug: 'a' }), pinnedAt } as Pin);
  assert.doesNotThrow(() => parsePinsFile(at('2026-10-31T10:00:00Z')));
  assert.doesNotThrow(() => parsePinsFile(at('2026-10-31T10:00:00+03:00')));
  assert.doesNotThrow(() => parsePinsFile(at('2026-10-31T10:00:00.123-05:30')));
  for (const value of ['2026-10-31T10:00:00', '2026-10-31', '2026-10-31 10:00:00Z', '2026-10-31T10:00:00+0200', '2026-10-31T25:00:00Z', '2026-10-31T10:60:00Z', '2026-10-31T10:00:60Z', '2026-02-30T10:00:00Z', '2026-10-31T10:00:00+24:00', '2026-10-31T10:00:00+02:60', '', 5, null]) {
    bad(at(value), /pinnedAt must be an ISO 8601 timestamp with an offset or Z/);
  }
});

test('until is a timestamp with an offset, or a real bare date; nothing else', () => {
  const until = (value: unknown) => file({ ...pin({ slug: 'a' }), until: value } as Pin);
  assert.doesNotThrow(() => parsePinsFile(until('2026-11-05')));
  assert.doesNotThrow(() => parsePinsFile(until('2028-02-29')));
  assert.doesNotThrow(() => parsePinsFile(until('2026-11-05T18:00:00+02:00')));
  assert.doesNotThrow(() => parsePinsFile(until('2026-11-05T18:00:00Z')));
  for (const value of ['2026-11-05T18:00:00', '2026-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '2026-11-5', '11/05/2026', '', 5, null]) {
    bad(until(value), /until must be a timestamp with an offset or Z, or a real YYYY-MM-DD date/);
  }
});

test('parsePinsText names bad JSON and passes valid text through the same checks', () => {
  assert.throws(() => parsePinsText('{ "mode": '), /pins\.json: not valid JSON/);
  assert.throws(() => parsePinsText(''), /not valid JSON/);
  assert.throws(() => parsePinsText('{"mode":"auto","pins":[],"x":1}'), /unknown key "x"/);
  assert.deepEqual(parsePinsText('{"mode":"approve","pins":[]}'), { mode: 'approve', pins: [] });
});

test('serializePinsFile writes two-space JSON with a trailing newline and is stable', () => {
  const text = serializePinsFile(file(pin({ slug: 'a', until: '2026-11-05' })));
  assert.equal(
    text,
    '{\n  "mode": "auto",\n  "pins": [\n    {\n      "slug": "a",\n      "source": "manual",\n      "state": "active",\n      "pinnedBy": "michel",\n      "pinnedAt": "2026-10-31T10:00:00Z",\n      "until": "2026-11-05"\n    }\n  ]\n}\n',
  );
  assert.equal(serializePinsFile(parsePinsText(text)), text);
  assert.equal(serializePinsFile({ mode: 'auto', pins: [] }), '{\n  "mode": "auto",\n  "pins": []\n}\n');
  assert.throws(() => serializePinsFile({ mode: 'auto', pins: [{ slug: 'Bad' } as Pin] }));
});

// ---------- untilInstant ----------

/** The zone's offset at an instant as "+02:00", read from Intl independently of the module under test. */
function offsetLabel(instant: Date): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: PIN_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(instant)
    .find((p) => p.type === 'timeZoneName')!.value; // "GMT+03:00"
  return part.replace('GMT', '');
}

/** Every day of 2026 whose offset differs from the day before: the zone's clock-change days. */
function transitionDays(): { day: string; before: string; after: string }[] {
  const found = [];
  for (let d = Date.UTC(2026, 0, 2); d < Date.UTC(2027, 0, 1); d += 86_400_000) {
    const before = offsetLabel(new Date(d - 86_400_000 + 12 * 3_600_000));
    const after = offsetLabel(new Date(d + 12 * 3_600_000));
    if (before !== after) found.push({ day: new Date(d).toISOString().slice(0, 10), before, after });
  }
  return found;
}

test('a bare date in winter is the end of that day at UTC+2', () => {
  assert.equal(untilInstant('2026-01-15').toISOString(), '2026-01-15T21:59:59.999Z');
  assert.equal(untilInstant('2026-12-31').toISOString(), '2026-12-31T21:59:59.999Z');
});

test('a bare date in summer is the end of that day at UTC+3', () => {
  assert.equal(untilInstant('2026-07-15').toISOString(), '2026-07-15T20:59:59.999Z');
});

test('a bare date is shown through 23:59:59.999 local and gone one millisecond later', () => {
  const last = untilInstant('2026-11-05');
  assert.equal(last.toISOString(), '2026-11-05T21:59:59.999Z');
  assert.equal(offsetLabel(last), '+02:00');
  assert.equal(new Date(last.valueOf() + 1).toISOString(), '2026-11-05T22:00:00.000Z'); // 00:00 on 6 Nov at +2
});

test('the two clock-change days of 2026 are found through Intl and read correctly', () => {
  const days = transitionDays();
  assert.equal(days.length, 2, `expected two clock changes in 2026, found ${JSON.stringify(days)}`);
  const [spring, autumn] = days;
  assert.deepEqual([spring.before, spring.after], ['+02:00', '+03:00']);
  assert.deepEqual([autumn.before, autumn.after], ['+03:00', '+02:00']);
  for (const { day, after } of days) {
    // The day ends under the offset that is in force after the change.
    assert.equal(untilInstant(day).valueOf(), Date.parse(`${day}T23:59:59.999${after}`), day);
  }
  // The days beside each change keep their ordinary offset.
  for (const [offsetDay, label] of [['2026-03-26', '+02:00'], ['2026-03-28', '+03:00'], ['2026-10-24', '+03:00'], ['2026-10-26', '+02:00']] as const) {
    assert.equal(untilInstant(offsetDay).valueOf(), Date.parse(`${offsetDay}T23:59:59.999${label}`), offsetDay);
  }
});

test('a timestamp until is that exact instant, whatever its offset', () => {
  assert.equal(untilInstant('2026-11-05T18:00:00+02:00').toISOString(), '2026-11-05T16:00:00.000Z');
  assert.equal(untilInstant('2026-11-05T18:00:00Z').toISOString(), '2026-11-05T18:00:00.000Z');
  assert.equal(untilInstant('2026-11-05T18:00:00.250-05:00').toISOString(), '2026-11-05T23:00:00.250Z');
});

test('untilInstant refuses what the schema refuses', () => {
  for (const value of ['2026-11-05T18:00:00', '2026-02-30', 'tomorrow', '']) {
    assert.throws(() => untilInstant(value), /neither a timestamp/, value);
  }
});

test('parseTimestamp returns null instead of throwing', () => {
  assert.equal(parseTimestamp('2026-11-05T18:00:00'), null);
  assert.equal(parseTimestamp('2026-11-05T18:00:00Z')?.toISOString(), '2026-11-05T18:00:00.000Z');
});

// ---------- selectPinned ----------

const NOW = new Date('2026-10-31T12:00:00Z');
const all = (...slugs: string[]) => new Set(slugs);
const slugs = (pins: Pin[]) => pins.map((p) => p.slug);

test('the card holds two', () => {
  assert.equal(PIN_CARD_CAPACITY, 2);
});

test('no pins, nothing shown, nothing dropped', () => {
  assert.deepEqual(selectPinned(file(), all(), NOW), { shown: [], dropped: [] });
});

test('one active pin on a published post shows', () => {
  const result = selectPinned(file(pin({ slug: 'a' })), all('a'), NOW);
  assert.deepEqual(slugs(result.shown), ['a']);
  assert.deepEqual(result.dropped, []);
});

test('proposed pins never show, in either mode', () => {
  for (const mode of ['auto', 'approve'] as const) {
    const result = selectPinned({ mode, pins: [pin({ slug: 'a', state: 'proposed', source: 'auto' }), pin({ slug: 'b', state: 'proposed' })] }, all('a', 'b'), NOW);
    assert.deepEqual(result.shown, []);
    assert.deepEqual(result.dropped, [{ slug: 'a', reason: 'proposed' }, { slug: 'b', reason: 'proposed' }]);
  }
});

test('a proposed pin does not take a slot from an active one', () => {
  const result = selectPinned(file(
    pin({ slug: 'p', state: 'proposed', pinnedAt: '2026-10-31T11:00:00Z' }),
    pin({ slug: 'a', pinnedAt: '2026-10-31T08:00:00Z' }),
    pin({ slug: 'b', pinnedAt: '2026-10-31T07:00:00Z' }),
  ), all('p', 'a', 'b'), NOW);
  assert.deepEqual(slugs(result.shown), ['a', 'b']);
});

test('a pin on an unpublished post is dropped as unpublished', () => {
  const result = selectPinned(file(pin({ slug: 'gone' }), pin({ slug: 'a' })), all('a'), NOW);
  assert.deepEqual(slugs(result.shown), ['a']);
  assert.deepEqual(result.dropped, [{ slug: 'gone', reason: 'unpublished' }]);
});

test('unpublished wins over expired when both are true', () => {
  const result = selectPinned(file(pin({ slug: 'gone', until: '2026-01-01' })), all(), NOW);
  assert.deepEqual(result.dropped, [{ slug: 'gone', reason: 'unpublished' }]);
});

test('expiry: shown at exactly the until instant, dropped one millisecond after', () => {
  const until = '2026-11-05T18:00:00+02:00';
  const at = untilInstant(until);
  const f = file(pin({ slug: 'a', until }));
  assert.deepEqual(slugs(selectPinned(f, all('a'), new Date(at.valueOf() - 1)).shown), ['a']);
  assert.deepEqual(slugs(selectPinned(f, all('a'), at).shown), ['a']);
  const after = selectPinned(f, all('a'), new Date(at.valueOf() + 1));
  assert.deepEqual(after.shown, []);
  assert.deepEqual(after.dropped, [{ slug: 'a', reason: 'expired' }]);
});

test('expiry of a bare date: shown at 23:59:59.999 Israel time, dropped at midnight', () => {
  const f = file(pin({ slug: 'a', until: '2026-07-15' }));
  assert.deepEqual(slugs(selectPinned(f, all('a'), new Date('2026-07-15T20:59:59.999Z')).shown), ['a']);
  assert.deepEqual(selectPinned(f, all('a'), new Date('2026-07-15T21:00:00.000Z')).dropped, [{ slug: 'a', reason: 'expired' }]);
});

test('a pin without until never expires', () => {
  assert.deepEqual(slugs(selectPinned(file(pin({ slug: 'a' })), all('a'), new Date('2040-01-01T00:00:00Z')).shown), ['a']);
});

test('shown order is newest pinnedAt first; offsets are compared as instants', () => {
  const result = selectPinned(file(
    pin({ slug: 'older', pinnedAt: '2026-10-31T10:00:00Z' }),
    pin({ slug: 'newer', pinnedAt: '2026-10-31T12:30:00+03:00' }), // 09:30Z: older than 10:00Z
  ), all('older', 'newer'), NOW);
  assert.deepEqual(slugs(result.shown), ['older', 'newer']);
});

test('with more than two manual pins, the two newest show; the rest are only not shown', () => {
  const result = selectPinned(file(
    pin({ slug: 'm1', pinnedAt: '2026-10-31T01:00:00Z' }),
    pin({ slug: 'm3', pinnedAt: '2026-10-31T03:00:00Z' }),
    pin({ slug: 'm2', pinnedAt: '2026-10-31T02:00:00Z' }),
  ), all('m1', 'm2', 'm3'), NOW);
  assert.deepEqual(slugs(result.shown), ['m3', 'm2']);
  assert.deepEqual(result.dropped, []);
});

test('manual pins take the slots before auto pins, even older ones', () => {
  const result = selectPinned(file(
    pin({ slug: 'auto-new', source: 'auto', pinnedBy: 'eic', pinnedAt: '2026-10-31T11:00:00Z' }),
    pin({ slug: 'manual-old', pinnedAt: '2026-10-01T00:00:00Z' }),
    pin({ slug: 'auto-newer', source: 'auto', pinnedBy: 'eic', pinnedAt: '2026-10-31T11:30:00Z' }),
  ), all('auto-new', 'manual-old', 'auto-newer'), NOW);
  assert.deepEqual(slugs(result.shown), ['auto-newer', 'manual-old']);
});

test('auto pins fill what manual pins leave, newest first', () => {
  const result = selectPinned(file(
    pin({ slug: 'a1', source: 'auto', pinnedAt: '2026-10-31T05:00:00Z' }),
    pin({ slug: 'a2', source: 'auto', pinnedAt: '2026-10-31T09:00:00Z' }),
    pin({ slug: 'a3', source: 'auto', pinnedAt: '2026-10-31T07:00:00Z' }),
  ), all('a1', 'a2', 'a3'), NOW);
  assert.deepEqual(slugs(result.shown), ['a2', 'a3']);
});

test('two manual pins leave no room for any auto pin', () => {
  const result = selectPinned(file(
    pin({ slug: 'm1', pinnedAt: '2026-10-01T00:00:00Z' }),
    pin({ slug: 'm2', pinnedAt: '2026-10-02T00:00:00Z' }),
    pin({ slug: 'a', source: 'auto', pinnedAt: '2026-10-31T00:00:00Z' }),
  ), all('m1', 'm2', 'a'), NOW);
  assert.deepEqual(slugs(result.shown), ['m2', 'm1']);
});

test('an expired or unpublished manual pin frees its slot for an auto pin', () => {
  const result = selectPinned(file(
    pin({ slug: 'm-expired', until: '2026-10-30' }),
    pin({ slug: 'm-gone' }),
    pin({ slug: 'm-ok', pinnedAt: '2026-10-20T00:00:00Z' }),
    pin({ slug: 'a', source: 'auto', pinnedAt: '2026-10-31T00:00:00Z' }),
  ), all('m-expired', 'm-ok', 'a'), NOW);
  assert.deepEqual(slugs(result.shown), ['a', 'm-ok']);
  assert.deepEqual(result.dropped, [{ slug: 'm-expired', reason: 'expired' }, { slug: 'm-gone', reason: 'unpublished' }]);
});

test('equal pinnedAt breaks the tie on slug, so the result never depends on file order', () => {
  const same = { pinnedAt: '2026-10-31T10:00:00Z' };
  const a = selectPinned(file(pin({ slug: 'c', ...same }), pin({ slug: 'a', ...same }), pin({ slug: 'b', ...same })), all('a', 'b', 'c'), NOW);
  const b = selectPinned(file(pin({ slug: 'b', ...same }), pin({ slug: 'c', ...same }), pin({ slug: 'a', ...same })), all('a', 'b', 'c'), NOW);
  assert.deepEqual(slugs(a.shown), ['a', 'b']);
  assert.deepEqual(a.shown, b.shown);
});
