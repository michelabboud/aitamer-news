#!/usr/bin/env node
/** Prepare and verify the exact publication artifact; credentials never enter receipts. */
import { appendFileSync, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parse, serialize } from 'parse5';
import { acknowledgedAt, digest, isoTime, selectPublication, sha256, slugs, validateQueue, validateState } from './publication.mjs';
import { assertOnlyChanged, isPublishedDraftField, pubDateOf, readFrontmatter, topLevelLine, withRaw } from './frontmatter.mjs';

const SITE = 'https://aitamer.news';
const REPOSITORY = 'michelabboud/aitamer-news';
const NETWORK_TIMEOUT_MS = 30_000;
const MAX_JSON_BYTES = 4 * 1024 * 1024;
const POSTS = 'src/content/posts';
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

/** Cloudflare may rewrite email-sharing links outside the story. Compare its actual body. */
export function articleBodyDigest(html) {
  const bodies = [];
  const visit = (node) => {
    if (node.tagName === 'div' && node.attrs?.some((attribute) => attribute.name === 'class' && attribute.value.split(/\s+/).includes('article__body'))) bodies.push(node);
    for (const child of node.childNodes ?? []) visit(child);
  };
  visit(parse(html));
  requireThat(bodies.length === 1, 'selected article must contain exactly one story body');
  return sha256(serialize(bodies[0]));
}

export async function fetchJson(url, { token, missing = false, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    redirect: 'error', signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS), cache: 'no-store',
  });
  if (missing && response.status === 404) return null;
  requireThat(response.ok, `publication request failed with HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  requireThat(declared <= MAX_JSON_BYTES, 'publication response exceeds size limit');
  let size = 0, parts = [];
  for await (const chunk of response.body) {
    size += chunk.length;
    requireThat(size <= MAX_JSON_BYTES, 'publication response exceeds size limit');
    parts.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw new Error('publication response is not valid JSON'); }
}

/** Canonical production and deployment URLs only; CLI input cannot redirect credentials. */
export function siteBase(value) {
  const url = new URL(value);
  requireThat(url.protocol === 'https:' && !url.username && !url.password && !url.port &&
    (url.hostname === 'aitamer.news' || /^[a-z0-9-]+\.aitamer-news\.pages\.dev$/.test(url.hostname)) &&
    url.pathname === '/' && !url.search && !url.hash, 'invalid publication verification origin');
  return url.origin;
}

export function readPosts(root, queue, now) {
  const files = new Map();
  for (const name of readdirSync(join(root, POSTS))) {
    if (!/\.mdx?$/.test(name)) continue;
    requireThat(name.endsWith('.md'), 'publication only accepts Markdown post files');
    const path = join(root, POSTS, name);
    requireThat(lstatSync(path).isFile(), 'publication post must be a regular file');
    const text = readFileSync(path, 'utf8');
    const frontmatter = readFrontmatter(text);
    requireThat(frontmatter !== null, `post has no frontmatter: ${name}`);
    files.set(name.slice(0, -3), { text, frontmatter, path });
  }
  for (const entry of queue.entries) {
    const post = files.get(entry.slug);
    requireThat(post && sha256(post.text) === entry.sha256, `reviewed content hash mismatch: ${entry.slug}`);
    requireThat(isPublishedDraftField(post.frontmatter.data) === true && pubDateOf(post.frontmatter).date?.valueOf() === isoTime(entry.pubDate), `reviewed schedule/draft mismatch: ${entry.slug}`);
  }
  return files;
}

/** A held flag only affects this owned build copy, never original bytes or article words. */
export function heldPost(text) {
  const fm = readFrontmatter(text);
  requireThat(fm !== null, 'cannot hold a post without frontmatter');
  if (fm.data.draft === true) return text;
  const line = topLevelLine(fm.raw, 'draft');
  const raw = line ? fm.raw.slice(0, line.start) + 'draft: true' + fm.raw.slice(line.end) : fm.raw + '\ndraft: true';
  const changed = withRaw(text, fm, raw);
  assertOnlyChanged(fm.data, changed, 'draft', (value) => value === true);
  return changed;
}

export function prepareBuildCopy(root, destination, files, state, now, trackedFiles) {
  requireThat(!existsSync(destination), 'publication build destination already exists');
  const tracked = new Set(trackedFiles);
  for (const slug of files.keys()) requireThat(tracked.has(`${POSTS}/${slug}.md`), `untracked post cannot enter a publication build: ${slug}`);
  const visible = new Set(state.visible);
  for (const slug of visible) {
    const post = files.get(slug);
    requireThat(post && isPublishedDraftField(post.frontmatter.data) === true && pubDateOf(post.frontmatter).date?.valueOf() <= now, `visible article is missing, draft or future: ${slug}`);
  }
  mkdirSync(destination, { mode: 0o700 });
  for (const name of trackedFiles) {
    const target = resolve(destination, name);
    requireThat(target.startsWith(resolve(destination) + sep) && !name.startsWith('.git/') && !name.startsWith('node_modules/'), 'invalid tracked publication path');
    const source = join(root, name);
    requireThat(lstatSync(source).isFile(), `publication source is not a regular file: ${name}`);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
  for (const [slug, post] of files) {
    if (!visible.has(slug)) writeFileSync(join(destination, POSTS, `${slug}.md`), heldPost(post.text));
  }
  requireThat(existsSync(join(root, 'node_modules')), 'publication dependencies are unavailable');
  symlinkSync(resolve(root, 'node_modules'), join(destination, 'node_modules'), 'dir');
  mkdirSync(join(destination, 'public'), { recursive: true });
  writeFileSync(join(destination, 'public/publication-state.json'), JSON.stringify(state, null, 2) + '\n');
  appendFileSync(join(destination, 'public/_headers'), '\n/publication-state.json\n  Cache-Control: no-store\n');
}

export function verifyArtifact(root, state) {
  const expected = validateState(state);
  const artifact = validateState(JSON.parse(readFileSync(join(root, 'dist/publication-state.json'), 'utf8')));
  requireThat(artifact.digest === expected.digest, 'built publication state differs from selection');
  const threads = JSON.parse(readFileSync(join(root, 'dist/comments/threads.json'), 'utf8'));
  requireThat(digest(slugs(Object.keys(threads.threads ?? {}))) === digest(expected.visible), 'built comment threads differ from selected articles');
  const pages = readdirSync(join(root, 'dist/posts'), { withFileTypes: true }).filter((entry) => entry.isDirectory() && existsSync(join(root, 'dist/posts', entry.name, 'index.html'))).map((entry) => entry.name);
  requireThat(digest(slugs(pages)) === digest(expected.visible), 'built article pages differ from selected articles');
  return { visibleCount: expected.visible.length, digest: expected.digest };
}

async function prepare(mode, bootstrapDigest, env) {
  const root = process.cwd();
  requireThat(env.GITHUB_REPOSITORY === REPOSITORY && env.GITHUB_REF === 'refs/heads/main', 'publication only runs from the main repository branch');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  requireThat(head === env.GITHUB_SHA, 'checked out publication commit differs from workflow');
  const token = env.GH_TOKEN;
  requireThat(Boolean(token), 'GH_TOKEN is required for publication verification');
  const current = await fetchJson(`https://api.github.com/repos/${REPOSITORY}/git/ref/heads/main`, { token });
  requireThat(current.object?.sha === head, 'publication candidate is no longer main; dispatch the latest commit');
  const queue = validateQueue(JSON.parse(readFileSync('publication/queue.json', 'utf8')));
  const live = await fetchJson(`${SITE}/publication-state.json?publication=${encodeURIComponent(env.GITHUB_RUN_ID)}`, { missing: mode === 'bootstrap' });
  let acknowledgment = null, bootstrapSlugs = null;
  if (live !== null) {
    const state = validateState(live);
    const identity = state.lastPublication;
    const run = await fetchJson(`https://api.github.com/repos/${REPOSITORY}/actions/runs/${identity.runId}/attempts/${identity.attempt}`, { token, missing: true });
    acknowledgment = acknowledgedAt(run, identity);
  } else {
    const threads = await fetchJson(`${SITE}/comments/threads.json?publication=${encodeURIComponent(env.GITHUB_RUN_ID)}`);
    requireThat(threads?.version === 1 && typeof threads.threads === 'object' && threads.threads !== null, 'live baseline threads are invalid');
    bootstrapSlugs = Object.keys(threads.threads);
  }
  const now = Date.now();
  const plan = selectPublication({ queue, live, mode, now, sourceSha: head, runId: env.GITHUB_RUN_ID, attempt: Number(env.GITHUB_RUN_ATTEMPT), acknowledgment, bootstrapSlugs, bootstrapDigest });
  const files = readPosts(root, queue, now);
  execFileSync('git', ['diff', '--quiet', 'HEAD', '--'], { stdio: 'pipe' });
  const runDir = mkdtempSync(join(env.RUNNER_TEMP || tmpdir(), 'aitamer-publication-'));
  const destination = join(runDir, 'site');
  const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\0').filter(Boolean);
  requireThat(trackedFiles.includes('publication/queue.json'), 'publication queue is not part of the pinned source');
  prepareBuildCopy(root, destination, files, plan.state, now, trackedFiles);
  writeFileSync(join(runDir, 'selection.json'), JSON.stringify({ ...plan, priorState: live, acknowledgment: acknowledgment === null ? null : new Date(acknowledgment).toISOString() }, null, 2) + '\n');
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `build-dir=${destination}\nreceipt-dir=${runDir}\nselected=${plan.selected ?? ''}\nreason=${plan.reason}\nshould-deploy=${!['spacing', 'nothing_due'].includes(plan.reason)}\n`);
  console.log(`publication: ${plan.reason}; ${plan.state.visible.length} visible; selected ${plan.selected ?? 'none'}`);
}

async function verifyLive(base, env) {
  const origin = siteBase(base);
  const expected = validateState(JSON.parse(readFileSync('dist/publication-state.json', 'utf8')));
  const live = validateState(await fetchJson(`${origin}/publication-state.json?publication=${encodeURIComponent(env.GITHUB_RUN_ID ?? 'verify')}`));
  requireThat(live.digest === expected.digest, 'served publication state differs from the built artifact');
  const threads = await fetchJson(`${origin}/comments/threads.json?publication=${encodeURIComponent(env.GITHUB_RUN_ID ?? 'verify')}`);
  requireThat(digest(slugs(Object.keys(threads.threads ?? {}))) === digest(expected.visible), 'served threads differ from publication state');
  const selection = env.PUBLICATION_RECEIPT_DIR ? JSON.parse(readFileSync(join(env.PUBLICATION_RECEIPT_DIR, 'selection.json'), 'utf8')) : null;
  if (selection?.selected) {
    const slug = selection.selected;
    requireThat(expected.visible.includes(slug), 'selected article is absent from the expected live set');
    const response = await fetch(`${origin}/posts/${encodeURIComponent(slug)}/?publication=${encodeURIComponent(env.GITHUB_RUN_ID ?? 'verify')}`, { redirect: 'error', signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS), cache: 'no-store' });
    requireThat(response.ok, `selected live article answered HTTP ${response.status}`);
    const page = await response.text();
    const built = readFileSync(join('dist/posts', slug, 'index.html'), 'utf8');
    requireThat(articleBodyDigest(page) === articleBodyDigest(built), 'selected live article body differs from the checked HTML');
  }
  console.log(`publication verified: ${expected.visible.length} articles; ${expected.digest}`);
  if (env.PUBLICATION_RECEIPT_DIR) writeFileSync(join(env.PUBLICATION_RECEIPT_DIR, origin === SITE ? 'production-verification.json' : 'preview-verification.json'), JSON.stringify({ origin, verifiedAt: new Date().toISOString(), state: expected }, null, 2) + '\n');
}

async function verifyPrior(env) {
  requireThat(Boolean(env.PUBLICATION_RECEIPT_DIR), 'publication selection receipt is required');
  const selection = JSON.parse(readFileSync(join(env.PUBLICATION_RECEIPT_DIR, 'selection.json'), 'utf8'));
  const live = await fetchJson(`${SITE}/publication-state.json?publication=${encodeURIComponent(env.GITHUB_RUN_ID)}`, { missing: selection.priorState === null });
  if (selection.priorState === null) {
    requireThat(live === null, 'publication bootstrap baseline changed');
    const threads = await fetchJson(`${SITE}/comments/threads.json?publication=${encodeURIComponent(env.GITHUB_RUN_ID)}`);
    requireThat(digest(slugs(Object.keys(threads.threads ?? {}))) === digest(selection.state.visible), 'publication bootstrap visible set changed');
  } else requireThat(validateState(live).digest === validateState(selection.priorState).digest, 'prior production state changed');
  console.log('publication: prior production state verified');
}

export async function main(args, env = process.env) {
  const [command, value, bootstrapDigest = ''] = args;
  if (command === 'prepare' && args.length <= 3) return prepare(value || 'retain', bootstrapDigest, env);
  if (command === 'verify-artifact' && args.length === 1) {
    const state = JSON.parse(readFileSync('public/publication-state.json', 'utf8'));
    console.log(`publication artifact: ${JSON.stringify(verifyArtifact(process.cwd(), state))}`);
    return;
  }
  if (command === 'verify-live' && args.length === 2) return verifyLive(value, env);
  if (command === 'verify-prior' && args.length === 1) return verifyPrior(env);
  if (command === 'record' && args.length === 1) {
    requireThat(Boolean(env.PUBLICATION_RECEIPT_DIR), 'publication receipt directory is required');
    const receipt = {
      runId: env.GITHUB_RUN_ID, attempt: Number(env.GITHUB_RUN_ATTEMPT), sourceSha: env.GITHUB_SHA,
      observedAt: new Date().toISOString(), outcome: env.PUBLICATION_OUTCOME,
      previousDeployment: env.PUBLICATION_PREVIOUS_DEPLOYMENT || null,
      previewDeployment: env.PUBLICATION_PREVIEW_DEPLOYMENT || null,
      productionDeployment: env.PUBLICATION_PRODUCTION_DEPLOYMENT || null,
    };
    writeFileSync(join(env.PUBLICATION_RECEIPT_DIR, 'outcome.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
    return;
  }
  throw new Error('usage: publication-cli.mjs prepare [retain|publish|bootstrap] [baseline-digest] | verify-artifact | verify-live <origin> | verify-prior');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { await main(process.argv.slice(2)); }
  catch (error) { console.error(`publication: ${error.message}`); process.exitCode = 1; }
}
