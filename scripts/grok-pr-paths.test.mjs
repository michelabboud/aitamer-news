import assert from 'node:assert/strict';
import test from 'node:test';
import { chmodSync, copyFileSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { collectPullRequest, grokLaneProblems, grokLaneScope, isGrokBranch, main, SPECIMEN_LEDGER_PATH } from './check-publisher-paths.mjs';
import { gitIn, quietlyAsync, tempDir } from './test-support.mjs';

const GROK = '9900003';
const MAINTAINER = '29182417';
const POST = 'src/content/posts/new-story.md';
const OLD_POST = 'src/content/posts/old-story.md';
const HISTORY = '0001 old-story\n';
const env = (overrides = {}) => ({
  PR_ACTION: 'opened', PR_AUTHOR_ID: GROK, EVENT_SENDER_ID: GROK, MAINTAINER_ID: MAINTAINER,
  GROK_ACTOR_ID: GROK, PR_HEAD_REF: 'grok/new-story',
  PR_HEAD_REPO: 'owner/site', PR_BASE_REPO: 'owner/site', ...overrides,
});
const scope = (values = {}) => {
  const event = env(values);
  return grokLaneScope({
    action: event.PR_ACTION, authorId: event.PR_AUTHOR_ID, senderId: event.EVENT_SENDER_ID,
    grokActorId: event.GROK_ACTOR_ID, headRef: event.PR_HEAD_REF,
    headRepo: event.PR_HEAD_REPO, baseRepo: event.PR_BASE_REPO,
  });
};

function repository(history = HISTORY) {
  const dir = tempDir('grok-paths-');
  const git = gitIn(dir);
  const write = (path, contents) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), contents);
  };
  const commit = (message) => {
    git(['add', '-A']);
    git(['commit', '-q', '--allow-empty', '-m', message]);
    return git(['rev-parse', 'HEAD']).trim();
  };
  write(OLD_POST, '---\ntitle: Old story\n---\nAn existing story, with its original body.\n');
  write(SPECIMEN_LEDGER_PATH, history);
  write('src/lib/site.ts', 'export {};\n');
  const base = commit('base');
  git(['switch', '-q', '-c', 'grok/new-story']);
  return { dir, git, write, commit, base };
}

async function run(repo, overrides = {}, base = repo.base) {
  const head = repo.commit('proposal');
  const { result, output } = await quietlyAsync(() => main(['pr', '--base', base, '--head', head], env(overrides), repo.dir));
  return { code: result, output, head };
}

const addPost = (repo) => repo.write(POST, '---\ntitle: New story\n---\nA different newly researched article.\n');

test('Grok requires both numeric identities, safe events, a valid branch and the trusted repository', () => {
  for (const PR_ACTION of ['opened', 'synchronize']) assert.equal(scope({ PR_ACTION }).applies, true);
  assert.equal(scope({ GROK_ACTOR_ID: ` ${GROK} ` }).applies, true);
  for (const overrides of [
    { PR_AUTHOR_ID: MAINTAINER }, { EVENT_SENDER_ID: MAINTAINER },
    { PR_AUTHOR_ID: '' }, { EVENT_SENDER_ID: '' },
    { GROK_ACTOR_ID: undefined }, { GROK_ACTOR_ID: '' }, { GROK_ACTOR_ID: '   ' },
    { GROK_ACTOR_ID: 'grok-bots-app[bot]' }, { GROK_ACTOR_ID: '0' }, { GROK_ACTOR_ID: '09900003' },
    { GROK_ACTOR_ID: '-1' }, { GROK_ACTOR_ID: '1.5' },
    { PR_ACTION: 'edited' }, { PR_ACTION: 'reopened' }, { PR_ACTION: '' }, { PR_ACTION: undefined },
    { PR_HEAD_REF: 'posts/grok-story' }, { PR_HEAD_REF: 'grok/' }, { PR_HEAD_REF: undefined },
    { PR_HEAD_REPO: 'fork/site' }, { PR_HEAD_REPO: undefined }, { PR_BASE_REPO: '' },
    { PR_HEAD_REPO: '', PR_BASE_REPO: '' }, { PR_HEAD_REPO: 'site', PR_BASE_REPO: 'site' },
  ]) assert.equal(scope(overrides).applies, false, JSON.stringify(overrides));
});

test('Grok branch syntax accepts valid nonempty refs and refuses Git revision/ref hazards', () => {
  for (const branch of ['grok/story', 'grok/news/story-1', 'grok/Story_1', 'grok/@', 'grok/story.locked']) {
    assert.equal(isGrokBranch(branch), true, branch);
  }
  for (const branch of [
    '', 'grok', 'grok/', 'grok//story', 'grok/story/', 'grok/.story', 'grok/story.lock',
    'grok/news/.story', 'grok/news.lock/story', 'grok/story.', 'grok/a..b', 'grok/a@{b',
    'grok/story~1', 'grok/story^', 'grok/a:b', 'grok/a?b', 'grok/a*b', 'grok/a[b',
    'grok/a\\b', 'grok/a b', 'grok/a\nb', 'grok/a\u0000b', 'grok/a\u007fb', undefined,
  ]) assert.equal(isGrokBranch(branch), false, String(branch));
});

test('CLI: Grok can add/modify Markdown posts and append to the specimen ledger', async () => {
  const repo = repository();
  addPost(repo);
  repo.write(OLD_POST, '---\ntitle: Corrected story\n---\nA sourced correction.\n');
  repo.write(SPECIMEN_LEDGER_PATH, `${HISTORY}0002 new-story\n`);
  const result = await run(repo);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /in the Grok App's content lane/);
});

test('CLI: wrong identity, configuration, event, branch or repository never admits a post', async () => {
  const repo = repository();
  addPost(repo);
  for (const values of [
    { PR_AUTHOR_ID: '4242' }, { EVENT_SENDER_ID: '4242' },
    { PR_AUTHOR_ID: 'grok-bots-app[bot]' }, { EVENT_SENDER_ID: 'grok-bots-app[bot]' },
    { GROK_ACTOR_ID: '' }, { GROK_ACTOR_ID: 'grok-bots-app[bot]' }, { GROK_ACTOR_ID: '0' },
    { PR_ACTION: 'edited' }, { PR_ACTION: 'reopened' }, { PR_HEAD_REF: 'other/story' },
    { PR_HEAD_REPO: 'fork/site' }, { PR_BASE_REPO: undefined },
  ]) {
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${JSON.stringify(values)}: ${result.output}`);
    assert.match(result.output, /outside the publisher's lanes/);
  }
});

test('CLI: Grok cannot change MDX, nested/bad post names, profiles, comments, configuration or workflows', async () => {
  for (const path of [
    'src/content/posts/new-story.mdx', 'src/content/posts/nested/new-story.md',
    'src/content/posts/Story.md', 'src/content/posts/new-story.md\n',
    'src/content/authors/grok.md', 'src/content/comments/new-story.json',
    'src/content/reactions/new-story.json', '.github/workflows/check-publisher-pr.yml',
    'package.json', 'src/lib/site.ts',
  ]) {
    const repo = repository();
    repo.write(path, 'a proposed change\n');
    const result = await run(repo);
    assert.equal(result.code, 1, path);
    assert.match(result.output, /outside the Grok lane/, path);
  }
});

test('CLI: Grok cannot delete, rename or copy posts, or add symlinks and executables', async () => {
  for (const [change, expected] of [
    [(repo) => rmSync(join(repo.dir, OLD_POST)), /status "D" is refused/],
    [(repo) => repo.git(['mv', OLD_POST, POST]), /status "R" is refused/],
    [(repo) => copyFileSync(join(repo.dir, OLD_POST), join(repo.dir, POST)), /status "C" is refused/],
    [(repo) => symlinkSync('../../lib/site.ts', join(repo.dir, POST)), /mode "120000" is refused/],
    [(repo) => { addPost(repo); chmodSync(join(repo.dir, POST), 0o755); }, /mode "100755" is refused/],
  ]) {
    const repo = repository();
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, expected);
  }
});

test('CLI: Grok cannot rewrite, truncate, delete or change the ledger mode', async () => {
  for (const change of [
    (repo) => repo.write(SPECIMEN_LEDGER_PATH, '0001 impostor\n0002 new-story\n'),
    (repo) => repo.write(SPECIMEN_LEDGER_PATH, ''),
    (repo) => rmSync(join(repo.dir, SPECIMEN_LEDGER_PATH)),
    (repo) => chmodSync(join(repo.dir, SPECIMEN_LEDGER_PATH), 0o755),
  ]) {
    const repo = repository();
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, result.output);
  }
});

test('ledger history compares bytes, including invalid UTF-8 that a text decoder would replace', async () => {
  const history = Buffer.from([0x31, 0xff, 0x0a]);
  const repo = repository(history);
  repo.write(SPECIMEN_LEDGER_PATH, Buffer.from([0x31, 0xfe, 0x0a, 0x32, 0x0a]));
  const result = await run(repo);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /exact byte prefix at the merge base/);
});

test('a stale Grok branch preserves current main history even when its ledger was unchanged', async () => {
  for (const append of [false, true]) {
    const repo = repository();
    addPost(repo);
    if (append) repo.write(SPECIMEN_LEDGER_PATH, `${HISTORY}0003 new-story\n`);
    const head = repo.commit('stale content');
    repo.git(['switch', '-q', 'main']);
    repo.write(SPECIMEN_LEDGER_PATH, `${HISTORY}0002 another-story\n`);
    const base = repo.commit('main adds another specimen');
    const { result, output } = await quietlyAsync(() => main(['pr', '--base', base, '--head', head], env(), repo.dir));
    assert.equal(result, 1, output);
    assert.match(output, /exact byte prefix on main now/);
  }
});

test('current main history can be retained by a refreshed head, and unrelated base changes pass', async () => {
  const repo = repository();
  addPost(repo);
  repo.write(SPECIMEN_LEDGER_PATH, `${HISTORY}0002 new-story\n`);
  const head = repo.commit('content');
  repo.git(['switch', '-q', 'main']);
  repo.write('src/lib/site.ts', 'export const changed = true;\n');
  const base = repo.commit('unrelated main change');
  const collected = collectPullRequest({ cwd: repo.dir, base, head });
  assert.deepEqual(grokLaneProblems({ cwd: repo.dir, collected }), []);
  repo.git(['switch', '-q', 'grok/new-story']);
  repo.write(SPECIMEN_LEDGER_PATH, `${HISTORY}0002 another-story\n0003 new-story\n`);
  const refreshed = repo.commit('retain later specimens');
  repo.git(['switch', '-q', 'main']);
  repo.write(SPECIMEN_LEDGER_PATH, `${HISTORY}0002 another-story\n`);
  const newerBase = repo.commit('later specimen');
  const result = await quietlyAsync(() => main(['pr', '--base', newerBase, '--head', refreshed], env(), repo.dir));
  assert.equal(result.result, 0, result.output);
});

test('other actors retain the maintainer exemption, publisher lanes and push behavior', async () => {
  const repo = repository();
  addPost(repo);
  assert.equal((await run(repo, { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: MAINTAINER })).code, 0);
  assert.equal((await run(repo, { PR_AUTHOR_ID: '4242', EVENT_SENDER_ID: '4242' })).code, 1);
  const comments = repository();
  comments.write('src/content/comments/old-story.json', '{}\n');
  assert.equal((await run(comments, { PR_AUTHOR_ID: '4242', EVENT_SENDER_ID: '4242' })).code, 0);
  assert.equal((await run(comments)).code, 1, 'Grok content lane does not acquire the publisher lanes');
  const head = repo.git(['rev-parse', 'HEAD']).trim();
  const push = await quietlyAsync(() => main(['push', '--before', repo.base, '--after', head], env(), repo.dir));
  assert.equal(push.result, 1, 'Grok lane never applies to push mode');
});
