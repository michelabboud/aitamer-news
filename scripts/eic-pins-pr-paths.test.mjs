// The desk editor App's pins lane in the publisher path guard (ADR 0050): exactly
// src/data/pins.json, added or modified, a plain file, from an eic/pins-<suffix> branch whose
// pull request author and event sender are both EIC_ACTOR_ID. Every other actor keeps failing.
import assert from 'node:assert/strict';
import test from 'node:test';
import { chmodSync, copyFileSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  collectPullRequest, isPinsBranch, main, pinsLaneProblems, pinsLaneScope, PINS_BRANCH_SUFFIX_MAX_LENGTH, PINS_PATH,
  SPECIMEN_LEDGER_PATH,
} from './check-publisher-paths.mjs';
import { gitIn, quietlyAsync, tempDir } from './test-support.mjs';

const EIC = '350852201';
const GROK = '9900005';
const QUILL = '9900007';
const POSTS = '9900002';
const MAINTAINER = '29182417';
const TOPICS = 'src/data/topics.json';
const POST = 'src/content/posts/new-story.md';
const pins = (slug = 'old-story') => `${JSON.stringify({ pins: [{ slug, source: 'manual', pinnedBy: 'eic', pinnedAt: '2026-10-31T10:00:00Z' }] }, null, 2)}\n`;
// Long and unlike pins.json, so git never sees pins.json as a copy of it unless it is one.
const topics = `${JSON.stringify(Object.fromEntries(Array.from({ length: 24 }, (_, n) => [`topic-${n}`, { title: `Topic number ${n}`, blurb: `What topic ${n} covers, in a sentence of its own.` }])), null, 2)}\n`;

const env = (overrides = {}) => ({
  PR_ACTION: 'opened', PR_AUTHOR_ID: EIC, EVENT_SENDER_ID: EIC, MAINTAINER_ID: MAINTAINER,
  EIC_ACTOR_ID: EIC, GROK_ACTOR_ID: GROK, QUILL_ACTOR_ID: QUILL, POSTS_ACTOR_ID: POSTS,
  PR_HEAD_REF: 'eic/pins-1793476936',
  PR_HEAD_REPO: 'owner/site', PR_BASE_REPO: 'owner/site', ...overrides,
});
const scope = (values = {}) => {
  const event = env(values);
  return pinsLaneScope({
    action: event.PR_ACTION, authorId: event.PR_AUTHOR_ID, senderId: event.EVENT_SENDER_ID,
    eicActorId: event.EIC_ACTOR_ID, headRef: event.PR_HEAD_REF,
    headRepo: event.PR_HEAD_REPO, baseRepo: event.PR_BASE_REPO,
  });
};

/** A repository with topics, a post and the ledger on main; `withPins` puts pins.json on main too. */
function repository({ withPins = true } = {}) {
  const dir = tempDir('eic-pins-');
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
  write(TOPICS, topics);
  write('src/content/posts/old-story.md', '---\ntitle: Old story\nauthor: michel\n---\nBody\n');
  write(SPECIMEN_LEDGER_PATH, '0001 old-story\n');
  if (withPins) write(PINS_PATH, pins());
  const base = commit('base');
  git(['switch', '-q', '-c', 'eic/pins-1793476936']);
  return { dir, git, write, commit, base };
}

async function run(repo, overrides = {}) {
  const head = repo.commit('proposal');
  const { result, output } = await quietlyAsync(() => main(['pr', '--base', repo.base, '--head', head], env(overrides), repo.dir));
  return { code: result, output, head };
}

const changePins = (repo) => repo.write(PINS_PATH, pins('new-story'));

test('the pins lane needs both numeric identities, a safe event, an eic/pins- branch and the trusted repository', () => {
  for (const PR_ACTION of ['opened', 'synchronize']) assert.equal(scope({ PR_ACTION }).applies, true);
  assert.equal(scope({ EIC_ACTOR_ID: ` ${EIC} ` }).applies, true);
  for (const overrides of [
    { PR_AUTHOR_ID: MAINTAINER }, { EVENT_SENDER_ID: MAINTAINER }, { PR_AUTHOR_ID: GROK, EVENT_SENDER_ID: GROK },
    { PR_AUTHOR_ID: '' }, { EVENT_SENDER_ID: '' }, { PR_AUTHOR_ID: 'aitamer-desk-editor[bot]' },
    { EIC_ACTOR_ID: undefined }, { EIC_ACTOR_ID: '' }, { EIC_ACTOR_ID: '   ' },
    { EIC_ACTOR_ID: 'aitamer-desk-editor[bot]' }, { EIC_ACTOR_ID: '0' }, { EIC_ACTOR_ID: `0${EIC}` },
    { EIC_ACTOR_ID: '-1' }, { EIC_ACTOR_ID: '1.5' },
    { PR_ACTION: 'edited' }, { PR_ACTION: 'reopened' }, { PR_ACTION: 'closed' }, { PR_ACTION: '' }, { PR_ACTION: undefined },
    { PR_HEAD_REF: 'eic/posts-1' }, { PR_HEAD_REF: 'eic/pins-' }, { PR_HEAD_REF: 'grok/pins-1' }, { PR_HEAD_REF: undefined },
    { PR_HEAD_REPO: 'fork/site' }, { PR_HEAD_REPO: undefined }, { PR_BASE_REPO: '' },
    { PR_HEAD_REPO: '', PR_BASE_REPO: '' }, { PR_HEAD_REPO: 'site', PR_BASE_REPO: 'site' },
  ]) assert.equal(scope(overrides).applies, false, JSON.stringify(overrides));
  assert.equal(scope({ PR_AUTHOR_ID: GROK }).eicApp, false, 'not the desk editor App at all');
  assert.equal(scope({ PR_ACTION: 'edited' }).eicApp, true, 'the App, refused for its event');
});

test('the branch suffix is strict: lowercase letters and digits in hyphen-joined runs, at most 64 characters', () => {
  for (const branch of ['eic/pins-1', 'eic/pins-1793476936', 'eic/pins-auto-20261031t1000z', 'eic/pins-a1-b2-c3', `eic/pins-${'a'.repeat(PINS_BRANCH_SUFFIX_MAX_LENGTH)}`]) {
    assert.equal(isPinsBranch(branch), true, branch);
  }
  for (const branch of [
    '', 'eic', 'eic/', 'eic/pins', 'eic/pins-', 'eic/pins--a', 'eic/pins-a-', 'eic/pins-a--b', 'eic/pins-A',
    'eic/pins-a_b', 'eic/pins-a.b', 'eic/pins-a.lock', 'eic/pins-a/b', 'eic/pins-a b', 'eic/pins-a\nb',
    'eic/pins-a\u0000b', 'eic/pins-é', 'eic/pins-a~1', 'eic/pins-a^', 'eic/pins-a@{1}', 'eic/pins-a..b',
    'eic/posts-a', 'eic/pin-a', 'eic/pinsa', 'EIC/pins-a', 'grok/pins-a', 'pins-a', 'refs/heads/eic/pins-a',
    `eic/pins-${'a'.repeat(PINS_BRANCH_SUFFIX_MAX_LENGTH + 1)}`, undefined, 7,
  ]) assert.equal(isPinsBranch(branch), false, JSON.stringify(branch));
});

test('CLI: the desk editor App may modify src/data/pins.json, and add it when main has none', async () => {
  const modify = repository();
  changePins(modify);
  const modified = await run(modify);
  assert.equal(modified.code, 0, modified.output);
  assert.match(modified.output, /1 changed file in this pull request, src\/data\/pins\.json, a plain file added or modified \(in the desk editor App's pins lane/);
  const add = repository({ withPins: false });
  changePins(add);
  const added = await run(add, { PR_ACTION: 'synchronize' });
  assert.equal(added.code, 0, added.output);
});

test('unsetting EIC_ACTOR_ID closes the lane: the same pull request is then held to the publisher rule', async () => {
  const repo = repository();
  changePins(repo);
  const open = await run(repo);
  assert.equal(open.code, 0, open.output);
  for (const EIC_ACTOR_ID of [undefined, '', 'aitamer-desk-editor[bot]', '0']) {
    const closed = await quietlyAsync(() => main(['pr', '--base', repo.base, '--head', open.head], env({ EIC_ACTOR_ID }), repo.dir));
    assert.equal(closed.result, 1, `${JSON.stringify(EIC_ACTOR_ID)}: ${closed.output}`);
    assert.match(closed.output, /"src\/data\/pins\.json"|src\/data\/pins\.json: outside the publisher's lanes/);
  }
});

test('CLI: the wrong identity, event, branch or repository never admits a pin, and the refusal says why', async () => {
  for (const [values, why] of [
    [{ PR_AUTHOR_ID: '4242' }, /the author is not the maintainer/],
    [{ EVENT_SENDER_ID: '4242' }, /not in the pins lane because the desk editor App’s pull request, but this event’s sender is someone else/],
    [{ EVENT_SENDER_ID: MAINTAINER }, /this event’s sender is someone else/],
    [{ PR_ACTION: 'edited' }, /not in the pins lane because a "edited" event does not show who pushed the head/],
    [{ PR_ACTION: 'reopened' }, /not in the pins lane because a "reopened" event does not show who pushed the head/],
    [{ PR_HEAD_REF: 'eic/posts-1' }, /not in the pins lane because the head branch "eic\/posts-1" is not a valid nonempty eic\/pins-<suffix> branch/],
    [{ PR_HEAD_REF: 'other/pins-1' }, /is not a valid nonempty eic\/pins-<suffix> branch/],
    [{ PR_HEAD_REF: 'eic/pins-Bad_Suffix' }, /"eic\/pins-Bad_Suffix" is not a valid nonempty eic\/pins-<suffix> branch/],
    [{ PR_HEAD_REF: 'eic/pins-a/b' }, /is not a valid nonempty eic\/pins-<suffix> branch/],
    [{ PR_HEAD_REPO: 'fork/site' }, /not in the pins lane because the head repository does not match the trusted base repository/],
    [{ PR_BASE_REPO: undefined }, /the head repository does not match/],
    [{ EIC_ACTOR_ID: undefined }, /held to the rule because the author is not the maintainer\):/],
  ]) {
    const repo = repository();
    changePins(repo);
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${JSON.stringify(values)}: ${result.output}`);
    assert.match(result.output, /src\/data\/pins\.json: outside the publisher's lanes; the publisher may change nothing/, JSON.stringify(values));
    assert.match(result.output, why, `${JSON.stringify(values)}: ${result.output}`);
  }
});

test('CLI: the pins lane changes exactly one file; a second file, or none, is refused by name', async () => {
  for (const [change, listed] of [
    [(repo) => { changePins(repo); repo.write(POST, '---\ntitle: New story\nauthor: michel\n---\nBody\n'); }, /changes 2 \("src\/content\/posts\/new-story\.md", "src\/data\/pins\.json"\)/],
    [(repo) => { changePins(repo); repo.write(TOPICS, `${topics}\n`); }, /changes 2 \("src\/data\/pins\.json", "src\/data\/topics\.json"\)/],
    [(repo) => { changePins(repo); repo.write(SPECIMEN_LEDGER_PATH, '0001 old-story\n0002 new-story\n'); }, /changes 2 /],
    [() => {}, /changes 0 \(none\)/],
  ]) {
    const repo = repository();
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /the pins lane changes exactly one file, src\/data\/pins\.json; this pull request changes/);
    assert.match(result.output, listed);
  }
});

test('CLI: one file that is not src/data/pins.json is outside the pins lane', async () => {
  for (const path of [
    TOPICS, 'src/data/pins.json5', 'src/data/Pins.json', 'src/data/pins/pins.json', 'data/pins.json', 'src/data/pins.json.bak',
    POST, '.github/workflows/check-publisher-pr.yml', 'scripts/check-publisher-paths.mjs', 'package.json',
  ]) {
    const repo = repository();
    repo.write(path, path === TOPICS ? `${topics}\n` : 'a proposed change\n');
    const result = await run(repo);
    assert.equal(result.code, 1, path);
    assert.match(result.output, new RegExp(`${JSON.stringify(path).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}: outside the pins lane; only src/data/pins\\.json may change`), result.output);
  }
});

test('CLI: the pins lane refuses deleting, renaming or copying pins.json, a symlink and the executable bit', async () => {
  for (const [label, withPins, change, expected] of [
    ['delete', true, (repo) => rmSync(join(repo.dir, PINS_PATH)), /"src\/data\/pins\.json": deleted; the pins lane only adds or modifies src\/data\/pins\.json/],
    ['rename into pins.json', false, (repo) => repo.git(['mv', TOPICS, PINS_PATH]), /"src\/data\/pins\.json": renamed from "src\/data\/topics\.json"; the pins lane only adds or modifies/],
    ['rename out of pins.json', true, (repo) => repo.git(['mv', PINS_PATH, 'src/data/pins-old.json']), /"src\/data\/pins-old\.json": outside the pins lane[^]*renamed from "src\/data\/pins\.json"/],
    ['copy', false, (repo) => copyFileSync(join(repo.dir, TOPICS), join(repo.dir, PINS_PATH)), /"src\/data\/pins\.json": copied from "src\/data\/topics\.json"; the pins lane only adds or modifies/],
    ['symlink', false, (repo) => symlinkSync('topics.json', join(repo.dir, PINS_PATH)), /"src\/data\/pins\.json": mode "120000" \(a symbolic link\) is refused; only a plain file \(100644\)/],
    ['symlink replacing the file', true, (repo) => { rmSync(join(repo.dir, PINS_PATH)); symlinkSync('topics.json', join(repo.dir, PINS_PATH)); }, /"src\/data\/pins\.json"/],
    ['executable', true, (repo) => { changePins(repo); chmodSync(join(repo.dir, PINS_PATH), 0o755); }, /"src\/data\/pins\.json": mode "100755" \(an executable\) is refused/],
    ['executable bit only', true, (repo) => chmodSync(join(repo.dir, PINS_PATH), 0o755), /mode "100755" \(an executable\) is refused/],
  ]) {
    const repo = repository({ withPins });
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, `${label}: ${result.output}`);
    assert.match(result.output, /this pull request changes what the desk editor App may not/, label);
    assert.match(result.output, expected, `${label}: ${result.output}`);
  }
});

test('CLI: a submodule at src/data/pins.json is refused', () => {
  const repo = repository({ withPins: false });
  repo.git(['update-index', '--add', '--cacheinfo', `160000,${repo.base},${PINS_PATH}`]);
  repo.git(['commit', '-q', '-m', 'submodule']);
  const head = repo.git(['rev-parse', 'HEAD']).trim();
  const problems = pinsLaneProblems(collectPullRequest({ cwd: repo.dir, base: repo.base, head, copies: true }));
  assert.deepEqual(problems, ['"src/data/pins.json": mode "160000" (a submodule) is refused; only a plain file (100644) may be added or changed']);
});

test('pinsLaneProblems is pure over the collected changes', () => {
  const modes = new Map([[PINS_PATH, '100644']]);
  assert.deepEqual(pinsLaneProblems({ changes: [{ status: 'M', path: PINS_PATH }], modes }), []);
  assert.deepEqual(pinsLaneProblems({ changes: [{ status: 'A', path: PINS_PATH }], modes }), []);
  assert.match(pinsLaneProblems({ changes: [{ status: 'T', path: PINS_PATH }], modes })[0], /changed with status "T"/);
  assert.match(pinsLaneProblems({ changes: [{ status: 'M', path: PINS_PATH }], modes: new Map() })[0], /mode undefined \(an unknown kind\)/);
});

test('every other App touching src/data/pins.json fails: Grok, Quill, the posts App, the publisher, Cursor', async () => {
  for (const [label, values, expected] of [
    ['Grok on its own branch', { PR_AUTHOR_ID: GROK, EVENT_SENDER_ID: GROK, PR_HEAD_REF: 'grok/pin-story' }, /"src\/data\/pins\.json": outside the Grok lane/],
    ['Grok on an eic/pins- branch', { PR_AUTHOR_ID: GROK, EVENT_SENDER_ID: GROK }, /outside the publisher's lanes/],
    ['Quill on its own branch', { PR_AUTHOR_ID: QUILL, EVENT_SENDER_ID: QUILL, PR_HEAD_REF: 'quill/pin-story' }, /"src\/data\/pins\.json": outside the Quill lane/],
    ['the posts App on an authors branch', { PR_AUTHOR_ID: POSTS, EVENT_SENDER_ID: POSTS, PR_HEAD_REF: 'desk/authors-desk1-0123456789abcdef-quill' }, /src\/data\/pins\.json[^]*not an author file/],
    ['the posts App on an eic/pins- branch', { PR_AUTHOR_ID: POSTS, EVENT_SENDER_ID: POSTS }, /not in the authors lane[^]*outside the publisher's lanes/],
    ['the publisher', { PR_AUTHOR_ID: '9900001', EVENT_SENDER_ID: '9900001' }, /outside the publisher's lanes/],
    ['Cursor', { PR_AUTHOR_ID: '9900009', EVENT_SENDER_ID: '9900009', PR_HEAD_REF: 'cursor/pin-story' }, /outside the publisher's lanes/],
    ['the desk editor App pushing into Grok’s pull request', { PR_AUTHOR_ID: GROK, PR_ACTION: 'synchronize' }, /outside the/],
    ['Grok pushing into the desk editor App’s pull request', { EVENT_SENDER_ID: GROK, PR_ACTION: 'synchronize' }, /outside the publisher's lanes/],
  ]) {
    const repo = repository();
    changePins(repo);
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${label}: ${result.output}`);
    assert.match(result.output, expected, `${label}: ${result.output}`);
  }
});

test('the maintainer stays exempt; the pins lane never applies to a push; the desk editor App gets nothing else', async () => {
  const repo = repository();
  changePins(repo);
  repo.write(POST, '---\ntitle: New story\nauthor: michel\n---\nBody\n');
  const maintainer = await run(repo, { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: MAINTAINER });
  assert.equal(maintainer.code, 0, maintainer.output);
  assert.match(maintainer.output, /both the maintainer/);
  const push = await quietlyAsync(() => main(['push', '--before', repo.base, '--after', maintainer.head], env(), repo.dir));
  assert.equal(push.result, 1, push.output);
  assert.match(push.output, /src\/data\/pins\.json: outside the publisher's lanes/);
  const post = repository();
  post.write(POST, '---\ntitle: New story\nauthor: quill\n---\nBody\n');
  const result = await run(post);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /outside the pins lane/);
});
