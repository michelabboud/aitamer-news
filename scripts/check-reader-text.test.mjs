import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { humanAuthors, leaksIn, main, readerTextProblems } from './check-reader-text.mjs';
import { tempDir } from './test-support.mjs';

function repo(posts, authors) {
  const dir = tempDir('check-reader-text-');
  const postsDir = join(dir, 'posts');
  const authorsDir = join(dir, 'authors');
  mkdirSync(postsDir);
  mkdirSync(authorsDir);
  for (const [name, text] of posts) writeFileSync(join(postsDir, name), text);
  for (const [name, text] of authors) writeFileSync(join(authorsDir, name), text);
  return { postsDir, authorsDir };
}
const AUTHORS = [['desk-bot.md', '---\nkind: bot\n---\n'], ['wiz-cat.md', '---\nkind: human\n---\n'], ['mai.md', '---\nkind: ai\n---\n']];
const post = (author, body) => `---\ntitle: T\nauthor: ${author}\n---\n\n${body}\n`;

test('both leak shapes are named; ordinary prose is not', () => {
  assert.deepEqual(leaksIn('**HARD:** keep MIT explicit'), ['the upper-case working word "HARD"']);
  assert.deepEqual(leaksIn('HARD fence vs T6 gateway'), ['the upper-case working word "HARD"', 'a "fence vs/from/against" working note']);
  assert.deepEqual(leaksIn('A hard limit on a fence from the road, and Cloudflare D1 and R2'), []);
});

test('a machine author with a note fails, naming the file', () => {
  const { postsDir, authorsDir } = repo([['a.md', post('desk-bot', 'HARD: do not invent a date')]], AUTHORS);
  const problems = readerTextProblems(postsDir, authorsDir);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^a\.md: working note in reader-facing text/);
});

test('an AI writer is gated too; a human author is not', () => {
  const { postsDir, authorsDir } = repo([['a.md', post('mai', 'HARD note')], ['b.md', post('wiz-cat', 'HARD note')]], AUTHORS);
  const problems = readerTextProblems(postsDir, authorsDir);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^a\.md/);
  assert.deepEqual([...humanAuthors(authorsDir)], ['wiz-cat']);
});

test('it warns and exits 0, so a bot post is never blocked; --strict exits 1', () => {
  const { postsDir, authorsDir } = repo([['a.md', post('desk-bot', 'HARD: note')]], AUTHORS);
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(main(postsDir, authorsDir), 0);
    assert.equal(main(postsDir, authorsDir, true), 1);
  } finally {
    console.warn = warn;
  }
});
