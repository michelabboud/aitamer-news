import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  COMMENT_FILE_PATH,
  MODE_FILE,
  PUBLISHER_LANE,
  checkPullRequest,
  enforcedFor,
  fileProblems,
  inPublisherLane,
  main,
  parseHeadModes,
  parsePullRequestFiles,
} from './check-publisher-paths.mjs';
import { gitIn, quietly, tempDir } from './test-support.mjs';

const PUBLISHER = 'aitamer-desk-publisher[bot]';
const LANE_FILE = `${PUBLISHER_LANE}grok-4-7.json`;

/** A head tree where every listed path is a plain file unless said otherwise. */
const tree = (entries) => new Map(Object.entries(entries).map(([path, mode]) => [path, mode ?? MODE_FILE]));
const plain = (...paths) => tree(Object.fromEntries(paths.map((path) => [path, MODE_FILE])));

// ---- the lane ----

test('only src/content/comments/<slug>.json is in the lane', () => {
  assert.equal(PUBLISHER_LANE, 'src/content/comments/');
  assert.equal(inPublisherLane(LANE_FILE), true);
  assert.equal(inPublisherLane(`${PUBLISHER_LANE}a1.json`), true);
});

test('outside the directory, nested, dotted, uppercase, README and non-json paths are not in the lane', () => {
  for (const path of [
    'README.md',
    'src/lib/site.ts',
    '.github/workflows/deploy-pages.yml',
    `${PUBLISHER_LANE}README.md`,
    `${PUBLISHER_LANE}nested/grok-4-7.json`,
    `${PUBLISHER_LANE}../posts/grok-4-7.md`,
    `${PUBLISHER_LANE}../comments/grok-4-7.json`,
    `${PUBLISHER_LANE}grok-4-7.JSON`,
    `${PUBLISHER_LANE}Grok-4-7.json`,
    `${PUBLISHER_LANE}-leading-hyphen.json`,
    `${PUBLISHER_LANE}grok 4 7.json`,
    `${PUBLISHER_LANE}grok-4-7.json.bak`,
    `${PUBLISHER_LANE}grok-4-7.json\n`,
    `${PUBLISHER_LANE}.json`,
    'src/content/comments',
    'src/content/commentsx/grok-4-7.json',
    'other/src/content/comments/grok-4-7.json',
    '',
    undefined,
    42,
  ]) {
    assert.equal(inPublisherLane(path), false, `path ${JSON.stringify(path)}`);
  }
});

test('the lane pattern is anchored and derived from the posts’ slug rule', () => {
  assert.equal(COMMENT_FILE_PATH.source, '^src\\/content\\/comments\\/[a-z0-9][a-z0-9-]*\\.json$');
});

// ---- whose pull requests are held to the rule ----

test('the publisher’s own pull request is enforced, case-insensitively', () => {
  assert.equal(enforcedFor({ author: PUBLISHER, publisherLogin: PUBLISHER }), true);
  assert.equal(enforcedFor({ author: 'AITAMER-DESK-PUBLISHER[bot]', publisherLogin: ` ${PUBLISHER} ` }), true);
});

test('anyone else’s pull request is not enforced when a publisher login is configured', () => {
  assert.equal(enforcedFor({ author: 'michelabboud', publisherLogin: PUBLISHER }), false);
  assert.equal(enforcedFor({ author: '', publisherLogin: PUBLISHER }), false);
  assert.equal(enforcedFor({ author: undefined, publisherLogin: PUBLISHER }), false);
});

test('with no publisher login configured every pull request is enforced (fail safe)', () => {
  assert.equal(enforcedFor({ author: 'michelabboud', publisherLogin: '' }), true);
  assert.equal(enforcedFor({ author: 'michelabboud', publisherLogin: '   ' }), true);
  assert.equal(enforcedFor({ author: 'michelabboud', publisherLogin: undefined }), true);
});

// ---- one file ----

test('adding, changing or deleting a comment file in the lane is allowed', () => {
  const modes = plain(LANE_FILE);
  assert.deepEqual(fileProblems({ filename: LANE_FILE, status: 'added' }, modes), []);
  assert.deepEqual(fileProblems({ filename: LANE_FILE, status: 'modified' }, modes), []);
  assert.deepEqual(fileProblems({ filename: LANE_FILE, status: 'removed' }, new Map()), []);
});

test('a rename inside the lane is allowed; a rename from or to outside is not', () => {
  const inside = { filename: LANE_FILE, status: 'renamed', previous_filename: `${PUBLISHER_LANE}old-slug.json` };
  assert.deepEqual(fileProblems(inside, plain(LANE_FILE)), []);
  const fromOutside = { filename: LANE_FILE, status: 'renamed', previous_filename: 'src/lib/site.ts' };
  assert.match(fileProblems(fromOutside, plain(LANE_FILE)).join('\n'), /renamed from src\/lib\/site\.ts, which is outside/);
  const toOutside = { filename: 'src/lib/site.ts', status: 'renamed', previous_filename: LANE_FILE };
  assert.match(fileProblems(toOutside, plain('src/lib/site.ts')).join('\n'), /src\/lib\/site\.ts: outside the publisher's lane/);
  const noPrevious = { filename: LANE_FILE, status: 'renamed' };
  assert.match(fileProblems(noPrevious, plain(LANE_FILE)).join('\n'), /renamed from \(unknown\)/);
});

test('a path outside the lane is a problem whatever its status, deletion included', () => {
  for (const status of ['added', 'modified', 'removed', 'renamed', 'copied', 'changed']) {
    const problems = fileProblems({ filename: 'README.md', status, previous_filename: 'README.md' }, plain('README.md'));
    assert.match(problems.join('\n'), /README\.md: outside the publisher's lane; only src\/content\/comments\/<slug>\.json may change/, status);
  }
  assert.match(fileProblems({ filename: `${PUBLISHER_LANE}nested/a.json`, status: 'added' }, plain(`${PUBLISHER_LANE}nested/a.json`)).join('\n'), /outside/);
  assert.match(fileProblems({ filename: `${PUBLISHER_LANE}../posts/a.md`, status: 'added' }, plain(`${PUBLISHER_LANE}../posts/a.md`)).join('\n'), /outside/);
  assert.match(fileProblems({ filename: `${PUBLISHER_LANE}a.JSON`, status: 'added' }, plain(`${PUBLISHER_LANE}a.JSON`)).join('\n'), /outside/);
  assert.match(fileProblems({ filename: `${PUBLISHER_LANE}README.md`, status: 'modified' }, plain(`${PUBLISHER_LANE}README.md`)).join('\n'), /outside/);
});

test('a symlink, a submodule or an executable in the lane is a problem, even at a lane path', () => {
  assert.match(fileProblems({ filename: LANE_FILE, status: 'added' }, tree({ [LANE_FILE]: '120000' })).join('\n'), /is a symbolic link \(120000\); only a plain file \(100644\)/);
  assert.match(fileProblems({ filename: LANE_FILE, status: 'added' }, tree({ [LANE_FILE]: '160000' })).join('\n'), /is a submodule \(160000\)/);
  assert.match(fileProblems({ filename: LANE_FILE, status: 'modified' }, tree({ [LANE_FILE]: '100755' })).join('\n'), /is an executable \(100755\)/);
  assert.match(fileProblems({ filename: LANE_FILE, status: 'changed' }, tree({ [LANE_FILE]: '040000' })).join('\n'), /is mode 040000 \(040000\)/);
});

test('a present file missing from the head tree, an unknown status or a nameless entry fails closed', () => {
  assert.match(fileProblems({ filename: LANE_FILE, status: 'added' }, new Map()).join('\n'), /not in the pull request's head tree/);
  assert.match(fileProblems({ filename: LANE_FILE, status: 'teleported' }, plain(LANE_FILE)).join('\n'), /unknown change status "teleported"/);
  assert.match(fileProblems({ filename: LANE_FILE }, plain(LANE_FILE)).join('\n'), /unknown change status undefined/);
  assert.deepEqual(fileProblems({ status: 'added' }, new Map()), ['a changed file has no name']);
  assert.deepEqual(fileProblems({ filename: '', status: 'added' }, new Map()), ['a changed file has no name']);
});

// ---- a pull request ----

test('the publisher’s pull request that only writes comment files passes', () => {
  const files = [
    { filename: LANE_FILE, status: 'added' },
    { filename: `${PUBLISHER_LANE}welcome-to-aitamer.json`, status: 'modified' },
    { filename: `${PUBLISHER_LANE}emptied-thread.json`, status: 'removed' },
  ];
  const modes = plain(LANE_FILE, `${PUBLISHER_LANE}welcome-to-aitamer.json`, 'README.md');
  assert.deepEqual(checkPullRequest({ author: PUBLISHER, publisherLogin: PUBLISHER, files, modes, changedFiles: 3 }), { enforced: true, problems: [] });
});

test('the publisher’s pull request that touches anything else fails, naming every path', () => {
  const files = [
    { filename: LANE_FILE, status: 'added' },
    { filename: '.github/workflows/deploy-pages.yml', status: 'modified' },
    { filename: 'src/lib/site.ts', status: 'removed' },
  ];
  const modes = plain(LANE_FILE, '.github/workflows/deploy-pages.yml');
  const { enforced, problems } = checkPullRequest({ author: PUBLISHER, publisherLogin: PUBLISHER, files, modes, changedFiles: 3 });
  assert.equal(enforced, true);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^\.github\/workflows\/deploy-pages\.yml: outside/);
  assert.match(problems[1], /^src\/lib\/site\.ts: outside/);
});

test('a human’s pull request touching code passes untouched when the publisher login is set', () => {
  const files = [{ filename: 'src/lib/site.ts', status: 'modified' }];
  assert.deepEqual(checkPullRequest({ author: 'michelabboud', publisherLogin: PUBLISHER, files, modes: plain('src/lib/site.ts'), changedFiles: 1 }), { enforced: false, problems: [] });
});

test('with no publisher login set, a human’s pull request touching code fails (fail safe)', () => {
  const files = [{ filename: 'src/lib/site.ts', status: 'modified' }];
  const result = checkPullRequest({ author: 'michelabboud', publisherLogin: '', files, modes: plain('src/lib/site.ts'), changedFiles: 1 });
  assert.equal(result.enforced, true);
  assert.equal(result.problems.length, 1);
});

test('a files list shorter than the pull request’s changed-file count is refused, not half-checked', () => {
  const files = [{ filename: LANE_FILE, status: 'added' }];
  const { problems } = checkPullRequest({ author: PUBLISHER, publisherLogin: PUBLISHER, files, modes: plain(LANE_FILE), changedFiles: 3001 });
  assert.deepEqual(problems, ['the API listed 1 changed files but the pull request changes 3001; refusing to check a partial list']);
});

test('an empty pull request passes; an unknown changed-file count is not compared', () => {
  assert.deepEqual(checkPullRequest({ author: PUBLISHER, publisherLogin: PUBLISHER, files: [], modes: new Map(), changedFiles: 0 }), { enforced: true, problems: [] });
  assert.deepEqual(checkPullRequest({ author: PUBLISHER, publisherLogin: PUBLISHER, files: [{ filename: LANE_FILE, status: 'added' }], modes: plain(LANE_FILE) }), { enforced: true, problems: [] });
});

// ---- the inputs ----

test('the files list may be flat or a list of pages (gh --paginate --slurp)', () => {
  const flat = [{ filename: 'a', status: 'added' }, { filename: 'b', status: 'removed' }];
  assert.deepEqual(parsePullRequestFiles(JSON.stringify(flat)), flat);
  assert.deepEqual(parsePullRequestFiles(JSON.stringify([[flat[0]], [flat[1]]])), flat);
  assert.deepEqual(parsePullRequestFiles('[]'), []);
  assert.deepEqual(parsePullRequestFiles('[[]]'), []);
});

test('a files list that is not an array of objects is a broken input', () => {
  assert.throws(() => parsePullRequestFiles('{"message":"Not Found"}'), /must be a JSON array/);
  assert.throws(() => parsePullRequestFiles('[1, 2]'), /every entry .* must be an object/);
  assert.throws(() => parsePullRequestFiles('[null]'), /every entry .* must be an object/);
  assert.throws(() => parsePullRequestFiles('not json'), SyntaxError);
});

test('ls-tree -z output parses into path → mode, paths with tabs and newlines included', () => {
  const text = [
    '100644 blob 0123abc\tsrc/content/comments/grok-4-7.json',
    '120000 blob 0123abd\tsrc/content/comments/link.json',
    '160000 commit 0123abe\tvendor/thing',
    '100755 blob 0123abf\tscripts/run.sh',
    '100644 blob 0123ac0\tweird\tname\nwith newline',
  ].join('\0') + '\0';
  assert.deepEqual(
    [...parseHeadModes(text)],
    [
      ['src/content/comments/grok-4-7.json', '100644'],
      ['src/content/comments/link.json', '120000'],
      ['vendor/thing', '160000'],
      ['scripts/run.sh', '100755'],
      ['weird\tname\nwith newline', '100644'],
    ],
  );
  assert.deepEqual([...parseHeadModes('')], []);
});

test('an ls-tree entry that does not look like one is a broken input', () => {
  assert.throws(() => parseHeadModes('100644 blob\0'), /unreadable ls-tree entry/);
  assert.throws(() => parseHeadModes('total 3\n'), /unreadable ls-tree entry/);
});

test('real git ls-tree output for a plain file, a symlink and an executable parses as expected', () => {
  const dir = tempDir('publisher-paths-');
  const git = gitIn(dir);
  mkdirSync(join(dir, PUBLISHER_LANE), { recursive: true });
  writeFileSync(join(dir, LANE_FILE), '{}\n');
  symlinkSync('grok-4-7.json', join(dir, `${PUBLISHER_LANE}link.json`));
  writeFileSync(join(dir, `${PUBLISHER_LANE}run.json`), '#!/bin/sh\n');
  chmodSync(join(dir, `${PUBLISHER_LANE}run.json`), 0o755);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'tree']);
  const modes = parseHeadModes(execFileSync('git', ['ls-tree', '-r', '-z', 'HEAD'], { cwd: dir, encoding: 'utf8' }));
  assert.equal(modes.get(LANE_FILE), '100644');
  assert.equal(modes.get(`${PUBLISHER_LANE}link.json`), '120000');
  assert.equal(modes.get(`${PUBLISHER_LANE}run.json`), '100755');
  assert.deepEqual(fileProblems({ filename: LANE_FILE, status: 'added' }, modes), []);
  assert.match(fileProblems({ filename: `${PUBLISHER_LANE}link.json`, status: 'added' }, modes).join('\n'), /symbolic link/);
  assert.match(fileProblems({ filename: `${PUBLISHER_LANE}run.json`, status: 'added' }, modes).join('\n'), /executable/);
});

// ---- the command line ----

/** Writes the two inputs and runs main with the given environment; returns exit code and output. */
function run(files, modesText, env) {
  const dir = tempDir('publisher-paths-cli-');
  const filesPath = join(dir, 'pr-files.json');
  const modesPath = join(dir, 'head-modes.txt');
  writeFileSync(filesPath, JSON.stringify(files));
  writeFileSync(modesPath, modesText);
  const { result, output } = quietly(() => main(['--files', filesPath, '--modes', modesPath], env));
  return { code: result, output };
}

const modesText = `100644 blob abc\t${LANE_FILE}\u0000100644 blob abd\tsrc/lib/site.ts\u0000`;

test('CLI: the publisher’s clean pull request exits 0 and says so', () => {
  const { code, output } = run([[{ filename: LANE_FILE, status: 'added' }]], modesText, { PR_AUTHOR: PUBLISHER, PUBLISHER_LOGIN: PUBLISHER, PR_CHANGED_FILES: '1' });
  assert.equal(code, 0);
  assert.match(output, /1 changed file \(by the publisher aitamer-desk-publisher\[bot\]\), all src\/content\/comments\/<slug>\.json\./);
});

test('CLI: the publisher’s pull request outside the lane exits 1 naming the path', () => {
  const { code, output } = run([[{ filename: 'src/lib/site.ts', status: 'modified' }]], modesText, { PR_AUTHOR: PUBLISHER, PUBLISHER_LOGIN: PUBLISHER, PR_CHANGED_FILES: '1' });
  assert.equal(code, 1);
  assert.match(output, /changes what the publisher may not:\n  src\/lib\/site\.ts: outside/);
});

test('CLI: a human’s pull request exits 0 without enforcing when the publisher login is set', () => {
  const { code, output } = run([[{ filename: 'src/lib/site.ts', status: 'modified' }]], modesText, { PR_AUTHOR: 'michelabboud', PUBLISHER_LOGIN: PUBLISHER, PR_CHANGED_FILES: '1' });
  assert.equal(code, 0);
  assert.match(output, /michelabboud is not the publisher/);
});

test('CLI: with PUBLISHER_LOGIN unset, a human’s pull request outside the lane exits 1 and says why', () => {
  const { code, output } = run([[{ filename: 'src/lib/site.ts', status: 'modified' }]], modesText, { PR_AUTHOR: 'michelabboud', PR_CHANGED_FILES: '1' });
  assert.equal(code, 1);
  assert.match(output, /held to the publisher’s rule because PUBLISHER_LOGIN is not set/);
});

test('CLI: a partial files list exits 1', () => {
  const { code, output } = run([[{ filename: LANE_FILE, status: 'added' }]], modesText, { PR_AUTHOR: PUBLISHER, PUBLISHER_LOGIN: PUBLISHER, PR_CHANGED_FILES: '2' });
  assert.equal(code, 1);
  assert.match(output, /listed 1 changed files but the pull request changes 2/);
});

test('CLI: missing or unknown arguments, an unreadable input or a bad count exit 2', () => {
  assert.equal(quietly(() => main([])).result, 2);
  assert.equal(quietly(() => main(['--files', 'x'])).result, 2);
  assert.equal(quietly(() => main(['--files', 'x', '--modes', 'y', '--extra'])).result, 2);
  assert.equal(quietly(() => main(['--files', '/nonexistent/pr-files.json', '--modes', '/nonexistent/modes.txt'], {})).result, 2);
  assert.equal(run([[]], '', { PR_CHANGED_FILES: 'three' }).code, 2);
  assert.equal(run({ message: 'Not Found' }, '', {}).code, 2);
});
