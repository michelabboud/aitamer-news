import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LISTING_PAGE_SIZE, listingTitle, withTrailingSlash } from './listing.ts';

test('a listing page fills whole rows of two and of three cards', () => {
  assert.equal(LISTING_PAGE_SIZE % 6, 0);
});

test('page 1 carries the plain name; later pages say which page; a bad page number is refused', () => {
  assert.equal(listingTitle('News', 1), 'News');
  assert.equal(listingTitle('Columns', 3), 'Columns · page 3');
  for (const bad of [0, -1, 1.5, Number.NaN]) assert.throws(() => listingTitle('News', bad), /whole number/);
});

test('page links end in exactly one slash, whatever Astro hands over', () => {
  assert.equal(withTrailingSlash('/news'), '/news/');
  assert.equal(withTrailingSlash('/news/2/'), '/news/2/');
  assert.equal(withTrailingSlash('/base/columns//'), '/base/columns/');
  assert.equal(withTrailingSlash('/news?x=1#top'), '/news/?x=1#top');
  assert.equal(withTrailingSlash('/'), '/');
});
