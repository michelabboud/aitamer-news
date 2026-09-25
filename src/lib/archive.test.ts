import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveMonthOf, formatArchiveMonth, groupByMonth } from './archive.ts';

const post = (id: string, iso: string) => ({ id, data: { pubDate: new Date(iso) } });

test('months are taken in UTC, not the local time of the writer', () => {
  // 23:30 on Sep 30 at -02:00 is already October in UTC.
  assert.deepEqual(archiveMonthOf(new Date('2026-09-30T23:30:00-02:00')), { year: '2026', month: '10' });
  assert.deepEqual(archiveMonthOf(new Date('2026-01-01T00:00:00Z')), { year: '2026', month: '01' });
});

test('posts are grouped newest month first and keep their order inside a month', () => {
  const months = groupByMonth([
    post('c', '2027-01-02T10:00:00Z'),
    post('b', '2026-09-24T09:15:12Z'),
    post('a', '2026-09-23T17:51:26Z'),
    post('z', '2026-08-31T23:59:59Z'),
  ]);
  assert.deepEqual(
    months.map((m) => [m.year, m.month, m.posts.map((p) => p.id)]),
    [
      ['2027', '01', ['c']],
      ['2026', '09', ['b', 'a']],
      ['2026', '08', ['z']],
    ],
  );
});

test('no posts means no months', () => {
  assert.deepEqual(groupByMonth([]), []);
});

test('month labels are written out in English', () => {
  assert.equal(formatArchiveMonth('2026', '09'), 'September 2026');
  assert.equal(formatArchiveMonth('2027', '01'), 'January 2027');
});
