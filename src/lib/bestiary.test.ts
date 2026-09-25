import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HABITATS,
  daysBetween,
  extinctionWatch,
  formatSpecimen,
  habitatOf,
  specimenNumbers,
  wildnessSegments,
} from './bestiary.ts';

const post = (id: string, iso: string) => ({ id, data: { pubDate: new Date(iso) } });

test('every desk sits in exactly one habitat', () => {
  const desks = ['top', 'models', 'tools', 'image', 'video', 'data', 'databases', 'rust', 'policy', 'opinion'];
  for (const desk of desks) {
    assert.equal(HABITATS.filter((h) => h.sections.includes(desk)).length, 1, desk);
  }
  assert.equal(habitatOf('video').name, 'Creative');
  assert.equal(habitatOf('databases').code, 'H4');
  assert.throws(() => habitatOf('sports'));
});

test('specimen numbers count up from the oldest post and mirror the newest-first tie order', () => {
  const numbers = specimenNumbers([
    post('c', '2026-09-25T10:00:00Z'),
    post('a', '2026-09-24T09:00:00Z'),
    // b and d share a time; listings show b before d, so d is the older specimen.
    post('d', '2026-09-24T12:00:00Z'),
    post('b', '2026-09-24T12:00:00Z'),
  ]);
  assert.deepEqual(Object.fromEntries(numbers), { a: 1, d: 2, b: 3, c: 4 });
  assert.equal(formatSpecimen(7), '0007');
  assert.equal(formatSpecimen(12345), '12345');
});

test('a wildness meter fills as many segments as the level, in the level colour', () => {
  assert.deepEqual(wildnessSegments(3), ['--wild-3', '--wild-3', '--wild-3', '--wild-empty', '--wild-empty']);
  assert.deepEqual(wildnessSegments(5), Array(5).fill('--wild-5'));
});

test('days are counted on UTC calendar dates', () => {
  assert.equal(daysBetween(new Date('2026-09-25T23:59:00Z'), new Date('2026-09-28T00:00:00Z')), 3);
  assert.equal(daysBetween(new Date('2026-09-25T00:01:00Z'), new Date('2026-09-25T23:00:00Z')), 0);
  assert.equal(daysBetween(new Date('2026-09-25T08:00:00Z'), new Date('2026-09-24T00:00:00Z')), -1);
});

test('extinction watch splits upcoming from extinct and orders each by nearness', () => {
  const sunset = (id: string, date: string) => ({ id, data: { sunset: { date: new Date(date) } } });
  const { upcoming, extinct } = extinctionWatch(
    [
      sunset('far', '2026-10-23'),
      sunset('gone', '2026-09-24'),
      { id: 'plain', data: {} },
      sunset('soon', '2026-09-28'),
      sunset('today', '2026-09-25'),
      sunset('long-gone', '2026-04-26'),
    ],
    new Date('2026-09-25T08:41:00Z'),
  );
  assert.deepEqual(upcoming.map((e) => [e.post.id, e.daysLeft]), [['today', 0], ['soon', 3], ['far', 28]]);
  assert.deepEqual(extinct.map((e) => e.post.id), ['gone', 'long-gone']);
});
