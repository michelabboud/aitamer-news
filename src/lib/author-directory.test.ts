import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAuthorDirectory, directoryAvatar } from './author-directory.ts';

const author = (id: string, kind = 'ai') => ({ id, data: { kind } });
const post = (id: string) => ({ data: { author: { id } } });

test('directory retains the complete roster, puts Michel first and uses the homepage editorial order', () => {
  const authors = [author('bot-x'), author('foxy'), author('ari'), author('wiz-cat', 'human'),
    author('quill'), author('desk-bot', 'bot'), author('mai'), author('aviram', 'human')];
  const original = [...authors];
  const entries = buildAuthorDirectory(authors, [post('desk-bot'), post('desk-bot'), post('ari')]);
  assert.deepEqual(entries.map(({ author }) => author.id),
    ['wiz-cat', 'mai', 'aviram', 'ari', 'desk-bot', 'quill', 'foxy', 'bot-x']);
  assert.equal(entries.find(({ author }) => author.id === 'desk-bot')?.count, 2);
  assert.equal(entries.find(({ author }) => author.id === 'ari')?.count, 1);
  assert.equal(entries.find(({ author }) => author.id === 'wiz-cat')?.count, 0);
  assert.deepEqual(authors, original);
});

test('sparse, unknown and empty rosters work without assuming Michel exists', () => {
  assert.deepEqual(buildAuthorDirectory([author('desk-bot', 'bot'), author('ari')], [])
    .map(({ author, count }) => [author.id, count]), [['ari', 0], ['desk-bot', 0]]);
  assert.deepEqual(buildAuthorDirectory([author('z-new'), author('a-new')], [post('absent')])
    .map(({ author, count }) => [author.id, count]), [['a-new', 0], ['z-new', 0]]);
  assert.deepEqual(buildAuthorDirectory([], [post('ari')]), []);
});

test('directory uses existing small avatars and the recorded Desk Bot small sibling', () => {
  for (const avatar of ['/authors/ari-avatar.jpg', '/authors/michel-avatar.webp',
    'https://bots.aitamer.news/authors/aviram-avatar-256-a8842817.webp']) {
    assert.equal(directoryAvatar(avatar), avatar);
  }
  assert.equal(directoryAvatar('https://bots.aitamer.news/authors/desk-bot-avatar-768-29791c2c.jpg'),
    'https://bots.aitamer.news/authors/desk-bot-avatar-208-803a50f0.jpg');
  const updated = 'https://bots.aitamer.news/authors/desk-bot-avatar-256-01234567.webp';
  assert.equal(directoryAvatar(updated), updated, 'a future frontmatter change must supersede the legacy override');
});

test('missing, unsafe and other explicitly oversized avatars use initials instead of a download', () => {
  for (const avatar of [undefined, '', 'javascript:alert(1)', '//evil.example/avatar.jpg',
    'https://bots.aitamer.news.evil.example/authors/avatar.jpg',
    'https://user:password@bots.aitamer.news/authors/avatar.jpg',
    '/authors/../secret.jpg', '/authors/test-avatar-768-12345678.jpg', '/authors/avatar.jpg\n',
    'https://bots.aitamer.news/authors/test-avatar-1024-12345678.jpg']) {
    assert.equal(directoryAvatar(avatar), undefined, avatar);
  }
});
