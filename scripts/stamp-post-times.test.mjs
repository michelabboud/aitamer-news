import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseStamp, dateOnlyPubDate, isoUtcSeconds, withStamp } from './stamp-post-times.mjs';

const post = (frontmatter, body = 'Body mentions pubDate: 2026-01-01 in prose.\n') =>
  `---\n${frontmatter}\n---\n\n${body}`;

test('a published post with a date-only pubDate needs a stamp; drafts and timed posts do not', () => {
  assert.equal(dateOnlyPubDate(post('title: A\npubDate: 2026-09-24\ndraft: false')), '2026-09-24');
  assert.equal(dateOnlyPubDate(post('title: A\npubDate: "2026-09-24"')), '2026-09-24');
  assert.equal(dateOnlyPubDate(post("pubDate: '2026-09-24'")), '2026-09-24');
  assert.equal(dateOnlyPubDate(post('pubDate: 2026-09-24\ndraft: true')), null);
  assert.equal(dateOnlyPubDate(post('pubDate: 2026-09-24T09:15:12Z')), null);
  assert.equal(dateOnlyPubDate('no frontmatter\npubDate: 2026-09-24\n'), null);
});

test('only a pubDate inside the frontmatter counts', () => {
  const body = 'pubDate: 2026-09-24\n';
  assert.equal(dateOnlyPubDate(post('title: A\npubDate: 2026-09-24T09:15:12Z', body)), null);
});

test('the time is kept when it falls on the editorial day, in UTC', () => {
  // 12:15 at +03:00 is 09:15 UTC, same day.
  assert.deepEqual(chooseStamp('2026-09-24', new Date('2026-09-24T12:15:12+03:00')), {
    value: '2026-09-24T09:15:12Z',
    exact: true,
  });
});

test('a time on another UTC day never moves the editorial date', () => {
  // 01:30 at +03:00 is still the previous UTC day.
  assert.deepEqual(chooseStamp('2026-09-24', new Date('2026-09-24T01:30:00+03:00')), {
    value: '2026-09-24T00:00:00Z',
    exact: false,
  });
  assert.deepEqual(chooseStamp('2026-09-20', new Date('2026-09-23T11:54:23Z')), {
    value: '2026-09-20T00:00:00Z',
    exact: false,
  });
});

test('stamping rewrites the pubDate line and nothing else', () => {
  const before = post('title: A\npubDate: 2026-09-24\nupdatedDate: 2026-09-25\ndraft: false');
  const after = withStamp(before, '2026-09-24T09:15:12Z');
  assert.equal(after, before.replace('pubDate: 2026-09-24\n', 'pubDate: 2026-09-24T09:15:12Z\n'));
  assert.equal(dateOnlyPubDate(after), null);
  assert.throws(() => withStamp(after, '2026-09-24T09:15:12Z'), /no date-only pubDate/);
});

test('stamps have second precision and a Z suffix', () => {
  assert.equal(isoUtcSeconds(new Date('2026-09-24T09:15:12.987Z')), '2026-09-24T09:15:12Z');
});
