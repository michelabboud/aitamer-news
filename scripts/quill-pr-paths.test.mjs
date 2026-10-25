import assert from 'node:assert/strict';
import test from 'node:test';
import { chmodSync, copyFileSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  collectPullRequest, isQuillBranch, main, quillLaneProblems, quillLaneScope, QUILL_LANE_AUTHORS, SPECIMEN_LEDGER_PATH,
} from './check-publisher-paths.mjs';
import { gitIn, quietlyAsync, tempDir } from './test-support.mjs';

const QUILL = '9900007';
const MAINTAINER = '29182417';
const POST = 'src/content/posts/new-story.md';
const OLD_POST = 'src/content/posts/old-story.md';
const HUMAN_POST = 'src/content/posts/human-story.md';
const HISTORY = '0001 old-story\n';
// A body of its own per title, long enough that git never sees one post as a copy of another.
const post = (author, title = 'New story', extra = '') => `---\ntitle: ${title}\nauthor: ${author}\n${extra}---\n${`${title}: a line only this article has, number `.repeat(1)}${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${title.toUpperCase()} paragraph ${n} is written about ${title.split('').reverse().join('')}.`).join('\n')}\n`;
const env = (overrides = {}) => ({
  PR_ACTION: 'opened', PR_AUTHOR_ID: QUILL, EVENT_SENDER_ID: QUILL, MAINTAINER_ID: MAINTAINER,
  QUILL_ACTOR_ID: QUILL, PR_HEAD_REF: 'quill/new-story',
  PR_HEAD_REPO: 'owner/site', PR_BASE_REPO: 'owner/site', ...overrides,
});
const scope = (values = {}) => {
  const event = env(values);
  return quillLaneScope({
    action: event.PR_ACTION, authorId: event.PR_AUTHOR_ID, senderId: event.EVENT_SENDER_ID,
    quillActorId: event.QUILL_ACTOR_ID, headRef: event.PR_HEAD_REF,
    headRepo: event.PR_HEAD_REPO, baseRepo: event.PR_BASE_REPO,
  });
};

function repository(history = HISTORY) {
  const dir = tempDir('quill-paths-');
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
  write(OLD_POST, post('quill', 'Old story'));
  write(HUMAN_POST, post('michel', 'Human story'));
  write(SPECIMEN_LEDGER_PATH, history);
  write('src/lib/site.ts', 'export {};\n');
  const base = commit('base');
  git(['switch', '-q', '-c', 'quill/new-story']);
  return { dir, git, write, commit, base };
}

async function run(repo, overrides = {}, base = repo.base) {
  const head = repo.commit('proposal');
  const { result, output } = await quietlyAsync(() => main(['pr', '--base', base, '--head', head], env(overrides), repo.dir));
  return { code: result, output, head };
}

const addPost = (repo, author = 'quill') => repo.write(POST, post(author));

test('the lane lists exactly one author, quill', () => {
  assert.deepEqual([...QUILL_LANE_AUTHORS], ['quill']);
  assert.throws(() => QUILL_LANE_AUTHORS.push('ari'));
});

test('Quill requires both numeric identities, safe events, a valid branch and the trusted repository', () => {
  for (const PR_ACTION of ['opened', 'synchronize']) assert.equal(scope({ PR_ACTION }).applies, true);
  assert.equal(scope({ QUILL_ACTOR_ID: ` ${QUILL} ` }).applies, true);
  for (const overrides of [
    { PR_AUTHOR_ID: MAINTAINER }, { EVENT_SENDER_ID: MAINTAINER },
    { PR_AUTHOR_ID: '' }, { EVENT_SENDER_ID: '' },
    { QUILL_ACTOR_ID: undefined }, { QUILL_ACTOR_ID: '' }, { QUILL_ACTOR_ID: '   ' },
    { QUILL_ACTOR_ID: 'aitamer-quill-posts[bot]' }, { QUILL_ACTOR_ID: '0' }, { QUILL_ACTOR_ID: '09900007' },
    { QUILL_ACTOR_ID: '-1' }, { QUILL_ACTOR_ID: '1.5' },
    { PR_ACTION: 'edited' }, { PR_ACTION: 'reopened' }, { PR_ACTION: '' }, { PR_ACTION: undefined },
    { PR_HEAD_REF: 'posts/quill-story' }, { PR_HEAD_REF: 'quill/' }, { PR_HEAD_REF: 'grok/story' }, { PR_HEAD_REF: undefined },
    { PR_HEAD_REPO: 'fork/site' }, { PR_HEAD_REPO: undefined }, { PR_BASE_REPO: '' },
    { PR_HEAD_REPO: '', PR_BASE_REPO: '' }, { PR_HEAD_REPO: 'site', PR_BASE_REPO: 'site' },
  ]) assert.equal(scope(overrides).applies, false, JSON.stringify(overrides));
});

test('unsetting QUILL_ACTOR_ID closes the lane: the same pull request is then held to the publisher rule', async () => {
  const repo = repository();
  addPost(repo);
  const open = await run(repo);
  assert.equal(open.code, 0, open.output);
  const closed = await quietlyAsync(() => main(['pr', '--base', repo.base, '--head', open.head], env({ QUILL_ACTOR_ID: undefined }), repo.dir));
  assert.equal(closed.result, 1, closed.output);
  assert.match(closed.output, /outside the publisher's lanes/);
});

test('Quill branch syntax accepts valid nonempty refs and refuses Git revision/ref hazards', () => {
  for (const branch of ['quill/story', 'quill/batch/story-1', 'quill/Story_1', 'quill/story.locked']) {
    assert.equal(isQuillBranch(branch), true, branch);
  }
  for (const branch of [
    '', 'quill', 'quill/', 'quill//story', 'quill/story/', 'quill/.story', 'quill/story.lock',
    'quill/news.lock/story', 'quill/story.', 'quill/a..b', 'quill/a@{b', 'grok/story',
    'quill/story~1', 'quill/story^', 'quill/a:b', 'quill/a?b', 'quill/a*b', 'quill/a[b',
    'quill/a\\b', 'quill/a b', 'quill/a\nb', 'quill/a\u0000b', 'quill/a\u007fb', undefined,
  ]) assert.equal(isQuillBranch(branch), false, String(branch));
});

test('CLI: Quill can add and correct its own posts and append to the specimen ledger', async () => {
  const repo = repository();
  addPost(repo);
  repo.write(OLD_POST, post('quill', 'Old story corrected'));
  repo.write(SPECIMEN_LEDGER_PATH, `${HISTORY}0002 new-story\n`);
  const result = await run(repo);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /in the Quill App's content lane/);
});

test('CLI: wrong identity, configuration, event, branch or repository never admits a post', async () => {
  const repo = repository();
  addPost(repo);
  for (const values of [
    { PR_AUTHOR_ID: '4242' }, { EVENT_SENDER_ID: '4242' },
    { PR_AUTHOR_ID: 'aitamer-quill-posts[bot]' }, { EVENT_SENDER_ID: 'aitamer-quill-posts[bot]' },
    { QUILL_ACTOR_ID: '' }, { QUILL_ACTOR_ID: 'aitamer-quill-posts[bot]' }, { QUILL_ACTOR_ID: '0' },
    { PR_ACTION: 'edited' }, { PR_ACTION: 'reopened' }, { PR_HEAD_REF: 'other/story' }, { PR_HEAD_REF: 'grok/story' },
    { PR_HEAD_REPO: 'fork/site' }, { PR_BASE_REPO: undefined },
  ]) {
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${JSON.stringify(values)}: ${result.output}`);
    assert.match(result.output, /outside the publisher's lanes/);
  }
});

test('CLI: Quill cannot change MDX, nested/bad post names, profiles, comments, configuration or workflows', async () => {
  for (const path of [
    'src/content/posts/new-story.mdx', 'src/content/posts/nested/new-story.md',
    'src/content/posts/Story.md', 'src/content/posts/new-story.md\n',
    'src/content/authors/quill.md', 'src/content/comments/new-story.json',
    'src/content/reactions/new-story.json', '.github/workflows/check-publisher-pr.yml',
    'package.json', 'src/lib/site.ts',
  ]) {
    const repo = repository();
    repo.write(path, 'a proposed change\n');
    const result = await run(repo);
    assert.equal(result.code, 1, path);
    assert.match(result.output, /outside the Quill lane/, path);
  }
});

test('CLI: Quill cannot delete, rename or copy posts, or add symlinks and executables', async () => {
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

test('CLI: Quill cannot rewrite, truncate, delete or change the ledger mode', async () => {
  for (const change of [
    (repo) => repo.write(SPECIMEN_LEDGER_PATH, '0001 impostor\n0002 new-story\n'),
    (repo) => repo.write(SPECIMEN_LEDGER_PATH, ''),
    (repo) => rmSync(join(repo.dir, SPECIMEN_LEDGER_PATH)),
    (repo) => chmodSync(join(repo.dir, SPECIMEN_LEDGER_PATH), 0o755),
  ]) {
    const repo = repository();
    addPost(repo);
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, result.output);
  }
});

test('the byline is bound: a new post must be written by quill', async () => {
  for (const author of ['michel', 'ari', 'foxy', 'grok-bot', 'Quill', 'QUILL', 'quill ', 'quill-2']) {
    const repo = repository();
    addPost(repo, JSON.stringify(author));
    const result = await run(repo);
    assert.equal(result.code, 1, `${author}: ${result.output}`);
    assert.match(result.output, /author/);
    assert.match(result.output, /not quill|only quill/);
  }
});

test('the byline is bound: no author, a non-string author or a list of authors is refused', async () => {
  for (const text of [
    '---\ntitle: New story\n---\nBody\n',
    '---\ntitle: New story\nauthor:\n---\nBody\n',
    '---\ntitle: New story\nauthor: 7\n---\nBody\n',
    '---\ntitle: New story\nauthor: [quill, michel]\n---\nBody\n',
    '---\ntitle: New story\nauthor:\n  - quill\n---\nBody\n',
    'Body without any frontmatter\n',
  ]) {
    const repo = repository();
    repo.write(POST, text);
    const result = await run(repo);
    assert.equal(result.code, 1, `${JSON.stringify(text)}: ${result.output}`);
    assert.match(result.output, /author/);
  }
});

test('the byline is bound: forms two readers could read differently are refused, not guessed', async () => {
  for (const text of [
    '---\ntitle: New story\nauthor: quill\nauthor: michel\n---\nBody\n',
    '---\n<<: {author: michel}\ntitle: New story\nauthor: quill\n---\nBody\n',
    '---\nauthor: &a quill\ntitle: New story\n---\nBody\n',
    '+++\nauthor = "michel"\n+++\n---\nauthor: quill\n---\nBody\n',
    '﻿---\ntitle: New story\nauthor: quill\n---\nBody\n',
    '---\r\ntitle: New story\r\nauthor: quill\r\n---\r\nBody\r\n',
  ]) {
    const repo = repository();
    repo.write(POST, text);
    const result = await run(repo);
    assert.equal(result.code, 1, `${JSON.stringify(text)}: ${result.output}`);
    assert.match(result.output, /cannot be read|author/);
  }
});

test('the byline is bound: Quill cannot edit a human or another writer\'s article, even by claiming it', async () => {
  for (const edited of [post('michel', 'Human story corrected'), post('quill', 'Human story, now quill'), post('ari', 'Human story, now ari')]) {
    const repo = repository();
    repo.write(HUMAN_POST, edited);
    const result = await run(repo);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /human-story\.md/);
    assert.match(result.output, /not written by quill|not quill|only quill/);
  }
});

test('the byline is bound: Quill cannot hand its own article to someone else', async () => {
  const repo = repository();
  repo.write(OLD_POST, post('michel', 'Old story'));
  const result = await run(repo);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /old-story\.md/);
});

test('a stale branch is judged on today\'s byline: an article main since gave to someone else stays untouchable', async () => {
  const repo = repository();
  repo.write(OLD_POST, post('quill', 'Old story, corrected'));
  const head = repo.commit('stale correction');
  repo.git(['switch', '-q', 'main']);
  repo.write(OLD_POST, post('michel', 'Old story'));
  const base = repo.commit('main reassigns the article');
  const { result, output } = await quietlyAsync(() => main(['pr', '--base', base, '--head', head], env(), repo.dir));
  assert.equal(result, 1, output);
  assert.match(output, /old-story\.md/);
});

test('quillLaneProblems is pure over its inputs: the reader is injected, and a reader that throws is a problem, not a pass', () => {
  const repo = repository();
  addPost(repo);
  const head = repo.commit('proposal');
  const collected = collectPullRequest({ cwd: repo.dir, base: repo.base, head });
  assert.deepEqual(quillLaneProblems({ cwd: repo.dir, collected, readPost: () => ({ data: { author: 'quill' } }) }), []);
  const throwing = quillLaneProblems({ cwd: repo.dir, collected, readPost: () => { throw new Error('boom'); } });
  assert.equal(throwing.length, 1);
  assert.match(throwing[0], /cannot be read/);
  const nothing = quillLaneProblems({ cwd: repo.dir, collected, readPost: () => null });
  assert.equal(nothing.length, 1);
});

test('a stale Quill branch preserves current main history even when its ledger was unchanged', async () => {
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

test('other actors keep the maintainer exemption, the publisher’s empty rule and push behavior; Quill gets nothing outside its lane', async () => {
  const repo = repository();
  addPost(repo);
  assert.equal((await run(repo, { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: MAINTAINER })).code, 0);
  assert.equal((await run(repo, { PR_AUTHOR_ID: '4242', EVENT_SENDER_ID: '4242' })).code, 1);
  const comments = repository();
  comments.write('src/content/comments/old-story.json', '{}\n');
  assert.equal((await run(comments, { PR_AUTHOR_ID: '4242', EVENT_SENDER_ID: '4242' })).code, 1, 'the publisher has no lane since ADR 0047');
  assert.equal((await run(comments)).code, 1, 'the Quill content lane does not acquire the publisher lanes');
  const head = repo.git(['rev-parse', 'HEAD']).trim();
  const push = await quietlyAsync(() => main(['push', '--before', repo.base, '--after', head], env(), repo.dir));
  assert.equal(push.result, 1, 'the Quill lane never applies to push mode');
});
