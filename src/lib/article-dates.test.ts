import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sitemapEntry } from '../../scripts/sitemap-data.mjs';
import { effectiveModified, lastChange } from './article-dates.ts';

const pub = new Date('2026-09-01T10:00:00Z');
const upd = new Date('2026-09-05T10:00:00Z');
const fix1 = new Date('2026-09-03T10:00:00Z');
const fix2 = new Date('2026-09-09T10:00:00Z');

test('an untouched story has no last change, and its effective date is its publish date', () => {
  assert.equal(lastChange({ pubDate: pub, corrections: [] }), undefined);
  assert.equal(lastChange({ pubDate: pub }), undefined);
  assert.equal(effectiveModified({ pubDate: pub, corrections: [] }).toISOString(), pub.toISOString());
});

test('updatedDate alone is the last change, exactly as written', () => {
  assert.equal(lastChange({ pubDate: pub, updatedDate: upd, corrections: [] })?.toISOString(), upd.toISOString());
});

test('a correction alone is the last change', () => {
  assert.equal(lastChange({ pubDate: pub, corrections: [{ date: fix1 }] })?.toISOString(), fix1.toISOString());
});

test('the newest of the update and every correction wins, whatever the order', () => {
  const data = { pubDate: pub, updatedDate: upd, corrections: [{ date: fix2 }, { date: fix1 }] };
  assert.equal(lastChange(data)?.toISOString(), fix2.toISOString());
  assert.equal(effectiveModified(data).toISOString(), fix2.toISOString());
  const older = { pubDate: pub, updatedDate: upd, corrections: [{ date: fix1 }] };
  assert.equal(lastChange(older)?.toISOString(), upd.toISOString());
});

test('a date earlier than publication is a typo, not a change: every surface ignores it', () => {
  const early = new Date('2026-08-01T00:00:00Z');
  assert.equal(lastChange({ pubDate: pub, updatedDate: early, corrections: [] }), undefined);
  assert.equal(lastChange({ pubDate: pub, corrections: [{ date: early }] }), undefined);
  assert.equal(lastChange({ pubDate: pub, updatedDate: early, corrections: [{ date: fix1 }] })?.toISOString(), fix1.toISOString());
  // A date equal to publication still counts as set.
  assert.equal(lastChange({ pubDate: pub, updatedDate: pub, corrections: [] })?.toISOString(), pub.toISOString());
});

test('the effective date is never earlier than the publish date', () => {
  const early = { pubDate: pub, updatedDate: new Date('2026-08-01T00:00:00Z'), corrections: [] };
  assert.equal(effectiveModified(early).toISOString(), pub.toISOString());
});

test('page, JSON-LD and sitemap agree: effectiveModified equals the sitemap lastmod', () => {
  const now = new Date('2026-12-01T00:00:00Z');
  const cases = [
    { pubDate: pub, corrections: [] },
    { pubDate: pub, updatedDate: upd, corrections: [] },
    { pubDate: pub, corrections: [{ date: fix2 }] },
    { pubDate: pub, updatedDate: upd, corrections: [{ date: fix2 }, { date: fix1 }] },
    { pubDate: pub, updatedDate: new Date('2026-08-01T00:00:00Z'), corrections: [] },
  ];
  for (const data of cases) {
    assert.equal(effectiveModified(data).toISOString(), sitemapEntry('x', data, now).lastmod?.toISOString());
  }
});
