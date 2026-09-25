import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { commentFileProblems, loadCommentFiles, main, postSlugs } from './check-comments.mjs';
import { quietly, tempDir } from './test-support.mjs';

const file = (slug, overrides = {}) =>
  JSON.stringify({
    version: 1,
    slug,
    generatedAt: '2026-09-25T12:37:00Z',
    comments: [{ id: '01K63M4Q3ZJ8W3Y8N5V2R7T9AB', name: 'Ada', text: 'Hello.', at: '2026-09-25T10:00:00Z' }],
    ...overrides,
  });

/** A repo-shaped temp dir: posts and a comments dir, each entry `[relative path, contents]`. */
function repo(posts, comments) {
  const dir = tempDir('check-comments-');
  const postsDir = join(dir, 'posts');
  const commentsDir = join(dir, 'comments');
  mkdirSync(postsDir);
  mkdirSync(commentsDir);
  for (const [name, text] of posts) writeFileSync(join(postsDir, name), text);
  for (const [name, text] of comments) {
    const path = join(commentsDir, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, text);
  }
  return { postsDir, commentsDir };
}

const POSTS = [
  ['grok-4-7.md', '---\ntitle: A\ndraft: false\n---\n'],
  ['still-a-draft.mdx', '---\ntitle: B\ndraft: true\n---\n'],
];

test('a comment file named after an existing post has no problems', () => {
  assert.deepEqual(commentFileProblems('grok-4-7.json', file('grok-4-7'), new Set(['grok-4-7'])), []);
});

test('a file whose slug has no post is an orphan, named', () => {
  const problems = commentFileProblems('gone-post.json', file('gone-post'), new Set(['grok-4-7']));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^gone-post\.json: no post src\/content\/posts\/gone-post\.md/);
});

test('a slug field that disagrees with the file name is named, with both values', () => {
  const problems = commentFileProblems('grok-4-7.json', file('other-post'), new Set(['grok-4-7', 'other-post']));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^grok-4-7\.json: its slug field is "other-post" but the file is named "grok-4-7"/);
});

test('a file name that is not a slug is refused before anything else is read', () => {
  for (const name of ['Grok-4-7.json', '-leading.json', 'has space.json', 'under_score.json']) {
    const problems = commentFileProblems(name, file(name.replace(/\.json$/, '')), new Set());
    assert.equal(problems.length, 1, name);
    assert.match(problems[0], /the file name is not a slug/);
  }
});

test('a file that is not JSON, or not an object, is named; the orphan rule still runs on it', () => {
  const notJson = commentFileProblems('grok-4-7.json', '{ "version": 1,', new Set(['grok-4-7']));
  assert.equal(notJson.length, 1);
  assert.match(notJson[0], /^grok-4-7\.json: not valid JSON/);

  const array = commentFileProblems('grok-4-7.json', '[]', new Set(['grok-4-7']));
  assert.deepEqual(array, ['grok-4-7.json: the file must be a JSON object']);

  const nullFile = commentFileProblems('gone.json', 'null', new Set());
  assert.equal(nullFile.length, 2);
  assert.match(nullFile[0], /must be a JSON object/);
  assert.match(nullFile[1], /no post/);
});

test('a missing slug field is reported as a mismatch, not a crash', () => {
  const problems = commentFileProblems('grok-4-7.json', '{"version":1}', new Set(['grok-4-7']));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /its slug field is undefined but the file is named "grok-4-7"/);
});

test('postSlugs lists .md and .mdx posts, drafts included, and nothing else', () => {
  const { postsDir } = repo([...POSTS, ['notes.txt', 'not a post'], ['README.md', '# not a post either']], []);
  assert.deepEqual([...postSlugs(postsDir)].sort(), ['README', 'grok-4-7', 'still-a-draft']);
});

test('loadCommentFiles: a missing directory is zero files; README.md is ignored; a nested file is a problem', () => {
  assert.deepEqual(loadCommentFiles(join(tempDir('check-comments-'), 'absent')), { files: [], problems: [] });

  const { commentsDir } = repo(POSTS, [
    ['README.md', '# Comment data files'],
    ['grok-4-7.json', file('grok-4-7')],
    ['nested/deep.json', file('deep')],
  ]);
  const { files, problems } = loadCommentFiles(commentsDir);
  assert.deepEqual(files.map((f) => f.name), ['grok-4-7.json']);
  assert.deepEqual(problems, [`nested/deep.json: comment files live directly in ${commentsDir}; the build ignores a subfolder`]);
});

test('main: exit 0 and a count when every file belongs to a post (a draft counts as a post)', () => {
  const dirs = repo(POSTS, [
    ['grok-4-7.json', file('grok-4-7')],
    ['still-a-draft.json', file('still-a-draft')],
  ]);
  const { result, output } = quietly(() => main([], dirs));
  assert.equal(result, 0);
  assert.equal(output, 'check:comments: 2 comment files, each named after a post that exists.');
});

test('main: exit 0 with no comment files at all, and with no comments directory', () => {
  const empty = repo(POSTS, [['README.md', '# Comment data files']]);
  const { result, output } = quietly(() => main([], empty));
  assert.equal(result, 0);
  assert.equal(output, 'check:comments: 0 comment files, each named after a post that exists.');

  const none = repo(POSTS, []);
  assert.equal(quietly(() => main([], { ...none, commentsDir: join(none.commentsDir, 'absent') })).result, 0);
});

test('main: exit 1 and every problem listed, orphan and mismatch and nested together', () => {
  const dirs = repo(POSTS, [
    ['gone-post.json', file('gone-post')],
    ['grok-4-7.json', file('elsewhere')],
    ['sub/x.json', file('x')],
  ]);
  const { result, output } = quietly(() => main([], dirs));
  assert.equal(result, 1);
  const lines = output.split('\n');
  assert.equal(lines[0], 'check:comments: fix these, then commit:');
  assert.equal(lines.length, 4, output);
  assert.match(output, /sub\/x\.json: comment files live directly in/);
  assert.match(output, /gone-post\.json: no post/);
  assert.match(output, /grok-4-7\.json: its slug field is "elsewhere"/);
});
