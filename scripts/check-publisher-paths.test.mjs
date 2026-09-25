import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  COMMENT_FILE_PATH,
  EXEMPTING_ACTIONS,
  MODE_FILE,
  PUBLISHER_LANE,
  UnjudgeableError,
  accountId,
  changeProblems,
  collectPullRequest,
  collectPush,
  fileProblems,
  inPublisherLane,
  main,
  parseHeadModes,
  parseNameStatus,
  pullRequestScope,
} from './check-publisher-paths.mjs';
import { gitIn, quietly, tempDir } from './test-support.mjs';

const MAINTAINER = '29182417';
const PUBLISHER = '9900001';
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

test('the check imports nothing outside node: built-ins and its own dependency-free slug module', async () => {
  const { readFileSync } = await import('node:fs');
  const text = readFileSync(new URL('./check-publisher-paths.mjs', import.meta.url), 'utf8');
  const specifiers = [...text.matchAll(/^import .* from '([^']+)';$/gm)].map((match) => match[1]);
  assert.deepEqual(specifiers.sort(), ['./slug.mjs', 'node:child_process', 'node:url']);
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
  const inside = { status: 'R', from: `${PUBLISHER_LANE}old-slug.json`, path: LANE_FILE };
  assert.deepEqual(fileProblems(inside, plain(LANE_FILE)), []);
  const fromOutside = { status: 'R', from: 'src/lib/site.ts', path: LANE_FILE };
  assert.match(fileProblems(fromOutside, plain(LANE_FILE)).join('\n'), /renamed from src\/lib\/site\.ts, which is outside/);
  const toOutside = { status: 'R', from: LANE_FILE, path: 'src/lib/site.ts' };
  assert.match(fileProblems(toOutside, plain('src/lib/site.ts')).join('\n'), /src\/lib\/site\.ts: outside the publisher's lane/);
  const noFrom = { status: 'R', path: LANE_FILE };
  assert.match(fileProblems(noFrom, plain(LANE_FILE)).join('\n'), /renamed from \(unknown\)/);
});

test('a path outside the lane is a problem whatever its status, deletion included', () => {
  for (const status of ['A', 'M', 'D', 'R', 'C', 'T']) {
    const problems = fileProblems({ status, from: 'README.md', path: 'README.md' }, plain('README.md'));
    assert.match(problems.join('\n'), /README\.md: outside the publisher's lane; only src\/content\/comments\/<slug>\.json may change/, status);
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
    { status: 'D', path: `${PUBLISHER_LANE}emptied-thread.json` },
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
  write(`${PUBLISHER_LANE}old-thread.json`);
  const root = commit('base');
  return { dir, git, write, commit, root };
}

test('a pull request is judged from the merge base: later main commits are not the branch’s', () => {
  const { dir, git, write, commit, root } = repository();
  git(['checkout', '-q', '-b', 'desk/comments-1']);
  write(LANE_FILE, '{"comments":[1,2,3],"slug":"grok-4-7","version":1}\n');
  rmSync(join(dir, PUBLISHER_LANE, 'old-thread.json'));
  const head = commit('comments');
  git(['checkout', '-q', 'main']);
  write('src/lib/site.ts', 'export const moved = 1;\n');
  const base = commit('main moves on');
  const { changes, modes } = collectPullRequest({ cwd: dir, base, head });
  assert.deepEqual(changes, [
    { status: 'A', path: LANE_FILE },
    { status: 'D', path: `${PUBLISHER_LANE}old-thread.json` },
  ]);
  assert.deepEqual(changeProblems({ changes, modes }), []);
  assert.notEqual(root, base);
});

test('real git output: a symlink, an executable and a rename from outside the lane are caught', () => {
  const { dir, git, write, commit } = repository();
  const base = git(['rev-parse', 'HEAD']).trim();
  git(['checkout', '-q', '-b', 'desk/comments-2']);
  symlinkSync('../../lib/site.ts', join(dir, `${PUBLISHER_LANE}link.json`));
  write(`${PUBLISHER_LANE}run.json`, '#!/bin/sh\n');
  chmodSync(join(dir, `${PUBLISHER_LANE}run.json`), 0o755);
  git(['mv', 'src/content/posts/grok-4-7.md', `${PUBLISHER_LANE}grok-4-7.json`]);
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

const cli = (argv, env, cwd) => {
  const { result, output } = quietly(() => main(argv, env, cwd));
  return { code: result, output };
};

test('CLI: a clean pull request passes, whoever sent it', () => {
  const { dir, base, clean } = pullRequests();
  const { code, output } = cli(['pr', '--base', base, '--head', clean], prEnv(PUBLISHER, PUBLISHER, MAINTAINER), dir);
  assert.equal(code, 0);
  assert.match(output, /1 changed file in this pull request, all src\/content\/comments\/<slug>\.json \(held to the rule because the author is not the maintainer\)\./);
});

test('CLI: the five scope cases on a pull request that touches code', () => {
  const { dir, base, dirty } = pullRequests();
  const run = (env) => cli(['pr', '--base', base, '--head', dirty], env, dir);
  const maintainerBoth = run(prEnv(MAINTAINER, MAINTAINER, MAINTAINER));
  assert.equal(maintainerBoth.code, 0);
  assert.match(maintainerBoth.output, /both the maintainer .*; nothing to enforce\./);
  const otherSender = run(prEnv(MAINTAINER, PUBLISHER, MAINTAINER));
  assert.equal(otherSender.code, 1);
  assert.match(otherSender.output, /this pull request changes what the publisher may not \(held to the rule because the maintainer’s pull request, but this event’s sender is someone else\):\n  src\/lib\/site\.ts: outside/);
  assert.equal(run(prEnv(PUBLISHER, MAINTAINER, MAINTAINER)).code, 1);
  const unset = run(prEnv(MAINTAINER, MAINTAINER, undefined));
  assert.equal(unset.code, 1);
  assert.match(unset.output, /MAINTAINER_ID is not set/);
  const login = run(prEnv(MAINTAINER, MAINTAINER, 'michelabboud'));
  assert.equal(login.code, 1);
  assert.match(login.output, /not a numeric account id/);
  assert.equal(run(prEnv(MAINTAINER, MAINTAINER, MAINTAINER, 'edited')).code, 1);
});

test('CLI: a head that is not in the clone fails (the verdict is pinned to one commit)', () => {
  const { dir, base } = pullRequests();
  const { code, output } = cli(['pr', '--base', base, '--head', 'a'.repeat(40)], prEnv(PUBLISHER, PUBLISHER, MAINTAINER), dir);
  assert.equal(code, 1);
  assert.match(output, /this pull request cannot be judged, so it fails \(.*\): git cat-file failed/);
});

test('CLI: push mode passes a comments-only push and fails anything else, or an unjudgeable before', () => {
  const { dir, base, clean, dirty } = pullRequests();
  assert.equal(cli(['push', '--before', base, '--after', clean], {}, dir).code, 0);
  const touched = cli(['push', '--before', clean, '--after', dirty], {}, dir);
  assert.equal(touched.code, 1);
  assert.match(touched.output, /this push changes what the publisher may not \(the pusher is the publisher\):\n  src\/lib\/site\.ts: outside/);
  const zeros = cli(['push', '--before', '0'.repeat(40), '--after', clean], {}, dir);
  assert.equal(zeros.code, 1);
  assert.match(zeros.output, /this push cannot be judged, so it fails \(the pusher is the publisher\): the push has no previous commit/);
  assert.equal(cli(['push', '--before', 'b'.repeat(40), '--after', clean], {}, dir).code, 1);
});

test('CLI: missing, unknown, repeated or mismatched arguments exit 2', () => {
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
    assert.equal(cli(argv, {}, '.').code, 2, argv.join(' '));
  }
});

test('the script runs as a program with a bare node, outside any npm context', () => {
  const { dir, base, clean } = pullRequests();
  const script = new URL('./check-publisher-paths.mjs', import.meta.url).pathname;
  const output = execFileSync(process.execPath, [script, 'push', '--before', base, '--after', clean], { cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.match(output, /1 changed file in this push/);
});
