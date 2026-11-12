// The series lane in the publisher path guard (ADR 0054): exactly src/data/series.json, modified,
// a plain file, from the Grok App on series/<suffix>, with the pull request's author and the
// event's sender both the Grok App. Cursor has no lane. Every other actor, file and branch keeps failing.
import assert from 'node:assert/strict';
import test from 'node:test';
import { chmodSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  collectPullRequest, isSeriesBranch, main, PINS_PATH, seriesLaneProblems, seriesLaneScope, SERIES_PATH,
  SPECIMEN_LEDGER_PATH,
} from './check-publisher-paths.mjs';
import { gitIn, quietlyAsync, tempDir } from './test-support.mjs';

const GROK = '9900005';
const CURSOR = '206951365';
const EIC = '350852201';
const QUILL = '9900007';
const POSTS = '9900002';
const MAINTAINER = '29182417';
const SERIES_CODE = 'src/data/series.ts';
const POST = 'src/content/posts/new-story.md';
const catalog = (title = 'Grok Bot tutorial') => `${JSON.stringify([
  { slug: 'grok-bot', title, description: 'Numbered tutorials on Grok Bot.' },
  { slug: 'vectors-plainly', title: 'Vectors, Plainly', description: 'What a vector database does, in six parts.' },
], null, 2)}\n`;
const withKubernetes = () => catalog().replace(/\n\]\n$/, `,\n  {\n    "slug": "k8s-from-zero",\n    "title": "Kubernetes from Zero",\n    "description": "Kubernetes from the first container to a production cluster."\n  }\n]\n`);

const env = (overrides = {}) => ({
  PR_ACTION: 'opened', PR_AUTHOR_ID: GROK, EVENT_SENDER_ID: GROK, MAINTAINER_ID: MAINTAINER,
  GROK_ACTOR_ID: GROK, EIC_ACTOR_ID: EIC, QUILL_ACTOR_ID: QUILL, POSTS_ACTOR_ID: POSTS,
  PR_HEAD_REF: 'series/k8s-from-zero',
  PR_HEAD_REPO: 'owner/site', PR_BASE_REPO: 'owner/site', ...overrides,
});
const scope = (values = {}) => {
  const event = env(values);
  return seriesLaneScope({
    action: event.PR_ACTION, authorId: event.PR_AUTHOR_ID, senderId: event.EVENT_SENDER_ID, headRef: event.PR_HEAD_REF,
    grokActorId: event.GROK_ACTOR_ID, headRepo: event.PR_HEAD_REPO, baseRepo: event.PR_BASE_REPO,
  });
};

/** A repository with the catalog, its reader, a post and the ledger on main. */
function repository({ withCatalog = true } = {}) {
  const dir = tempDir('series-lane-');
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
  write(SERIES_CODE, "import catalog from './series.json' with { type: 'json' };\nexport const SERIES = catalog;\n");
  write('src/content/posts/old-story.md', '---\ntitle: Old story\nauthor: michel\n---\nBody\n');
  write(SPECIMEN_LEDGER_PATH, '0001 old-story\n');
  if (withCatalog) write(SERIES_PATH, catalog());
  const base = commit('base');
  git(['switch', '-q', '-c', 'series/k8s-from-zero']);
  return { dir, git, write, commit, base };
}

async function run(repo, overrides = {}) {
  const head = repo.commit('proposal');
  const { result, output } = await quietlyAsync(() => main(['pr', '--base', repo.base, '--head', head], env(overrides), repo.dir));
  return { code: result, output, head };
}

const addKubernetes = (repo) => repo.write(SERIES_PATH, withKubernetes());

test('the series lane: the Grok App only, on series/, both identities, a safe event, the trusted repository', () => {
  for (const values of [{}, { PR_ACTION: 'synchronize' }, { PR_HEAD_REF: 'series/k8s' }, { GROK_ACTOR_ID: ` ${GROK} ` }]) {
    assert.equal(scope(values).applies, true, JSON.stringify(values));
  }
  assert.equal(scope().app, 'Grok');
  for (const overrides of [
    { PR_AUTHOR_ID: MAINTAINER }, { EVENT_SENDER_ID: MAINTAINER }, { EVENT_SENDER_ID: CURSOR }, { PR_AUTHOR_ID: CURSOR },
    { PR_AUTHOR_ID: CURSOR, EVENT_SENDER_ID: CURSOR }, { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: CURSOR },
    { PR_AUTHOR_ID: EIC, EVENT_SENDER_ID: EIC }, { PR_AUTHOR_ID: '' }, { PR_AUTHOR_ID: 'grok[bot]', EVENT_SENDER_ID: 'grok[bot]' },
    { GROK_ACTOR_ID: undefined }, { GROK_ACTOR_ID: '' }, { GROK_ACTOR_ID: 'grok[bot]' }, { GROK_ACTOR_ID: '0' }, { GROK_ACTOR_ID: `0${GROK}` },
    { PR_ACTION: 'edited' }, { PR_ACTION: 'reopened' }, { PR_ACTION: 'closed' }, { PR_ACTION: undefined },
    { PR_HEAD_REF: 'grok/series-k8s' }, { PR_HEAD_REF: 'cursor/series-k8s' }, { PR_HEAD_REF: 'series/' }, { PR_HEAD_REF: undefined },
    { PR_HEAD_REPO: 'fork/site' }, { PR_BASE_REPO: '' }, { PR_HEAD_REPO: 'site', PR_BASE_REPO: 'site' },
  ]) assert.equal(scope(overrides).applies, false, JSON.stringify(overrides));
  assert.equal(scope({ PR_HEAD_REF: 'series/K8s' }).seriesApp, true, 'Grok on a bad series/ branch: the refusal names the lane');
  assert.equal(scope({ PR_HEAD_REF: 'grok/some-story' }).seriesApp, false, 'an ordinary Grok article is not about the series lane');
  assert.equal(scope({ PR_AUTHOR_ID: CURSOR, EVENT_SENDER_ID: CURSOR }).seriesApp, false, 'Cursor has no lane');
});

test('the branch suffix is strict', () => {
  for (const branch of ['series/k8s-from-zero', 'series/1', 'series/a1-b2']) assert.equal(isSeriesBranch(branch), true, branch);
  for (const branch of [
    '', 'series', 'series/', 'series/A', 'series/a_b', 'series/a.b', 'series/a/b', 'series/a--b', 'series/-a', 'series/a-',
    'series/a b', 'series/a\nb', 'series/a..b', 'series/a@{1}', `series/${'a'.repeat(65)}`, 'refs/heads/series/a', 'Series/a',
    'cursor/series-a', undefined, 7,
  ]) assert.equal(isSeriesBranch(branch), false, JSON.stringify(branch));
});

test('CLI: the Grok App may modify src/data/series.json; the message names the lane and the App', async () => {
  const repo = repository();
  addKubernetes(repo);
  const result = await run(repo);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /1 changed file in this pull request, src\/data\/series\.json, a plain file modified \(in the series lane because the author and this event’s sender are the Grok App/);
  const noGrok = await quietlyAsync(() => main(['pr', '--base', repo.base, '--head', result.head], env({ GROK_ACTOR_ID: undefined }), repo.dir));
  assert.equal(noGrok.result, 1, noGrok.output);
});

test('CLI: Cursor never gets the series lane, however it names the branch or whose login opens the pull request', async () => {
  for (const values of [
    { PR_AUTHOR_ID: CURSOR, EVENT_SENDER_ID: CURSOR },
    { PR_AUTHOR_ID: CURSOR, EVENT_SENDER_ID: CURSOR, PR_HEAD_REF: 'cursor/series-k8s' },
    { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: CURSOR, PR_HEAD_REF: 'cursor/series-k8s', PR_ACTION: 'synchronize' },
    { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: CURSOR, PR_HEAD_REF: 'cursor/series-k8s', PR_ACTION: 'edited' },
  ]) {
    const repo = repository();
    addKubernetes(repo);
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${JSON.stringify(values)}: ${result.output}`);
    assert.match(result.output, /src\/data\/series\.json: outside the publisher's lanes; the publisher may change nothing/);
  }
});

test('CLI: the wrong identity, event, branch or repository never admits a catalog change, and the refusal says why', async () => {
  for (const [values, why] of [
    [{ EVENT_SENDER_ID: '4242' }, /not in the series lane because the Grok App’s pull request, but this event’s sender is someone else/],
    [{ EVENT_SENDER_ID: CURSOR }, /not in the series lane because the Grok App’s pull request, but this event’s sender is someone else/],
    [{ PR_ACTION: 'edited' }, /not in the series lane because a "edited" event does not show who pushed the head/],
    [{ PR_ACTION: 'reopened' }, /not in the series lane because a "reopened" event/],
    [{ PR_HEAD_REF: 'series/K8s' }, /not in the series lane because the head branch "series\/K8s" is not a valid nonempty series\/<suffix> branch/],
    [{ PR_HEAD_REPO: 'fork/site' }, /not in the series lane because the head repository does not match the trusted base repository/],
    [{ PR_HEAD_REF: 'cursor/series-k8s' }, /not in the Grok lane because the head branch "cursor\/series-k8s" is not a valid nonempty grok\/ branch/],
    [{ PR_AUTHOR_ID: '4242', EVENT_SENDER_ID: '4242' }, /held to the rule because the author is not the maintainer\):/],
  ]) {
    const repo = repository();
    addKubernetes(repo);
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${JSON.stringify(values)}: ${result.output}`);
    assert.match(result.output, /src\/data\/series\.json: outside the publisher's lanes; the publisher may change nothing/, JSON.stringify(values));
    assert.match(result.output, why, `${JSON.stringify(values)}: ${result.output}`);
  }
});

test('CLI: Grok on its grok/ article branch is held to its own lane for the catalog', async () => {
  const repo = repository();
  addKubernetes(repo);
  const result = await run(repo, { PR_HEAD_REF: 'grok/k8s-from-zero' });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /"src\/data\/series\.json": outside the Grok lane/);
});

test('CLI: the series lane changes exactly one file; the code that reads it, a post or a second file is refused by name', async () => {
  for (const [change, listed] of [
    [(repo) => { addKubernetes(repo); repo.write(POST, '---\ntitle: New story\nauthor: michel\n---\nBody\n'); }, /changes 2 \("src\/content\/posts\/new-story\.md", "src\/data\/series\.json"\)/],
    [(repo) => { addKubernetes(repo); repo.write(SERIES_CODE, 'export const SERIES = [];\n'); }, /changes 2 \("src\/data\/series\.json", "src\/data\/series\.ts"\)/],
    [() => {}, /changes 0 \(none\)/],
  ]) {
    const repo = repository();
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /the series lane changes exactly one file, src\/data\/series\.json; this pull request changes/);
    assert.match(result.output, listed);
  }
});

test('CLI: one file that is not src/data/series.json is outside the series lane, the reader code above all', async () => {
  for (const path of [
    SERIES_CODE, 'src/lib/series-catalog.ts', 'src/components/SeriesIcon.astro', 'src/assets/series-icons/k8s-from-zero.svg',
    PINS_PATH, 'src/data/Series.json', 'src/data/series.json5', 'src/data/series/series.json', 'public/series.json',
    POST, '.github/workflows/check-publisher-pr.yml', 'scripts/check-publisher-paths.mjs', 'package.json',
  ]) {
    const repo = repository();
    repo.write(path, 'a proposed change\n');
    const result = await run(repo);
    assert.equal(result.code, 1, path);
    assert.match(result.output, new RegExp(`${JSON.stringify(path).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}: outside the series lane; only src/data/series\\.json may change`), result.output);
  }
});

test('CLI: the series lane refuses adding, deleting, renaming or copying the catalog, a symlink and the executable bit', async () => {
  for (const [label, withCatalog, change, expected] of [
    ['add', false, addKubernetes, /"src\/data\/series\.json": added; the series lane only modifies src\/data\/series\.json/],
    ['delete', true, (repo) => rmSync(join(repo.dir, SERIES_PATH)), /"src\/data\/series\.json": deleted; the series lane only modifies/],
    ['rename out', true, (repo) => repo.git(['mv', SERIES_PATH, 'src/data/series-old.json']), /"src\/data\/series-old\.json": outside the series lane[^]*renamed from "src\/data\/series\.json"/],
    ['symlink replacing the file', true, (repo) => { rmSync(join(repo.dir, SERIES_PATH)); symlinkSync('series.ts', join(repo.dir, SERIES_PATH)); }, /"src\/data\/series\.json": (changed with status "T"; the series lane only modifies[^]*)?mode "120000" \(a symbolic link\) is refused/],
    ['executable', true, (repo) => { addKubernetes(repo); chmodSync(join(repo.dir, SERIES_PATH), 0o755); }, /"src\/data\/series\.json": mode "100755" \(an executable\) is refused/],
  ]) {
    const repo = repository({ withCatalog });
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, `${label}: ${result.output}`);
    assert.match(result.output, /this pull request changes what the Grok App may not/, label);
    assert.match(result.output, expected, `${label}: ${result.output}`);
  }
});

test('seriesLaneProblems refuses a symlink or submodule mode even on an ordinary modify', () => {
  for (const [mode, kind] of [['120000', 'a symbolic link'], ['160000', 'a submodule'], ['100755', 'an executable']]) {
    assert.deepEqual(seriesLaneProblems({ changes: [{ status: 'M', path: SERIES_PATH }], modes: new Map([[SERIES_PATH, mode]]) }),
      [`"src/data/series.json": mode "${mode}" (${kind}) is refused; only a plain file (100644) may be added or changed`]);
  }
});

test('seriesLaneProblems is pure over the collected changes', () => {
  const modes = new Map([[SERIES_PATH, '100644']]);
  assert.deepEqual(seriesLaneProblems({ changes: [{ status: 'M', path: SERIES_PATH }], modes }), []);
  assert.match(seriesLaneProblems({ changes: [{ status: 'A', path: SERIES_PATH }], modes })[0], /added; the series lane only modifies/);
  assert.match(seriesLaneProblems({ changes: [{ status: 'T', path: SERIES_PATH }], modes })[0], /changed with status "T"/);
  assert.match(seriesLaneProblems({ changes: [{ status: 'C', path: SERIES_PATH, from: 'src/data/pins.json' }], modes })[0], /copied from "src\/data\/pins\.json"; the series lane only modifies/);
  assert.match(seriesLaneProblems({ changes: [{ status: 'R', path: SERIES_PATH, from: 'src/data/old.json' }], modes })[0], /renamed from "src\/data\/old\.json"/);
  assert.match(seriesLaneProblems({ changes: [{ status: 'M', path: SERIES_PATH }], modes: new Map() })[0], /mode undefined \(an unknown kind\)/);
});

test('a submodule at src/data/series.json is refused', () => {
  const repo = repository();
  repo.git(['rm', '-q', '--cached', SERIES_PATH]);
  repo.git(['update-index', '--add', '--cacheinfo', `160000,${repo.base},${SERIES_PATH}`]);
  repo.git(['commit', '-q', '-m', 'submodule']);
  const head = repo.git(['rev-parse', 'HEAD']).trim();
  const problems = seriesLaneProblems(collectPullRequest({ cwd: repo.dir, base: repo.base, head, copies: true }));
  assert.ok(problems.some((problem) => /mode "160000" \(a submodule\) is refused/.test(problem)), problems.join('\n'));
});

test('every other App touching src/data/series.json fails: the desk editor, Quill, the posts App, the publisher', async () => {
  for (const [label, values, expected] of [
    ['the desk editor App on a pins branch', { PR_AUTHOR_ID: EIC, EVENT_SENDER_ID: EIC, PR_HEAD_REF: 'eic/pins-1' }, /outside the pins lane/],
    ['the desk editor App on a series branch', { PR_AUTHOR_ID: EIC, EVENT_SENDER_ID: EIC, PR_HEAD_REF: 'series/k8s' }, /outside the publisher's lanes/],
    ['Quill on its own branch', { PR_AUTHOR_ID: QUILL, EVENT_SENDER_ID: QUILL, PR_HEAD_REF: 'quill/k8s' }, /outside the Quill lane/],
    ['the posts App on a series branch', { PR_AUTHOR_ID: POSTS, EVENT_SENDER_ID: POSTS, PR_HEAD_REF: 'series/k8s' }, /outside the publisher's lanes/],
    ['the publisher', { PR_AUTHOR_ID: '9900001', EVENT_SENDER_ID: '9900001', PR_HEAD_REF: 'series/k8s' }, /outside the publisher's lanes/],
  ]) {
    const repo = repository();
    addKubernetes(repo);
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${label}: ${result.output}`);
    assert.match(result.output, expected, `${label}: ${result.output}`);
  }
});

test('the maintainer stays exempt on a branch of their own, never on a bot branch; the series lane never applies to a push', async () => {
  const repo = repository();
  addKubernetes(repo);
  repo.write(SERIES_CODE, 'export const SERIES = [];\n');
  const onBotBranch = await run(repo, { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: MAINTAINER });
  assert.equal(onBotBranch.code, 1, onBotBranch.output);
  assert.match(onBotBranch.output, /the head branch is a bot branch \(series\/\), never the maintainer's/);
  const maintainer = await quietlyAsync(() => main(['pr', '--base', repo.base, '--head', onBotBranch.head],
    env({ PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: MAINTAINER, PR_HEAD_REF: 'feat/k8s-row' }), repo.dir));
  assert.equal(maintainer.result, 0, maintainer.output);
  const push = await quietlyAsync(() => main(['push', '--before', repo.base, '--after', onBotBranch.head], env(), repo.dir));
  assert.equal(push.result, 1, push.output);
  assert.match(push.output, /src\/data\/series\.json: outside the publisher's lanes/);
});

test('CLI: a head with two merge bases (criss-cross) cannot be judged, so it fails, even when its own diff is only the catalog', async () => {
  // main: base -> P1, and a feature P2 merged into main as M. The bot's head merges P1 and P2
  // itself (never M) and edits the catalog. Against either single merge base its diff can look
  // like the catalog alone, while against M it would revert one side.
  const repo = repository();
  repo.git(['switch', '-q', '-c', 'feature', repo.base]);
  repo.write('src/feature.ts', 'export const feature = 1;\n');
  const p2 = repo.commit('feature');
  repo.git(['switch', '-q', '-C', 'main-line', repo.base]);
  repo.write('src/main-line.ts', 'export const line = 1;\n');
  const p1 = repo.commit('main line');
  repo.git(['merge', '-q', '--no-ff', '-m', 'merge feature', p2]);
  const main_ = repo.git(['rev-parse', 'HEAD']).trim();
  repo.git(['switch', '-q', '-C', 'series/k8s-from-zero', p1]);
  repo.git(['merge', '-q', '--no-ff', '-s', 'ours', '-m', 'bot merge', p2]);
  addKubernetes(repo);
  const head = repo.commit('catalog');
  assert.equal(repo.git(['merge-base', '--all', main_, head]).trim().split('\n').length, 2, 'the fixture really is criss-cross');
  const { result, output } = await quietlyAsync(() => main(['pr', '--base', main_, '--head', head], env(), repo.dir));
  assert.equal(result, 1, output);
  assert.match(output, /cannot be judged, so it fails[^]*2 merge bases \(a criss-cross history\)/);
});
