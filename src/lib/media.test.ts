import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SOCIAL_IMAGE, MEDIA_ORIGIN, heroUrl, isOwnHeroUrl, resolveMedia, shareImageUrl, visualHeroSources, webpHeroUrl } from './media.ts';
import { WEBP_HERO_JPEGS } from './hero-webp-catalog.ts';

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

test('bot heroes require the own slug and an eight-character lowercase hex hash on the exact host', () => {
  const own = 'https://bots.aitamer.news/heroes/a-0123abcd.jpg';
  assert.equal(isOwnHeroUrl('a', own), true);
  for (const value of [
    'https://bots.aitamer.news/heroes/a.jpg',
    'https://bots.aitamer.news/heroes/b-0123abcd.jpg',
    'https://bots.aitamer.news/heroes/a-0123ABCD.jpg',
    'https://bots.aitamer.news/heroes/a-0123abc.jpg',
    'https://bots.aitamer.news/heroes/a-0123abcde.jpg',
    'https://bots.aitamer.news/heroes/a-0123abcd\n.jpg',
    'https://bots.aitamer.news/heroes/a-0123abcd\r.jpg',
    `${own}?v=2`, `${own}#top`, `${own}/`,
    'https://bots.aitamer.news.evil.example/heroes/a-0123abcd.jpg',
    'https://bots.aitamer.news@evil.example/heroes/a-0123abcd.jpg',
    'https://user@bots.aitamer.news/heroes/a-0123abcd.jpg',
    'https://bots.aitamer.news:443/heroes/a-0123abcd.jpg',
    'https://BOTS.aitamer.news/heroes/a-0123abcd.jpg',
    'http://bots.aitamer.news/heroes/a-0123abcd.jpg',
    'https://bots.aitamer.news/heroes/%61-0123abcd.jpg',
    'https://bots.aitamer.news/posts/a-0123abcd.jpg',
  ]) assert.equal(isOwnHeroUrl('a', value), false, value);
});

test('local media overrides handle the bot origin while leaving lookalikes untouched', () => {
  const hero = 'https://bots.aitamer.news/heroes/a-0123abcd.jpg';
  assert.equal(resolveMedia(hero, '/media-local/'), '/media-local/heroes/a-0123abcd.jpg');
  assert.equal(resolveMedia('https://bots.aitamer.news', '/media-local/'), '/media-local');
  assert.equal(resolveMedia(hero), hero);
  for (const url of [
    'https://bots.aitamer.news.evil.example/heroes/a-0123abcd.jpg',
    'https://bots.aitamer.news@evil.example/heroes/a-0123abcd.jpg',
    'https://user@bots.aitamer.news/heroes/a-0123abcd.jpg',
  ]) assert.equal(resolveMedia(url, '/media-local'), url);
});

test('a bot hero may be the WebP of its hashed JPEG, on the bot host only, with the same strict form', () => {
  assert.equal(isOwnHeroUrl('a', 'https://bots.aitamer.news/heroes/a-0123abcd.webp'), true);
  assert.equal(isOwnHeroUrl('a', 'https://bots.aitamer.news/heroes/a-0123abcd.jpg'), true);
  for (const value of [
    'https://media.aitamer.news/heroes/a-0123abcd.webp',
    'https://media.aitamer.news/heroes/a.webp',
    'https://bots.aitamer.news/heroes/a.webp',
    'https://bots.aitamer.news/heroes/b-0123abcd.webp',
    'https://bots.aitamer.news/heroes/a-0123ABCD.webp',
    'https://bots.aitamer.news/heroes/a-0123abc.webp',
    'https://bots.aitamer.news/heroes/a-0123abcd.WEBP',
    'https://bots.aitamer.news/heroes/a-0123abcd.png',
    'https://bots.aitamer.news/heroes/a-0123abcd.webp?v=2',
    'https://bots.aitamer.news.evil.example/heroes/a-0123abcd.webp',
    'http://bots.aitamer.news/heroes/a-0123abcd.webp',
  ]) assert.equal(isOwnHeroUrl('a', value), false, value);
});

test('shareImageUrl gives a bot WebP hero its JPEG twin and leaves everything else alone', () => {
  assert.equal(shareImageUrl('https://bots.aitamer.news/heroes/a-b-0123abcd.webp'), 'https://bots.aitamer.news/heroes/a-b-0123abcd.jpg');
  for (const value of [
    'https://bots.aitamer.news/heroes/a-0123abcd.jpg',
    'https://media.aitamer.news/heroes/a-0123abcd.webp',
    'https://media.aitamer.news/heroes/a.jpg',
    'https://bots.aitamer.news/heroes/a.webp',
    'https://bots.aitamer.news.evil.example/heroes/a-0123abcd.webp',
    '/covers/models.svg',
    DEFAULT_SOCIAL_IMAGE,
  ]) assert.equal(shareImageUrl(value), value, value);
});

test('every accepted bot WebP slug keeps a JPEG share image, including repeated and trailing hyphens', () => {
  for (const slug of ['a', 'a--b', 'a-', 'a--']) {
    const hero = `https://bots.aitamer.news/heroes/${slug}-0123abcd.webp`;
    assert.equal(isOwnHeroUrl(slug, hero), true);
    const share = shareImageUrl(hero);
    assert.equal(share, `https://bots.aitamer.news/heroes/${slug}-0123abcd.jpg`);
    assert.equal(resolveMedia(share, '/media-local'), `/media-local/heroes/${slug}-0123abcd.jpg`);
  }
});

test('verified hero pairs on either host select WebP and keep their exact JPEG fallback', () => {
  for (const origin of ['https://media.aitamer.news', 'https://bots.aitamer.news']) {
    const jpeg = WEBP_HERO_JPEGS.find((url) => url.startsWith(`${origin}/`));
    assert.ok(jpeg);
    const webp = jpeg.replace(/\.jpg$/, '.webp');
    assert.equal(webpHeroUrl(jpeg), webp);
    assert.deepEqual(visualHeroSources(jpeg), { src: jpeg, webp });
    assert.deepEqual(visualHeroSources(jpeg, '/media-local/'), {
      src: jpeg.replace(origin, '/media-local'),
      webp: webp.replace(origin, '/media-local'),
    });
  }
  assert.deepEqual(visualHeroSources('https://media.aitamer.news/heroes/welcome-to-aitamer.jpg'), {
    src: 'https://media.aitamer.news/heroes/welcome-to-aitamer.jpg',
    webp: 'https://media.aitamer.news/heroes/welcome-to-aitamer.webp',
  });
});

test('unknown JPEGs and unrelated images never infer an unverified WebP', () => {
  for (const src of [
    'https://media.aitamer.news/heroes/future-quality-fallback-0123abcd.jpg',
    'https://bots.aitamer.news/heroes/future-quality-fallback-0123abcd.jpg',
    'https://media.aitamer.news.evil.example/heroes/welcome-to-aitamer.jpg',
    'https://user@media.aitamer.news/heroes/welcome-to-aitamer.jpg',
    'https://media.aitamer.news/heroes/welcome-to-aitamer.jpg?v=1',
    '/covers/models.svg', DEFAULT_SOCIAL_IMAGE,
  ]) {
    assert.equal(webpHeroUrl(src), undefined);
    assert.deepEqual(visualHeroSources(src), { src });
  }
});

test('an explicit valid bot WebP selects its JPEG fallback before local rewriting', () => {
  const webp = 'https://bots.aitamer.news/heroes/a--b--0123abcd.webp';
  assert.equal(webpHeroUrl(webp), webp);
  assert.deepEqual(visualHeroSources(webp, '/media-local'), {
    src: '/media-local/heroes/a--b--0123abcd.jpg',
    webp: '/media-local/heroes/a--b--0123abcd.webp',
  });
});
