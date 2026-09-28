import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  AUTHOR_BRANCH,
  AUTHOR_FILE_MAX_BYTES,
  AUTHOR_FILE_PATH,
  AUTHOR_LANE_KINDS,
  AUTHORS_LANE,
  COMMENTS_LANE,
  COMMENT_FILE_PATH,
  EXEMPTING_ACTIONS,
  MODE_FILE,
  PUBLISHER_LANES,
  REACTIONS_LANE,
  REACTION_FILE_PATH,
  UnjudgeableError,
  accountId,
  authorBranchId,
  authorContentProblems,
  authorIdOf,
  authorPathProblems,
  authorsLaneScope,
  changeProblems,
  comparableName,
  collectPullRequest,
  collectPush,
  fileProblems,
  inPublisherLane,
  laneOf,
  main,
  parseHeadModes,
  parseNameStatus,
  pullRequestScope,
} from './check-publisher-paths.mjs';
import { readFrontmatter } from './frontmatter.mjs';
import { gitIn, quietly, quietlyAsync, tempDir } from './test-support.mjs';

const MAINTAINER = '29182417';
const PUBLISHER = '9900001';
const LANE_FILE = `${COMMENTS_LANE}grok-4-7.json`;
const REACTION_FILE = `${REACTIONS_LANE}grok-4-7.json`;
/** What every "outside" message names as allowed. */
const LANES_TEXT = /only src\/content\/comments\/<slug>\.json or src\/content\/reactions\/<slug>\.json may change/;

/** A head tree where every listed path is a plain file unless said otherwise. */
const tree = (entries) => new Map(Object.entries(entries).map(([path, mode]) => [path, mode ?? MODE_FILE]));
const plain = (...paths) => tree(Object.fromEntries(paths.map((path) => [path, MODE_FILE])));

// ---- the lane ----

test('only src/content/comments/<slug>.json and src/content/reactions/<slug>.json are in the lanes', () => {
  assert.deepEqual(PUBLISHER_LANES, ['src/content/comments/', 'src/content/reactions/']);
  assert.equal(inPublisherLane(LANE_FILE), true);
  assert.equal(inPublisherLane(REACTION_FILE), true);
  assert.equal(laneOf(LANE_FILE), COMMENTS_LANE);
  assert.equal(laneOf(REACTION_FILE), REACTIONS_LANE);
  assert.equal(inPublisherLane(`${COMMENTS_LANE}a1.json`), true);
});

test('outside the directory, nested, dotted, uppercase, README and non-json paths are not in the lane', () => {
  for (const path of [
    'README.md',
    'src/lib/site.ts',
    '.github/workflows/deploy-pages.yml',
    `${COMMENTS_LANE}README.md`,
    `${COMMENTS_LANE}nested/grok-4-7.json`,
    `${COMMENTS_LANE}../posts/grok-4-7.md`,
    `${COMMENTS_LANE}../comments/grok-4-7.json`,
    `${COMMENTS_LANE}grok-4-7.JSON`,
    `${COMMENTS_LANE}Grok-4-7.json`,
    `${COMMENTS_LANE}-leading-hyphen.json`,
    `${COMMENTS_LANE}grok 4 7.json`,
    `${COMMENTS_LANE}grok-4-7.json.bak`,
    `${COMMENTS_LANE}grok-4-7.json\n`,
    `${COMMENTS_LANE}.json`,
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

test('the lane patterns are anchored and derived from the posts’ slug rule', () => {
  assert.equal(COMMENT_FILE_PATH.source, '^src\\/content\\/comments\\/[a-z0-9][a-z0-9-]*\\.json$');
  assert.equal(REACTION_FILE_PATH.source, '^src\\/content\\/reactions\\/[a-z0-9][a-z0-9-]*\\.json$');
});

test('the check imports nothing outside node: built-ins and its own dependency-free slug module', async () => {
  const { readFileSync } = await import('node:fs');
  const text = readFileSync(new URL('./check-publisher-paths.mjs', import.meta.url), 'utf8');
  const specifiers = [...text.matchAll(/^import .* from '([^']+)';$/gm)].map((match) => match[1]);
  assert.deepEqual(specifiers.sort(), ['./slug.mjs', 'node:child_process', 'node:url', 'node:util']);
  // The one dynamic import: the frontmatter reader, loaded only for the posts App's authors lane.
  assert.deepEqual([...text.matchAll(/\bimport\(([^)]*)\)/g)].map((match) => match[1]), ["'./frontmatter.mjs'"]);
  const slug = readFileSync(new URL('./slug.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(slug, /^import /m);
});

// ---- who is held to the rule ----

const scope = (action, authorId, senderId, maintainerId) => pullRequestScope({ action, authorId, senderId, maintainerId });

test('the maintainer as both author and sender of an opened or synchronize event is not enforced', () => {
  for (const action of ['opened', 'synchronize']) {
    const result = scope(action, MAINTAINER, MAINTAINER, MAINTAINER);
    assert.equal(result.enforced, false, action);
    assert.match(result.reason, /both the maintainer \(account 29182417\)/);
  }
  assert.equal(scope('opened', ` ${MAINTAINER}`, `${MAINTAINER}\n`, ` ${MAINTAINER} `).enforced, false);
  assert.deepEqual([...EXEMPTING_ACTIONS].sort(), ['opened', 'synchronize']);
});

test('the maintainer’s pull request is enforced when another account sent the event (someone pushed into it)', () => {
  const result = scope('synchronize', MAINTAINER, PUBLISHER, MAINTAINER);
  assert.equal(result.enforced, true);
  assert.match(result.reason, /this event’s sender is someone else/);
  assert.equal(scope('opened', MAINTAINER, '', MAINTAINER).enforced, true);
  assert.equal(scope('opened', MAINTAINER, undefined, MAINTAINER).enforced, true);
});

test('another account’s pull request is enforced even when the maintainer sent the event', () => {
  const result = scope('synchronize', PUBLISHER, MAINTAINER, MAINTAINER);
  assert.equal(result.enforced, true);
  assert.match(result.reason, /the author is not the maintainer/);
  assert.equal(scope('opened', PUBLISHER, PUBLISHER, MAINTAINER).enforced, true);
  assert.equal(scope('opened', undefined, MAINTAINER, MAINTAINER).enforced, true);
});

test('an unset or empty MAINTAINER_ID enforces every pull request (fail safe)', () => {
  for (const maintainerId of [undefined, '', '   ']) {
    const result = scope('opened', MAINTAINER, MAINTAINER, maintainerId);
    assert.equal(result.enforced, true, JSON.stringify(maintainerId));
    assert.match(result.reason, /MAINTAINER_ID is not set/);
  }
});

test('a non-numeric MAINTAINER_ID, a login included, enforces every pull request', () => {
  for (const maintainerId of ['michelabboud', '0', '-29182417', '29182417.0', '0x1bd1', '1e3', '29182417 1']) {
    const result = scope('opened', maintainerId, maintainerId, maintainerId);
    assert.equal(result.enforced, true, maintainerId);
    assert.match(result.reason, /not a numeric account id/);
  }
});

test('an edited or reopened event never exempts, even the maintainer’s own (it does not say who pushed the head)', () => {
  for (const action of ['edited', 'reopened', '', undefined]) {
    const result = scope(action, MAINTAINER, MAINTAINER, MAINTAINER);
    assert.equal(result.enforced, true, String(action));
    assert.match(result.reason, /exempts nobody/);
  }
});

test('account ids are positive whole numbers, compared as text', () => {
  assert.equal(accountId('29182417'), '29182417');
  assert.equal(accountId(29182417), '29182417');
  assert.equal(accountId(' 7 '), '7');
  for (const bad of ['', '0', '007', '-1', '1.5', 'abc', null, undefined, {}]) assert.equal(accountId(bad), null, String(bad));
  assert.equal(accountId('9007199254740993'), '9007199254740993');
});

// ---- one file ----

test('adding, changing or deleting a comment file in the lane is allowed', () => {
  const modes = plain(LANE_FILE);
  assert.deepEqual(fileProblems({ status: 'A', path: LANE_FILE }, modes), []);
  assert.deepEqual(fileProblems({ status: 'M', path: LANE_FILE }, modes), []);
  assert.deepEqual(fileProblems({ status: 'D', path: LANE_FILE }, new Map()), []);
});

test('a rename inside the lane is allowed; a rename from or to outside is not', () => {
  const inside = { status: 'R', from: `${COMMENTS_LANE}old-slug.json`, path: LANE_FILE };
  assert.deepEqual(fileProblems(inside, plain(LANE_FILE)), []);
  const fromOutside = { status: 'R', from: 'src/lib/site.ts', path: LANE_FILE };
  assert.match(fileProblems(fromOutside, plain(LANE_FILE)).join('\n'), /renamed from src\/lib\/site\.ts, which is outside/);
  const toOutside = { status: 'R', from: LANE_FILE, path: 'src/lib/site.ts' };
  assert.match(fileProblems(toOutside, plain('src/lib/site.ts')).join('\n'), /src\/lib\/site\.ts: outside the publisher's lanes/);
  const noFrom = { status: 'R', path: LANE_FILE };
  assert.match(fileProblems(noFrom, plain(LANE_FILE)).join('\n'), /renamed from \(unknown\)/);
});

test('a path outside the lane is a problem whatever its status, deletion included', () => {
  for (const status of ['A', 'M', 'D', 'R', 'C', 'T']) {
    const problems = fileProblems({ status, from: 'README.md', path: 'README.md' }, plain('README.md'));
    assert.match(problems.join('\n'), /README\.md: outside the publisher's lanes; /, status);
    assert.match(problems.join('\n'), LANES_TEXT, status);
  }
});

test('a symlink, a submodule, an executable or a type change in the lane is a problem, even at a lane path', () => {
  assert.match(fileProblems({ status: 'A', path: LANE_FILE }, tree({ [LANE_FILE]: '120000' })).join('\n'), /is a symbolic link \(120000\); only a plain file \(100644\)/);
  assert.match(fileProblems({ status: 'A', path: LANE_FILE }, tree({ [LANE_FILE]: '160000' })).join('\n'), /is a submodule \(160000\)/);
  assert.match(fileProblems({ status: 'M', path: LANE_FILE }, tree({ [LANE_FILE]: '100755' })).join('\n'), /is an executable \(100755\)/);
  assert.match(fileProblems({ status: 'T', path: LANE_FILE }, tree({ [LANE_FILE]: '120000' })).join('\n'), /symbolic link/);
  assert.match(fileProblems({ status: 'M', path: LANE_FILE }, tree({ [LANE_FILE]: '040000' })).join('\n'), /is mode 040000 \(040000\)/);
});

test('a present file missing from the tree, an unexpected status or a nameless entry fails closed', () => {
  assert.match(fileProblems({ status: 'A', path: LANE_FILE }, new Map()).join('\n'), /not in the tree being checked/);
  for (const status of ['U', 'X', 'B', 'Q', undefined]) {
    assert.match(fileProblems({ status, path: LANE_FILE }, plain(LANE_FILE)).join('\n'), /unexpected change status/, String(status));
  }
  assert.deepEqual(fileProblems({ status: 'A' }, new Map()), ['a changed file has no name']);
  assert.deepEqual(fileProblems({ status: 'A', path: '' }, new Map()), ['a changed file has no name']);
});

test('the problems of a set of changes name every offending path', () => {
  const changes = [
    { status: 'A', path: LANE_FILE },
    { status: 'M', path: '.github/workflows/deploy-pages.yml' },
    { status: 'D', path: 'src/lib/site.ts' },
    { status: 'D', path: `${COMMENTS_LANE}emptied-thread.json` },
  ];
  const problems = changeProblems({ changes, modes: plain(LANE_FILE, '.github/workflows/deploy-pages.yml') });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^\.github\/workflows\/deploy-pages\.yml: outside/);
  assert.match(problems[1], /^src\/lib\/site\.ts: outside/);
  assert.deepEqual(changeProblems({ changes: [], modes: new Map() }), []);
});

// ---- the git outputs ----

test('name-status -z output parses, renames and paths with tabs and newlines included', () => {
  const text = ['A', LANE_FILE, 'M', 'src/lib/site.ts', 'R087', 'a.json', 'b.json', 'C100', 'x', 'y', 'D', 'weird\tname\nwith newline', 'T', 'z', ''].join('\0');
  assert.deepEqual(parseNameStatus(text), [
    { status: 'A', path: LANE_FILE },
    { status: 'M', path: 'src/lib/site.ts' },
    { status: 'R', from: 'a.json', path: 'b.json' },
    { status: 'C', from: 'x', path: 'y' },
    { status: 'D', path: 'weird\tname\nwith newline' },
    { status: 'T', path: 'z' },
  ]);
  assert.deepEqual(parseNameStatus(''), []);
});

test('name-status output that does not look like it is unjudgeable', () => {
  assert.throws(() => parseNameStatus('A\0'), UnjudgeableError);
  assert.throws(() => parseNameStatus('R100\0only-one\0'), /missing its path/);
  assert.throws(() => parseNameStatus('M\0\0'), /missing its path/);
  assert.throws(() => parseNameStatus('A file\0'), /unreadable diff status/);
  assert.throws(() => parseNameStatus('added\0x\0'), /unreadable diff status/);
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
  assert.throws(() => parseHeadModes('100644 blob\0'), /unreadable ls-tree entry/);
  assert.throws(() => parseHeadModes('total 3\n'), UnjudgeableError);
});

// ---- real repositories ----

/** A repository with `main` holding one post, returning helpers to change it and commit. */
function repository() {
  const dir = tempDir('publisher-paths-');
  const git = gitIn(dir);
  const write = (path, text = '{}\n') => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  const commit = (message) => {
    git(['add', '-A']);
    git(['commit', '-q', '--allow-empty', '-m', message]);
    return git(['rev-parse', 'HEAD']).trim();
  };
  write('src/content/posts/grok-4-7.md', '---\ntitle: x\n---\n');
  write('src/lib/site.ts', 'export {};\n');
  write(`${COMMENTS_LANE}old-thread.json`);
  const root = commit('base');
  return { dir, git, write, commit, root };
}

test('a pull request is judged from the merge base: later main commits are not the branch’s', () => {
  const { dir, git, write, commit, root } = repository();
  git(['checkout', '-q', '-b', 'desk/comments-1']);
  write(LANE_FILE, '{"comments":[1,2,3],"slug":"grok-4-7","version":1}\n');
  rmSync(join(dir, COMMENTS_LANE, 'old-thread.json'));
  const head = commit('comments');
  git(['checkout', '-q', 'main']);
  write('src/lib/site.ts', 'export const moved = 1;\n');
  const base = commit('main moves on');
  const { changes, modes } = collectPullRequest({ cwd: dir, base, head });
  assert.deepEqual(changes, [
    { status: 'A', path: LANE_FILE },
    { status: 'D', path: `${COMMENTS_LANE}old-thread.json` },
  ]);
  assert.deepEqual(changeProblems({ changes, modes }), []);
  assert.notEqual(root, base);
});

test('real git output: a symlink, an executable and a rename from outside the lane are caught', () => {
  const { dir, git, write, commit } = repository();
  const base = git(['rev-parse', 'HEAD']).trim();
  git(['checkout', '-q', '-b', 'desk/comments-2']);
  symlinkSync('../../lib/site.ts', join(dir, `${COMMENTS_LANE}link.json`));
  write(`${COMMENTS_LANE}run.json`, '#!/bin/sh\n');
  chmodSync(join(dir, `${COMMENTS_LANE}run.json`), 0o755);
  git(['mv', 'src/content/posts/grok-4-7.md', `${COMMENTS_LANE}grok-4-7.json`]);
  const head = commit('sneaky');
  const { changes, modes } = collectPullRequest({ cwd: dir, base, head });
  const problems = changeProblems({ changes, modes }).join('\n');
  assert.match(problems, /link\.json: is a symbolic link/);
  assert.match(problems, /run\.json: is an executable/);
  assert.match(problems, /grok-4-7\.json: renamed from src\/content\/posts\/grok-4-7\.md, which is outside/);
});

test('a pull request whose base or head is not in the clone, or not a commit id, is unjudgeable', () => {
  const { dir, root } = repository();
  const missing = 'f'.repeat(40);
  assert.throws(() => collectPullRequest({ cwd: dir, base: root, head: missing }), /git cat-file failed/);
  assert.throws(() => collectPullRequest({ cwd: dir, base: 'main', head: root }), /--base must be a full lowercase commit id/);
  assert.throws(() => collectPullRequest({ cwd: dir, base: root, head: 'HEAD; rm -rf /' }), UnjudgeableError);
});

test('a push is judged from before to after; all-zero or missing before is unjudgeable', () => {
  const { dir, write, commit, root } = repository();
  write(LANE_FILE);
  const after = commit('publisher push');
  const { changes, modes } = collectPush({ cwd: dir, before: root, after });
  assert.deepEqual(changes, [{ status: 'A', path: LANE_FILE }]);
  assert.deepEqual(changeProblems({ changes, modes }), []);
  assert.throws(() => collectPush({ cwd: dir, before: '0'.repeat(40), after }), /before is all zeros/);
  assert.throws(() => collectPush({ cwd: dir, before: 'e'.repeat(40), after }), /is not in this clone/);
  assert.throws(() => collectPush({ cwd: dir, before: root, after: 'short' }), /--after must be a full lowercase commit id/);
});

// ---- the command line ----

const prEnv = (authorId, senderId, maintainerId, action = 'synchronize') => ({
  PR_ACTION: action,
  PR_AUTHOR_ID: authorId,
  EVENT_SENDER_ID: senderId,
  ...(maintainerId === undefined ? {} : { MAINTAINER_ID: maintainerId }),
});

/** A repository with a clean comment branch and a branch that also touches code. */
function pullRequests() {
  const repo = repository();
  const base = repo.root;
  repo.git(['checkout', '-q', '-b', 'clean']);
  repo.write(LANE_FILE);
  const clean = repo.commit('comments');
  repo.write('src/lib/site.ts', 'export const evil = 1;\n');
  const dirty = repo.commit('code');
  return { dir: repo.dir, base, clean, dirty };
}

const cli = async (argv, env, cwd) => {
  const { result, output } = await quietlyAsync(() => main(argv, env, cwd));
  return { code: result, output };
};

test('CLI: a clean pull request passes, whoever sent it', async () => {
  const { dir, base, clean } = pullRequests();
  const { code, output } = await cli(['pr', '--base', base, '--head', clean], prEnv(PUBLISHER, PUBLISHER, MAINTAINER), dir);
  assert.equal(code, 0);
  assert.match(output, /1 changed file in this pull request, all src\/content\/comments\/<slug>\.json or src\/content\/reactions\/<slug>\.json \(held to the rule because the author is not the maintainer\)\./);
});

test('CLI: the five scope cases on a pull request that touches code', async () => {
  const { dir, base, dirty } = pullRequests();
  const run = (env) => cli(['pr', '--base', base, '--head', dirty], env, dir);
  const maintainerBoth = await run(prEnv(MAINTAINER, MAINTAINER, MAINTAINER));
  assert.equal(maintainerBoth.code, 0);
  assert.match(maintainerBoth.output, /both the maintainer .*; nothing to enforce\./);
  const otherSender = await run(prEnv(MAINTAINER, PUBLISHER, MAINTAINER));
  assert.equal(otherSender.code, 1);
  assert.match(otherSender.output, /this pull request changes what the publisher may not \(held to the rule because the maintainer’s pull request, but this event’s sender is someone else\):\n  src\/lib\/site\.ts: outside/);
  assert.equal((await run(prEnv(PUBLISHER, MAINTAINER, MAINTAINER))).code, 1);
  const unset = await run(prEnv(MAINTAINER, MAINTAINER, undefined));
  assert.equal(unset.code, 1);
  assert.match(unset.output, /MAINTAINER_ID is not set/);
  const login = await run(prEnv(MAINTAINER, MAINTAINER, 'michelabboud'));
  assert.equal(login.code, 1);
  assert.match(login.output, /not a numeric account id/);
  assert.equal((await run(prEnv(MAINTAINER, MAINTAINER, MAINTAINER, 'edited'))).code, 1);
});

test('CLI: a head that is not in the clone fails (the verdict is pinned to one commit)', async () => {
  const { dir, base } = pullRequests();
  const { code, output } = await cli(['pr', '--base', base, '--head', 'a'.repeat(40)], prEnv(PUBLISHER, PUBLISHER, MAINTAINER), dir);
  assert.equal(code, 1);
  assert.match(output, /this pull request cannot be judged, so it fails \(.*\): git cat-file failed/);
});

test('CLI: push mode passes a comments-only push and fails anything else, or an unjudgeable before', async () => {
  const { dir, base, clean, dirty } = pullRequests();
  assert.equal((await cli(['push', '--before', base, '--after', clean], {}, dir)).code, 0);
  const touched = await cli(['push', '--before', clean, '--after', dirty], {}, dir);
  assert.equal(touched.code, 1);
  assert.match(touched.output, /this push changes what the publisher may not \(the pusher is the publisher\):\n  src\/lib\/site\.ts: outside/);
  const zeros = await cli(['push', '--before', '0'.repeat(40), '--after', clean], {}, dir);
  assert.equal(zeros.code, 1);
  assert.match(zeros.output, /this push cannot be judged, so it fails \(the pusher is the publisher\): the push has no previous commit/);
  assert.equal((await cli(['push', '--before', 'b'.repeat(40), '--after', clean], {}, dir)).code, 1);
});

test('CLI: missing, unknown, repeated or mismatched arguments exit 2', async () => {
  for (const argv of [
    [],
    ['pr'],
    ['pr', '--base', 'x'],
    ['pr', '--base', 'x', '--head', 'y', '--extra', 'z'],
    ['pr', '--base', 'x', '--base', 'y'],
    ['pr', '--before', 'x', '--after', 'y'],
    ['push', '--base', 'x', '--head', 'y'],
    ['deploy', '--before', 'x', '--after', 'y'],
    ['--files', 'x', '--modes', 'y'],
  ]) {
    assert.equal((await cli(argv, {}, '.')).code, 2, argv.join(' '));
  }
});

test('the script runs as a program with a bare node, outside any npm context', () => {
  const { dir, base, clean } = pullRequests();
  const script = new URL('./check-publisher-paths.mjs', import.meta.url).pathname;
  const output = execFileSync(process.execPath, [script, 'push', '--before', base, '--after', clean], { cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.match(output, /1 changed file in this push/);
});

// ---- the second lane: reactions (ADR 0008) ----

test('the reactions lane takes <slug>.json only: README, nested, lookalike directories, traversal and other names are out', () => {
  for (const path of [
    `${REACTIONS_LANE}README.md`,
    `${REACTIONS_LANE}nested/grok-4-7.json`,
    `${REACTIONS_LANE}../comments/grok-4-7.json`,
    `${REACTIONS_LANE}../posts/grok-4-7.md`,
    `${REACTIONS_LANE}./grok-4-7.json`,
    `${REACTIONS_LANE}grok-4-7.JSON`,
    `${REACTIONS_LANE}grok-4-7.json.bak`,
    `${REACTIONS_LANE}grok-4-7.jsonc`,
    `${REACTIONS_LANE}Grok-4-7.json`,
    `${REACTIONS_LANE}.json`,
    `${REACTIONS_LANE}grok-4-7.json\n`,
    'src/content/reactions',
    'src/content/reactionsx/a.json',
    'src/content/reaction/a.json',
    'src/content/Reactions/a.json',
    'other/src/content/reactions/a.json',
  ]) {
    assert.equal(inPublisherLane(path), false, `path ${JSON.stringify(path)}`);
    assert.equal(laneOf(path), null, `path ${JSON.stringify(path)}`);
  }
});

test('adding, changing or deleting a reactions file is allowed, as in the comments lane', () => {
  const modes = plain(REACTION_FILE);
  assert.deepEqual(fileProblems({ status: 'A', path: REACTION_FILE }, modes), []);
  assert.deepEqual(fileProblems({ status: 'M', path: REACTION_FILE }, modes), []);
  assert.deepEqual(fileProblems({ status: 'D', path: REACTION_FILE }, new Map()), []);
  assert.deepEqual(fileProblems({ status: 'R', from: `${REACTIONS_LANE}old-slug.json`, path: REACTION_FILE }, modes), []);
});

test('a reactions file is held to the same modes: no symlink, no executable, no submodule', () => {
  assert.match(fileProblems({ status: 'A', path: REACTION_FILE }, tree({ [REACTION_FILE]: '120000' })).join('\n'), /is a symbolic link \(120000\)/);
  assert.match(fileProblems({ status: 'M', path: REACTION_FILE }, tree({ [REACTION_FILE]: '100755' })).join('\n'), /is an executable \(100755\)/);
  assert.match(fileProblems({ status: 'A', path: REACTION_FILE }, tree({ [REACTION_FILE]: '160000' })).join('\n'), /is a submodule \(160000\)/);
});

test('a rename across the lanes is refused, in either direction; so is a rename in from outside', () => {
  const intoReactions = fileProblems({ status: 'R', from: LANE_FILE, path: REACTION_FILE }, plain(REACTION_FILE));
  assert.deepEqual(intoReactions, [
    `${REACTION_FILE}: renamed from ${LANE_FILE}, in another lane; a file never moves between src/content/comments/ and src/content/reactions/`,
  ]);
  const intoComments = fileProblems({ status: 'R', from: REACTION_FILE, path: LANE_FILE }, plain(LANE_FILE));
  assert.match(intoComments.join('\n'), /grok-4-7\.json: renamed from src\/content\/reactions\/grok-4-7\.json, in another lane/);
  const fromOutside = fileProblems({ status: 'R', from: 'src/lib/site.ts', path: REACTION_FILE }, plain(REACTION_FILE));
  assert.match(fromOutside.join('\n'), /renamed from src\/lib\/site\.ts, which is outside the publisher's lanes/);
});

test('a change that touches a reactions file and anything else names the anything else', () => {
  const changes = [
    { status: 'A', path: REACTION_FILE },
    { status: 'M', path: LANE_FILE },
    { status: 'A', path: `${REACTIONS_LANE}README.md` },
    { status: 'M', path: 'src/lib/reactions.ts' },
    { status: 'D', path: `${REACTIONS_LANE}gone.json` },
  ];
  const problems = changeProblems({ changes, modes: plain(REACTION_FILE, LANE_FILE, `${REACTIONS_LANE}README.md`, 'src/lib/reactions.ts') });
  assert.equal(problems.length, 2, problems.join('\n'));
  assert.match(problems[0], /^src\/content\/reactions\/README\.md: outside the publisher's lanes; /);
  assert.match(problems[1], /^src\/lib\/reactions\.ts: outside the publisher's lanes; /);
  for (const problem of problems) assert.match(problem, LANES_TEXT);
});

test('real git output: a rename from the comments lane into the reactions lane is caught', () => {
  const { dir, git, commit, root } = repository();
  git(['checkout', '-q', '-b', 'desk/comments-3']);
  mkdirSync(join(dir, REACTIONS_LANE), { recursive: true });
  git(['mv', `${COMMENTS_LANE}old-thread.json`, `${REACTIONS_LANE}old-thread.json`]);
  const head = commit('moved');
  const { changes, modes } = collectPullRequest({ cwd: dir, base: root, head });
  assert.deepEqual(changes, [{ status: 'R', from: `${COMMENTS_LANE}old-thread.json`, path: `${REACTIONS_LANE}old-thread.json` }]);
  assert.match(changeProblems({ changes, modes }).join('\n'), /old-thread\.json: renamed from src\/content\/comments\/old-thread\.json, in another lane/);
});

/** A repository with a branch that writes both lanes, and one that also touches code. */
function twoLanePullRequests() {
  const repo = repository();
  const base = repo.root;
  repo.git(['checkout', '-q', '-b', 'desk/comments-4']);
  repo.write(LANE_FILE);
  repo.write(REACTION_FILE, '{"reactions":[{"id":"love","n":1}],"slug":"grok-4-7","version":1}\n');
  const clean = repo.commit('comments and reactions');
  repo.write('src/lib/site.ts', 'export const REACTIONS_LIVE = true;\n');
  const dirty = repo.commit('and code');
  return { dir: repo.dir, base, clean, dirty };
}

test('CLI: a pull request writing both lanes passes; the same plus code fails; the maintainer rules are unchanged', async () => {
  const { dir, base, clean, dirty } = twoLanePullRequests();
  const passed = await cli(['pr', '--base', base, '--head', clean], prEnv(PUBLISHER, PUBLISHER, MAINTAINER), dir);
  assert.equal(passed.code, 0, passed.output);
  assert.match(passed.output, /2 changed files in this pull request, all src\/content\/comments\/<slug>\.json or src\/content\/reactions\/<slug>\.json/);
  const failed = await cli(['pr', '--base', base, '--head', dirty], prEnv(PUBLISHER, PUBLISHER, MAINTAINER), dir);
  assert.equal(failed.code, 1);
  assert.match(failed.output, /\n  src\/lib\/site\.ts: outside the publisher's lanes; /);
  assert.doesNotMatch(failed.output, /grok-4-7\.json:/, 'the lane files themselves are fine');
  assert.equal((await cli(['pr', '--base', base, '--head', dirty], prEnv(MAINTAINER, MAINTAINER, MAINTAINER, 'opened'), dir)).code, 0);
  assert.equal((await cli(['pr', '--base', base, '--head', dirty], prEnv(MAINTAINER, PUBLISHER, MAINTAINER), dir)).code, 1);
  assert.equal((await cli(['pr', '--base', base, '--head', dirty], prEnv(MAINTAINER, MAINTAINER, undefined), dir)).code, 1);
});

test('CLI: push mode passes a push writing both lanes and fails one that adds anything else', async () => {
  const { dir, base, clean, dirty } = twoLanePullRequests();
  assert.equal((await cli(['push', '--before', base, '--after', clean], {}, dir)).code, 0);
  const touched = await cli(['push', '--before', clean, '--after', dirty], {}, dir);
  assert.equal(touched.code, 1);
  assert.match(touched.output, /this push changes what the publisher may not \(the pusher is the publisher\):\n  src\/lib\/site\.ts: outside the publisher's lanes/);
});

test('real git output: a delete in one lane plus a dissimilar add in the other passes as two lane changes (the rename rule is a tripwire)', () => {
  const { dir, git, write, commit, root } = repository();
  git(['checkout', '-q', '-b', 'desk/comments-5']);
  rmSync(join(dir, COMMENTS_LANE, 'old-thread.json'));
  write(`${REACTIONS_LANE}old-thread.json`, '{"reactions":[{"id":"love","n":1},{"id":"wow","n":2}],"slug":"old-thread","version":1}\n');
  const head = commit('delete one, add a different one');
  const { changes, modes } = collectPullRequest({ cwd: dir, base: root, head });
  assert.deepEqual(changes, [
    { status: 'D', path: `${COMMENTS_LANE}old-thread.json` },
    { status: 'A', path: `${REACTIONS_LANE}old-thread.json` },
  ], 'git does not pair dissimilar files as a rename');
  assert.deepEqual(changeProblems({ changes, modes }), [], 'both are paths the publisher may write; the contracts judge the content');
});

// ---- the posts App's authors lane (ADR 0018) ----

const POSTS = '9900002';
const AUTHOR_BRANCH_NAME = (id) => `desk/authors-test-abcdef0123456789-${id}`;
const QUILL = `${AUTHORS_LANE}quill.md`;
const author = (fields, body = '') => `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n${body}`;
const QUILL_TEXT = author({ name: 'Quill', kind: 'ai', bio: 'The editor.' }, 'I am Quill.\n');
const WIZ_TEXT = author({ name: 'Wiz Cat', kind: 'human', bio: 'Founding editor.' });
const DESK_BOT_TEXT = author({ name: 'Desk Bot', kind: 'bot', bio: 'The news bot.' });

test('the authors lane takes src/content/authors/<id>.md only, with the posts MCP’s author id rule', () => {
  assert.equal(AUTHORS_LANE, 'src/content/authors/');
  for (const [path, id] of [[QUILL, 'quill'], [`${AUTHORS_LANE}desk-bot.md`, 'desk-bot'], [`${AUTHORS_LANE}a1.md`, 'a1'], [`${AUTHORS_LANE}${'a'.repeat(64)}.md`, 'a'.repeat(64)]]) {
    assert.equal(authorIdOf(path), id, path);
  }
  for (const path of [
    `${AUTHORS_LANE}quill.mdx`,
    `${AUTHORS_LANE}nested/quill.md`,
    `${AUTHORS_LANE}Quill.md`,
    `${AUTHORS_LANE}quill-.md`,
    `${AUTHORS_LANE}-quill.md`,
    `${AUTHORS_LANE}qu--ill.md`,
    `${AUTHORS_LANE}${'a'.repeat(65)}.md`,
    `${AUTHORS_LANE}quill.md.bak`,
    `${AUTHORS_LANE}quill.md\n`,
    `${AUTHORS_LANE}.md`,
    `${AUTHORS_LANE}../posts/quill.md`,
    'src/content/authorsx/quill.md',
    'other/src/content/authors/quill.md',
    `${COMMENTS_LANE}quill.json`,
    '',
    undefined,
  ]) {
    assert.equal(authorIdOf(path), null, JSON.stringify(path));
  }
  assert.equal(AUTHOR_FILE_PATH.test(`${AUTHORS_LANE}quill.mdx`), false);
  assert.equal(inPublisherLane(QUILL), false, 'the publisher’s lanes do not gain author files');
});

test('an author branch is the posts MCP’s desk/authors-<desk>-<16 hex>-<id>, and nothing like it', () => {
  assert.equal(authorBranchId('desk/authors-test-abcdef0123456789-quill'), 'quill');
  assert.equal(authorBranchId('desk/authors-prod1-0123456789abcdef-desk-bot'), 'desk-bot');
  assert.equal(authorBranchId(`desk/authors-${'d'.repeat(16)}-0123456789abcdef-nova`), 'nova');
  for (const ref of [
    'desk/posts-test-20260928-abc-quill',
    'desk/comments-1',
    'desk/authors-quill',
    'desk/authors-test-quill',
    'desk/authors-test-abcdef012345678-quill',
    'desk/authors-test-ABCDEF0123456789-quill',
    'desk/authors-test-abcdef0123456789g-quill',
    `desk/authors-${'d'.repeat(17)}-0123456789abcdef-quill`,
    'desk/authors-Test-abcdef0123456789-quill',
    'desk/authors--abcdef0123456789-quill',
    'desk/authors-test-abcdef0123456789-quill-',
    'desk/authors-test-abcdef0123456789-Quill',
    'desk/authors-test-abcdef0123456789-quill/x',
    'refs/heads/desk/authors-test-abcdef0123456789-quill',
    `desk/authors-test-abcdef0123456789-${'a'.repeat(65)}`,
    '',
    undefined,
  ]) {
    assert.equal(authorBranchId(ref), null, JSON.stringify(ref));
  }
  assert.equal(AUTHOR_BRANCH.test('desk/authors-test-abcdef0123456789-quill\n'), false);
});

const lane = (overrides = {}) => authorsLaneScope({
  action: 'opened',
  authorId: POSTS,
  senderId: POSTS,
  headRef: AUTHOR_BRANCH_NAME('quill'),
  postsActorId: POSTS,
  ...overrides,
});

test('the authors lane applies only to the posts App as author and sender, on opened or synchronize, from an author branch', () => {
  for (const action of ['opened', 'synchronize']) {
    const result = lane({ action });
    assert.equal(result.applies, true, action);
    assert.match(result.reason, /posts App \(account 9900002\), on desk\/authors-test-abcdef0123456789-quill/);
  }
  assert.equal(lane({ postsActorId: ` ${POSTS}\n` }).applies, true, 'the variable is trimmed, as MAINTAINER_ID is');
  for (const [overrides, reason, postsApp] of [
    [{ postsActorId: undefined }, /POSTS_ACTOR_ID is not set/, false],
    [{ postsActorId: '' }, /POSTS_ACTOR_ID is not set/, false],
    [{ postsActorId: '   ' }, /POSTS_ACTOR_ID is not set/, false],
    [{ postsActorId: 'aitamer-desk-posts[bot]' }, /not a numeric account id/, false],
    [{ postsActorId: '0' }, /not a numeric account id/, false],
    [{ postsActorId: '-9900002' }, /not a numeric account id/, false],
    [{ postsActorId: '9900002.0' }, /not a numeric account id/, false],
    [{ authorId: PUBLISHER }, /the author is not the posts App/, false],
    [{ authorId: MAINTAINER }, /the author is not the posts App/, false],
    [{ authorId: undefined }, /the author is not the posts App/, false],
    [{ senderId: PUBLISHER }, /sender is someone else/, true],
    [{ senderId: MAINTAINER }, /sender is someone else/, true],
    [{ action: 'edited' }, /"edited" event does not show who pushed the head/, true],
    [{ action: 'reopened' }, /"reopened" event/, true],
    [{ action: undefined }, /"" event/, true],
    [{ headRef: 'desk/posts-test-20260928-abc-quill' }, /is not a desk\/authors-<desk>-<digest>-<id> branch/, true],
    [{ headRef: 'main' }, /is not a desk\/authors-<desk>-<digest>-<id> branch/, true],
    [{ headRef: undefined }, /is not a desk\/authors/, true],
  ]) {
    const result = lane(overrides);
    assert.equal(result.applies, false, JSON.stringify(overrides));
    assert.equal(result.postsApp, postsApp, JSON.stringify(overrides));
    assert.match(result.reason, reason, JSON.stringify(overrides));
  }
});

test('the authors lane’s paths: exactly one plain <id>.md, added or modified, named by its branch', () => {
  const headRef = AUTHOR_BRANCH_NAME('quill');
  assert.deepEqual(authorPathProblems({ changes: [{ status: 'M', path: QUILL }], modes: plain(QUILL), headRef }), []);
  assert.deepEqual(authorPathProblems({ changes: [{ status: 'A', path: QUILL }], modes: plain(QUILL), headRef }), []);
  const two = authorPathProblems({ changes: [{ status: 'M', path: QUILL }, { status: 'A', path: `${AUTHORS_LANE}nova.md` }], modes: plain(QUILL, `${AUTHORS_LANE}nova.md`), headRef });
  assert.equal(two.length, 1);
  assert.match(two[0], /changes exactly one author file; this pull request changes 2 \("src\/content\/authors\/quill\.md", "src\/content\/authors\/nova\.md"\)/);
  assert.match(authorPathProblems({ changes: [], modes: plain(), headRef })[0], /changes 0 \(none\)/);
  const withCode = authorPathProblems({ changes: [{ status: 'M', path: QUILL }, { status: 'M', path: 'src/lib/site.ts' }], modes: plain(QUILL, 'src/lib/site.ts'), headRef });
  assert.match(withCode[0], /changes 2/);
  const mdx = authorPathProblems({ changes: [{ status: 'A', path: `${AUTHORS_LANE}quill.mdx` }], modes: plain(`${AUTHORS_LANE}quill.mdx`), headRef });
  assert.match(mdx.join('\n'), /"src\/content\/authors\/quill\.mdx": not an author file; only src\/content\/authors\/<id>\.md may change/);
  assert.match(authorPathProblems({ changes: [{ status: 'D', path: QUILL }], modes: plain(), headRef }).join('\n'), /quill\.md: deleted; an author file may only be added or modified/);
  const renamed = authorPathProblems({ changes: [{ status: 'R', from: `${AUTHORS_LANE}wiz-cat.md`, path: QUILL }], modes: plain(QUILL), headRef });
  assert.match(renamed.join('\n'), /quill\.md: renamed from "src\/content\/authors\/wiz-cat\.md"; an author file may only be added or modified/);
  const copied = authorPathProblems({ changes: [{ status: 'C', from: `${AUTHORS_LANE}wiz-cat.md`, path: QUILL }], modes: plain(QUILL), headRef });
  assert.match(copied.join('\n'), /copied from/);
  assert.match(authorPathProblems({ changes: [{ status: 'T', path: QUILL }], modes: plain(QUILL), headRef }).join('\n'), /changed with status "T"/);
  const otherId = authorPathProblems({ changes: [{ status: 'M', path: QUILL }], modes: plain(QUILL), headRef: AUTHOR_BRANCH_NAME('mai') });
  assert.match(otherId.join('\n'), /the branch desk\/authors-test-abcdef0123456789-mai is for the author "mai", not "quill"/);
  for (const mode of ['120000', '100755', '160000']) {
    const problems = authorPathProblems({ changes: [{ status: 'M', path: QUILL }], modes: tree({ [QUILL]: mode }), headRef });
    assert.match(problems.join('\n'), new RegExp(`\\(${mode}\\); only a plain file`), mode);
  }
  assert.match(authorPathProblems({ changes: [{ status: 'M', path: QUILL }], modes: plain(), headRef }).join('\n'), /mode cannot be checked/);
});

const content = (status, baseText, headText, otherNames = ['Wiz Cat', 'Desk Bot', 'Mai'], path = QUILL) =>
  authorContentProblems({ status, path, baseText, headText, otherNames, readFrontmatter });

test('a modified AI writer or bot may change its bio, avatar, beats and introduction', () => {
  assert.deepEqual(content('M', QUILL_TEXT, author({ name: 'Quill', kind: 'ai', bio: 'The editor, and a writer.', beats: ['Editing'] }, 'I am Quill, still.\n')), []);
  assert.deepEqual(content('M', DESK_BOT_TEXT, author({ name: 'Desk Bot', kind: 'bot', bio: 'The news bot, v2.', avatar: '/authors/desk-bot.jpg' }), ['Quill'], `${AUTHORS_LANE}desk-bot.md`), []);
});

test('guardrail: a human’s file (or one of an unknown kind) is never changed through the App, not even its bio', () => {
  assert.deepEqual(AUTHOR_LANE_KINDS, ['ai', 'bot']);
  const wiz = `${AUTHORS_LANE}wiz-cat.md`;
  const refusal = /wiz-cat\.md: an author of kind "human"; the authors lane changes only kind: ai or kind: bot files \(a human's file changes only through the maintainer\)/;
  for (const head of [
    author({ name: 'Wiz Cat', kind: 'human', bio: 'Editor.' }),
    author({ name: 'Wiz Cat', kind: 'human', bio: 'Founding editor.' }, 'A new introduction.\n'),
    author({ name: 'Wiz Katz', kind: 'human', bio: 'Founding editor.' }),
    author({ name: 'Wiz Cat', kind: 'ai', bio: 'Founding editor.' }),
    WIZ_TEXT,
  ]) {
    const problems = content('M', WIZ_TEXT, head, ['Quill'], wiz);
    assert.equal(problems.length, 1, head);
    assert.match(problems[0], refusal, head);
  }
  for (const kind of ['robot', 'Human', undefined]) {
    const base = author(kind === undefined ? { name: 'X', bio: 'x' } : { name: 'X', kind, bio: 'x' });
    assert.match(content('M', base, base.replace('bio: "x"', 'bio: "y"')).join('\n'), /the authors lane changes only kind: ai or kind: bot files/, String(kind));
  }
});

test('guardrail: a modified AI writer or bot never changes its kind', () => {
  for (const [from, to] of [['ai', 'human'], ['bot', 'human'], ['ai', 'bot'], ['bot', 'ai'], ['ai', 'robot']]) {
    const problems = content('M', author({ name: 'Quill', kind: from, bio: 'x' }), author({ name: 'Quill', kind: to, bio: 'x' }));
    assert.match(problems.join('\n'), new RegExp(`its kind changed \\("${from}" to "${to}"\\); an author's kind never changes`), `${from} → ${to}`);
  }
  const dropped = content('M', QUILL_TEXT, author({ name: 'Quill', bio: 'x' }));
  assert.match(dropped.join('\n'), /its kind changed \("ai" to undefined\)/);
});

test('guardrail: a modified author never changes, adds or drops an id field', () => {
  const withId = author({ id: 'quill', name: 'Quill', kind: 'ai', bio: 'x' });
  assert.deepEqual(content('M', withId, author({ id: 'quill', name: 'Quill', kind: 'ai', bio: 'y' })), []);
  assert.match(content('M', withId, author({ id: 'mai', name: 'Quill', kind: 'ai', bio: 'x' })).join('\n'), /its id field changed \("quill" to "mai"\)/);
  assert.match(content('M', QUILL_TEXT, withId).join('\n'), /its id field changed \(undefined to "quill"\)/);
  assert.match(content('M', withId, QUILL_TEXT).join('\n'), /its id field changed/);
});

test('guardrail: an AI writer or a bot keeps its name', () => {
  assert.match(content('M', QUILL_TEXT, author({ name: 'Wiz Cat', kind: 'ai', bio: 'x' })).join('\n'), /its name changed \("Quill" to "Wiz Cat"\); an author of kind "ai" keeps its name/);
  assert.match(content('M', QUILL_TEXT, author({ name: 'Quill the Editor', kind: 'ai', bio: 'x' })).join('\n'), /an author of kind "ai" keeps its name/);
  assert.match(content('M', DESK_BOT_TEXT, author({ name: 'Desk Editor', kind: 'bot', bio: 'x' }), ['Quill'], `${AUTHORS_LANE}desk-bot.md`).join('\n'), /an author of kind "bot" keeps its name/);
});

test('guardrail: an added author is an AI writer or a bot, never a human', () => {
  const nova = `${AUTHORS_LANE}nova.md`;
  for (const kind of AUTHOR_LANE_KINDS) {
    assert.deepEqual(content('A', null, author({ name: 'Nova', kind, bio: 'x' }), ['Quill'], nova), [], kind);
  }
  for (const kind of ['human', 'Human', 'robot', '', 1]) {
    const problems = content('A', null, author({ name: 'Nova', kind, bio: 'x' }), ['Quill'], nova);
    assert.match(problems.join('\n'), /a new author of kind .*; the authors lane adds only kind: ai or kind: bot \(a new human is the maintainer's to add\)/, JSON.stringify(kind));
  }
  assert.match(content('A', null, author({ name: 'Nova', bio: 'x' }), ['Quill'], nova).join('\n'), /a new author of kind undefined/);
  assert.match(content('A', null, '---\nname: Nova\nkind: human # an AI\nbio: x\n---\n', ['Quill'], nova).join('\n'), /a new author of kind "human"/, 'parsed as Astro parses it');
});

test('guardrail: an added author may not take another author’s name, in any case, spacing or width', () => {
  const nova = `${AUTHORS_LANE}nova.md`;
  for (const name of ['Wiz Cat', 'wiz cat', ' WIZ  CAT ', 'Ｗｉｚ Ｃａｔ', 'Wiz\tCat']) {
    assert.match(content('A', null, author({ name, kind: 'ai', bio: 'x' }), ['Wiz Cat', 'Quill'], nova).join('\n'), /is another author's; no author passes as another/, JSON.stringify(name));
  }
  assert.equal(comparableName('Ｗｉｚ  Ｃａｔ '), 'wiz cat');
  assert.equal(comparableName(42), null);
});

test('guardrail: an added author’s id field, if any, is its file’s id', () => {
  const nova = `${AUTHORS_LANE}nova.md`;
  assert.deepEqual(content('A', null, author({ id: 'nova', name: 'Nova', kind: 'ai', bio: 'x' }), [], nova), []);
  assert.match(content('A', null, author({ id: 'wiz-cat', name: 'Nova', kind: 'ai', bio: 'x' }), [], nova).join('\n'), /its id field "wiz-cat" is not its file's id "nova"/);
});

test('an author file that cannot be read, at the head or the merge base, fails', () => {
  assert.match(content('M', QUILL_TEXT, '---\nname: [unclosed\n---\n').join('\n'), /the file at the head cannot be read: frontmatter is not valid YAML/);
  assert.match(content('M', QUILL_TEXT, 'no frontmatter at all\n').join('\n'), /the file at the head has no frontmatter/);
  assert.match(content('M', '---\nkind: ai\nkind: human\n---\n', QUILL_TEXT).join('\n'), /the file at the merge base cannot be read/, 'a duplicated key is refused, as Astro refuses it');
  assert.match(content('A', null, '---\nname: Nova\nkind: ai\nkind: human\n---\n').join('\n'), /the file at the head cannot be read/);
  assert.match(content('M', null, QUILL_TEXT).join('\n'), /modified, but it is not at the merge base/);
});

/** A repository whose main holds the site's four authors, the posts App's branch cut from it. */
function authorRepository() {
  const repo = repository();
  repo.write(QUILL, QUILL_TEXT);
  repo.write(`${AUTHORS_LANE}wiz-cat.md`, WIZ_TEXT);
  repo.write(`${AUTHORS_LANE}desk-bot.md`, DESK_BOT_TEXT);
  repo.write(`${AUTHORS_LANE}mai.md`, author({ name: 'Mai', kind: 'ai', bio: 'x' }));
  const base = repo.commit('authors');
  repo.git(['checkout', '-q', '-b', 'branch']);
  /** Reset the branch to main, apply `change`, commit, and return the head. */
  const head = (change) => {
    repo.git(['checkout', '-q', '-B', 'branch', base]);
    change(repo);
    return repo.commit('change');
  };
  return { ...repo, base, head };
}

const postsEnv = (id, overrides = {}) => ({
  PR_ACTION: 'opened',
  PR_AUTHOR_ID: POSTS,
  EVENT_SENDER_ID: POSTS,
  MAINTAINER_ID: MAINTAINER,
  POSTS_ACTOR_ID: POSTS,
  PR_HEAD_REF: AUTHOR_BRANCH_NAME(id),
  ...overrides,
});

test('CLI: the posts App’s honest author pull requests pass (a changed bio, a new AI writer, a new bot)', async () => {
  const repo = authorRepository();
  const bio = repo.head((r) => r.write(QUILL, author({ name: 'Quill', kind: 'ai', bio: 'The editor, still.' }, 'I am Quill.\n')));
  const passed = await cli(['pr', '--base', repo.base, '--head', bio], postsEnv('quill'), repo.dir);
  assert.equal(passed.code, 0, passed.output);
  assert.match(passed.output, /1 changed file in this pull request, src\/content\/authors\/<id>\.md, honest \(in the posts App's authors lane because the author and this event’s sender are the posts App \(account 9900002\)/);
  for (const kind of ['ai', 'bot']) {
    const added = repo.head((r) => r.write(`${AUTHORS_LANE}nova.md`, author({ name: 'Nova', kind, bio: 'New.' })));
    const run = await cli(['pr', '--base', repo.base, '--head', added], postsEnv('nova', { PR_ACTION: 'synchronize' }), repo.dir);
    assert.equal(run.code, 0, run.output);
  }
});

test('CLI: every guardrail refuses the posts App’s pull request', async () => {
  const repo = authorRepository();
  const refused = async (id, change, pattern) => {
    const head = repo.head(change);
    const run = await cli(['pr', '--base', repo.base, '--head', head], postsEnv(id), repo.dir);
    assert.equal(run.code, 1, run.output);
    assert.match(run.output, /this pull request changes what the posts App may not \(in the posts App's authors lane/);
    assert.match(run.output, pattern);
  };
  await refused('quill', (r) => r.write(QUILL, author({ name: 'Quill', kind: 'human', bio: 'x' })), /its kind changed \("ai" to "human"\)/);
  await refused('quill', (r) => r.write(QUILL, author({ name: 'Wiz', kind: 'ai', bio: 'x' })), /an author of kind "ai" keeps its name/);
  await refused('desk-bot', (r) => r.write(`${AUTHORS_LANE}desk-bot.md`, author({ name: 'A Person', kind: 'bot', bio: 'x' })), /an author of kind "bot" keeps its name/);
  await refused('nova', (r) => r.write(`${AUTHORS_LANE}nova.md`, author({ name: 'Nova', kind: 'human', bio: 'x' })), /a new author of kind "human"/);
  await refused('nova', (r) => r.write(`${AUTHORS_LANE}nova.md`, author({ name: 'mai', kind: 'ai', bio: 'x' })), /the name "mai" is another author's/);
  await refused('wiz-cat', (r) => r.write(`${AUTHORS_LANE}wiz-cat.md`, author({ name: 'Wiz Cat', kind: 'human', bio: 'Only the bio changed.' })), /wiz-cat\.md: an author of kind "human"; the authors lane changes only kind: ai or kind: bot files/);
  await refused('wiz-cat', (r) => r.write(`${AUTHORS_LANE}wiz-cat.md`, author({ name: 'Quill', kind: 'human', bio: 'x' })), /an author of kind "human"/);
  await refused('quill', (r) => r.write(QUILL, author({ id: 'mai', name: 'Quill', kind: 'ai', bio: 'x' })), /its id field changed/);
  await refused('quill', (r) => { r.write(QUILL, author({ name: 'Quill', kind: 'ai', bio: 'y' })); r.write(`${AUTHORS_LANE}nova.md`, author({ name: 'Nova', kind: 'ai', bio: 'x' })); }, /changes exactly one author file; this pull request changes 2/);
  await refused('quill', (r) => { r.write(QUILL, author({ name: 'Quill', kind: 'ai', bio: 'y' })); r.write('src/lib/site.ts', 'export const evil = 1;\n'); }, /changes exactly one author file; this pull request changes 2/);
  await refused('nova', (r) => r.write(`${AUTHORS_LANE}nova.mdx`, author({ name: 'Nova', kind: 'ai', bio: 'x' })), /"src\/content\/authors\/nova\.mdx": not an author file/);
  await refused('quill', (r) => rmSync(join(r.dir, QUILL)), /quill\.md: deleted; an author file may only be added or modified/);
  await refused('nova', (r) => r.git(['mv', QUILL, `${AUTHORS_LANE}nova.md`]), /nova\.md: renamed from "src\/content\/authors\/quill\.md"/);
  await refused('mai', (r) => r.write(QUILL, author({ name: 'Quill', kind: 'ai', bio: 'y' })), /is for the author "mai", not "quill"/);
  await refused('quill', (r) => { rmSync(join(r.dir, QUILL)); symlinkSync('mai.md', join(r.dir, QUILL)); }, /is a symbolic link \(120000\)/);
  await refused('quill', (r) => { r.write(QUILL, QUILL_TEXT.replace('The editor.', 'The editor, now executable.')); chmodSync(join(r.dir, QUILL), 0o755); }, /is an executable \(100755\)/);
  await refused('quill', (r) => r.write(`${COMMENTS_LANE}grok-4-7.json`), /not an author file/);
});

test('CLI: without the lane, an author file is outside the publisher’s lanes: wrong branch, wrong bot, other sender, edited, variable unset', async () => {
  const repo = authorRepository();
  const bio = repo.head((r) => r.write(QUILL, author({ name: 'Quill', kind: 'ai', bio: 'Changed.' })));
  const outside = /src\/content\/authors\/quill\.md: outside the publisher's lanes/;
  for (const [overrides, why] of [
    [{ PR_HEAD_REF: 'desk/posts-test-20260928-abc-quill' }, /and not in the authors lane because the head branch "desk\/posts-test-20260928-abc-quill" is not a desk\/authors-<desk>-<digest>-<id> branch/],
    [{ PR_HEAD_REF: 'desk/comments-1' }, /not in the authors lane because the head branch/],
    [{ PR_AUTHOR_ID: PUBLISHER, EVENT_SENDER_ID: PUBLISHER }, /held to the rule because the author is not the maintainer\):/],
    [{ EVENT_SENDER_ID: PUBLISHER }, /not in the authors lane because the posts App’s pull request, but this event’s sender is someone else/],
    [{ EVENT_SENDER_ID: MAINTAINER }, /sender is someone else/],
    [{ PR_ACTION: 'edited' }, /not in the authors lane because a "edited" event/],
    [{ PR_ACTION: 'reopened' }, /a "reopened" event/],
    [{ POSTS_ACTOR_ID: undefined }, /held to the rule because the author is not the maintainer\):/],
    [{ POSTS_ACTOR_ID: '' }, /held to the rule because the author is not the maintainer\):/],
    [{ POSTS_ACTOR_ID: 'aitamer-desk-posts[bot]' }, /held to the rule because the author is not the maintainer\):/],
    [{ POSTS_ACTOR_ID: PUBLISHER }, /held to the rule because the author is not the maintainer\):/],
  ]) {
    const run = await cli(['pr', '--base', repo.base, '--head', bio], postsEnv('quill', overrides), repo.dir);
    assert.equal(run.code, 1, JSON.stringify(overrides));
    assert.match(run.output, /this pull request changes what the publisher may not/, JSON.stringify(overrides));
    assert.match(run.output, outside, JSON.stringify(overrides));
    assert.match(run.output, why, JSON.stringify(overrides));
  }
});

test('CLI: the posts App outside the lane keeps exactly the rules everyone has; the maintainer’s exemption is unchanged', async () => {
  const repo = authorRepository();
  const comments = repo.head((r) => r.write(LANE_FILE));
  const wrongBranch = await cli(['pr', '--base', repo.base, '--head', comments], postsEnv('quill', { PR_HEAD_REF: 'desk/comments-1' }), repo.dir);
  assert.equal(wrongBranch.code, 0, 'a comments-only pull request passes the path rule, whoever opened it, as before');
  const inLane = await cli(['pr', '--base', repo.base, '--head', comments], postsEnv('quill'), repo.dir);
  assert.equal(inLane.code, 1, 'on an author branch the posts App is judged by the authors lane only');
  const human = repo.head((r) => r.write(QUILL, author({ name: 'Quill', kind: 'human', bio: 'x' })));
  const maintainer = await cli(['pr', '--base', repo.base, '--head', human], postsEnv('quill', { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: MAINTAINER }), repo.dir);
  assert.equal(maintainer.code, 0, 'the maintainer is exempt, as before');
  assert.match(maintainer.output, /both the maintainer .*; nothing to enforce\./);
  const sameId = await cli(['pr', '--base', repo.base, '--head', human], postsEnv('quill', { MAINTAINER_ID: POSTS }), repo.dir);
  assert.equal(sameId.code, 0, 'a MAINTAINER_ID set to the App exempts it: the maintainer rule comes first, unchanged');
});

test('CLI: an author file over the size cap, or another author that cannot be read, cannot be judged and fails', async () => {
  const repo = authorRepository();
  const big = repo.head((r) => r.write(QUILL, author({ name: 'Quill', kind: 'ai', bio: 'x'.repeat(AUTHOR_FILE_MAX_BYTES) })));
  const tooBig = await cli(['pr', '--base', repo.base, '--head', big], postsEnv('quill'), repo.dir);
  assert.equal(tooBig.code, 1);
  assert.match(tooBig.output, /this pull request cannot be judged, so it fails \(in the posts App's authors lane .*\): src\/content\/authors\/quill\.md: \d+ bytes, more than an author file's 65536/);
  repo.git(['checkout', '-q', 'main']);
  repo.write(`${AUTHORS_LANE}broken.md`, '---\nname: [unclosed\n---\n');
  const base = repo.commit('a broken author on main');
  repo.git(['checkout', '-q', '-B', 'other', base]);
  repo.write(`${AUTHORS_LANE}nova.md`, author({ name: 'Nova', kind: 'ai', bio: 'x' }));
  const head = repo.commit('nova');
  const broken = await cli(['pr', '--base', base, '--head', head], postsEnv('nova'), repo.dir);
  assert.equal(broken.code, 1);
  assert.match(broken.output, /cannot be judged.*broken\.md: another author's file cannot be read, so the names cannot be compared/);
});

test('the authors lane fails closed when the frontmatter reader is not there (the lockfile was not installed)', () => {
  const repo = authorRepository();
  const bio = repo.head((r) => r.write(QUILL, author({ name: 'Quill', kind: 'ai', bio: 'Changed.' })));
  const judge = tempDir('author-judge-');
  for (const name of ['check-publisher-paths.mjs', 'slug.mjs']) copyFileSync(new URL(`./${name}`, import.meta.url), join(judge, name));
  const run = (env) => {
    try {
      return { code: 0, output: execFileSync(process.execPath, [join(judge, 'check-publisher-paths.mjs'), 'pr', '--base', repo.base, '--head', bio], { cwd: repo.dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH, ...env } }) };
    } catch (error) {
      return { code: error.status, output: `${error.stdout}${error.stderr}` };
    }
  };
  const missing = run(postsEnv('quill'));
  assert.equal(missing.code, 1, missing.output);
  assert.match(missing.output, /cannot be judged, so it fails .*the site's frontmatter reader cannot be loaded \(is the lockfile installed\?\)/);
  const comments = repo.head((r) => r.write(LANE_FILE));
  const publisher = execFileSync(process.execPath, [join(judge, 'check-publisher-paths.mjs'), 'pr', '--base', repo.base, '--head', comments], { cwd: repo.dir, encoding: 'utf8', env: { PATH: process.env.PATH, ...prEnv(PUBLISHER, PUBLISHER, MAINTAINER) } });
  assert.match(publisher, /1 changed file in this pull request, all src\/content\/comments/, 'the publisher’s lanes still need nothing but node');
});
