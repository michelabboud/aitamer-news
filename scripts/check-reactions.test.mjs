import assert from 'node:assert/strict';
import test from 'node:test';
import { lstatSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REACTIONS_DIR, entryProblem, loadReactionFiles, main, reactionFileProblems } from './check-reactions.mjs';
import { quietly, tempDir } from './test-support.mjs';

/**
 * The reactions check shares its rules with the comments check (`data-files.mjs`, proven there by
 * `check-comments.test.mjs`); these cases prove it is bound to its own directory and words, and
 * run the failures task RB1 names: a file for a missing post, a slug that is not the file name.
 */

const file = (slug, reactions = [{ id: 'love', n: 3 }]) => JSON.stringify({ version: 1, slug, reactions });

function repo(posts, reactions) {
  const dir = tempDir('check-reactions-');
  const postsDir = join(dir, 'posts');
  const reactionsDir = join(dir, 'reactions');
  mkdirSync(postsDir);
  mkdirSync(reactionsDir);
  for (const [name, text] of posts) writeFileSync(join(postsDir, name), text);
  for (const [name, text] of reactions) {
    const path = join(reactionsDir, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, text);
  }
  return { postsDir, reactionsDir };
}

const POSTS = [
  ['grok-4-7.md', '---\ntitle: A\ndraft: false\n---\n'],
  ['still-a-draft.mdx', '---\ntitle: B\ndraft: true\n---\n'],
];

test('the check reads src/content/reactions', () => {
  assert.equal(REACTIONS_DIR, 'src/content/reactions');
});

test('a reactions file named after an existing post has no problems', () => {
  assert.deepEqual(reactionFileProblems('grok-4-7.json', file('grok-4-7'), new Set(['grok-4-7'])), []);
});

test('a file for a post that does not exist is an orphan reactions file, pointing at POST.md section 9', () => {
  assert.deepEqual(reactionFileProblems('gone.json', file('gone'), new Set(['grok-4-7'])), [
    'gone.json: no post src/content/posts/gone.md (or .mdx) exists; an orphan reaction file is removed, never kept (POST.md section 9)',
  ]);
});

test('a slug field that is not the file name is named, with both values', () => {
  assert.deepEqual(reactionFileProblems('grok-4-7.json', file('other'), new Set(['grok-4-7', 'other'])), [
    'grok-4-7.json: its slug field is "other" but the file is named "grok-4-7"; a reaction file is named after its post',
  ]);
});

test('a file that is not JSON is named', () => {
  const problems = reactionFileProblems('grok-4-7.json', '{"version":1,', new Set(['grok-4-7']));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^grok-4-7\.json: not valid JSON/);
});

test('entries that do not belong are refused in the reactions directory\'s own words', () => {
  const { reactionsDir } = repo(POSTS, [['grok-4-7.json', file('grok-4-7')]]);
  mkdirSync(join(reactionsDir, 'nested'));
  writeFileSync(join(reactionsDir, 'grok-4-7.json.bak'), file('grok-4-7'));
  symlinkSync(join(reactionsDir, 'grok-4-7.json'), join(reactionsDir, 'still-a-draft.json'));
  const { files, problems } = loadReactionFiles(reactionsDir);
  assert.deepEqual(files.map((f) => f.name), ['grok-4-7.json']);
  assert.deepEqual(problems, [
    `grok-4-7.json.bak: only README.md and <slug>.json reaction files (lowercase slug, .json exactly) belong in ${reactionsDir}; the build ignores this entry`,
    `nested/: a folder; reaction files live directly in ${reactionsDir}, and the build ignores anything deeper`,
    'still-a-draft.json: a symbolic link; reaction files are regular files, and links are never followed',
  ]);
  assert.match(entryProblem('x.json', lstatSync(join(reactionsDir, 'still-a-draft.json')), reactionsDir), /reaction files are regular files/);
});

test('main: exit 0 and a count with files for real posts, drafts included', () => {
  const dirs = repo(POSTS, [
    ['README.md', '# Reactions data files'],
    ['grok-4-7.json', file('grok-4-7')],
    ['still-a-draft.json', file('still-a-draft')],
  ]);
  const { result, output } = quietly(() => main([], dirs));
  assert.equal(result, 0);
  assert.equal(output, 'check:reactions: 2 reaction files, each named after a post that exists.');
});

test('main: exit 0 with no reactions files, and with no reactions directory at all', () => {
  const empty = repo(POSTS, [['README.md', '# Reactions data files']]);
  assert.equal(quietly(() => main([], empty)).output, 'check:reactions: 0 reaction files, each named after a post that exists.');
  const none = repo(POSTS, []);
  assert.equal(quietly(() => main([], { ...none, reactionsDir: join(none.reactionsDir, 'absent') })).result, 0);
});

test('main: exit 1 and every problem listed — orphan and mismatch together', () => {
  const dirs = repo(POSTS, [
    ['gone-post.json', file('gone-post')],
    ['grok-4-7.json', file('elsewhere')],
  ]);
  const { result, output } = quietly(() => main([], dirs));
  assert.equal(result, 1);
  const lines = output.split('\n');
  assert.equal(lines[0], 'check:reactions: fix these, then commit:');
  assert.equal(lines.length, 3, output);
  assert.match(output, /gone-post\.json: no post/);
  assert.match(output, /grok-4-7\.json: its slug field is "elsewhere"/);
});

