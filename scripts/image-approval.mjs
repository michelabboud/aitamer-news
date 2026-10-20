#!/usr/bin/env node
/** Owner dispatch authorizes one exact image-only head. Privileged jobs read Git objects only;
 * the isolated validation job materializes approved data over its trusted-main checkout. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { readFrontmatter } from './frontmatter.mjs';
import { parseHeadModes, parseNameStatus } from './check-publisher-paths.mjs';
import { checkSvg, DIAGRAM_PATH } from './check-diagrams.mjs';

// Numeric identity is an authority invariant in reviewed main, never a mutable repository variable.
const OWNER_ID = 29182417;
const WORKFLOW = '.github/workflows/image-approval.yml';
const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const REQUEST = /^Owner image approval pr=(\d+) head=([a-f0-9]{40})$/;
const RASTER = /^public\/(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(png|jpe?g|webp|gif|avif|ico)$/;
const AUTHOR = /^src\/content\/authors\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const POST = /^src\/content\/posts\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const AUTHOR_FIELDS = ['avatar', 'portrait', 'portraitAlt'];
const POST_FIELDS = ['heroImage', 'heroAlt'];
const IMAGE_URL_FIELDS = ['avatar', 'portrait', 'heroImage'];
const AVATAR_ORIGINS = new Set(['https://media.aitamer.news', 'https://bots.aitamer.news']);
const MAX_FILES = 64;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_METADATA_BYTES = 256 * 1024;
const MAX_DIMENSION = 8192;
const MAX_PIXELS = 32 * 1024 * 1024;
const DECODE_TIMEOUT_MS = 30_000;
const REMOTE_AVATAR_TIMEOUT_MS = 15_000;
const IMAGE_MIME = { png: ['image/png'], jpg: ['image/jpeg'], jpeg: ['image/jpeg'], webp: ['image/webp'], gif: ['image/gif'], avif: ['image/avif'], ico: ['image/x-icon', 'image/vnd.microsoft.icon'] };
const CHECK_NAMES = ['publisher-paths', 'check', 'specimen-integrity'];

const sha = value => { if (!SHA.test(value ?? '')) throw new Error('invalid full commit SHA'); return value; };
const integer = value => { if (!/^[1-9][0-9]*$/.test(String(value))) throw new Error('invalid positive ID'); const n = Number(value); if (!Number.isSafeInteger(n)) throw new Error('invalid positive ID'); return n; };
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const utf8 = bytes => { const text = bytes.toString('utf8'); if (!Buffer.from(text).equals(bytes)) throw new Error('invalid UTF-8 metadata or SVG'); return text; };
function blob(cwd, commit, path, limit) {
  const ref = `${sha(commit)}:${path}`, size = Number(git(cwd, 'cat-file', '-s', ref));
  if (!Number.isSafeInteger(size) || size < 1 || size > limit) throw new Error(`${path}: blob size exceeds image/metadata byte bound`);
  return execFileSync('git', ['show', ref], { cwd, maxBuffer: limit });
}

/** Cheap positive file identification at the privileged boundary; the isolated job also decodes. */
export function assertImageSignature(path, bytes) {
  const ext = RASTER.exec(path)?.[1];
  let valid = false;
  if (ext === 'png') valid = bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) && bytes.toString('ascii', 12, 16) === 'IHDR';
  else if (ext === 'jpg' || ext === 'jpeg') valid = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  else if (ext === 'gif') valid = bytes.length >= 10 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6));
  else if (ext === 'webp') valid = bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.readUInt32LE(4) + 8 === bytes.length && bytes.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16));
  else if (ext === 'ico') valid = bytes.length >= 22 && bytes.readUInt16LE(0) === 0 && bytes.readUInt16LE(2) === 1 && bytes.readUInt16LE(4) > 0 && bytes.readUInt16LE(4) <= 256 && bytes.length >= 6 + 16 * bytes.readUInt16LE(4);
  else if (ext === 'avif' && bytes.length >= 16 && bytes.toString('ascii', 4, 8) === 'ftyp') {
    const length = bytes.readUInt32BE(0);
    if (length >= 16 && length <= bytes.length && length % 4 === 0) {
      const brands = [bytes.toString('ascii', 8, 12)];
      for (let offset = 16; offset < length; offset += 4) brands.push(bytes.toString('ascii', offset, offset + 4));
      valid = brands.some(brand => ['avif', 'avis'].includes(brand));
    }
  }
  if (!valid) throw new Error(`${path}: image signature does not match the allowed raster format`);
}

/** Remove only unambiguous, single-line scalar image fields. Everything else stays byte-for-byte. */
function metadataView(text, fields) {
  const fm = readFrontmatter(text);
  if (!fm) throw new Error('image metadata needs existing frontmatter');
  const omitted = new Set();
  const lines = fm.raw.split('\n');
  for (const field of fields) {
    if (!Object.hasOwn(fm.data, field)) continue;
    const index = lines.findIndex(line => line.startsWith(`${field}:`));
    if (index < 0 || typeof fm.data[field] !== 'string' || /[\x00-\x1f\x7f]/.test(fm.data[field]) || fm.data[field].length > 4096 || /^[|>]/.test(lines[index].slice(field.length + 1).trimStart())) throw new Error(`${field}: image field must be a plain own top-level single-line string`);
    const standalone = readFrontmatter(`---\n${lines[index]}\n---\n`);
    if (!standalone || Object.keys(standalone.data).length !== 1 || !isDeepStrictEqual(standalone.data[field], fm.data[field])) throw new Error(`${field}: image field has ambiguous multiline metadata`);
    omitted.add(index);
  }
  const remaining = { ...fm.data };
  for (const field of fields) delete remaining[field];
  return { fm, remaining, text: text.slice(0, fm.start) + lines.filter((_, index) => !omitted.has(index)).join('\n') + text.slice(fm.end) };
}

function assertAvatarURL(value) {
  const local = typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
  let allowed = local && !value.startsWith('/heroes/') && RASTER.test(`public${value}`);
  if (!local && typeof value === 'string' && value.startsWith('https://')) {
    const url = URL.canParse(value) ? new URL(value) : null;
    allowed = Boolean(url && AVATAR_ORIGINS.has(url.origin) && !url.username && !url.password && !/[?#\\]/.test(value) && url.href === value && RASTER.test(`public${url.pathname}`));
  }
  if (!allowed) throw new Error('avatar: image URL must be a local raster path outside /heroes/ or an HTTPS raster URL on media.aitamer.news/bots.aitamer.news, without credentials, query or fragment; other origins require a normal maintainer PR');
}

/** Returns whether an image URL (rather than alt text alone) changed. No editorial fields change. */
export function imageMetadataChange(path, before, after) {
  const fields = AUTHOR.test(path) ? AUTHOR_FIELDS : POST.test(path) ? POST_FIELDS : null;
  if (!fields) throw new Error(`${path}: outside image metadata scope`);
  const original = metadataView(before, fields), candidate = metadataView(after, fields);
  if (original.text !== candidate.text || !isDeepStrictEqual(original.remaining, candidate.remaining)) throw new Error(`${path}: only image metadata fields may change; preserve all other bytes`);
  if (AUTHOR.test(path) && original.fm.data.avatar !== candidate.fm.data.avatar && candidate.fm.data.avatar !== undefined) assertAvatarURL(candidate.fm.data.avatar);
  return fields.some(field => IMAGE_URL_FIELDS.includes(field) && original.fm.data[field] !== candidate.fm.data[field]);
}

/** Pure Git-object policy inspector shared by prepare, validation, certificates and observations. */
export function inspectImageChanges(base, source, { cwd = process.cwd() } = {}) {
  sha(base); sha(source);
  try { git(cwd, 'merge-base', '--is-ancestor', base, source); }
  catch (error) { if (error.status !== 1) throw error; throw new Error('update image branch with current main before approving its new exact head'); }
  const changes = parseNameStatus(git(cwd, 'diff', '--name-status', '--no-renames', '-z', base, source));
  if (!changes.length || changes.length > MAX_FILES) throw new Error(`image approval requires 1..${MAX_FILES} changed files`);
  const beforeModes = parseHeadModes(git(cwd, 'ls-tree', '-r', '-z', base));
  const afterModes = parseHeadModes(git(cwd, 'ls-tree', '-r', '-z', source));
  let totalBytes = 0, actualImageChange = false;
  const evidence = [];
  for (const { path, status } of changes) {
    if (!['A', 'M', 'D'].includes(status)) throw new Error(`${path}: unsupported image change status`);
    const raster = RASTER.test(path), svg = path.startsWith('public/') && DIAGRAM_PATH.test(path.slice('public'.length));
    const metadata = AUTHOR.test(path) || POST.test(path);
    if (path.startsWith('public/heroes/')) throw new Error('public/heroes is outside image approval: upload create-only hero pairs to the media host');
    if (!raster && !svg && !metadata) throw new Error(`${path}: outside image approval scope (SVG is limited to sanitized diagrams)`);
    const oldMode = beforeModes.get(path) ?? null, newMode = afterModes.get(path) ?? null;
    if (status !== 'D' && newMode !== '100644') throw new Error(`${path}: image additions/modifications must be regular mode 100644 files`);
    if (oldMode !== null && !['100644', '100755'].includes(oldMode)) throw new Error(`${path}: source must be a regular file, never symlink/submodule`);
    if (metadata && (status !== 'M' || oldMode !== '100644')) throw new Error(`${path}: image metadata requires an existing regular author or post`);
    const limit = metadata ? MAX_METADATA_BYTES : MAX_IMAGE_BYTES;
    const old = status === 'A' ? null : blob(cwd, base, path, limit);
    const next = status === 'D' ? null : blob(cwd, source, path, limit);
    totalBytes += (old?.length ?? 0) + (next?.length ?? 0);
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('image approval exceeds aggregate byte bound');
    if (metadata) actualImageChange = imageMetadataChange(path, utf8(old), utf8(next)) || actualImageChange;
    else {
      // Old regular image bytes may predate today's format policy; deleting them remains safe.
      if (next && raster) assertImageSignature(path, next);
      if (next && svg) {
        const { findings, output } = checkSvg(utf8(next));
        if (findings.length || !output) throw new Error(`${path}: unsafe SVG: ${findings.join('; ')}`);
      }
      if (old === null || next === null || !old.equals(next)) actualImageChange = true;
    }
    evidence.push({ path, status, oldMode, newMode, before: old === null ? null : createHash('sha256').update(old).digest('hex'), after: next === null ? null : createHash('sha256').update(next).digest('hex') });
  }
  if (!actualImageChange) throw new Error('image approval needs an actual image asset or image URL change');
  const tree = git(cwd, 'merge-tree', '--write-tree', base, source).trim();
  if (!SHA.test(tree) || tree !== git(cwd, 'rev-parse', `${source}^{tree}`).trim()) throw new Error('deterministic merge tree differs from the approved source');
  const digest = createHash('sha256').update(JSON.stringify({ schema: 1, base, source, tree, changes: evidence })).digest('hex');
  return { base, source, tree, digest, changes: evidence };
}

function assertMainEnvironment(env, repo) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_WORKFLOW_REF !== `${repo}/${WORKFLOW}@refs/heads/main` || integer(env.GITHUB_ACTOR_ID) !== OWNER_ID || sha(env.GITHUB_WORKFLOW_SHA) !== sha(env.GITHUB_SHA)) throw new Error('owner image approval requires trusted-main workflow dispatch');
}
function observableBranch(pr) {
  return ['images/', 'grok/', 'quill/', 'desk/posts-', 'specimens/run-'].some(prefix => pr.head?.ref?.startsWith(prefix)) || pr.labels?.some(label => label.name === 'workflow-numbering');
}
/** API run metadata supplies immutable dispatch authority; neither PR reviews nor labels authorize. */
export async function verifyDispatch(api, env) {
  assertMainEnvironment(env, api.repo);
  const runID = integer(env.GITHUB_RUN_ID), attempt = integer(env.GITHUB_RUN_ATTEMPT), number = integer(env.PR_NUMBER), source = sha(env.SOURCE_SHA), policy = sha(env.GITHUB_SHA);
  const run = await api.request(`/actions/runs/${runID}`), request = REQUEST.exec(run.display_title ?? '');
  if (run.id !== runID || run.run_attempt !== attempt || run.event !== 'workflow_dispatch' || run.head_branch !== 'main' || run.head_sha !== policy || ![WORKFLOW, `${WORKFLOW}@main`, `${WORKFLOW}@refs/heads/main`].includes(run.path) || run.repository?.full_name !== api.repo || run.head_repository?.full_name !== api.repo || run.actor?.id !== OWNER_ID || run.triggering_actor?.id !== OWNER_ID || !request || integer(request[1]) !== number || request[2] !== source) throw new Error('owner dispatch or trusted workflow provenance mismatch');
  const base = sha((await api.request('/git/ref/heads/main')).object?.sha);
  if (base !== policy) throw new Error('current main differs from owner dispatch base; dispatch again');
  const pr = await api.request(`/pulls/${number}`);
  if (pr.number !== number || pr.state !== 'open' || pr.draft || pr.head?.repo?.full_name !== api.repo || pr.base?.repo?.full_name !== api.repo || pr.base?.ref !== 'main') throw new Error('image PR must be open, non-draft, same repository and based on main');
  if (pr.head.sha !== source) throw new Error('image PR head changed; approve the new exact head');
  if (pr.base.sha !== base) throw new Error('image PR base differs from current main');
  if (!observableBranch(pr)) throw new Error('use an images/ branch for image PR observations before owner approval');
  return { number, source, base, runID, attempt };
}
function fetchObjects(cwd, ...commits) { for (const commit of commits) git(cwd, 'fetch', '--no-tags', 'origin', sha(commit)); }
function output(name, value, env) {
  if (!/^[a-z_]+$/.test(name) || /[\r\n]/.test(String(value))) throw new Error('unsafe image approval output');
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
function assertBinding(plan, env) {
  if (plan.base !== sha(env.BASE_SHA) || plan.source !== sha(env.HEAD_SHA) || plan.tree !== sha(env.TREE_SHA) || !DIGEST.test(env.IMAGE_DIGEST ?? '') || plan.digest !== env.IMAGE_DIGEST) throw new Error('image approval digest/tree/base/head binding mismatch');
}
export async function prepare(api, env, { cwd = process.cwd(), fetchCommits = (...commits) => fetchObjects(cwd, ...commits) } = {}) {
  const request = await verifyDispatch(api, env);
  if (git(cwd, 'rev-parse', 'HEAD').trim() !== request.base) throw new Error('prepare must execute from trusted main checkout');
  fetchCommits(request.base, request.source);
  const plan = inspectImageChanges(request.base, request.source, { cwd });
  for (const [key, value] of Object.entries({ base: plan.base, head: plan.source, tree: plan.tree, digest: plan.digest })) output(key, value, env);
  console.log(`Image approval prepared: PR #${request.number}, ${plan.changes.length} data files, head ${plan.source}, base ${plan.base}.`);
  return plan;
}

/** Decode untrusted raster data only on the isolated, credential-free validation runner. */
export function decodeImage(path, cwd = process.cwd()) {
  let info;
  try {
    info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', path], { cwd, encoding: 'utf8', timeout: DECODE_TIMEOUT_MS, maxBuffer: 64 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
    if (!Array.isArray(info.streams) || info.streams.length === 0 || info.streams.some(({ width, height }) => !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS)) throw new Error('dimensions exceed bounds');
    execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-nostdin', '-i', path, '-frames:v', '1', '-f', 'null', '-'], { cwd, timeout: DECODE_TIMEOUT_MS, maxBuffer: 64 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (cause) { throw new Error(`${path}: raster decode failed or dimensions exceed ${MAX_DIMENSION}/${MAX_PIXELS} bounds`, { cause }); }
}
export function materialize(env, { cwd = process.cwd(), fetchCommits = (...commits) => fetchObjects(cwd, ...commits), decode = decodeImage } = {}) {
  assertMainEnvironment(env, env.GITHUB_REPOSITORY);
  const base = sha(env.BASE_SHA), source = sha(env.HEAD_SHA);
  if (base !== sha(env.GITHUB_SHA) || git(cwd, 'rev-parse', 'HEAD').trim() !== base) throw new Error('validation must start from the trusted main checkout');
  git(cwd, 'diff', '--exit-code'); git(cwd, 'diff', '--cached', '--exit-code');
  fetchCommits(base, source);
  const plan = inspectImageChanges(base, source, { cwd }); assertBinding(plan, env);
  // No submitted script/workflow/config/package is ever checked out or executed.
  git(cwd, 'restore', `--source=${source}`, '--worktree', '--', ...plan.changes.map(change => change.path));
  for (const change of plan.changes) if (change.status !== 'D' && RASTER.test(change.path)) decode(change.path, cwd);
  console.log(`Exact image-only merge tree ${plan.tree} materialized over trusted main; ${plan.changes.length} files.`);
  return plan;
}

/** External avatar availability is checked only in credential-free validation, never privileged
 * prepare/certify or proposal observations. Existing references are outside this change's scope. */
export async function checkRemoteAvatars(plan, { cwd = process.cwd(), fetcher = fetch } = {}) {
  for (const change of plan.changes) {
    if (!AUTHOR.test(change.path) || change.status !== 'M') continue;
    const before = readFrontmatter(utf8(blob(cwd, plan.base, change.path, MAX_METADATA_BYTES))).data.avatar;
    const avatar = readFrontmatter(utf8(blob(cwd, plan.source, change.path, MAX_METADATA_BYTES))).data.avatar;
    if (avatar === before || avatar === undefined || !avatar.startsWith('https://')) continue;
    assertAvatarURL(avatar);
    const ext = RASTER.exec(`public${new URL(avatar).pathname}`)[1];
    let response;
    try {
      response = await fetcher(avatar, { method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(REMOTE_AVATAR_TIMEOUT_MS) });
    } catch (cause) { throw new Error(`${change.path}: remote avatar HEAD failed (network, timeout or redirect)`, { cause }); }
    if (response.status !== 200) throw new Error(`${change.path}: remote avatar HEAD answered ${response.status}; expected 200`);
    const type = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_MIME[ext].includes(type)) throw new Error(`${change.path}: remote avatar HEAD has the wrong image MIME; expected ${IMAGE_MIME[ext].join(' or ')}`);
  }
}

export async function certify(api, env, { cwd = process.cwd(), fetchCommits = (...commits) => fetchObjects(cwd, ...commits) } = {}) {
  if (env.PREPARE_RESULT !== 'success' || env.VALIDATION_RESULT !== 'success') throw new Error('successful prepare and isolated validation required');
  const request = await verifyDispatch(api, env);
  if (git(cwd, 'rev-parse', 'HEAD').trim() !== request.base) throw new Error('certification requires trusted main checkout');
  fetchCommits(request.base, request.source);
  const plan = inspectImageChanges(request.base, request.source, { cwd }); assertBinding(plan, env);
  const jobs = await api.list(`/actions/runs/${request.runID}/attempts/${request.attempt}/jobs`, 'jobs');
  for (const name of ['prepare-images', 'validate-images']) {
    const matched = jobs.filter(job => job.name === name);
    if (matched.length !== 1 || matched[0].status !== 'completed' || matched[0].conclusion !== 'success') throw new Error('successful isolated validation jobs missing from this workflow attempt');
  }
  // Repeat live authority checks immediately before issuing the exact-base certificate set.
  await verifyDispatch(api, env);
  const details = `https://github.com/${api.repo}/actions/runs/${request.runID}/attempts/${request.attempt}`;
  const summary = `Owner dispatch approved PR #${request.number} at exact source ${plan.source}, current base ${plan.base}, merge tree ${plan.tree}, image digest ${plan.digest}. Isolated raster decoding, full tests, post/media checks, build and rendered-body/CSP/link/diagram gates passed. This is image approval, not specimen allocation or auto-merge authority. A new head or base requires a new dispatch.`;
  for (const name of CHECK_NAMES) await api.request('/check-runs', 'POST', { name, head_sha: plan.source, status: 'completed', conclusion: 'success', completed_at: new Date().toISOString(), details_url: details, external_id: `image-approval-v1:${api.repo}:${plan.base}:${plan.source}:${plan.digest}:${request.runID}:${request.attempt}`, output: { title: 'Owner-approved exact image tree validated', summary } });
  console.log(`Owner image checks certified for ${plan.source} against ${plan.base}; normal protected merge remains separate.`);
  return plan;
}

async function main() {
  try {
    const [mode] = process.argv.slice(2);
    if (mode === 'materialize') await checkRemoteAvatars(materialize(process.env));
    else if (['prepare', 'certify'].includes(mode)) {
      // Keep the pure policy importable by admission observations without a module cycle.
      const { GitHub } = await import('./specimen-admission.mjs');
      const api = new GitHub(process.env.GITHUB_REPOSITORY, process.env.GH_TOKEN);
      await (mode === 'prepare' ? prepare : certify)(api, process.env);
    } else throw new Error('usage: image-approval.mjs prepare|materialize|certify');
  } catch (error) { console.error(`Image approval refused: ${error.message}`); process.exitCode = 1; }
}
// Finish module evaluation before importing the admission API helper, whose observation path
// imports this policy in turn. Awaiting that import at module scope would deadlock the CLI.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) void main();
