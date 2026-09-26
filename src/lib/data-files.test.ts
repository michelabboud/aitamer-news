import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COMMENTS_BASE, DATA_FILE_NAME, REACTIONS_BASE, hasDataFiles } from '../content/data-files.ts';
import { COMMENT_FILE_NAME as CHECK_COMMENT_FILE_NAME, COMMENTS_DIR } from '../../scripts/check-comments.mjs';
import { REACTIONS_DIR } from '../../scripts/check-reactions.mjs';
import { DATA_FILE_NAME as CHECK_DATA_FILE_NAME } from '../../scripts/data-files.mjs';

/** Both data directories obey the same rules; every case runs against each. */
const BASES = [COMMENTS_BASE, REACTIONS_BASE];

/** A throwaway project root with the data directory `base` in it, as a `file:` URL ending in `/`. */
function projectRoot(base: string, files: string[] = [], directories: string[] = []): { root: URL; dir: string; done: () => void } {
  const project = mkdtempSync(join(tmpdir(), 'data-files-'));
  const dir = join(project, base);
  mkdirSync(dir, { recursive: true });
  for (const name of files) writeFileSync(join(dir, name), '{}');
  for (const name of directories) mkdirSync(join(dir, name));
  return { root: pathToFileURL(`${project}/`), dir, done: () => rmSync(project, { recursive: true, force: true }) };
}

for (const base of BASES) {
  test(`${base}: a directory with only the README has no data files`, (t) => {
    const project = projectRoot(base, ['README.md']);
    t.after(project.done);
    assert.equal(hasDataFiles(project.root, base), false);
  });

  test(`${base}: one .json file is enough`, (t) => {
    const project = projectRoot(base, ['README.md', 'grok-4-7.json']);
    t.after(project.done);
    assert.equal(hasDataFiles(project.root, base), true);
  });

  test(`${base}: a directory named like a data file is not a data file`, (t) => {
    const project = projectRoot(base, ['README.md'], ['odd.json']);
    t.after(project.done);
    assert.equal(hasDataFiles(project.root, base), false);
  });

  test(`${base}: a missing directory counts as none`, (t) => {
    const project = projectRoot(base);
    t.after(project.done);
    rmSync(project.dir, { recursive: true });
    assert.equal(hasDataFiles(project.root, base), false);
  });

  test(`${base}: a file where the directory should be is an error, not "no files"`, (t) => {
    const project = projectRoot(base);
    t.after(project.done);
    rmSync(project.dir, { recursive: true });
    writeFileSync(project.dir, 'not a directory');
    assert.throws(() => hasDataFiles(project.root, base), { code: 'ENOTDIR' });
  });

  test(`${base}: only a lowercase <slug>.json counts: dotfiles, other cases and other characters do not`, (t) => {
    for (const name of ['.hidden.json', '.json', 'X.JSON', 'Grok.json', 'a_b.json', '-a.json', 'x.json.bak', 'x.jsonc']) {
      const project = projectRoot(base, ['README.md', name]);
      t.after(project.done);
      assert.equal(hasDataFiles(project.root, base), false, name);
    }
  });

  test(`${base}: a symbolic link is never a data file, whether it points at a real file or nowhere`, (t) => {
    const project = projectRoot(base, ['README.md']);
    t.after(project.done);
    const target = join(project.dir, '..', 'outside.json');
    writeFileSync(target, '{}');
    symlinkSync(target, join(project.dir, 'linked.json'));
    symlinkSync(join(project.dir, 'missing'), join(project.dir, 'dangling.json'));
    assert.equal(hasDataFiles(project.root, base), false);
    writeFileSync(join(project.dir, 'real.json'), '{}');
    assert.equal(hasDataFiles(project.root, base), true);
  });
}

test('the two directories are independent: a file in one says nothing about the other', (t) => {
  const project = projectRoot(COMMENTS_BASE, ['grok-4-7.json']);
  t.after(project.done);
  mkdirSync(join(project.dir, '..', 'reactions'));
  assert.equal(hasDataFiles(project.root, COMMENTS_BASE), true);
  assert.equal(hasDataFiles(project.root, REACTIONS_BASE), false);
});

test('a root without its trailing slash is refused, not resolved to the wrong directory', (t) => {
  const project = projectRoot(COMMENTS_BASE, ['grok-4-7.json']);
  t.after(project.done);
  const withoutSlash = new URL(project.root.href.replace(/\/$/, ''));
  assert.throws(() => hasDataFiles(withoutSlash, COMMENTS_BASE), TypeError);
});

test('the bases name the directories the checks read', () => {
  assert.equal(COMMENTS_BASE, `./${COMMENTS_DIR}`);
  assert.equal(REACTIONS_BASE, `./${REACTIONS_DIR}`);
});

test('the file-name rule agrees with the checks, which fail the names this one ignores', () => {
  const corpus = [
    'grok-4-7.json', 'a.json', '0.json', 'a-b-c.json', 'README.md', '.hidden.json', '.json', 'X.JSON', 'x.JSON',
    'Grok.json', 'a_b.json', '-a.json', 'x.json.bak', 'x.jsonc', 'x.json/', 'a b.json', 'é.json', 'x..json',
  ];
  for (const name of corpus) {
    assert.equal(DATA_FILE_NAME.test(name), CHECK_DATA_FILE_NAME.test(name), name);
    assert.equal(DATA_FILE_NAME.test(name), CHECK_COMMENT_FILE_NAME.test(name), name);
  }
});
