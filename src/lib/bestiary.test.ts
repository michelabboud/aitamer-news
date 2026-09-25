import assert from 'node:assert/strict';
import test from 'node:test';
import { HABITAT_LIST, daysBetween, extinctionWatch, habitatOf, wildnessTokens } from './bestiary.ts';

test('every habitat has one display entry, in code order', () => {
  assert.deepEqual(HABITAT_LIST.map((h) => h.code), ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']);
  assert.equal(habitatOf('creative').name, 'Creative');
  assert.equal(habitatOf('infra').code, 'H4');
  assert.throws(() => habitatOf('video'), /not a habitat/);
});

test('a wildness meter fills as many segments as the level, in the level colour', () => {
  assert.deepEqual(wildnessTokens(3), ['--wild-3', '--wild-3', '--wild-3', '--wild-empty', '--wild-empty']);
  assert.deepEqual(wildnessTokens(5), Array(5).fill('--wild-5'));
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
