import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { authorIds, authorProblem, authorProblems, main } from './check-authors.mjs';
import { quietly, tempDir } from './test-support.mjs';

const IDS = new Set(['desk-bot', 'wiz-cat']);
const post = (frontmatter) => `---\n${frontmatter}\n---\n\nBody.\n`;

/** A repo-shaped temp dir with posts and authors, each entry `[file name, contents]`. */
function repo(posts, authors) {
  const dir = tempDir('check-authors-');
  const postsDir = join(dir, 'posts');
  const authorsDir = join(dir, 'authors');
  mkdirSync(postsDir);
  mkdirSync(authorsDir);
  for (const [name, text] of posts) writeFileSync(join(postsDir, name), text);
  for (const [name, text] of authors) writeFileSync(join(authorsDir, name), text);
  return { postsDir, authorsDir };
}

test('a known author, a draft included, has no problem', () => {
  assert.equal(authorProblem('a.md', post('title: A\nauthor: wiz-cat\ndraft: false'), IDS), null);
  assert.equal(authorProblem('b.mdx', post('title: B\nauthor: desk-bot\ndraft: true'), IDS), null);
});

test('an unknown author is refused by name, with the known ids and why it matters', () => {
  const problem = authorProblem('a.md', post('title: A\nauthor: ghost-writer'), IDS);
  assert.match(problem, /^a\.md: author "ghost-writer" has no profile in src\/content\/authors\/ \(known: desk-bot, wiz-cat\)/);
  assert.match(problem, /drop this post without failing/);
});

test('a near miss is still unknown: ids are matched exactly', () => {
  for (const author of ['Wiz-Cat', 'wiz-cat ', 'wiz', 'desk-bot.md']) {
    assert.notEqual(authorProblem('a.md', post(`author: ${JSON.stringify(author)}`), IDS), null, author);
  }
});

test('a non-string author is refused; a missing author is left to the schema', () => {
  assert.match(authorProblem('a.md', post('author: 42'), IDS), /must be an author id \(a string\), not 42/);
  assert.match(authorProblem('a.md', post('author: [wiz-cat]'), IDS), /not \["wiz-cat"\]/);
  assert.equal(authorProblem('a.md', post('title: A'), IDS), null);
  assert.equal(authorProblem('a.md', 'no frontmatter at all\n', IDS), null);
});

test('broken frontmatter is reported, not thrown', () => {
  assert.match(authorProblem('a.md', '---\nauthor: [unclosed\n---\n', IDS), /^a\.md: frontmatter is not valid YAML/);
});

test('author ids come from .md and .mdx profile files only', () => {
  const { authorsDir } = repo([], [['wiz-cat.md', ''], ['desk-bot.mdx', ''], ['README.txt', ''], ['notes', '']]);
  assert.deepEqual([...authorIds(authorsDir)].sort(), ['desk-bot', 'wiz-cat']);
});

test('main exits 1 on any unknown author, names every one in order, and ignores non-post files', () => {
  const { postsDir, authorsDir } = repo(
    [
      ['b-post.md', post('author: nobody')],
      ['a-post.mdx', post('author: also-nobody')],
      ['fine.md', post('author: wiz-cat')],
      ['notes.txt', post('author: nobody')],
    ],
    [['wiz-cat.md', ''], ['desk-bot.md', '']],
  );
  assert.deepEqual(
    authorProblems({ postsDir, authorsDir }).map((line) => line.split(':')[0]),
    ['a-post.mdx', 'b-post.md'],
  );
  const { result, output } = quietly(() => main({ postsDir, authorsDir }));
  assert.equal(result, 1);
  assert.equal(output.split('\n').filter((line) => line.startsWith('check-authors: ')).length, 2);
});

test('main exits 0 when every author is known', () => {
  const { postsDir, authorsDir } = repo([['a.md', post('author: wiz-cat')]], [['wiz-cat.md', '']]);
  assert.equal(quietly(() => main({ postsDir, authorsDir })).result, 0);
});

test('the real site: every post names a known author', () => {
  assert.deepEqual(authorProblems(), []);
});

// ---- review of PR #46, B2: no field may move an author's id ----

test('review B2: an author’s id is its file name; a slug field cannot move it', async () => {
  const { authorEntryId } = await import('../src/content/author-id.ts');
  assert.equal(authorEntryId({ entry: 'wiz-cat.md', data: { slug: 'mai' } }), 'wiz-cat');
  assert.equal(authorEntryId({ entry: 'hijack.md', data: { slug: 'wiz-cat' } }), 'hijack');
  assert.equal(authorEntryId({ entry: 'mai.mdx', data: {} }), 'mai');
  assert.equal(authorEntryId({ entry: 'team/nova.md', data: {} }), 'team/nova');
});

test('review B2: the authors collection gives its loader that id rule', async () => {
  const { readFileSync } = await import('node:fs');
  const config = readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8');
  assert.match(config, /import \{ authorEntryId \} from '\.\/content\/author-id\.ts';/);
  assert.match(config, /const authors = defineCollection\(\{\n  loader: glob\(\{ base: '\.\/src\/content\/authors', pattern: '\*\*\/\*\.\{md,mdx\}', generateId: authorEntryId \}\),/);
});

test('review B2: two author files with one id fail the check (the build would keep only one, with a warning)', () => {
  const { postsDir, authorsDir } = repo([['a.md', post('author: wiz-cat')]], [
    ['wiz-cat.md', '---\nname: Wiz Cat\n---\n'],
    ['wiz-cat.mdx', '---\nname: Wiz Cat Again\n---\n'],
  ]);
  const { result, output } = quietly(() => main({ postsDir, authorsDir }));
  assert.equal(result, 1);
  assert.match(output, /check-authors: the author id "wiz-cat" is given by more than one file \(wiz-cat\.md, wiz-cat\.mdx\); the build would keep only one/);
});

test('review B2: a nested author file is an author, with the id Astro gives it', () => {
  const { postsDir, authorsDir } = repo([['a.md', post('author: team/nova')]], [['wiz-cat.md', '---\nname: W\n---\n']]);
  mkdirSync(join(authorsDir, 'team'));
  writeFileSync(join(authorsDir, 'team', 'nova.md'), '---\nname: Nova\n---\n');
  assert.deepEqual([...authorIds(authorsDir)].sort(), ['team/nova', 'wiz-cat']);
  assert.equal(quietly(() => main({ postsDir, authorsDir })).result, 0);
});
