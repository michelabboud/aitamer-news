#!/usr/bin/env node
/**
 * Check that the hero images the posts point at are really on the media host (ADR 0020).
 *
 *   npm run check:media                          every post's hero answers 200 image/jpeg on media.aitamer.news
 *   npm run check:media -- --local <dir>         and every <dir>/<slug>.jpg is there byte for byte (size, ETag = MD5)
 *
 * Exit 0 when everything checked is there, 1 when anything is missing or differs, 2 on a usage error.
 *
 * Network, on demand, and **never part of the deploy**: the build must not depend on the media host being
 * reachable (plan 2026-09-25-comments-and-r2-media §3, §7.1). Two uses:
 * - the migration (`--local public/heroes`, before the frontmatter rewrite and before the folder was
 *   removed): R2's ETag for an object uploaded in one part is the hex MD5 of its bytes, so a matching
 *   `Content-Length` and ETag prove the object is the file in git, not merely a file of that name;
 * - afterwards, with no argument: a writer or an editor asks "is every post's hero uploaded?". A published
 *   post whose hero is missing is a finding (readers see a broken image); a draft's is only listed, since a
 *   draft's hero may be uploaded later.
 *
 * Only `heroImage` values on the media host are requested; anything else is `check:posts`' business
 * (`scripts/stamp-post-times.mjs --check` refuses a published post whose hero is not its media URL).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA_ORIGIN } from '../src/lib/media.ts';
import { isPublishedDraftField, readFrontmatter } from './frontmatter.mjs';
import { POSTS_DIR } from './stamp-post-times.mjs';

/** Tries per request, for a network error or a 5xx. */
export const ATTEMPTS = 3;
/** Wait between tries of one request. */
export const ATTEMPT_DELAY_MS = 2_000;
/** Requests in flight at once: seconds for today's heroes, and polite to the CDN at thousands. */
export const CONCURRENCY = 8;
/** Per-request limit, so a hung connection is a finding instead of a hang. */
export const REQUEST_TIMEOUT_MS = 15_000;
/** Identifies these requests in Cloudflare's logs. */
export const USER_AGENT = 'aitamer-check-media/1 (+https://github.com/michelabboud/aitamer-news)';
/** The one content type a hero is uploaded with (POST.md §3). */
export const HERO_CONTENT_TYPE = 'image/jpeg';
const POST_FILE = /\.mdx?$/;
const HERO_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/;

/**
 * An ETag as R2 sends it, reduced to the bare value: quotes and a weak `W/` prefix removed, lower case.
 * @param {string | null} etag @returns {string | null}
 */
export function bareEtag(etag) {
  if (!etag) return null;
  return etag.trim().replace(/^W\//i, '').replace(/^"(.*)"$/, '$1').toLowerCase();
}

/** @param {Buffer} bytes @returns {string} hex MD5 */
export const md5Hex = (bytes) => createHash('md5').update(bytes).digest('hex');

/**
 * Compare a HEAD answer with the local file it should be.
 * @param {{ status: number, headers: Headers }} res
 * @param {{ size: number, md5: string } | null} local null when only presence is checked
 * @returns {string | null} what is wrong, or null
 */
export function judge(res, local) {
  if (res.status !== 200) return `answered ${res.status}, expected 200`;
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== HERO_CONTENT_TYPE) return `served as ${JSON.stringify(res.headers.get('content-type'))}, expected ${HERO_CONTENT_TYPE}`;
  if (local === null) return null;
  const length = Number(res.headers.get('content-length'));
  if (length !== local.size) return `is ${res.headers.get('content-length') ?? 'of unknown size'} bytes, the local file ${local.size}`;
  const etag = bareEtag(res.headers.get('etag'));
  if (etag !== local.md5) {
    // A multipart upload's ETag is `<md5 of part md5s>-<parts>`, never the file's MD5: upload heroes in one part.
    return `ETag ${res.headers.get('etag') ?? '(none)'} is not the local file's MD5 ${local.md5}${etag?.includes('-') ? ' (a multipart upload?)' : ''}`;
  }
  return null;
}

/**
 * HEAD `url`, retrying a network error or a 5xx.
 * @param {string} url
 * @param {{ attempts?: number, attemptDelayMs?: number }} [opts]
 * @returns {Promise<{ status: number, headers: Headers } | { error: string }>}
 */
export async function head(url, { attempts = ATTEMPTS, attemptDelayMs = ATTEMPT_DELAY_MS } = {}) {
  let last;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'manual', headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (res.status < 500) return { status: res.status, headers: res.headers };
      last = { error: `answered ${res.status} after ${attempts} tries` };
    } catch (error) {
      last = { error: `request failed after ${attempts} tries: ${error.cause?.code ?? error.message}` };
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attemptDelayMs));
  }
  return last;
}

/** Run `fn` over `items`, at most `limit` at a time, keeping the order. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * The heroes to check. Keys are paths on the media host (`heroes/<slug>.jpg`).
 * @param {{ postsDir: string, localDir?: string | null }} where
 * @returns {{ targets: { key: string, label: string, local: { size: number, md5: string } | null, required: boolean }[], errors: string[] }}
 */
export function collect({ postsDir, localDir = null }) {
  const targets = [];
  const errors = [];
  const prefix = `${MEDIA_ORIGIN}/`;
  for (const name of readdirSync(postsDir).filter((n) => POST_FILE.test(n)).sort()) {
    const file = join(postsDir, name);
    let fm;
    try {
      fm = readFrontmatter(readFileSync(file, 'utf8'));
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
      continue;
    }
    const hero = fm?.data.heroImage;
    if (typeof hero !== 'string' || !hero.startsWith(prefix)) continue;
    targets.push({ key: hero.slice(prefix.length), label: file, local: null, required: isPublishedDraftField(fm.data) === true });
  }
  if (localDir !== null) {
    for (const name of readdirSync(localDir).sort()) {
      const file = join(localDir, name);
      if (!statSync(file).isFile()) continue;
      if (!HERO_FILE.test(name)) {
        errors.push(`${file}: not a hero file name (<slug>.jpg)`);
        continue;
      }
      const bytes = readFileSync(file);
      targets.push({ key: `heroes/${name}`, label: file, local: { size: bytes.length, md5: md5Hex(bytes) }, required: true });
    }
  }
  return { targets, errors };
}

/**
 * @param {string[]} argv
 * @param {{ postsDir?: string, origin?: string, attempts?: number, attemptDelayMs?: number, concurrency?: number }} [options]
 *   `origin` stands in for the media host (tests serve it locally)
 * @returns {Promise<number>} exit code
 */
export async function main(argv, { postsDir = POSTS_DIR, origin = MEDIA_ORIGIN, attempts, attemptDelayMs, concurrency = CONCURRENCY } = {}) {
  const at = argv.indexOf('--local');
  const localDir = at >= 0 ? argv[at + 1] : null;
  const unknown = argv.filter((_, i) => at < 0 || (i !== at && i !== at + 1));
  if ((at >= 0 && (!localDir || localDir.startsWith('--'))) || unknown.length > 0) {
    console.error('usage: node scripts/check-media.mjs [--local <dir of <slug>.jpg files>]');
    return 2;
  }
  if (localDir !== null && !existsSync(localDir)) {
    console.error(`check:media: ${localDir} does not exist`);
    return 2;
  }
  const { targets, errors } = collect({ postsDir, localDir });
  if (errors.length > 0) {
    console.error('check:media: these files cannot be read (nothing was requested):');
    for (const error of errors) console.error(`  ${error}`);
    return 1;
  }

  const results = await pool(targets, concurrency, async (target) => {
    const res = await head(`${origin}/${target.key}`, { attempts, attemptDelayMs });
    return { target, problem: 'error' in res ? res.error : judge(res, target.local) };
  });

  const failing = results.filter((r) => r.problem !== null && r.target.required);
  const drafts = results.filter((r) => r.problem !== null && !r.target.required);
  for (const { target, problem } of failing) console.error(`  ${origin}/${target.key} (${target.label}): ${problem}`);
  for (const { target, problem } of drafts) console.warn(`  draft, not yet a finding: ${origin}/${target.key} (${target.label}): ${problem}`);

  const local = results.filter((r) => r.target.local !== null);
  const posts = results.filter((r) => r.target.local === null);
  const ok = (list) => list.filter((r) => r.problem === null).length;
  if (localDir !== null) console.log(`check:media: ${ok(local)}/${local.length} files in ${localDir} are on ${origin} byte for byte (size and ETag = MD5).`);
  console.log(`check:media: ${ok(posts)}/${posts.length} post heroes on ${origin} answer 200 ${HERO_CONTENT_TYPE}.`);
  return failing.length === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
