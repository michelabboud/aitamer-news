import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FRONT_LOG_SIZE, FRONT_MINIMUM, frontPage, orderHomeAuthors } from './front-page.ts';

const post = (id: string, iso: string) => ({ id, data: { pubDate: new Date(iso) } });
const ids = (list: { id: string }[]) => list.map((p) => p.id);

test('every post from the newest post’s three-day window is featured, however many there are', () => {
  const posts = [
    post('a', '2026-09-27T20:00:00Z'),
    ...Array.from({ length: 11 }, (_, i) => post(`w${i}`, new Date(Date.parse("2026-09-27T20:00:00Z") - (i + 1) * 6 * 60 * 60 * 1000).toISOString())),
    post('old', '2026-09-10T00:00:00Z'),
  ];
  const page = frontPage(posts);
  assert.equal(page.lead?.id, 'a');
  assert.equal(page.featured.length, 11);
  assert.deepEqual(ids(page.log), ['old']);
});

test('a quiet period is filled with older posts up to the minimum, and the log continues after them', () => {
  const posts = [
    post('a', '2026-09-27T00:00:00Z'),
    post('b', '2026-09-26T00:00:00Z'),
    ...Array.from({ length: 20 }, (_, i) => post(`old${i}`, new Date(Date.UTC(2026, 7, 30 - i)).toISOString())),
  ];
  const page = frontPage(posts);
  assert.equal(page.featured.length, FRONT_MINIMUM - 1);
  assert.deepEqual(ids(page.featured).slice(0, 2), ['b', 'old0']);
  assert.equal(page.log.length, FRONT_LOG_SIZE);
  assert.equal(page.log[0].id, `old${FRONT_MINIMUM - 2}`);
});

test('the window is measured from the newest post, not the clock, and its edge is exclusive', () => {
  const posts = [
    post('a', '2026-01-08T00:00:00Z'),
    post('inside', '2026-01-05T00:00:01Z'),
    post('edge', '2026-01-05T00:00:00Z'),
  ];
  const page = frontPage(posts, { minimum: 1 });
  assert.deepEqual(ids(page.featured), ['inside']);
  assert.deepEqual(ids(page.log), ['edge']);
});

test('no posts gives an empty page; one post gives only a lead', () => {
  assert.deepEqual(frontPage([]), { lead: undefined, featured: [], log: [] });
  const one = frontPage([post('a', '2026-09-27T00:00:00Z')]);
  assert.equal(one.lead?.id, 'a');
  assert.deepEqual(one.featured, []);
  assert.deepEqual(one.log, []);
});

test('posts out of order and invalid options are refused, not silently mis-shown', () => {
  assert.throws(
    () => frontPage([post('old', '2026-09-01T00:00:00Z'), post('new', '2026-09-27T00:00:00Z')]),
    /sorted newest first/,
  );
  for (const bad of [{ windowDays: 0 }, { minimum: 0 }, { minimum: 1.5 }, { logSize: -1 }]) {
    assert.throws(() => frontPage([], bad), /invalid options/);
  }
});

test('homepage author order follows the editorial roster and keeps unknown authors visible', () => {
  const input = ['foxy', 'other', 'ari', 'wiz-cat', 'quill', 'desk-bot', 'aviram', 'mai']
    .map((id) => ({ id }));
  assert.deepEqual(orderHomeAuthors(input).map((author) => author.id),
    ['mai', 'aviram', 'ari', 'desk-bot', 'quill', 'foxy', 'wiz-cat', 'other']);
  assert.equal(input[0].id, 'foxy');
  assert.deepEqual(orderHomeAuthors([]), []);
});
