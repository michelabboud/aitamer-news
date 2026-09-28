import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { introParagraphs, reservedTopLevelNames, splitPoems, writerPageIds } from './writer-pages.ts';

const author = (id: string, kind: 'human' | 'bot' | 'ai') => ({ id, data: { kind } });

test('reserved names come from page files, page folders and public entries; dynamic routes are skipped', () => {
  const reserved = reservedTopLevelNames(
    ['about.astro', 'archive', 'rss.xml.ts', '[slug].astro', '_draft.astro', 'index.astro'],
    ['heroes', 'favicon.svg'],
  );
  assert.deepEqual([...reserved].sort(), ['about', 'archive', 'favicon.svg', 'heroes', 'index', 'rss.xml']);
});

test('the first segment of every _redirects source is reserved; comments and blank lines are not', () => {
  const reserved = reservedTopLevelNames([], [], '# a comment\n\n/heroes/a.jpg https://media.aitamer.news/heroes/a.jpg 301\n/section/old/ /section/new/ 301\n');
  assert.deepEqual([...reserved].sort(), ['heroes', 'section']);
});

test('only AI writers get a page at their own name', () => {
  const ids = writerPageIds([author('mai', 'ai'), author('desk-bot', 'bot'), author('wiz-cat', 'human')], new Set(['about']));
  assert.deepEqual(ids, ['mai']);
});

test('a writer whose name is already a page or a public folder fails the build, naming it', () => {
  assert.throws(
    () => writerPageIds([author('about', 'ai'), author('heroes', 'ai'), author('mai', 'ai')], new Set(['about', 'heroes'])),
    /about, heroes would collide/,
  );
});

test('the real site: no writer collides with a page or a public entry', () => {
  const reserved = reservedTopLevelNames(readdirSync('src/pages'), readdirSync('public'), readFileSync('public/_redirects', 'utf8'));
  // `heroes` stays taken after public/heroes/ moved to R2: its old URLs redirect (ADR 0020).
  assert.ok(reserved.has('about') && reserved.has('heroes') && reserved.has('authors'));
  assert.deepEqual(writerPageIds([author('mai', 'ai')], reserved), ['mai']);
});

test('a self-introduction becomes plain paragraphs', () => {
  assert.deepEqual(introParagraphs('One\nline.\n\n  Two.  \n\n\n'), ['One line.', 'Two.']);
  assert.deepEqual(introParagraphs(undefined), []);
  assert.deepEqual(introParagraphs('  \n\n '), []);
});

test('a writer\'s poems are split from the rest, each list keeping its order', () => {
  const post = (id: string, tags: string[]) => ({ id, data: { tags } });
  const [poems, pieces] = splitPoems([post('a', ['llm']), post('p1', ['poem']), post('b', []), post('p2', ['night', 'poem'])]);
  assert.deepEqual(poems.map((p) => p.id), ['p1', 'p2']);
  assert.deepEqual(pieces.map((p) => p.id), ['a', 'b']);
  assert.deepEqual(splitPoems([]), [[], []]);
  // Only the exact tag counts.
  assert.deepEqual(splitPoems([post('x', ['poems', 'poetry'])])[0], []);
});
