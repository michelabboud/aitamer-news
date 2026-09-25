import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postSlugOf, sitemapEntry } from './sitemap-data.mjs';

const now = new Date('2026-09-25T12:00:00Z');

test('withdrawn, draft and scheduled posts are left out of the sitemap', () => {
  assert.equal(sitemapEntry('a', { pubDate: new Date('2026-09-24T09:00:00Z') }, now).listed, true);
  assert.equal(
    sitemapEntry('b', { pubDate: new Date('2026-09-24T09:00:00Z'), withdrawn: { date: '2026-09-25', reason: 'x' } }, now).listed,
    false,
  );
  assert.equal(sitemapEntry('c', { pubDate: new Date('2026-09-24T09:00:00Z'), draft: true }, now).listed, false);
  assert.equal(sitemapEntry('d', { pubDate: new Date('2026-09-26T08:00:00Z') }, now).listed, false);
});

test('last change is the newest of publish, update and correction dates', () => {
  const entry = sitemapEntry(
    'a',
    {
      pubDate: new Date('2026-09-20T09:00:00Z'),
      updatedDate: new Date('2026-09-22T00:00:00Z'),
      corrections: [{ date: new Date('2026-09-23T00:00:00Z'), text: 'fixed' }, { date: '2026-09-21', text: 'x' }],
    },
    now,
  );
  assert.equal(entry.lastmod?.toISOString(), '2026-09-23T00:00:00.000Z');
  assert.equal(sitemapEntry('b', { pubDate: 'not a date' }, now).lastmod, null);
});

test('only post URLs map to a slug', () => {
  assert.equal(postSlugOf('https://aitamer.news/posts/grok-4-7/'), 'grok-4-7');
  assert.equal(postSlugOf('https://aitamer.news/section/tools/'), null);
});
