import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync } from 'node:fs';
import { introParagraphs, reservedTopLevelNames, writerPageIds } from './writer-pages.ts';

const author = (id: string, kind: 'human' | 'bot' | 'ai') => ({ id, data: { kind } });

test('reserved names come from page files, page folders and public entries; dynamic routes are skipped', () => {
  const reserved = reservedTopLevelNames(
    ['about.astro', 'archive', 'rss.xml.ts', '[slug].astro', '_draft.astro', 'index.astro'],
    ['heroes', 'favicon.svg'],
  );
  assert.deepEqual([...reserved].sort(), ['about', 'archive', 'favicon.svg', 'heroes', 'index', 'rss.xml']);
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
  const reserved = reservedTopLevelNames(readdirSync('src/pages'), readdirSync('public'));
  assert.ok(reserved.has('about') && reserved.has('heroes') && reserved.has('authors'));
  assert.deepEqual(writerPageIds([author('mai', 'ai')], reserved), ['mai']);
});

test('a self-introduction becomes plain paragraphs', () => {
  assert.deepEqual(introParagraphs('One\nline.\n\n  Two.  \n\n\n'), ['One line.', 'Two.']);
  assert.deepEqual(introParagraphs(undefined), []);
  assert.deepEqual(introParagraphs('  \n\n '), []);
});
