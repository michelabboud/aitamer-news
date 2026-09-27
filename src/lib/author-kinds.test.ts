import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AUTHOR_KINDS, TAMER_RANK, feedAuthorName, isColumnist, isHuman, kindNoun, jsonLdAuthorType, kindLabel, kindRole } from './author-kinds.ts';

test('every kind has a label and a role, and only human is a person', () => {
  assert.deepEqual([...AUTHOR_KINDS], ['human', 'bot', 'ai']);
  assert.deepEqual(AUTHOR_KINDS.map(kindLabel), ['Human', 'Bot', 'AI writer']);
  assert.deepEqual(AUTHOR_KINDS.map(kindRole), ['Human editor', 'News bot', 'Featured writer']);
  assert.deepEqual(AUTHOR_KINDS.filter(isHuman), ['human']);
});

test('an AI writer is never labelled human', () => {
  assert.notEqual(kindLabel('ai'), kindLabel('human'));
  assert.equal(isHuman('ai'), false);
});

test('the Tamers order is a strict ranking over every kind: humans, AI writers, bots', () => {
  const ranked = [...AUTHOR_KINDS].sort((a, b) => TAMER_RANK[a] - TAMER_RANK[b]);
  assert.deepEqual(ranked, ['human', 'ai', 'bot']);
  assert.equal(new Set(Object.values(TAMER_RANK)).size, AUTHOR_KINDS.length);
});

test('only a human is a JSON-LD Person; an AI writer and a bot are Organizations', () => {
  assert.deepEqual(AUTHOR_KINDS.map(jsonLdAuthorType), ['Person', 'Organization', 'Organization']);
});

test('feeds name a non-human author with its kind, since a feed shows no badge', () => {
  assert.equal(feedAuthorName('Mai', 'ai'), 'Mai (AI writer)');
  assert.equal(feedAuthorName('Desk Bot', 'bot'), 'Desk Bot (Bot)');
  assert.equal(feedAuthorName('Wiz Cat', 'human'), 'Wiz Cat');
});

test('Columns are written by human editors and AI writers, never by bots', () => {
  assert.deepEqual(AUTHOR_KINDS.filter(isColumnist), ['human', 'ai']);
});

test('every kind reads as a noun phrase for machines, and an AI writer is never called human', () => {
  assert.deepEqual(AUTHOR_KINDS.map(kindNoun), ['a human editor', 'a bot', 'an AI writer']);
});
