import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LATEST_LIMIT, latestEntries, revDocument, storyRev } from './freshness.ts';
import { isLatestFeed, isRevDocument, newStories, noticeFor, noticeText, storiesText } from './freshness-client.ts';

const data = { title: 'A story', section: 'dev', tags: ['a', 'b'], pubDate: new Date('2026-10-02T10:00:00Z') };

test('storyRev is stable, ignores key order and undefined fields', () => {
  const a = storyRev(data, 'body');
  assert.equal(a.length, 16);
  assert.match(a, /^[0-9a-f]+$/);
  assert.equal(storyRev({ pubDate: data.pubDate, tags: ['a', 'b'], section: 'dev', title: 'A story', heroAlt: undefined }, 'body'), a);
});

test('storyRev changes with the body, a frontmatter field, a date and a tag', () => {
  const base = storyRev(data, 'body');
  assert.notEqual(storyRev(data, 'body!'), base);
  assert.notEqual(storyRev({ ...data, title: 'A story.' }, 'body'), base);
  assert.notEqual(storyRev({ ...data, pubDate: new Date('2026-10-02T10:30:00Z') }, 'body'), base);
  assert.notEqual(storyRev({ ...data, tags: ['a'] }, 'body'), base);
});

test('storyRev does not confuse where the frontmatter ends and the body begins', () => {
  assert.notEqual(storyRev({ a: 'x' }, 'y'), storyRev({ a: 'xy' }, ''));
});

test('revDocument reports the update date, the correction count and the withdrawal', () => {
  const plain = revDocument({ data, body: 'b' });
  assert.deepEqual({ ...plain, rev: '' }, { rev: '', updatedDate: null, corrections: 0, withdrawn: false });
  const changed = revDocument({
    data: { ...data, updatedDate: new Date('2026-10-03T00:00:00Z'), corrections: [{ date: 'x', text: 'y' }], withdrawn: { date: 'x', reason: 'y' } },
    body: 'b',
  });
  assert.equal(changed.updatedDate, '2026-10-03T00:00:00.000Z');
  assert.equal(changed.corrections, 1);
  assert.equal(changed.withdrawn, true);
  assert.notEqual(changed.rev, plain.rev);
});

test('latestEntries lists the newest first, is capped, and orders ties by slug', () => {
  const posts = Array.from({ length: LATEST_LIMIT + 5 }, (_, i) => ({
    id: `p${String(i).padStart(2, '0')}`,
    data: { section: 'tools', pubDate: new Date(Date.UTC(2026, 9, 1, 0, i)) },
  }));
  const out = latestEntries(posts);
  assert.equal(out.length, LATEST_LIMIT);
  assert.equal(out[0].slug, `p${String(LATEST_LIMIT + 4).padStart(2, '0')}`);
  const tie = latestEntries([
    { id: 'b', data: { section: 'dev', pubDate: new Date('2026-10-01T00:00:00Z') } },
    { id: 'a', data: { section: 'dev', pubDate: new Date('2026-10-01T00:00:00Z') } },
  ]);
  assert.deepEqual(tie.map((e) => e.slug), ['a', 'b']);
  assert.equal(tie[0].pubDate, '2026-10-01T00:00:00.000Z');
});

const page = { rev: 'aaaa', corrections: 0, withdrawn: false };
const live = { rev: 'aaaa', updatedDate: null, corrections: 0, withdrawn: false };

test('noticeFor: nothing for a current page; withdrawn beats corrected beats updated', () => {
  assert.equal(noticeFor(page, live), null);
  assert.equal(noticeFor(page, { ...live, rev: 'bbbb' }), 'updated');
  assert.equal(noticeFor(page, { ...live, rev: 'bbbb', corrections: 1 }), 'corrected');
  assert.equal(noticeFor(page, { ...live, rev: 'bbbb', corrections: 1, withdrawn: true }), 'withdrawn');
  assert.equal(noticeFor({ ...page, withdrawn: true }, { ...live, rev: 'bbbb', withdrawn: true }), 'updated');
  assert.equal(noticeFor({ ...page, corrections: 2 }, { ...live, rev: 'bbbb', corrections: 1 }), 'updated');
});

test('noticeText and storiesText read plainly', () => {
  assert.equal(noticeText('updated'), 'This story has been updated.');
  assert.equal(noticeText('corrected'), 'This story has been corrected.');
  assert.equal(noticeText('withdrawn'), 'This story has been withdrawn.');
  assert.equal(storiesText(0), '');
  assert.equal(storiesText(1), '1 new story.');
  assert.equal(storiesText(4), '4 new stories.');
});

const entries = [
  { slug: 'c', section: 'dev', pubDate: '2026-10-02T12:00:00.000Z' },
  { slug: 'b', section: 'tools', pubDate: '2026-10-02T11:00:00.000Z' },
  { slug: 'a', section: 'dev', pubDate: '2026-10-02T10:00:00.000Z' },
];

test('newStories counts what is newer than the newest shown, all habitats or one', () => {
  assert.equal(newStories(entries, '2026-10-02T10:00:00.000Z'), 2);
  assert.equal(newStories(entries, '2026-10-02T10:00:00.000Z', 'dev'), 1);
  assert.equal(newStories(entries, '2026-10-02T12:00:00.000Z'), 0);
  assert.equal(newStories(entries, 'not a date'), 0);
  assert.equal(newStories([], '2026-10-02T10:00:00.000Z'), 0);
});

test('the shape guards refuse malformed answers instead of showing them', () => {
  assert.equal(isRevDocument(live), true);
  assert.equal(isRevDocument({ ...live, rev: '' }), false);
  assert.equal(isRevDocument({ rev: 'x', corrections: '1', withdrawn: false }), false);
  assert.equal(isRevDocument(null), false);
  assert.equal(isLatestFeed({ entries }), true);
  assert.equal(isLatestFeed({ entries: [{ slug: 'a' }] }), false);
  assert.equal(isLatestFeed({}), false);
});
