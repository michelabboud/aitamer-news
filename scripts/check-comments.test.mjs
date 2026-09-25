import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { lstatSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMMENT_FILE_NAME, commentFileProblems, entryProblem, loadCommentFiles, main, postSlugs } from './check-comments.mjs';
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

// --- what belongs in the directory ------------------------------------------------------------

test('a comment file name is a lowercase slug and .json, exactly', () => {
  for (const name of ['grok-4-7.json', 'a.json', '0.json']) assert.equal(COMMENT_FILE_NAME.test(name), true, name);
  for (const name of ['grok-4-7.JSON', 'grok-4-7.jsonc', 'grok-4-7.json.bak', 'Grok-4-7.json', '.grok.json', '.json', 'grok 4.json', 'grok-4-7.json ', 'README.md']) {
    assert.equal(COMMENT_FILE_NAME.test(name), false, JSON.stringify(name));
  }
});

test('loadCommentFiles: a missing directory is zero files; README.md is ignored; a regular comment file is read', () => {
  assert.deepEqual(loadCommentFiles(join(tempDir('check-comments-'), 'absent')), { files: [], problems: [] });

  const { commentsDir } = repo(POSTS, [
    ['README.md', '# Comment data files'],
    ['grok-4-7.json', file('grok-4-7')],
  ]);
  const { files, problems } = loadCommentFiles(commentsDir);
  assert.deepEqual(files, [{ name: 'grok-4-7.json', text: file('grok-4-7') }]);
  assert.deepEqual(problems, []);
});

test('loadCommentFiles: a folder is a problem in its own right, and nothing inside it is read', () => {
  const { commentsDir } = repo(POSTS, [
    ['nested/deep.json', file('deep')],
    ['thread.json/index.json', file('thread')],
  ]);
  const { files, problems } = loadCommentFiles(commentsDir);
  assert.deepEqual(files, []);
  assert.deepEqual(problems, [
    `nested/: a folder; comment files live directly in ${commentsDir}, and the build ignores anything deeper`,
    `thread.json/: a folder; comment files live directly in ${commentsDir}, and the build ignores anything deeper`,
  ]);
});

test('loadCommentFiles: every wrong name is a problem — uppercase extension, .jsonc, a backup, a dotfile, another README', () => {
  const { commentsDir } = repo(POSTS, [
    ['grok-4-7.JSON', file('grok-4-7')],
    ['grok-4-7.jsonc', file('grok-4-7')],
    ['grok-4-7.json.bak', file('grok-4-7')],
    ['.grok-4-7.json', file('grok-4-7')],
    ['.DS_Store', ''],
    ['readme.md', '# lowercase is not the README'],
    ['Grok-4-7.json', file('grok-4-7')],
  ]);
  const { files, problems } = loadCommentFiles(commentsDir);
  assert.deepEqual(files, []);
  assert.deepEqual(
    problems.map((p) => p.split(':')[0]),
    ['.DS_Store', '.grok-4-7.json', 'Grok-4-7.json', 'grok-4-7.JSON', 'grok-4-7.json.bak', 'grok-4-7.jsonc', 'readme.md'],
  );
  for (const problem of problems) assert.match(problem, /only README\.md and <slug>\.json comment files \(lowercase slug, \.json exactly\) belong in /);
});

test('loadCommentFiles: a symbolic link is refused and never followed, whether it points at a valid file, a directory, or nothing', () => {
  const { commentsDir } = repo(POSTS, [['grok-4-7.json', file('grok-4-7')]]);
  const outside = tempDir('check-comments-outside-');
  writeFileSync(join(outside, 'real.json'), file('still-a-draft'));
  symlinkSync(join(outside, 'real.json'), join(commentsDir, 'still-a-draft.json'));
  symlinkSync(outside, join(commentsDir, 'linked-dir'));
  symlinkSync(join(outside, 'missing.json'), join(commentsDir, 'dangling.json'));
  symlinkSync(join(commentsDir, 'grok-4-7.json'), join(commentsDir, 'README.md'));
  const { files, problems } = loadCommentFiles(commentsDir);
  assert.deepEqual(files.map((f) => f.name), ['grok-4-7.json']);
  assert.deepEqual(
    problems,
    ['README.md', 'dangling.json', 'linked-dir', 'still-a-draft.json'].map(
      (name) => `${name}: a symbolic link; comment files are regular files, and links are never followed`,
    ),
  );
});

test('loadCommentFiles: a named pipe is refused as not a regular file', (t) => {
  const { commentsDir } = repo(POSTS, []);
  try {
    execFileSync('mkfifo', [join(commentsDir, 'grok-4-7.json')]);
  } catch (error) {
    if (error.code === 'ENOENT') return t.skip('mkfifo is not available on this platform');
    throw error;
  }
  const { files, problems } = loadCommentFiles(commentsDir);
  assert.deepEqual(files, []);
  assert.deepEqual(problems, ['grok-4-7.json: not a regular file (a pipe, a socket or a device); comment files are regular files']);
});

test('loadCommentFiles: a comments path that is a file, not a directory, is one problem', () => {
  const dir = tempDir('check-comments-');
  const notADir = join(dir, 'comments');
  writeFileSync(notADir, 'x');
  assert.deepEqual(loadCommentFiles(notADir), {
    files: [],
    problems: [`${notADir}: not a directory; the comment files live in a directory of that name`],
  });
});

test('entryProblem judges by lstat: a link to a regular file is still a link', () => {
  const dir = tempDir('check-comments-');
  writeFileSync(join(dir, 'grok-4-7.json'), '{}');
  symlinkSync(join(dir, 'grok-4-7.json'), join(dir, 'link.json'));
  assert.equal(entryProblem('grok-4-7.json', lstatSync(join(dir, 'grok-4-7.json')), dir), undefined);
  assert.equal(entryProblem('README.md', lstatSync(join(dir, 'grok-4-7.json')), dir), undefined);
  assert.match(entryProblem('link.json', lstatSync(join(dir, 'link.json')), dir), /a symbolic link/);
});

// --- main ---------------------------------------------------------------------------------------

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

test('main: exit 1 and every problem listed — orphan, mismatch, folder, wrong name and link together', () => {
  const dirs = repo(POSTS, [
    ['gone-post.json', file('gone-post')],
    ['grok-4-7.json', file('elsewhere')],
    ['sub/x.json', file('x')],
    ['notes.json.bak', file('notes')],
  ]);
  symlinkSync(join(dirs.commentsDir, 'grok-4-7.json'), join(dirs.commentsDir, 'still-a-draft.json'));
  const { result, output } = quietly(() => main([], dirs));
  assert.equal(result, 1);
  const lines = output.split('\n');
  assert.equal(lines[0], 'check:comments: fix these, then commit:');
  assert.equal(lines.length, 6, output);
  assert.match(output, /sub\/: a folder; comment files live directly in/);
  assert.match(output, /notes\.json\.bak: only README\.md and <slug>\.json comment files/);
  assert.match(output, /still-a-draft\.json: a symbolic link/);
  assert.match(output, /gone-post\.json: no post/);
  assert.match(output, /grok-4-7\.json: its slug field is "elsewhere"/);
});
