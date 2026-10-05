import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authorSchema } from '../content/author-schema.ts';
import { isFeaturedWriter, personalOpinionDisclosure } from './writer-pages.ts';

test('author schema preserves old profiles and defaults opinion off for human and AI authors', () => {
  for (const kind of ['human', 'ai', 'bot'] as const) {
    const data = authorSchema.parse({ name: 'Existing author', kind, bio: 'Biography' });
    assert.equal(data.featured, undefined);
    assert.equal(data.writerOrder, undefined);
    assert.equal(data.personalOpinion, false);
    assert.equal(isFeaturedWriter({ id: 'existing', data }), kind === 'ai');
    assert.equal(personalOpinionDisclosure({ data }), undefined);
  }
});

test('a featured human author can enable personal opinion without changing author identity', () => {
  const data = authorSchema.parse({
    name: 'New contributor', kind: 'human', bio: 'Biography',
    featured: true, writerOrder: 1, personalOpinion: true,
    portrait: '/authors/new-contributor.jpg', portraitAlt: 'A paper collage portrait.',
  });
  assert.equal(data.kind, 'human');
  assert.equal(isFeaturedWriter({ id: 'new-contributor', data }), true);
  assert.equal(data.writerOrder, 1);
  assert.equal(personalOpinionDisclosure({ data })?.label, 'Personal opinion');
});

test('author schema refuses nonboolean toggles and invalid editorial ranks', () => {
  const base = { name: 'Author', kind: 'human', bio: 'Biography' };
  for (const extra of [
    { featured: 'true' }, { personalOpinion: 'false' },
    { writerOrder: -1 }, { writerOrder: 1.5 }, { writerOrder: '1' },
    { writerOrder: Infinity }, { writerOrder: NaN },
  ]) {
    assert.equal(authorSchema.safeParse({ ...base, ...extra }).success, false, JSON.stringify(extra));
  }
});

test('featured portraits still require alt text and a house author-image path', () => {
  const base = { name: 'Author', kind: 'human', bio: 'Biography', featured: true };
  assert.equal(authorSchema.safeParse({ ...base, portrait: '/authors/author.jpg' }).success, false);
  assert.equal(authorSchema.safeParse({ ...base, portraitAlt: 'A portrait.' }).success, false);
  assert.equal(authorSchema.safeParse({ ...base, portrait: '/heroes/author.jpg', portraitAlt: 'A portrait.' }).success, false);
});


test('author website is optional and rejects script URLs, HTTP and embedded credentials', () => {
  const base = { name: 'Author', kind: 'human', bio: 'Biography' };
  assert.equal(authorSchema.parse({ ...base, website: 'https://gizmojack.com/' }).website, 'https://gizmojack.com/');
  for (const website of ['javascript:alert(1)', 'http://example.com/', 'https://user:password@example.com/', 'not a URL']) {
    assert.equal(authorSchema.safeParse({ ...base, website }).success, false, website);
  }
});
