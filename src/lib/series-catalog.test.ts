// The series catalog reader (ADR 0054): src/data/series.json is bot-writable data, so every row is
// checked and any problem fails with a message naming the row.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseSeriesCatalog, SeriesCatalogError, SERIES_ARC_NAME_MAX_LENGTH, SERIES_DESCRIPTION_MAX_LENGTH, SERIES_HERO_ALT_MAX_LENGTH, SERIES_TITLE_MAX_LENGTH,
} from './series-catalog.ts';
import { SERIES } from '../data/series.ts';
import { SLUG_MAX_LENGTH } from '../../scripts/slug.mjs';

const row = (extra: Record<string, unknown> = {}) => ({
  slug: 'k8s-from-zero',
  title: 'Kubernetes from Zero',
  description: 'Kubernetes from the first container to a production cluster.',
  ...extra,
});
const hero = { heroImage: 'https://bots.aitamer.news/heroes/series-k8s-from-zero-0123abcd.jpg', heroAlt: 'Paper boxes stacked into a ship' };
const refuses = (data: unknown, message: RegExp) => assert.throws(() => parseSeriesCatalog(data), (error: unknown) => {
  assert.ok(error instanceof SeriesCatalogError, String(error));
  assert.match(error.message, /^series\.json: /);
  assert.match(error.message, message);
  return true;
}, JSON.stringify(data));

test('the committed catalog reads cleanly and keeps the file order', () => {
  const file = JSON.parse(readFileSync('src/data/series.json', 'utf8'));
  assert.deepEqual(SERIES.map((meta) => meta.slug), file.map((meta: { slug: string }) => meta.slug));
  assert.deepEqual(SERIES, file);
});

test('a row without a hero, and one with a hero named for its own series, are accepted and frozen', () => {
  const rows = parseSeriesCatalog([row(), row({ slug: 'second', ...hero, heroImage: 'https://bots.aitamer.news/heroes/series-second-89abcdef.jpg' })]);
  assert.deepEqual(rows[0], row());
  assert.equal(rows[1].heroAlt, hero.heroAlt);
  assert.ok(Object.isFrozen(rows) && Object.isFrozen(rows[0]));
  assert.deepEqual(parseSeriesCatalog([]), []);
  assert.equal(parseSeriesCatalog([row({ title: 't'.repeat(SERIES_TITLE_MAX_LENGTH) })]).length, 1);
  assert.equal(parseSeriesCatalog([row({ description: 'é'.repeat(SERIES_DESCRIPTION_MAX_LENGTH) })]).length, 1, 'characters, not bytes');
  assert.equal(parseSeriesCatalog([row({ title: 'Vectors, Plainly — “quotes” & accents: café, 日本語' })]).length, 1, 'ordinary punctuation and scripts pass');
});

test('the file must be an array of objects with known keys only', () => {
  refuses({ series: [] }, /must be a JSON array/);
  refuses(null, /must be a JSON array/);
  refuses([null], /row 1: must be an object/);
  refuses([[row()]], /row 1: must be an object/);
  refuses(['k8s'], /row 1: must be an object/);
  refuses([row({ order: 1 })], /row 1: unknown key "order"/);
  refuses([row({ icon: 'x', script: 'y' })], /unknown keys "icon", "script"/);
  // JSON.parse makes "__proto__" an own key, unlike an object literal: it is refused like any other.
  refuses(JSON.parse(`[${JSON.stringify(row()).slice(0, -1)},"__proto__":{"heroAlt":"x"}}]`), /row 1: unknown key "__proto__"/);
});

test('the slug is a lowercase slug, at most the site slug length, used once', () => {
  assert.equal(parseSeriesCatalog([row({ slug: 'a'.repeat(SLUG_MAX_LENGTH) })]).length, 1);
  for (const slug of ['', 'K8s', 'k8s_from', 'k8s-', '-k8s', 'k8s--zero', 'k8s zero', 'k8s/zero', 7, undefined, 'a'.repeat(SLUG_MAX_LENGTH + 1)]) {
    refuses([row({ slug })], new RegExp(`row 1: slug .* is not a lowercase slug of at most ${SLUG_MAX_LENGTH} characters`));
  }
  refuses([row(), row({ title: 'Again' })], /row 2 \("k8s-from-zero"\): the slug is already used by an earlier row/);
});

test('title, description and hero alt are trimmed plain text within their lengths', () => {
  for (const field of ['title', 'description'] as const) {
    refuses([row({ [field]: undefined })], new RegExp(`${field} must be a string`));
    refuses([row({ [field]: 42 })], new RegExp(`${field} must be a string`));
    refuses([row({ [field]: '   ' })], new RegExp(`${field} is empty`));
    refuses([row({ [field]: ' padded' })], new RegExp(`${field} has leading or trailing spaces`));
    for (const bad of ['two\nlines', 'tab\there', 'nul\u0000', 'bell\u0007', 'c1\u0085', '<b>bold</b>', 'a > b', 'rev\u202eersed', 'zero\u200bwidth', 'rtl\u200fmark', 'iso\u2066late', 'bom\ufeffmid', 'line\u2028sep', 'soft\u00adhyphen']) {
      refuses([row({ [field]: bad })], new RegExp(`${field} must be plain text`));
    }
  }
  refuses([row({ title: 't'.repeat(SERIES_TITLE_MAX_LENGTH + 1) })], /title is longer than 80 characters/);
  refuses([row({ description: 'd'.repeat(SERIES_DESCRIPTION_MAX_LENGTH + 1) })], /description is longer than 240 characters/);
  refuses([row({ ...hero, heroAlt: 'a'.repeat(SERIES_HERO_ALT_MAX_LENGTH + 1) })], /heroAlt is longer than 200 characters/);
  refuses([row({ ...hero, heroAlt: '' })], /heroAlt is empty/);
});

const foundations = { name: 'Foundations', start: 1, end: 12 };
const certification = { name: 'Certification', start: 13 };

test('arcs are optional, and a plan is frozen with an open final arc allowed', () => {
  const rows = parseSeriesCatalog([row({ arcs: [foundations, certification] }), row({ slug: 'second', title: 'Second' })]);
  assert.deepEqual(rows[0].arcs, [foundations, certification]);
  assert.equal(rows[1].arcs, undefined);
  assert.ok(Object.isFrozen(rows[0].arcs) && Object.isFrozen(rows[0].arcs![0]));
  assert.equal(parseSeriesCatalog([row({ arcs: [{ name: 'A'.repeat(SERIES_ARC_NAME_MAX_LENGTH), start: 1 }] })]).length, 1);
});

test('an arc plan must be a contiguous list of plain-text arcs starting at lesson 1', () => {
  refuses([row({ arcs: 'Foundations' })], /arcs must be a non-empty array/);
  refuses([row({ arcs: [] })], /arcs must be a non-empty array/);
  refuses([row({ arcs: [null] })], /arcs\[1\]: must be an object/);
  refuses([row({ arcs: [{ ...foundations, size: 12 }] })], /arcs\[1\]: unknown key "size"/);
  refuses([row({ arcs: [{ name: ' padded', start: 1, end: 1 }] })], /arcs\[1\]: name has leading or trailing spaces/);
  refuses([row({ arcs: [{ name: 'two\nlines', start: 1 }] })], /arcs\[1\]: name must be plain text/);
  refuses([row({ arcs: [{ name: 'A'.repeat(SERIES_ARC_NAME_MAX_LENGTH + 1), start: 1 }] })], new RegExp(`name is longer than ${SERIES_ARC_NAME_MAX_LENGTH} characters`));
  for (const start of [0, -1, 1.5, '1', true]) {
    refuses([row({ arcs: [{ name: 'Foundations', start }] })], /arcs\[1\]: start must be a positive integer/);
  }
  refuses([row({ arcs: [{ name: 'Foundations', start: 1, end: 0 }] })], /arcs\[1\]: end must be an integer from start onward/);
  refuses([row({ arcs: [{ name: 'Foundations', start: 1, end: '12' }] })], /arcs\[1\]: end must be an integer from start onward/);
  refuses([row({ arcs: [{ name: 'Foundations', start: 2, end: 4 }] })], /arcs must start at lesson 1/);
  refuses([row({ arcs: [foundations, { name: 'Next', start: 14, end: 15 }] })], /arcs\[2\] \("Next"\): starts at 14, leaving a gap after lesson 12/);
  refuses([row({ arcs: [foundations, { name: 'Next', start: 12, end: 15 }] })], /arcs\[2\] \("Next"\): overlaps the previous arc, which ends at lesson 12/);
  refuses([row({ arcs: [{ name: 'Open', start: 1 }, foundations] })], /arcs\[1\] \("Open"\): an arc without an end has to be the last one/);
  refuses([row({ arcs: [foundations, { name: 'Foundations', start: 13 }] })], /arcs\[2\] \("Foundations"\): the name is already used/);
});

test('a hero is both fields or neither, on the media host, named for its own series', () => {
  refuses([row({ heroImage: hero.heroImage })], /heroImage and heroAlt go together/);
  refuses([row({ heroAlt: hero.heroAlt })], /heroImage and heroAlt go together/);
  for (const heroImage of [
    '', 'http://bots.aitamer.news/heroes/series-k8s-from-zero-0123abcd.jpg',
    'https://evil.example/heroes/series-k8s-from-zero-0123abcd.jpg',
    'https://bots.aitamer.news.evil.example/heroes/series-k8s-from-zero-0123abcd.jpg',
    'https://bots.aitamer.news/other/series-k8s-from-zero-0123abcd.jpg',
    'https://bots.aitamer.news/heroes/series-k8s-from-zero-0123abcd.png',
    'https://bots.aitamer.news/heroes/series-k8s-from-zero-0123ABCD.jpg',
    'https://bots.aitamer.news/heroes/series-k8s-from-zero.jpg',
    'https://bots.aitamer.news/heroes/series-k8s-from-zero-0123abcd.jpg?x=1',
    'https://bots.aitamer.news/heroes/series-k8s-from-zero-0123abcd.jpg ',
    'javascript:alert(1)', null, 3,
  ]) refuses([row({ ...hero, heroImage })], /heroImage must be https:\/\/bots\.aitamer\.news\/heroes\/series-k8s-from-zero-<8 hex>\.jpg/);
  refuses([row({ ...hero, heroImage: 'https://bots.aitamer.news/heroes/series-grok-bot-a478a6b9.jpg' })], /heroImage is named for series "grok-bot", not "k8s-from-zero"/);
});
