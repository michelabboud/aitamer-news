import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { introParagraphs, orderWriterCards, reservedTopLevelNames, splitPoems, writerPageIds, isFeaturedWriter, writerAuthorPath, writerRole, writerNoun, personalOpinionDisclosure } from './writer-pages.ts';

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

test('existing AI writers get own-name pages while unfeatured humans and bots stay profiles', () => {
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

test('writer cards follow the editor\'s order; unlisted writers come last in id order; input is untouched', () => {
  const input = [{ id: 'ari' }, { id: 'zed' }, { id: 'foxy' }, { id: 'mai' }, { id: 'quill' }, { id: 'abe' }];
  assert.deepEqual(orderWriterCards(input).map((w) => w.id), ['mai', 'quill', 'foxy', 'ari', 'abe', 'zed']);
  assert.equal(input[0].id, 'ari');
  assert.deepEqual(orderWriterCards([]), []);
});


test('human writers opt in, AI writers default in and may opt out, bots never get own-name pages', () => {
  const writers = [
    author('mai', 'ai'),
    { id: 'new-human', data: { kind: 'human' as const, featured: true } },
    author('wiz-cat', 'human'),
    { id: 'private-ai', data: { kind: 'ai' as const, featured: false } },
    { id: 'desk-bot', data: { kind: 'bot' as const, featured: true } },
  ];
  assert.deepEqual(writers.filter(isFeaturedWriter).map((a) => a.id), ['mai', 'new-human']);
  assert.deepEqual(writerPageIds(writers, new Set()), ['mai', 'new-human']);
  assert.deepEqual(writers.map(writerAuthorPath), ['/mai/', '/new-human/', '/authors/wiz-cat/', '/authors/private-ai/', '/authors/desk-bot/']);
  assert.deepEqual(writers.map(writerRole), ['Featured writer', 'Human writer', 'Human editor', 'Featured writer', 'News bot']);
  assert.equal(writerNoun(writers[1]), 'a human writer');
  assert.equal(writerNoun(writers[2]), 'a human editor');
});

test('an opted-in human writer receives the same route collision protection as an AI writer', () => {
  assert.throws(
    () => writerPageIds([{ id: 'about', data: { kind: 'human', featured: true } }], new Set(['about'])),
    /about would collide/,
  );
  assert.deepEqual(writerPageIds([{ id: 'about', data: { kind: 'human' } }], new Set(['about'])), []);
});

test('editorial ranks insert a human immediately after Mai while preserving all existing AI positions', () => {
  const input = [
    { id: 'ari' }, { id: 'quill' }, { id: 'zed' }, { id: 'foxy' }, { id: 'mai' },
    { id: 'new-human', data: { writerOrder: 1 } }, { id: 'abe' },
  ];
  assert.deepEqual(orderWriterCards(input).map((a) => a.id), ['mai', 'new-human', 'quill', 'foxy', 'ari', 'abe', 'zed']);
  assert.equal(input[0].id, 'ari');
  assert.deepEqual(orderWriterCards([
    { id: 'mai', data: { writerOrder: 25 } }, { id: 'foxy' }, { id: 'quill' },
  ]).map((a) => a.id), ['quill', 'foxy', 'mai']);
  assert.deepEqual(orderWriterCards([
    { id: 'z', data: { writerOrder: 0 } }, { id: 'a', data: { writerOrder: 0 } },
  ]).map((a) => a.id), ['a', 'z']);
});

test('opinion disclosure defaults off and explicit opt-in is reusable across author kinds and posts', () => {
  assert.equal(personalOpinionDisclosure(undefined), undefined);
  assert.equal(personalOpinionDisclosure({ data: { name: 'Human author' } }), undefined);
  assert.equal(personalOpinionDisclosure({ data: { name: 'AI writer', personalOpinion: false } }), undefined);
  for (const name of ['A human contributor', 'A named AI writer']) {
    const opinion = personalOpinionDisclosure({ data: { name, personalOpinion: true } });
    assert.equal(opinion?.label, 'Personal opinion');
    assert.ok(opinion?.disclaimer.includes(`${name}’s personal views`));
    assert.ok(opinion?.disclaimer.includes('do not necessarily reflect AI Tamer'));
    assert.ok(opinion?.disclaimer.includes('sourcing and correction standards'));
  }
});
