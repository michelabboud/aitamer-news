import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COMMENTS_BASE, COMMENT_FILE_NAME, hasCommentFiles } from '../content/comment-files.ts';
import { COMMENT_FILE_NAME as CHECK_COMMENT_FILE_NAME } from '../../scripts/check-comments.mjs';

/** A throwaway project root with the comment directory in it, as a `file:` URL ending in `/`. */
function projectRoot(files: string[] = [], directories: string[] = []): { root: URL; dir: string; done: () => void } {
  const base = mkdtempSync(join(tmpdir(), 'comment-files-'));
  const dir = join(base, COMMENTS_BASE);
  mkdirSync(dir, { recursive: true });
  for (const name of files) writeFileSync(join(dir, name), '{}');
  for (const name of directories) mkdirSync(join(dir, name));
  return { root: pathToFileURL(`${base}/`), dir, done: () => rmSync(base, { recursive: true, force: true }) };
}

test('a directory with only the README has no comment files', (t) => {
  const project = projectRoot(['README.md']);
  t.after(project.done);
  assert.equal(hasCommentFiles(project.root), false);
});

test('one .json file is enough', (t) => {
  const project = projectRoot(['README.md', 'grok-4-7.json']);
  t.after(project.done);
  assert.equal(hasCommentFiles(project.root), true);
});

test('a directory named like a data file is not a data file', (t) => {
  const project = projectRoot(['README.md'], ['odd.json']);
  t.after(project.done);
  assert.equal(hasCommentFiles(project.root), false);
});

test('a missing comment directory counts as none', (t) => {
  const project = projectRoot();
  t.after(project.done);
  rmSync(project.dir, { recursive: true });
  assert.equal(hasCommentFiles(project.root), false);
});

test('a file where the directory should be is an error, not "no comments"', (t) => {
  const project = projectRoot();
  t.after(project.done);
  rmSync(project.dir, { recursive: true });
  writeFileSync(project.dir, 'not a directory');
  assert.throws(() => hasCommentFiles(project.root), { code: 'ENOTDIR' });
});

test('only a lowercase <slug>.json counts: dotfiles, other cases and other characters do not', (t) => {
  for (const name of ['.hidden.json', '.json', 'X.JSON', 'Grok.json', 'a_b.json', '-a.json', 'x.json.bak', 'x.jsonc']) {
    const project = projectRoot(['README.md', name]);
    t.after(project.done);
    assert.equal(hasCommentFiles(project.root), false, name);
  }
});

test('a symbolic link is never a comment file, whether it points at a real file or nowhere', (t) => {
  const project = projectRoot(['README.md']);
  t.after(project.done);
  const target = join(project.dir, '..', 'outside.json');
  writeFileSync(target, '{}');
  symlinkSync(target, join(project.dir, 'linked.json'));
  symlinkSync(join(project.dir, 'missing'), join(project.dir, 'dangling.json'));
  assert.equal(hasCommentFiles(project.root), false);
  writeFileSync(join(project.dir, 'real.json'), '{}');
  assert.equal(hasCommentFiles(project.root), true);
});

test('a root without its trailing slash is refused, not resolved to the wrong directory', (t) => {
  const project = projectRoot(['grok-4-7.json']);
  t.after(project.done);
  const withoutSlash = new URL(project.root.href.replace(/\/$/, ''));
  assert.throws(() => hasCommentFiles(withoutSlash), TypeError);
});

test('the file-name rule agrees with check-comments.mjs, which fails the names this one ignores', () => {
  const corpus = [
    'grok-4-7.json', 'a.json', '0.json', 'a-b-c.json', 'README.md', '.hidden.json', '.json', 'X.JSON', 'x.JSON',
    'Grok.json', 'a_b.json', '-a.json', 'x.json.bak', 'x.jsonc', 'x.json/', 'a b.json', 'é.json', 'x..json',
  ];
  for (const name of corpus) assert.equal(COMMENT_FILE_NAME.test(name), CHECK_COMMENT_FILE_NAME.test(name), name);
});
