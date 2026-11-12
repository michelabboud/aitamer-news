// The diagrams lane in the publisher path guard (ADR 0054): on diagrams/<post-slug>, the Grok App
// may add or redraw public/diagrams/<that slug>/<name>.svg, plain files, at most
// DIAGRAMS_LANE_MAX_FILES, and nothing else. What an SVG says is check-diagrams.mjs's, in `check`.
// Also: a bot branch is never the maintainer's, which is how Cursor's pull requests (opened through
// the maintainer's login) stay held to the rule.
import assert from 'node:assert/strict';
import test from 'node:test';
import { chmodSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  BOT_BRANCH_PREFIXES, DIAGRAMS_LANE_MAX_FILES, diagramsLaneProblems, diagramsLaneScope, isDiagramsBranch, main, pullRequestScope,
  SERIES_PATH, SPECIMEN_LEDGER_PATH,
} from './check-publisher-paths.mjs';
import { SLUG_MAX_LENGTH } from './slug.mjs';
import { gitIn, quietlyAsync, tempDir } from './test-support.mjs';

const GROK = '9900005';
const CURSOR = '206951365';
const EIC = '350852201';
const MAINTAINER = '29182417';
const SLUG = 'k8s-from-zero-01-what-kubernetes-is';
const FOLDER = `public/diagrams/${SLUG}`;
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>\n';

const env = (overrides = {}) => ({
  PR_ACTION: 'opened', PR_AUTHOR_ID: GROK, EVENT_SENDER_ID: GROK, MAINTAINER_ID: MAINTAINER,
  GROK_ACTOR_ID: GROK, EIC_ACTOR_ID: EIC, PR_HEAD_REF: `diagrams/${SLUG}`,
  PR_HEAD_REPO: 'owner/site', PR_BASE_REPO: 'owner/site', ...overrides,
});
const scope = (values = {}) => {
  const event = env(values);
  return diagramsLaneScope({
    action: event.PR_ACTION, authorId: event.PR_AUTHOR_ID, senderId: event.EVENT_SENDER_ID, headRef: event.PR_HEAD_REF,
    grokActorId: event.GROK_ACTOR_ID, headRepo: event.PR_HEAD_REPO, baseRepo: event.PR_BASE_REPO,
  });
};

/** A repository with the post, an existing diagram of another post, and the ledger on main. */
function repository() {
  const dir = tempDir('diagrams-lane-');
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
  write(`src/content/posts/${SLUG}.md`, '---\ntitle: What Kubernetes is\nauthor: grok\n---\nBody\n');
  write('public/diagrams/other-post/figure.svg', SVG);
  write(`${FOLDER}/old-figure.svg`, SVG);
  write(SPECIMEN_LEDGER_PATH, '0001 old-story\n');
  write(SERIES_PATH, '[]\n');
  const base = commit('base');
  git(['switch', '-q', '-c', `diagrams/${SLUG}`]);
  return { dir, git, write, commit, base };
}

async function run(repo, overrides = {}) {
  const head = repo.commit('proposal');
  const { result, output } = await quietlyAsync(() => main(['pr', '--base', repo.base, '--head', head], env(overrides), repo.dir));
  return { code: result, output, head };
}

test('the diagrams lane: the Grok App only, on diagrams/<post-slug>, both identities, a safe event, the trusted repository', () => {
  for (const values of [{}, { PR_ACTION: 'synchronize' }, { PR_HEAD_REF: 'diagrams/a' }]) assert.equal(scope(values).applies, true, JSON.stringify(values));
  for (const overrides of [
    { PR_AUTHOR_ID: MAINTAINER }, { EVENT_SENDER_ID: MAINTAINER }, { PR_AUTHOR_ID: CURSOR, EVENT_SENDER_ID: CURSOR },
    { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: CURSOR }, { EVENT_SENDER_ID: CURSOR }, { PR_AUTHOR_ID: EIC, EVENT_SENDER_ID: EIC },
    { GROK_ACTOR_ID: undefined }, { GROK_ACTOR_ID: '' }, { GROK_ACTOR_ID: '0' },
    { PR_ACTION: 'edited' }, { PR_ACTION: 'reopened' }, { PR_ACTION: undefined },
    { PR_HEAD_REF: `grok/diagrams-${SLUG}` }, { PR_HEAD_REF: `cursor/diagrams-${SLUG}` }, { PR_HEAD_REF: 'diagrams/' },
    { PR_HEAD_REPO: 'fork/site' }, { PR_BASE_REPO: '' },
  ]) assert.equal(scope(overrides).applies, false, JSON.stringify(overrides));
  assert.equal(scope({ PR_HEAD_REF: 'diagrams/Bad' }).diagramsApp, true, 'Grok on a bad diagrams/ branch: the refusal names the lane');
  assert.equal(scope({ PR_HEAD_REF: 'grok/story' }).diagramsApp, false);
});

test('the branch is diagrams/ and a post slug, as long as a post slug may be', () => {
  for (const branch of [`diagrams/${SLUG}`, 'diagrams/a', 'diagrams/1-2', `diagrams/${'a'.repeat(SLUG_MAX_LENGTH)}`]) assert.equal(isDiagramsBranch(branch), true, branch);
  for (const branch of [
    '', 'diagrams', 'diagrams/', 'diagrams/A', 'diagrams/a_b', 'diagrams/a.b', 'diagrams/a/b', 'diagrams/a--b', 'diagrams/-a',
    'diagrams/a-', 'diagrams/a b', 'diagrams/a\nb', `diagrams/${'a'.repeat(SLUG_MAX_LENGTH + 1)}`, 'refs/heads/diagrams/a', undefined, 7,
  ]) assert.equal(isDiagramsBranch(branch), false, JSON.stringify(branch));
});

test('CLI: the Grok App may add and redraw diagrams in the folder of the post its branch names', async () => {
  const repo = repository();
  repo.write(`${FOLDER}/desired-state-loop.svg`, SVG);
  repo.write(`${FOLDER}/from-one-server-to-a-cluster.svg`, SVG);
  repo.write(`${FOLDER}/old-figure.svg`, SVG.replace('10" height', '9" height'));
  const result = await run(repo);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, new RegExp(`3 changed files in this pull request, public/diagrams/${SLUG}/<name>\\.svg, plain files added or redrawn \\(in the diagrams lane because the author and this event’s sender are the Grok App`));
});

test('CLI: anything outside that one folder, or not a lowercase .svg, is refused by name', async () => {
  for (const path of [
    'public/diagrams/other-post/figure.svg', 'public/diagrams/other-post/new.svg', `public/diagrams/${SLUG}-2/a.svg`,
    `${FOLDER}/a.png`, `${FOLDER}/A.svg`, `${FOLDER}/a_b.svg`, `${FOLDER}/.svg`, `${FOLDER}/nested/a.svg`, `${FOLDER}/a.svg.html`,
    `public/${SLUG}/a.svg`, `src/content/posts/${SLUG}.md`, SERIES_PATH, 'scripts/check-diagrams.mjs', 'public/_headers',
  ]) {
    const repo = repository();
    repo.write(path, SVG.replace('<rect', '<circle r="3"/><rect'));
    const result = await run(repo);
    assert.equal(result.code, 1, `${path}: ${result.output}`);
    assert.match(result.output, /this pull request changes what the Grok App may not/);
    assert.ok(result.output.includes(`${JSON.stringify(path)}: outside the diagrams lane; only ${FOLDER}/<name>.svg may change`), `${path}: ${result.output}`);
  }
});

test('CLI: deleting, renaming, a symlink and the executable bit are refused; an empty or oversized pull request too', async () => {
  for (const [label, change, expected] of [
    ['delete', (repo) => rmSync(join(repo.dir, FOLDER, 'old-figure.svg')), /"public\/diagrams\/[^"]+\/old-figure\.svg": deleted; the diagrams lane only adds or redraws diagrams/],
    ['rename', (repo) => repo.git(['mv', `${FOLDER}/old-figure.svg`, `${FOLDER}/new-figure.svg`]), /"public\/diagrams\/[^"]+\/new-figure\.svg": renamed from "public\/diagrams\/[^"]+\/old-figure\.svg"/],
    ['symlink', (repo) => symlinkSync('../other-post/figure.svg', join(repo.dir, FOLDER, 'linked.svg')), /mode "120000" \(a symbolic link\) is refused/],
    ['executable', (repo) => { repo.write(`${FOLDER}/run.svg`, SVG); chmodSync(join(repo.dir, FOLDER, 'run.svg'), 0o755); }, /mode "100755" \(an executable\) is refused/],
    ['empty', () => {}, /the diagrams lane changes at least one file under public\/diagrams\/[^/]+\/; this pull request changes none/],
    ['oversized', (repo) => { for (let i = 0; i <= DIAGRAMS_LANE_MAX_FILES; i += 1) repo.write(`${FOLDER}/figure-${i}.svg`, SVG); }, new RegExp(`at most ${DIAGRAMS_LANE_MAX_FILES} files; this pull request changes ${DIAGRAMS_LANE_MAX_FILES + 1}`)],
  ]) {
    const repo = repository();
    change(repo);
    const result = await run(repo);
    assert.equal(result.code, 1, `${label}: ${result.output}`);
    assert.match(result.output, expected, `${label}: ${result.output}`);
  }
});

test('diagramsLaneProblems is pure: copies and type changes are refused, an unknown mode too', () => {
  const path = `${FOLDER}/a.svg`;
  const modes = new Map([[path, '100644']]);
  const ref = `diagrams/${SLUG}`;
  assert.deepEqual(diagramsLaneProblems({ changes: [{ status: 'A', path }], modes }, ref), []);
  assert.deepEqual(diagramsLaneProblems({ changes: [{ status: 'M', path }], modes }, ref), []);
  assert.match(diagramsLaneProblems({ changes: [{ status: 'C', path, from: 'public/diagrams/other-post/figure.svg' }], modes }, ref)[0], /copied from "public\/diagrams\/other-post\/figure\.svg"/);
  assert.match(diagramsLaneProblems({ changes: [{ status: 'T', path }], modes }, ref)[0], /changed with status "T"/);
  assert.match(diagramsLaneProblems({ changes: [{ status: 'A', path }], modes: new Map() }, ref)[0], /mode undefined \(an unknown kind\)/);
});

test('CLI: Cursor never gets the diagrams lane, and the wrong event or sender says why', async () => {
  for (const [values, why] of [
    [{ PR_AUTHOR_ID: CURSOR, EVENT_SENDER_ID: CURSOR }, /held to the rule because the author is not the maintainer\)/],
    [{ PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: CURSOR, PR_HEAD_REF: `cursor/diagrams-${SLUG}` }, /the head branch is a bot branch \(cursor\/\)/],
    [{ EVENT_SENDER_ID: CURSOR }, /not in the diagrams lane because the Grok App’s pull request, but this event’s sender is someone else/],
    [{ PR_ACTION: 'edited' }, /not in the diagrams lane because a "edited" event does not show who pushed the head/],
  ]) {
    const repo = repository();
    repo.write(`${FOLDER}/a.svg`, SVG);
    const result = await run(repo, values);
    assert.equal(result.code, 1, `${JSON.stringify(values)}: ${result.output}`);
    assert.match(result.output, /outside the publisher's lanes; the publisher may change nothing/);
    assert.match(result.output, why, `${JSON.stringify(values)}: ${result.output}`);
  }
});

test('a bot branch is never the maintainer’s: Cursor opens pull requests through the maintainer’s login', () => {
  assert.deepEqual([...BOT_BRANCH_PREFIXES], ['cursor/', 'series/', 'diagrams/']);
  const maintainerEvent = { action: 'opened', authorId: MAINTAINER, senderId: MAINTAINER, maintainerId: MAINTAINER };
  for (const headRef of ['cursor/k8s-part-01', 'series/k8s', `diagrams/${SLUG}`, 'cursor/anything/at-all']) {
    const result = pullRequestScope({ ...maintainerEvent, headRef });
    assert.equal(result.enforced, true, headRef);
    assert.match(result.reason, /is a bot branch/, headRef);
  }
  for (const headRef of ['feat/series-lane', 'post/k8s', 'eic/pins-1', 'my-cursor/x', 'xseries/a', undefined]) {
    assert.equal(pullRequestScope({ ...maintainerEvent, headRef }).enforced, false, String(headRef));
  }
});

test('CLI: a Cursor pull request opened through the maintainer’s login is held to the rule, code above all', async () => {
  const repo = repository();
  repo.write('src/components/SeriesIcon.astro', '---\n---\n<span />\n');
  const result = await run(repo, { PR_AUTHOR_ID: MAINTAINER, EVENT_SENDER_ID: MAINTAINER, PR_HEAD_REF: 'cursor/k8s-series-row-fdb4' });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /held to the rule because the head branch is a bot branch \(cursor\/\), never the maintainer's, whoever opened it/);
  assert.match(result.output, /src\/components\/SeriesIcon\.astro: outside the publisher's lanes/);
});
