import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HABITATS,
  HABITAT_META,
  FRONTMATTER_SECTIONS,
  LEGACY_SECTIONS,
  SECTION_ALIASES,
  isHabitat,
  normalizeSection,
  isLegacySection,
  sitemapIncludes,
} from './habitats.ts';

test('every retired section folds into a real habitat', () => {
  for (const [old, habitat] of Object.entries(LEGACY_SECTIONS)) {
    assert.ok(isHabitat(habitat), `${old} → ${habitat}`);
    assert.ok(!isHabitat(old), `${old} must not also be a live habitat`);
  }
});

test('habitat codes run H1–H6 in list order', () => {
  assert.deepEqual(
    HABITATS.map((h) => HABITAT_META[h].code),
    ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
  );
});

test('the retired habitats are accepted in frontmatter and filed where they folded', () => {
  assert.deepEqual(
    Object.fromEntries(Object.keys(SECTION_ALIASES).map((a) => [a, normalizeSection(a)])),
    { creative: 'tools', infra: 'devops', policy: 'general', opinion: 'general' },
  );
  for (const h of HABITATS) assert.equal(normalizeSection(h), h);
  assert.deepEqual([...FRONTMATTER_SECTIONS], [...HABITATS, 'creative', 'infra', 'policy', 'opinion']);
  // An alias is never also a habitat, or a writer could not tell which one they meant.
  for (const alias of Object.keys(SECTION_ALIASES)) assert.ok(!isHabitat(alias), alias);
});

test('every frontmatter alias also has a legacy URL, so its old section page still resolves', () => {
  for (const [alias, habitat] of Object.entries(SECTION_ALIASES)) assert.equal(LEGACY_SECTIONS[alias], habitat, alias);
});

test('isLegacySection ignores inherited object keys', () => {
  assert.equal(isLegacySection('top'), true);
  assert.equal(isLegacySection('toString'), false);
  assert.equal(isLegacySection('models'), false);
});

test('sitemap drops legacy redirect pages only', () => {
  assert.equal(sitemapIncludes('https://aitamer.news/section/top/'), false);
  assert.equal(sitemapIncludes('https://aitamer.news/aitamer-news/section/databases/'), false);
  assert.equal(sitemapIncludes('https://aitamer.news/section/creative/'), false);
  assert.equal(sitemapIncludes('https://aitamer.news/section/devops/'), true);
  assert.equal(sitemapIncludes('https://aitamer.news/posts/top/'), true);
  assert.equal(sitemapIncludes('https://aitamer.news/'), true);
});
