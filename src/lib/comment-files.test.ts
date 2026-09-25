import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COMMENTS_BASE, hasCommentFiles } from '../content/comment-files.ts';

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
