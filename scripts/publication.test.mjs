import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { acknowledgedAt, digest, isoTime, PUBLICATION_INTERVAL_MS, selectPublication, sealState, validateQueue, validateState } from './publication.mjs';
import { articleBodyDigest, fetchJson, heldPost, prepareBuildCopy, readPosts, siteBase } from './publication-cli.mjs';
import { readFrontmatter } from './frontmatter.mjs';

const sourceSha = 'a'.repeat(40), hash = 'b'.repeat(64);
const time = (s) => Date.parse(`2026-10-04T${s}Z`);
const queue = () => ({ version: 1, baseline: { slugs: ['old'], sha256: digest(['old']) }, entries: [
  { slug: 'first', sha256: hash, reviewSha256: hash, pubDate: '2026-10-04T08:00:00Z' },
  { slug: 'second', sha256: hash, reviewSha256: hash, pubDate: '2026-10-04T08:30:00Z' },
] });
const live = () => sealState({ version: 1, sourceSha, queueSha256: digest(validateQueue(queue())), visible: ['old'], lastPublication: { runId: '1', attempt: 1, sourceSha, slug: null } });
const select = (extra = {}) => selectPublication({ queue: queue(), live: live(), mode: 'publish', now: time('09:00:00'), sourceSha, runId: '2', attempt: 1, acknowledgment: time('08:00:00'), ...extra });

test('long outage admits exactly the earliest due reviewed article without a lookback window', () => {
  const result = select({ now: time('23:00:00') });
  assert.equal(result.selected, 'first');
  assert.deepEqual(result.state.visible, ['first', 'old']);
});
test('retain/manual default never admits due content', () => {
  assert.equal(select({ mode: 'retain' }).selected, null);
});
test('half-hour spacing starts after acknowledgment, not original slot or build start', () => {
  assert.equal(select({ acknowledgment: time('08:30:01') }).reason, 'spacing');
  assert.equal(select({ acknowledgment: time('08:30:00') }).selected, 'first');
  assert.equal(PUBLICATION_INTERVAL_MS, time('09:00:00') - time('08:30:00'));
});
test('future articles are held and empty due queues do not cause deployments', () => {
  assert.equal(select({ now: time('07:30:00'), acknowledgment: time('07:00:00') }).reason, 'nothing_due');
});
test('a repeated request cannot republish the same article or advance before new acknowledgment', () => {
  const first = select();
  const again = select({ live: first.state, acknowledgment: time('09:00:00') });
  assert.equal(again.selected, null);
  assert.deepEqual(again.state.visible, first.state.visible);
  assert.equal(select({ live: first.state, acknowledgment: time('09:00:00'), now: time('09:30:00') }).selected, 'second');
});
test('failed/unacknowledged publication only recovers the already visible set', () => {
  const first = select();
  const result = select({ live: first.state, acknowledgment: null, runId: '3' });
  assert.equal(result.reason, 'recovery');
  assert.equal(result.selected, null);
  assert.deepEqual(result.state.visible, first.state.visible);
  assert.equal(result.state.lastPublication.runId, '3');
});
test('missing state cannot silently bootstrap even if everything is overdue', () => {
  assert.throws(() => select({ live: null }), /explicit verified bootstrap/);
});
test('bootstrap requires exact observed baseline and never adds queue posts', () => {
  const result = select({ live: null, mode: 'bootstrap', bootstrapSlugs: ['old'], bootstrapDigest: digest(['old']) });
  assert.deepEqual(result.state.visible, ['old']);
  assert.throws(() => select({ live: null, mode: 'bootstrap', bootstrapSlugs: ['old', 'unexpected'], bootstrapDigest: digest(['old']) }), /baseline/);
  assert.throws(() => select({ mode: 'bootstrap', bootstrapSlugs: ['old'], bootstrapDigest: digest(['old']) }), /existing/);
});
test('corrupt manifests, unknown live content and lost baseline fail closed', () => {
  assert.throws(() => validateState({ ...live(), visible: ['old', 'first'] }), /digest/);
  assert.throws(() => select({ live: sealState({ ...live(), digest: undefined, visible: ['old', 'rogue'] }) }), /digest|unapproved/);
  const removed = { ...live() }; delete removed.digest; removed.visible = [];
  assert.throws(() => select({ live: sealState(removed) }), /remove/);
});
test('queue rejects unsafe paths, duplicate dates/slugs, missing review hashes and malformed UTC', () => {
  for (const patch of [{ slug: '../escape' }, { slug: 'old' }, { reviewSha256: '' }, { pubDate: '2026-02-30T08:00:00Z' }, { pubDate: '2026-10-04T08:01:00Z' }]) {
    const q = queue(); Object.assign(q.entries[0], patch); assert.throws(() => validateQueue(q));
  }
  const q = queue(); q.entries[1].pubDate = q.entries[0].pubDate;
  assert.throws(() => validateQueue(q), /duplicate/);
  assert.throws(() => isoTime('2026-10-04'), /full UTC/);
});
test('only matching successful deploy run attempts acknowledge publication', () => {
  const identity = live().lastPublication;
  const run = { id: 1, run_attempt: 1, head_sha: sourceSha, head_branch: 'main', path: '.github/workflows/deploy-pages.yml', status: 'completed', conclusion: 'success', updated_at: '2026-10-04T08:00:00Z' };
  assert.equal(acknowledgedAt(run, identity), time('08:00:00'));
  for (const patch of [{ id: 2 }, { run_attempt: 2 }, { head_sha: 'c'.repeat(40) }, { head_branch: 'other' }, { path: 'other.yml' }, { conclusion: 'failure' }, { status: 'in_progress' }]) assert.equal(acknowledgedAt({ ...run, ...patch }, identity), null);
});
test('holding a post changes only its draft flag, preserving body and metadata', () => {
  for (const flag of ['', 'draft: false\n', 'draft: true\n']) {
    const original = `---\ntitle: A\n${flag}pubDate: 2026-10-04T08:00:00Z\n---\n\nOriginal $& words.\n`;
    const held = heldPost(original);
    assert.equal(readFrontmatter(held).data.draft, true);
    assert.ok(held.endsWith('\n\nOriginal $& words.\n'));
    assert.equal(readFrontmatter(held).data.title, 'A');
  }
});
test('verification origin refuses arbitrary hosts, credentials, ports and paths', () => {
  assert.equal(siteBase('https://aitamer.news'), 'https://aitamer.news');
  assert.equal(siteBase('https://abc.aitamer-news.pages.dev'), 'https://abc.aitamer-news.pages.dev');
  for (const url of ['http://aitamer.news', 'https://evil.example', 'https://x@aitamer.news', 'https://aitamer.news:123/', 'https://aitamer.news/a']) assert.throws(() => siteBase(url));
});
test('live verification compares the story despite unrelated edge email-link rewrites', () => {
  const built = '<a href="mailto:test@example.org">share</a><div class="article__body"><p>Checked words.</p></div>';
  const live = built.replace('mailto:test@example.org', '/cdn-cgi/l/email-protection#abc');
  assert.equal(articleBodyDigest(built), articleBodyDigest(live));
  assert.notEqual(articleBodyDigest(built), articleBodyDigest(live.replace('Checked words.', 'Different words.')));
  assert.throws(() => articleBodyDigest('<p>missing</p>'), /exactly one/);
});
test('network errors and malformed/oversize publication responses cannot become empty live state', async () => {
  const response = (body, status = 200, headers = {}) => async () => new Response(body, { status, headers });
  assert.equal(await fetchJson('https://example.test', { missing: true, fetchImpl: response('', 404) }), null);
  await assert.rejects(fetchJson('https://example.test', { fetchImpl: response('', 404) }), /HTTP 404/);
  await assert.rejects(fetchJson('https://example.test', { fetchImpl: response('<html>') }), /valid JSON/);
  await assert.rejects(fetchJson('https://example.test', { fetchImpl: response('{}', 200, { 'content-length': '999999999' }) }), /size limit/);
});
test('workflow defaults retain, serializes selection and checks the selected artifact before upload', () => {
  const workflow = yaml.load(readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'));
  assert.equal(workflow.on.workflow_dispatch.inputs.publication_mode.default, 'retain');
  const job = workflow.jobs.deploy, steps = job.steps;
  assert.deepEqual(job.concurrency, { group: 'pages-production', 'cancel-in-progress': false });
  const selection = steps.findIndex((step) => step.id === 'publication');
  const artifact = steps.findIndex((step) => step.run?.includes('verify-artifact'));
  const production = steps.findIndex((step) => step.id === 'production');
  assert.ok(selection > 0 && artifact > selection && production > artifact);
  assert.match(steps[selection].env.PUBLICATION_MODE, /workflow_dispatch.*retain/);
  for (const step of steps.filter((step) => step.with?.command?.includes('pages deploy'))) assert.match(step.with.command, /outputs.build-dir.*\/dist/);
  assert.ok(steps.some((step) => step.run?.includes('verify-prior')));
  assert.ok(steps.some((step) => step.name === 'Retain publication receipts' && step.if.startsWith('always()')));
});
test('publication source hash changes and untracked files cannot enter an approved build', () => {
  const root = mkdtempSync(join(tmpdir(), 'aitamer-publication-test-'));
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  const text = '---\ntitle: First\npubDate: 2026-10-04T08:00:00Z\ndraft: false\n---\n\nOriginal.\n';
  writeFileSync(join(root, 'src/content/posts/first.md'), text);
  const q = validateQueue(queue());
  assert.throws(() => readPosts(root, q, time('09:00:00')), /hash mismatch/);
  const baseline = { version: 1, baseline: { slugs: ['first'], sha256: digest(['first']) }, entries: [] };
  const files = readPosts(root, validateQueue(baseline), time('09:00:00'));
  assert.throws(() => prepareBuildCopy(root, join(root, 'untracked-build'), files, { visible: ['first'] }, time('09:00:00'), []), /untracked/);
  assert.equal(readFileSync(join(root, 'src/content/posts/first.md'), 'utf8'), text);
});
