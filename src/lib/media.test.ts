import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SOCIAL_IMAGE, MEDIA_ORIGIN, heroUrl, isOwnHeroUrl, resolveMedia } from './media.ts';

test('heroUrl builds the full R2 URL for a slug', () => {
  assert.equal(heroUrl('grok-4-7'), 'https://media.aitamer.news/heroes/grok-4-7.jpg');
});

test('resolveMedia leaves a non-media URL untouched, override set', () => {
  const url = 'https://elsewhere.example/x.jpg';
  assert.equal(resolveMedia(url, '/media-local'), url);
});

test('resolveMedia rewrites a media URL to the override base', () => {
  assert.equal(
    resolveMedia(`${MEDIA_ORIGIN}/heroes/grok-4-7.jpg`, '/media-local'),
    '/media-local/heroes/grok-4-7.jpg',
  );
});

test('resolveMedia never introduces a double slash when the override has a trailing slash', () => {
  assert.equal(
    resolveMedia(`${MEDIA_ORIGIN}/heroes/grok-4-7.jpg`, '/media-local/'),
    '/media-local/heroes/grok-4-7.jpg',
  );
});

test('resolveMedia rewrites the bare media origin (no path) to the override with no trailing slash', () => {
  assert.equal(resolveMedia(MEDIA_ORIGIN, '/media-local/'), '/media-local');
});

test('resolveMedia leaves a /heroes/ repo-relative path untouched, even with an override set', () => {
  const path = '/heroes/grok-4-7.jpg';
  assert.equal(resolveMedia(path, '/media-local'), path);
});

test('resolveMedia leaves a house-cover SVG path untouched', () => {
  const path = '/covers/models.svg';
  assert.equal(resolveMedia(path, '/media-local'), path);
});

test('resolveMedia does not treat a look-alike host as media (boundary check)', () => {
  const url = 'https://media.aitamer.news.evil.example/heroes/x.jpg';
  assert.equal(resolveMedia(url, '/media-local'), url);
});

test('empty override is identity, even for a media URL', () => {
  const url = `${MEDIA_ORIGIN}/heroes/grok-4-7.jpg`;
  assert.equal(resolveMedia(url, ''), url);
  assert.equal(resolveMedia(url, undefined), url);
});

test('with no override argument at all, resolveMedia reads no env under the Node test runner and is identity', () => {
  // import.meta.env does not exist outside Vite/Astro; the default parameter must not throw.
  const url = `${MEDIA_ORIGIN}/heroes/grok-4-7.jpg`;
  assert.equal(resolveMedia(url), url);
});

test('the default social image is the share card on the media host, and follows the local override', () => {
  assert.equal(DEFAULT_SOCIAL_IMAGE, 'https://media.aitamer.news/site/share-card.jpg');
  assert.equal(resolveMedia(DEFAULT_SOCIAL_IMAGE, '/media-local'), '/media-local/site/share-card.jpg');
});

test('isOwnHeroUrl accepts the legacy URL and the content-addressed one, for the post\'s own slug only', () => {
  assert.equal(isOwnHeroUrl('a', heroUrl('a')), true);
  assert.equal(isOwnHeroUrl('a', 'https://media.aitamer.news/heroes/a-0123abcd.jpg'), true);
  assert.equal(isOwnHeroUrl('a-0123abcd', heroUrl('a-0123abcd')), true);
  for (const value of [
    'https://media.aitamer.news/heroes/b-0123abcd.jpg',
    'https://media.aitamer.news/heroes/a-0123ABCD.jpg',
    'https://media.aitamer.news/heroes/a-0123abc.jpg',
    'https://media.aitamer.news/heroes/a-0123abcde.jpg',
    'https://media.aitamer.news/heroes/a-0123abcd.png',
    'https://media.aitamer.news/heroes/a-0123abcd.jpg?x=1',
    'http://media.aitamer.news/heroes/a-0123abcd.jpg',
    'https://media.aitamer.news/heroes/a-.jpg',
    '/heroes/a-0123abcd.jpg',
    '',
  ]) {
    assert.equal(isOwnHeroUrl('a', value), false, value);
  }
  assert.equal(isOwnHeroUrl('a', undefined), false);
  assert.equal(isOwnHeroUrl('a', 7), false);
});
