import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { acknowledgedAt, digest, expectedArticleBodySlug, isoTime, PUBLICATION_INTERVAL_MS, selectPublication, sealState, validateQueue, validateReceiptBundle, validateRequestId, validateState } from './publication.mjs';
import { articleBodyDigest, fetchJson, heldPost, prepareBuildCopy, readPosts, siteBase, verifyLive } from './publication-cli.mjs';
import { readFrontmatter } from './frontmatter.mjs';

const sourceSha = 'a'.repeat(40), hash = 'b'.repeat(64);
const time = (s) => Date.parse(`2026-10-04T${s}Z`);
const queue = () => ({ version: 1, baseline: { slugs: ['old'], sha256: digest(['old']) }, entries: [
  { slug: 'first', sha256: hash, reviewSha256: hash, pubDate: '2026-10-04T08:00:00Z' },
  { slug: 'second', sha256: hash, reviewSha256: hash, pubDate: '2026-10-04T08:30:00Z' },
] });
const live = () => sealState({ version: 1, sourceSha, queueSha256: digest(validateQueue(queue())), visible: ['old'], lastPublication: { runId: '1', attempt: 1, sourceSha, slug: null }, lastDeployment: { runId: '1', attempt: 1, sourceSha, slug: null } });
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
test('the latest deployment identity advances on retain without resetting the article spacing clock', () => {
  const retained = select({ mode: 'retain', runId: '4' });
  assert.equal(retained.state.lastPublication.runId, '1');
  assert.equal(retained.state.lastDeployment.runId, '4');
  assert.equal(retained.state.digest, validateState(retained.state).digest);
});

function receiptBundle() {
  const priorState = live(), plan = select();
  return {
    selection: { ...plan, priorState, requestId: null },
    artifactVerification: { state: plan.state, visibleCount: plan.state.visible.length, digest: plan.state.digest },
    productionVerification: { origin: 'https://aitamer.news', verifiedAt: '2026-10-04T09:01:00.000Z',
      deploymentId: 'actual-deployment-id', state: plan.state,
      articleBody: { slug: 'first', builtSha256: hash, servedSha256: hash } },
    outcome: { runId: '2', attempt: 1, sourceSha, requestId: null, outcome: 'success',
      productionDeployment: 'actual-deployment-id' },
  };
}

test('archived proof binds the exact served state, artifact, deployment and checked article body', () => {
  const bundle = receiptBundle(), state = bundle.selection.state;
  assert.equal(validateReceiptBundle(bundle, state).deploymentId, 'actual-deployment-id');
  assert.throws(() => validateReceiptBundle(null, state), /bundle is missing/);
  const altered = (part, patch) => ({ ...bundle, [part]: { ...bundle[part], ...patch } });
  for (const name of ['artifactVerification', 'productionVerification', 'outcome']) {
    const missing = { ...bundle, [name]: undefined };
    assert.throws(() => validateReceiptBundle(missing, state), /files are missing/);
  }
  assert.throws(() => validateReceiptBundle(altered('outcome', { runId: '3' }), state), /identity/);
  assert.throws(() => validateReceiptBundle(altered('outcome', { attempt: 2 }), state), /identity/);
  assert.throws(() => validateReceiptBundle(altered('outcome', { sourceSha: 'c'.repeat(40) }), state), /identity/);
  assert.throws(() => validateReceiptBundle(altered('outcome', { requestId: 'a7a44583-7e28-4a7c-8edb-20b9d77d9621' }), state), /request identity/);
  assert.throws(() => validateReceiptBundle(altered('outcome', { productionDeployment: '' }), state), /deployment identity/);
  assert.throws(() => validateReceiptBundle(altered('productionVerification', { deploymentId: 'another-deployment' }), state), /deployment identity/);
  assert.throws(() => validateReceiptBundle(altered('productionVerification', { origin: 'https://preview.aitamer-news.pages.dev' }), state), /production verification/);
  assert.throws(() => validateReceiptBundle(altered('productionVerification', { articleBody: null }), state), /body was not verified/);
  assert.throws(() => validateReceiptBundle(altered('productionVerification', { articleBody: { slug: 'first', builtSha256: hash, servedSha256: 'c'.repeat(64) } }), state), /body was not verified/);
  assert.throws(() => validateReceiptBundle(altered('artifactVerification', { digest: 'c'.repeat(64) }), state), /artifact proof/);
  const { digest: ignoredDigest, ...unsealed } = state;
  const other = sealState({ ...unsealed, visible: [...state.visible, 'second'] });
  assert.throws(() => validateReceiptBundle(bundle, other), /differs from production/);
});

test('a retain receipt proves its own deployment while preserving the earlier publication identity', () => {
  const priorState = live();
  const plan = select({ mode: 'retain' });
  const bundle = receiptBundle();
  bundle.selection = { ...plan, priorState, requestId: null };
  bundle.artifactVerification = { state: plan.state, visibleCount: plan.state.visible.length, digest: plan.state.digest };
  bundle.productionVerification = { origin: 'https://aitamer.news', verifiedAt: '2026-10-04T09:01:00.000Z',
    deploymentId: 'actual-deployment-id', state: plan.state, articleBody: null };
  assert.equal(validateReceiptBundle(bundle, plan.state).runId, '2');
  assert.equal(plan.state.lastPublication.runId, '1');
});

test('recovery requires body proof for the earlier admitted article before another admission', () => {
  const priorState = select().state;
  const plan = select({ live: priorState, acknowledgment: null, runId: '3', now: time('09:05:00') });
  assert.equal(plan.reason, 'recovery');
  assert.equal(plan.selected, null);
  const bundle = receiptBundle();
  bundle.selection = { ...plan, priorState, requestId: null };
  bundle.artifactVerification = { state: plan.state, visibleCount: plan.state.visible.length, digest: plan.state.digest };
  bundle.productionVerification = { origin: 'https://aitamer.news', verifiedAt: '2026-10-04T09:06:00.000Z',
    deploymentId: 'actual-deployment-id', state: plan.state, articleBody: null };
  bundle.outcome = { ...bundle.outcome, runId: '3' };
  assert.equal(expectedArticleBodySlug(bundle.selection), 'first');
  assert.throws(() => validateReceiptBundle(bundle, plan.state), /body was not verified/);
  bundle.productionVerification.articleBody = { slug: 'second', builtSha256: hash, servedSha256: hash };
  assert.throws(() => validateReceiptBundle(bundle, plan.state), /body was not verified/);
  bundle.productionVerification.articleBody = { slug: 'first', builtSha256: hash, servedSha256: 'c'.repeat(64) };
  assert.throws(() => validateReceiptBundle(bundle, plan.state), /body was not verified/);
  bundle.productionVerification.articleBody = { slug: 'first', builtSha256: hash, servedSha256: hash };
  assert.equal(validateReceiptBundle(bundle, plan.state).runId, '3');
  const { digest: ignoredDigest, ...unsealed } = plan.state;
  const falseRecovery = sealState({ ...unsealed, lastPublication: { ...plan.state.lastPublication, slug: 'old' } });
  assert.throws(() => expectedArticleBodySlug({ ...bundle.selection, state: falseRecovery }), /recovery publication identity/);
  assert.equal(select({ live: plan.state, acknowledgment: time('09:06:00'), runId: '4', now: time('09:36:00') }).selected, 'second');
});

test('live recovery compares the previously selected story and records its proof', async () => {
  const priorState = select().state;
  const plan = select({ live: priorState, acknowledgment: null, runId: '3', now: time('09:05:00') });
  const directory = mkdtempSync(join(tmpdir(), 'aitamer-recovery-body-'));
  const build = join(directory, 'site'), receipts = join(directory, 'receipts');
  mkdirSync(join(build, 'dist/posts/first'), { recursive: true });
  mkdirSync(join(build, 'dist/posts/old'), { recursive: true });
  mkdirSync(join(build, 'dist/comments'), { recursive: true });
  mkdirSync(receipts);
  const built = '<html><div class="article__body"><p>Checked story.</p></div></html>';
  writeFileSync(join(build, 'dist/posts/first/index.html'), built);
  writeFileSync(join(build, 'dist/posts/old/index.html'), '<html>Old</html>');
  writeFileSync(join(build, 'dist/publication-state.json'), JSON.stringify(plan.state));
  writeFileSync(join(build, 'dist/comments/threads.json'), JSON.stringify({ threads: { first: {}, old: {} } }));
  writeFileSync(join(receipts, 'selection.json'), JSON.stringify({ ...plan, requestId: null, priorState }));
  const env = { PUBLICATION_RECEIPT_DIR: receipts, PUBLICATION_SELECTION_DIGEST: plan.state.digest,
    PUBLICATION_DEPLOYMENT_ID: 'actual-deployment-id', GITHUB_RUN_ID: '3', GITHUB_RUN_ATTEMPT: '1', GITHUB_SHA: sourceSha };
  const fetchFor = (body) => async (url) => {
    const path = new URL(url).pathname;
    if (path === '/publication-state.json') return new Response(JSON.stringify(plan.state));
    if (path === '/comments/threads.json') return new Response(JSON.stringify({ threads: { first: {}, old: {} } }));
    if (path === '/posts/first/') return new Response(body);
    throw new Error(`unexpected recovery request: ${path}`);
  };
  await assert.rejects(verifyLive('https://aitamer.news', env, { root: build, fetchImpl: fetchFor(built.replace('Checked story.', 'Different story.')) }), /body differs/);
  await verifyLive('https://aitamer.news', env, { root: build, fetchImpl: fetchFor(built) });
  const proof = JSON.parse(readFileSync(join(receipts, 'production-verification.json'), 'utf8'));
  assert.equal(proof.articleBody.slug, 'first');
  assert.equal(proof.articleBody.servedSha256, proof.articleBody.builtSha256);
});

test('the initial zero-addition bootstrap has an independently verifiable receipt', () => {
  const plan = select({ live: null, mode: 'bootstrap', bootstrapSlugs: ['old'], bootstrapDigest: digest(['old']) });
  const bundle = receiptBundle();
  bundle.selection = { ...plan, priorState: null, requestId: null };
  bundle.artifactVerification = { state: plan.state, visibleCount: plan.state.visible.length, digest: plan.state.digest };
  bundle.productionVerification = { origin: 'https://aitamer.news', verifiedAt: '2026-10-04T09:01:00.000Z',
    deploymentId: 'actual-deployment-id', state: plan.state, articleBody: null };
  assert.equal(validateReceiptBundle(bundle, plan.state).state.visible.length, 1);
  assert.throws(() => validateReceiptBundle({ ...bundle, selection: { ...bundle.selection, selected: 'first' } }, plan.state), /bootstrap receipt/);
});

test('recovery of the baseline has no article body to check', () => {
  const baseline = select({ live: null, mode: 'bootstrap', bootstrapSlugs: ['old'], bootstrapDigest: digest(['old']) }).state;
  const recovered = select({ live: baseline, acknowledgment: null, runId: '3' });
  const selection = { ...recovered, priorState: baseline, requestId: null };
  assert.equal(recovered.selected, null);
  assert.equal(expectedArticleBodySlug(selection), null);
});

test('publication request IDs are either absent or canonical UUID version 4', () => {
  const id = 'a7a44583-7e28-4a7c-8edb-20b9d77d9621';
  assert.equal(validateRequestId(id), id);
  assert.equal(validateRequestId(''), null);
  for (const invalid of ['../../bad', 'plain', id.toUpperCase(), 'a7a44583-7e28-1a7c-8edb-20b9d77d9621'])
    assert.throws(() => validateRequestId(invalid), /request ID/);
});

test('artifact command refuses post-build state changes even when pages and threads match the changed state', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aitamer-selection-boundary-'));
  const build = join(directory, 'site'), receipts = join(directory, 'receipts');
  mkdirSync(join(build, 'dist/posts/old'), { recursive: true });
  mkdirSync(join(build, 'dist/comments'), { recursive: true });
  mkdirSync(join(build, 'public'), { recursive: true });
  mkdirSync(receipts);
  const plan = select({ mode: 'retain' }), state = plan.state;
  writeFileSync(join(receipts, 'selection.json'), JSON.stringify({ ...plan, requestId: null, priorState: live() }));
  writeFileSync(join(build, 'public/publication-state.json'), JSON.stringify(state));
  writeFileSync(join(build, 'dist/publication-state.json'), JSON.stringify(state));
  writeFileSync(join(build, 'dist/comments/threads.json'), JSON.stringify({ threads: { old: {} } }));
  writeFileSync(join(build, 'dist/posts/old/index.html'), '<main>Old</main>');
  const env = { ...process.env, PUBLICATION_RECEIPT_DIR: receipts, PUBLICATION_SELECTION_DIGEST: state.digest,
    GITHUB_RUN_ID: '2', GITHUB_RUN_ATTEMPT: '1', GITHUB_SHA: sourceSha };
  const script = new URL('./publication-cli.mjs', import.meta.url).pathname;
  assert.match(execFileSync(process.execPath, [script, 'verify-artifact'], { cwd: build, env, encoding: 'utf8' }), /publication artifact/);
  writeFileSync(join(receipts, 'selection.json'), JSON.stringify({ ...plan, selected: 'first', requestId: null, priorState: live() }));
  assert.throws(() => execFileSync(process.execPath, [script, 'verify-artifact'], { cwd: build, env, stdio: 'pipe' }), /visible-set difference is invalid/);
  writeFileSync(join(receipts, 'selection.json'), JSON.stringify({ ...plan, requestId: null, priorState: live() }));
  const { digest: ignoredDigest, ...unsealed } = state;
  const changed = sealState({ ...unsealed, visible: ['first', 'old'] });
  writeFileSync(join(build, 'public/publication-state.json'), JSON.stringify(changed));
  writeFileSync(join(build, 'dist/publication-state.json'), JSON.stringify(changed));
  writeFileSync(join(build, 'dist/comments/threads.json'), JSON.stringify({ threads: { old: {}, first: {} } }));
  mkdirSync(join(build, 'dist/posts/first'));
  writeFileSync(join(build, 'dist/posts/first/index.html'), '<main>First</main>');
  assert.throws(() => execFileSync(process.execPath, [script, 'verify-artifact'], { cwd: build, env, stdio: 'pipe' }), /built publication state differs from selection/);
  assert.throws(() => execFileSync(process.execPath, [script, 'verify-artifact'], { cwd: build, env: { ...env, PUBLICATION_RECEIPT_DIR: '' }, stdio: 'pipe' }), /selection receipt directory is required/);
  assert.throws(() => execFileSync(process.execPath, [script, 'verify-live', 'https://aitamer.news'], { cwd: build, env, stdio: 'pipe' }), /built publication state differs from selection/);
  assert.throws(() => execFileSync(process.execPath, [script, 'verify-live', 'https://aitamer.news'], { cwd: build, env: { ...env, PUBLICATION_RECEIPT_DIR: '' }, stdio: 'pipe' }), /selection receipt directory is required/);
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
test('production workflow keeps publication admission inactive and deploys the normal repository build', () => {
  const workflow = yaml.load(readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'));
  assert.equal(workflow.on.workflow_dispatch.inputs.publication_mode, undefined);
  assert.equal(workflow.on.workflow_dispatch.inputs.bootstrap_digest, undefined);
  assert.equal(workflow.on.workflow_dispatch.inputs.publication_request_id, undefined);
  const job = workflow.jobs.deploy, steps = job.steps;
  assert.deepEqual(job.concurrency, { group: 'pages-production', 'cancel-in-progress': false });
  const build = steps.findIndex((step) => step.run === 'npm run build');
  const preview = steps.findIndex((step) => step.id === 'preview');
  const production = steps.findIndex((step) => step.id === 'production');
  assert.ok(build > 0 && preview > build && production > preview);
  assert.equal(steps[build].if, undefined);
  assert.equal(steps[build]['working-directory'], undefined);
  assert.equal(steps.some((step) => step.id === 'publication' || step.run?.includes('publication-cli.mjs')), false);
  assert.equal(steps.some((step) => step.name === 'Retain publication receipts'), false);
  for (const step of steps.filter((step) => step.with?.command?.includes('pages deploy'))) assert.match(step.with.command, /^pages deploy dist /);
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
