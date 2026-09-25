import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HABITATS,
  HABITAT_META,
  LEGACY_SECTIONS,
  isHabitat,
  isLegacySection,
  sitemapIncludes,
} from './habitats.ts';

test('every retired section folds into a real habitat', () => {
  for (const [old, habitat] of Object.entries(LEGACY_SECTIONS)) {
    assert.ok(isHabitat(habitat), `${old} → ${habitat}`);
    assert.ok(!isHabitat(old), `${old} must not also be a live habitat`);
  }
});

test('habitat codes run H1–H7 in list order', () => {
  assert.deepEqual(
    HABITATS.map((h) => HABITAT_META[h].code),
    ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'],
  );
});

test('isLegacySection ignores inherited object keys', () => {
  assert.equal(isLegacySection('top'), true);
  assert.equal(isLegacySection('toString'), false);
  assert.equal(isLegacySection('models'), false);
});

test('sitemap drops legacy redirect pages only', () => {
  assert.equal(sitemapIncludes('https://aitamer.news/section/top/'), false);
  assert.equal(sitemapIncludes('https://aitamer.news/aitamer-news/section/databases/'), false);
  assert.equal(sitemapIncludes('https://aitamer.news/section/creative/'), true);
  assert.equal(sitemapIncludes('https://aitamer.news/posts/top/'), true);
  assert.equal(sitemapIncludes('https://aitamer.news/'), true);
});
