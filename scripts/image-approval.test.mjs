import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertImageSignature, certify, checkRemoteAvatars, imageMetadataChange, inspectImageChanges, materialize, prepare, verifyDispatch } from './image-approval.mjs';

const REPO = 'michelabboud/aitamer-news';
const OWNER = 29182417;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==', 'base64');
const AUTHOR = '---\nname: Aviram\nkind: human\navatar: /authors/aviram.png\nportrait: /authors/portrait.png\nportraitAlt: A portrait\n---\n\nOriginal biography.\n';
const POST = '---\ntitle: Original\nauthor: aviram\npubDate: 2026-10-01\nspecimen: 1\nheroImage: https://media.aitamer.news/heroes/original.jpg\nheroAlt: Original hero\n---\n\nOriginal article.\n';
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'aitamer-image-approval-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = (path, bytes) => { mkdirSync(dirname(join(cwd, path)), { recursive: true }); writeFileSync(join(cwd, path), bytes); };
  git('init', '-q', '-b', 'main'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture');
  put('public/authors/aviram.png', PNG); chmodSync(join(cwd, 'public/authors/aviram.png'), 0o755);
  put('src/content/authors/aviram.md', AUTHOR); put('src/content/posts/original.md', POST);
  put('src/content/specimen-ledger.txt', '1 original\n'); put('scripts/trusted.mjs', 'export const trusted = true;\n');
  const commit = () => { git('add', '-A'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD'); };
  const base = commit();
  return { cwd, git, put, commit, base, add: () => { put('public/authors/new.png', PNG); return commit(); } };
}

test('PR292 style image replacement accepts legacy executable deletion and only avatar metadata', t => {
  const f = fixture(t); unlinkSync(join(f.cwd, 'public/authors/aviram.png'));
  f.put('public/authors/aviram.webp', Buffer.from('524946461600000057454250565038200a00000000000000000000000000', 'hex'));
  f.put('src/content/authors/aviram.md', AUTHOR.replace('aviram.png', 'aviram.webp'));
  const head = f.commit(), plan = inspectImageChanges(f.base, head, { cwd: f.cwd });
  assert.equal(plan.tree, f.git('rev-parse', `${head}^{tree}`));
  assert.equal(plan.changes.length, 3); assert.match(plan.digest, /^[a-f0-9]{64}$/);
});

test('standard raster formats have positive extension-specific magic and reject disguised SVG/HTML', () => {
  const samples = {
    png: PNG, jpg: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 2]), jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0, 2]),
    gif: Buffer.from('GIF89a\x01\x00\x01\x00'), webp: Buffer.from('524946461600000057454250565038200a00000000000000000000000000', 'hex'),
    avif: Buffer.from('00000018667479706176696600000000617669666d696631', 'hex'), ico: Buffer.from([0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 32, 0, 1, 0, 0, 0, 22, 0, 0, 0, 0]),
  };
  for (const [ext, bytes] of Object.entries(samples)) {
    assert.doesNotThrow(() => assertImageSignature(`public/example.${ext}`, bytes), ext);
    assert.throws(() => assertImageSignature(`public/example.${ext}`, Buffer.from('<svg onload="evil()"/>')), /signature|format/i, ext);
  }
  assert.throws(() => assertImageSignature('public/example.webp', PNG), /signature|format/i);
});

test('only existing diagram SVG paths use the strict sanitizer', t => {
  const f = fixture(t); f.put('public/diagrams/original/chart.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>');
  assert.doesNotThrow(() => inspectImageChanges(f.base, f.commit(), { cwd: f.cwd }));
  f.put('public/diagrams/original/chart.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.throws(() => inspectImageChanges(f.base, f.commit(), { cwd: f.cwd }), /SVG|svg|script/);
});

test('unrelated code, identity, text, ledger, new author/post, heroes and active SVG paths are rejected', async t => {
  for (const [path, content] of [
    ['scripts/trusted.mjs', 'evil()'], ['.github/workflows/evil.yml', 'permissions: write-all'],
    ['src/content/specimen-ledger.txt', '2 stolen\n'], ['src/content/authors/new.md', AUTHOR], ['src/content/posts/new.md', POST],
    ['src/content/authors/aviram.md', AUTHOR.replace('Aviram', 'Changed')],
    ['src/content/authors/aviram.md', AUTHOR.replace('Original biography.', 'Changed biography.')],
    ['src/content/posts/original.md', POST.replace('specimen: 1', 'specimen: 2')],
    ['src/content/posts/original.md', POST.replace('2026-10-01', '2026-10-02')],
    ['public/heroes/forbidden.png', PNG], ['public/logo.svg', '<svg/>'],
  ]) await t.test(path, st => {
    const f = fixture(st); f.put(path, content);
    assert.throws(() => inspectImageChanges(f.base, f.commit(), { cwd: f.cwd }), /outside|existing|only|metadata|SVG|heroes/i);
  });
});

test('metadata changes preserve all other bytes and parsed fields; alt alone does not authorize a request', t => {
  assert.equal(imageMetadataChange('src/content/posts/original.md', POST, POST.replace('original.jpg', 'replacement.jpg').replace('Original hero', 'Replacement hero')), true);
  assert.equal(imageMetadataChange('src/content/authors/aviram.md', AUTHOR, AUTHOR.replace('A portrait', 'New description')), false);
  for (const after of [
    POST.replace('heroImage:', '"heroImage":'), POST.replace('heroImage:', 'heroImage: &x'),
    POST.replace('heroImage:', 'heroImage: a\nheroImage:'), POST.replace('heroAlt: Original hero', 'heroAlt: >-\n  Multiline'),
    POST.replace('heroImage: https://media.aitamer.news/heroes/original.jpg', 'heroImage:\n  nested: value'),
    POST.replace('Original article.', 'New article.'),
  ]) assert.throws(() => imageMetadataChange('src/content/posts/original.md', POST, after), /field|metadata|frontmatter|line|only|YAML/i);
  const f = fixture(t); f.put('src/content/posts/original.md', POST.replace('Original hero', 'Changed hero'));
  assert.throws(() => inspectImageChanges(f.base, f.commit(), { cwd: f.cwd }), /image asset|image URL/i);
});

test('changed avatars allow only local raster paths or static HTTPS images on owned media origins', () => {
  const update = value => AUTHOR.replace('avatar: /authors/aviram.png', `avatar: ${JSON.stringify(value)}`);
  for (const value of ['/authors/aviram.webp', '/images/favicons/avatar.ico', 'https://bots.aitamer.news/authors/avatar.webp', 'https://media.aitamer.news/authors/avatar.jpg']) {
    assert.equal(imageMetadataChange('src/content/authors/aviram.md', AUTHOR, update(value)), true, value);
  }
  for (const value of [
    '', 'https://tracker.example/avatar.png', 'https://bots.aitamer.news.tracker.example/avatar.png',
    'data:image/png;base64,AAAA', 'javascript:alert(1)', '//tracker.example/avatar.webp',
    'https://owner:password@bots.aitamer.news/authors/avatar.webp', 'https://%', 'not a URL',
    '/heroes/avatar.png', '/authors/../secret.png', '/authors/avatar.svg', '/authors/avatar.png?reader=1',
    'https://bots.aitamer.news/authors/avatar.webp?reader=1', 'https://bots.aitamer.news/authors/avatar.webp#reader',
    'https://bots.aitamer.news/authors/avatar.webp?', 'https://bots.aitamer.news/authors/avatar.webp#',
    'http://bots.aitamer.news/authors/avatar.webp', 'https://bots.aitamer.news:8443/authors/avatar.webp',
  ]) assert.throws(() => imageMetadataChange('src/content/authors/aviram.md', AUTHOR, update(value)), /avatar|origin|image URL/i, value);
  const legacy = AUTHOR.replace('/authors/aviram.png', 'https://legacy.example/avatar.png');
  assert.equal(imageMetadataChange('src/content/authors/aviram.md', legacy, legacy.replace('A portrait', 'New description')), false, 'unchanged legacy URLs retain their existing acceptance');
});

test('changed remote avatars must answer bounded, credential-free HEAD with matching image MIME', async t => {
  const f = fixture(t), url = 'https://bots.aitamer.news/authors/avatar.webp';
  f.put('src/content/authors/aviram.md', AUTHOR.replace('/authors/aviram.png', url));
  const plan = inspectImageChanges(f.base, f.commit(), { cwd: f.cwd });
  const calls = [];
  await checkRemoteAvatars(plan, { cwd: f.cwd, fetcher: async (input, options) => {
    calls.push({ input, options }); return new Response(null, { status: 200, headers: { 'Content-Type': 'image/webp' } });
  } });
  assert.equal(calls.length, 1); assert.equal(calls[0].input, url);
  assert.equal(calls[0].options.method, 'HEAD'); assert.equal(calls[0].options.redirect, 'error');
  assert.ok(calls[0].options.signal instanceof AbortSignal); assert.equal(calls[0].options.headers?.Authorization, undefined);
  for (const fetcher of [
    async () => new Response(null, { status: 404 }),
    async () => new Response(null, { status: 200, headers: { 'Content-Type': 'text/html' } }),
    async () => new Response(null, { status: 302, headers: { location: 'https://tracker.example/image.webp' } }),
    async () => { throw new Error('connection failed'); },
  ]) await assert.rejects(checkRemoteAvatars(plan, { cwd: f.cwd, fetcher }), /avatar|HEAD|MIME|media/i);
});

test('remote avatar checks never fetch unchanged remote references or local asset changes', async t => {
  const f = fixture(t), old = AUTHOR.replace('/authors/aviram.png', 'https://legacy.example/avatar.png');
  f.put('src/content/authors/aviram.md', old); const base = f.commit();
  f.put('src/content/authors/aviram.md', old.replace('A portrait', 'New portrait description'));
  f.put('public/authors/new.png', PNG);
  const plan = inspectImageChanges(base, f.commit(), { cwd: f.cwd });
  await checkRemoteAvatars(plan, { cwd: f.cwd, fetcher: async () => { assert.fail('unchanged avatar must never be fetched'); } });
});

test('symlinks, submodules, executable additions, mode changes and oversized images fail closed', async t => {
  for (const mode of ['100755', '120000', '160000']) await t.test(mode, st => {
    const f = fixture(st); f.put('public/new.png', PNG); f.git('add', 'public/new.png');
    const object = mode === '160000' ? f.base : f.git('hash-object', '-w', 'public/new.png');
    f.git('update-index', '--add', '--cacheinfo', `${mode},${object},public/new.png`);
    f.git('commit', '-qm', 'bad mode');
    assert.throws(() => inspectImageChanges(f.base, f.git('rev-parse', 'HEAD'), { cwd: f.cwd }), /mode|regular/);
  });
  const f = fixture(t); f.put('public/too-big.png', Buffer.concat([PNG, Buffer.alloc(11 * 1024 * 1024)]));
  assert.throws(() => inspectImageChanges(f.base, f.commit(), { cwd: f.cwd }), /bound|bytes|size/i);
});

test('file count and aggregate byte bounds reject otherwise valid image batches', async t => {
  await t.test('count', st => {
    const f = fixture(st); for (let i = 0; i < 65; i++) f.put(`public/batch/image-${i}.png`, PNG);
    assert.throws(() => inspectImageChanges(f.base, f.commit(), { cwd: f.cwd }), /changed files/);
  });
  await t.test('aggregate bytes', st => {
    const f = fixture(st), image = Buffer.concat([PNG, Buffer.alloc(9 * 1024 * 1024)]);
    for (let i = 0; i < 6; i++) f.put(`public/batch/image-${i}.png`, image);
    assert.throws(() => inspectImageChanges(f.base, f.commit(), { cwd: f.cwd }), /aggregate byte/);
  });
});


function state(base = 'a'.repeat(40), head = 'b'.repeat(40)) {
  const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: REPO, GITHUB_RUN_ID: '100', GITHUB_RUN_ATTEMPT: '1', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main', GITHUB_SHA: base, GITHUB_WORKFLOW_SHA: base, GITHUB_ACTOR_ID: String(OWNER), GITHUB_WORKFLOW_REF: `${REPO}/.github/workflows/image-approval.yml@refs/heads/main`, PR_NUMBER: '292', SOURCE_SHA: head };
  const run = { id: 100, run_attempt: 1, event: 'workflow_dispatch', head_branch: 'main', head_sha: base, path: '.github/workflows/image-approval.yml', display_title: `Owner image approval pr=292 head=${head}`, repository: { full_name: REPO }, head_repository: { full_name: REPO }, actor: { id: OWNER }, triggering_actor: { id: OWNER } };
  const pr = { number: 292, state: 'open', draft: false, head: { sha: head, ref: 'images/portrait', repo: { full_name: REPO } }, base: { ref: 'main', sha: base, repo: { full_name: REPO } } };
  const writes = [];
  const api = { repo: REPO, async request(path, method = 'GET', body) {
    if (method !== 'GET') { writes.push({ path, method, body }); return { id: writes.length }; }
    if (path === '/actions/runs/100') return structuredClone(run);
    if (path === '/pulls/292') return structuredClone(pr);
    if (path === '/git/ref/heads/main') return { object: { sha: base } };
    throw new Error(`unexpected API request ${path}`);
  }, async list(path, key) {
    assert.equal(path, '/actions/runs/100/attempts/1/jobs'); assert.equal(key, 'jobs');
    return [{ name: 'prepare-images', conclusion: 'success', status: 'completed' }, { name: 'validate-images', conclusion: 'success', status: 'completed' }];
  } };
  return { env, run, pr, api, writes };
}

test('only immutable owner dispatch on current trusted main authorizes exact open same-repo head', async t => {
  assert.equal((await verifyDispatch(state().api, state().env)).source, 'b'.repeat(40));
  const cases = [
    s => { s.run.actor.id = 99; }, s => { s.run.triggering_actor.id = 99; }, s => { s.env.GITHUB_ACTOR_ID = '99'; },
    s => { s.run.path = '.github/workflows/evil.yml'; }, s => { s.run.event = 'pull_request'; },
    s => { s.env.GITHUB_REF = 'refs/heads/images/evil'; }, s => { s.env.GITHUB_WORKFLOW_SHA = 'c'.repeat(40); },
    s => { s.pr.head.sha = 'c'.repeat(40); }, s => { s.pr.base.sha = 'c'.repeat(40); },
    s => { s.pr.head.repo.full_name = 'fork/repo'; }, s => { s.pr.base.ref = 'dev'; },
    s => { s.pr.draft = true; }, s => { s.pr.state = 'closed'; }, s => { s.pr.head.ref = 'other/unsafe'; },
    s => { s.run.display_title = s.run.display_title.replace('292', '293'); },
  ];
  for (const [index, mutate] of cases.entries()) await t.test(String(index), async () => {
    const s = state(); mutate(s); await assert.rejects(verifyDispatch(s.api, s.env), /owner|trusted|current|head|base|same|open|dispatch|images\//i); assert.equal(s.writes.length, 0);
  });
});

test('live main drift invalidates preparation and certification before any mutation', async t => {
  const f = fixture(t), head = f.add(), plan = inspectImageChanges(f.base, head, { cwd: f.cwd }); f.git('checkout', '-q', f.base);
  for (const action of [prepare, certify]) {
    const s = state(f.base, head), request = s.api.request;
    s.api.request = async (path, ...args) => path === '/git/ref/heads/main' ? { object: { sha: 'c'.repeat(40) } } : request(path, ...args);
    await assert.rejects(action(s.api, { ...s.env, BASE_SHA: f.base, HEAD_SHA: head, TREE_SHA: plan.tree, IMAGE_DIGEST: plan.digest, VALIDATION_RESULT: 'success', PREPARE_RESULT: 'success' }, { cwd: f.cwd, fetchCommits() {} }), /current main/);
    assert.equal(s.writes.length, 0);
  }
});

test('prepare is read-only; materialization copies only a deterministic image-only tree into trusted checkout', async t => {
  const f = fixture(t), head = f.add(), s = state(f.base, head);
  f.git('checkout', '-q', f.base);
  const prepared = await prepare(s.api, s.env, { cwd: f.cwd, fetchCommits() {} }); assert.equal(s.writes.length, 0);
  const env = { ...s.env, BASE_SHA: prepared.base, HEAD_SHA: prepared.source, TREE_SHA: prepared.tree, IMAGE_DIGEST: prepared.digest };
  materialize(env, { cwd: f.cwd, fetchCommits() {}, decode() {} });
  assert.equal(readFileSync(join(f.cwd, 'scripts/trusted.mjs'), 'utf8'), 'export const trusted = true;\n');
  assert.deepEqual(readFileSync(join(f.cwd, 'public/authors/new.png')), PNG);
  assert.equal(f.git('rev-parse', 'HEAD'), f.base, 'candidate code is never checked out');
  assert.throws(() => materialize({ ...env, IMAGE_DIGEST: '0'.repeat(64) }, { cwd: f.cwd, fetchCommits() {}, decode() {} }), /binding|digest/);
});

test('base must already be an ancestor of source and materialization rejects a dirty or wrong checkout', t => {
  const f = fixture(t), head = f.add(); f.git('checkout', '-q', '-b', 'other', f.base); f.put('other.txt', 'base drift'); const drift = f.commit();
  assert.throws(() => inspectImageChanges(drift, head, { cwd: f.cwd }), /current main|ancestor|update/i);
  const plan = inspectImageChanges(f.base, head, { cwd: f.cwd });
  assert.throws(() => materialize({ ...state(f.base, head).env, BASE_SHA: f.base, HEAD_SHA: head, TREE_SHA: plan.tree, IMAGE_DIGEST: plan.digest }, { cwd: f.cwd, fetchCommits() {}, decode() {} }), /checkout|trusted/);
});

test('certification recomputes exact image/base proof and validates this attempt successful isolated jobs', async t => {
  const f = fixture(t), head = f.add(), plan = inspectImageChanges(f.base, head, { cwd: f.cwd }), s = state(f.base, head);
  f.git('checkout', '-q', f.base);
  const env = { ...s.env, BASE_SHA: f.base, HEAD_SHA: head, TREE_SHA: plan.tree, IMAGE_DIGEST: plan.digest, VALIDATION_RESULT: 'success', PREPARE_RESULT: 'success' };
  await certify(s.api, env, { cwd: f.cwd, fetchCommits() {} });
  assert.deepEqual(s.writes.map(w => w.body.name), ['publisher-paths', 'check', 'specimen-integrity']);
  for (const { path, body } of s.writes) {
    assert.equal(path, '/check-runs'); assert.equal(body.head_sha, head); assert.match(body.external_id, /^image-approval-v1:/);
    assert.ok(body.external_id.includes(f.base)); assert.ok(body.external_id.includes(plan.digest)); assert.ok(body.output.summary.includes(plan.tree));
  }
  for (const changes of [{ IMAGE_DIGEST: '0'.repeat(64) }, { VALIDATION_RESULT: 'failure' }, { BASE_SHA: 'c'.repeat(40) }, { HEAD_SHA: 'c'.repeat(40) }]) {
    const refused = state(f.base, head); await assert.rejects(certify(refused.api, { ...env, ...changes }, { cwd: f.cwd, fetchCommits() {} })); assert.equal(refused.writes.length, 0);
  }
  const failed = state(f.base, head); failed.api.list = async () => [{ name: 'validate-images', status: 'completed', conclusion: 'failure' }];
  await assert.rejects(certify(failed.api, env, { cwd: f.cwd, fetchCommits() {} }), /validation|jobs|successful/); assert.equal(failed.writes.length, 0);
});

test('workflow isolates credentials, uses trusted base and runs every existing validation gate', () => {
  const yaml = readFileSync(new URL('../.github/workflows/image-approval.yml', import.meta.url), 'utf8');
  const validate = yaml.split('  validate:\n')[1]?.split('  certify:\n')[0]; assert.ok(validate);
  assert.match(yaml, /name: Approve image PR/); assert.match(yaml, /workflow_dispatch:/); assert.doesNotMatch(yaml, /pull_request_target|secrets\.|SPECIMEN_WRITE_TOKEN|MAINTAINER_ID/);
  assert.doesNotMatch(validate, /GH_TOKEN|github\.token|checks: write|contents: write|pull-requests: write|persist-credentials: true/);
  assert.match(validate, /ref: \$\{\{ needs\.prepare\.outputs\.base \}\}/);
  for (const command of ['npm test', 'npm run check:posts', 'npm run check:media', 'npm run build', 'npm run check:bodies:build', 'npm run check:csp', 'npm run check:links', 'npm run check:diagrams:dist']) assert.ok(validate.includes(command), command);
  assert.match(yaml, /VALIDATION_RESULT: \$\{\{ needs\.validate\.result \}\}/);
});

test('the CLI reaches its environment rejection without a module-cycle deadlock', () => {
  assert.throws(() => execFileSync(process.execPath, [fileURLToPath(new URL('./image-approval.mjs', import.meta.url)), 'prepare'], { env: { ...process.env, GITHUB_REPOSITORY: '', GH_TOKEN: '' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), error => error.status === 1 && /Image approval refused: invalid repository/.test(error.stderr));
});
