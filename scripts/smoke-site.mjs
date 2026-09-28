#!/usr/bin/env node
/**
 * Check a deployed copy of the site against the build it was made from (docs/adr/0014-verified-deploys.md).
 *
 *   node scripts/smoke-site.mjs --base <url> --expect preview|production [--dist dist]
 *
 * Exit 0 when the deployment serves this build correctly, 1 when it does not, 2 on a usage error.
 *
 * The deploy runs this twice: against the preview deployment, before anything goes live, and against
 * aitamer.news right after the production deploy, where a failure rolls production back. The build's
 * own checks prove `dist` is right; this proves Cloudflare serves it right: the redirects, the
 * headers, and every page actually reachable.
 *
 * What it asserts, all measured against `dist`:
 * - every page answers 200 with the `<title>` this build gave it, so a stale deployment (an old
 *   build still being served) fails as surely as a missing page;
 * - every file at the site root (llms.txt, the feeds, the sitemaps, robots.txt) and every same-site
 *   file the home page loads (its CSS, scripts, images) answers 200;
 * - every `_redirects` line answers its status and points at its target;
 * - every diagram answers 200 as `image/svg+xml` under its folder's enforced lockdown (ADR 0016);
 * - an address that does not exist answers 404, not 200;
 * - the home page carries a Content-Security-Policy, and a hashed `/_astro/` file the long cache;
 * - `X-Robots-Tag: noindex` is on a preview and **not** on production: previews must stay out of
 *   search results, and the same header on aitamer.news would take the whole site out of them.
 *
 * A fresh deployment can take a moment to be served everywhere, so a failed round is retried
 * (ROUNDS, ROUND_DELAY_MS) before the verdict; one request's network error or 5xx is retried within
 * the round (ATTEMPTS). Only the last round's findings are reported.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlFiles, pageUrls, servedPath, sitePath } from './check-dist-links.mjs';

/** Rounds of the whole check before a failure is final: a new deployment can lag for seconds. */
export const ROUNDS = 3;
/** Wait between rounds. */
export const ROUND_DELAY_MS = 20_000;
/** Tries per request within a round, for a network error or a 5xx. */
export const ATTEMPTS = 3;
/** Wait between tries of one request. */
export const ATTEMPT_DELAY_MS = 2_000;
/** Requests in flight at once: enough to finish in seconds, few enough not to look like a flood. */
export const CONCURRENCY = 8;
/** Per-request limit, so a hung connection fails the check instead of the job's timeout. */
export const REQUEST_TIMEOUT_MS = 15_000;
/**
 * Most pages checked per round. Today every page is (64); at the planned 10,000 posts the key pages
 * come first and the rest is a deterministic slice, so a deploy never sends ten thousand requests.
 */
export const MAX_PAGES = 1_000;
/** Checked first whatever the cap: the pages a reader or a crawler reaches first. */
export const KEY_PAGES = ['/', '/news/', '/columns/', '/search/', '/about/'];
/** Identifies these requests in Cloudflare's logs. */
export const USER_AGENT = 'aitamer-deploy-smoke/1 (+https://github.com/michelabboud/aitamer-news)';
/** Root files that are the host's configuration, never served as files. */
const HOST_CONFIG_FILES = new Set(['_headers', '_redirects', '_routes.json']);
const EXPECTS = new Set(['preview', 'production']);
/** A `_redirects` target with its own scheme and host, not a path on the site. */
const ABSOLUTE_TARGET = /^https?:\/\//i;

/** @param {string} html @returns {string | null} the page's title text as written, or null */
export function titleOf(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? match[1].trim() : null;
}

/**
 * The redirects a deployment must serve, from `_redirects` (`from to [status]`, status 302 when absent).
 * @param {string} text @returns {{ from: string, to: string, status: number }[]}
 */
export function parseRedirects(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return { from, to, status: status ? Number(status) : 302 };
    });
}

/**
 * What to request, from the build.
 * @param {string} dist @param {number} maxPages
 * @returns {{ pages: { path: string, title: string | null }[], files: string[], redirects: ReturnType<typeof parseRedirects> }}
 */
export function plan(dist, maxPages = MAX_PAGES) {
  const redirectsFile = join(dist, '_redirects');
  const redirects = existsSync(redirectsFile) ? parseRedirects(readFileSync(redirectsFile, 'utf8')) : [];
  // A retired section keeps a fallback page for hosts that ignore `_redirects`; Pages redirects it
  // instead, and the redirect is what gets checked.
  const redirected = new Set(redirects.map((r) => r.from));
  const all = htmlFiles(dist)
    .filter((file) => file !== '404.html')
    .map((file) => ({ path: servedPath(file), file }))
    .filter(({ path }) => !redirected.has(path))
    .map(({ path, file }) => ({ path, title: titleOf(readFileSync(join(dist, file), 'utf8')) }));
  const key = KEY_PAGES.map((path) => all.find((p) => p.path === path)).filter(Boolean);
  const rest = all.filter((p) => !KEY_PAGES.includes(p.path));
  const pages = [...key, ...rest].slice(0, Math.max(maxPages, key.length));

  const rootFiles = readdirSync(dist, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.endsWith('.html') && !HOST_CONFIG_FILES.has(e.name))
    .map((e) => `/${e.name}`);
  const homeFiles = pageUrls(readFileSync(join(dist, 'index.html'), 'utf8'))
    .map((url) => sitePath(url, '/', 'https://site.invalid'))
    .filter((path) => path !== null && !path.endsWith('/'));
  const files = [...new Set([...rootFiles, ...homeFiles])].sort();
  const diagramsDir = join(dist, 'diagrams');
  const diagrams = existsSync(diagramsDir)
    ? readdirSync(diagramsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .flatMap((d) => readdirSync(join(diagramsDir, d.name)).filter((f) => f.endsWith('.svg')).map((f) => `/diagrams/${d.name}/${f}`))
        .sort()
    : [];
  return { pages, files, redirects, diagrams };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One request, retried on a network error or a 5xx.
 * @param {string} url @param {{ redirect?: RequestRedirect, attempts?: number, attemptDelayMs?: number }} opts
 * @returns {Promise<{ status: number, headers: Headers, body: string } | { error: string }>}
 */
export async function request(url, { redirect = 'manual', attempts = ATTEMPTS, attemptDelayMs = ATTEMPT_DELAY_MS } = {}) {
  let last = 'no attempt made';
  for (let i = 0; i < attempts; i += 1) {
    if (i > 0) await sleep(attemptDelayMs);
    try {
      const res = await fetch(url, { redirect, headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      const body = await res.text();
      if (res.status >= 500) {
        last = `answered ${res.status}`;
        continue;
      }
      return { status: res.status, headers: res.headers, body };
    } catch (err) {
      last = `request failed: ${err.cause?.code ?? err.name}: ${err.message}`;
    }
  }
  return { error: last };
}

/** Run `fn` over `items`, at most `limit` at a time, keeping order. */
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

/** @param {string} value @returns {boolean} */
const saysNoindex = (value) => /(^|[\s,])noindex([\s,]|$)/i.test(value ?? '');

/**
 * One round of checks against a deployment.
 * @param {string} base  the deployment's origin
 * @param {'preview' | 'production'} expect
 * @param {ReturnType<typeof plan>} work
 * @param {{ attempts?: number, attemptDelayMs?: number, concurrency?: number }} opts
 * @returns {Promise<{ checked: number, findings: string[] }>}
 */
export async function checkRound(base, expect, work, opts = {}) {
  const findings = [];
  const at = (path) => new URL(path, base).href;
  const get = (path, redirect) => request(at(path), { redirect, ...opts });
  const concurrency = opts.concurrency ?? CONCURRENCY;

  const pages = await pool(work.pages, concurrency, async (page) => ({ page, res: await get(page.path) }));
  for (const { page, res } of pages) {
    if ('error' in res) findings.push(`${page.path}: ${res.error}`);
    else if (res.status !== 200) findings.push(`${page.path}: answered ${res.status}, expected 200`);
    else if (titleOf(res.body) !== page.title) findings.push(`${page.path}: title is ${JSON.stringify(titleOf(res.body))}, this build's is ${JSON.stringify(page.title)} (an old deployment?)`);
  }

  const files = await pool(work.files, concurrency, async (path) => ({ path, res: await get(path) }));
  for (const { path, res } of files) {
    if ('error' in res) findings.push(`${path}: ${res.error}`);
    else if (res.status !== 200) findings.push(`${path}: answered ${res.status}, expected 200`);
  }

  const redirects = await pool(work.redirects, concurrency, async (rule) => ({ rule, res: await get(rule.from, 'manual') }));
  for (const { rule, res } of redirects) {
    if ('error' in res) {
      findings.push(`redirect ${rule.from}: ${res.error}`);
      continue;
    }
    const location = res.headers.get('location');
    const landsOn = location ? new URL(location, at(rule.from)) : null;
    const target = new URL(rule.to, at(rule.from));
    // A target on another host (a hero on the media host, ADR 0020) must land on that host too; a
    // site-relative one is compared by path, whatever host the deployment answers under.
    const lands = landsOn && landsOn.pathname === target.pathname && (!ABSOLUTE_TARGET.test(rule.to) || landsOn.origin === target.origin);
    if (res.status !== rule.status) findings.push(`redirect ${rule.from}: answered ${res.status}, expected ${rule.status}`);
    else if (!lands) findings.push(`redirect ${rule.from}: points at ${location ?? 'nothing'}, expected ${rule.to}`);
  }

  // Diagrams (ADR 0016): an SVG opened on its own is a document on this origin, so each one must
  // arrive as an image under its folder's enforced lockdown, never as something a browser runs.
  const diagrams = await pool(work.diagrams ?? [], concurrency, async (path) => ({ path, res: await get(path) }));
  for (const { path, res } of diagrams) {
    if ('error' in res) {
      findings.push(`${path}: ${res.error}`);
      continue;
    }
    const policy = res.headers.get('content-security-policy') ?? '';
    if (res.status !== 200) findings.push(`${path}: answered ${res.status}, expected 200`);
    else if (!/^image\/svg\+xml\b/.test(res.headers.get('content-type') ?? '')) findings.push(`${path}: served as ${res.headers.get('content-type')}, expected image/svg+xml`);
    else if (!/default-src 'none'/.test(policy) || !/\bsandbox\b/.test(policy) || /script-src/.test(policy)) findings.push(`${path}: missing the diagrams' enforced lockdown (Content-Security-Policy: ${JSON.stringify(policy)})`);
    else if ((res.headers.get('x-content-type-options') ?? '').toLowerCase() !== 'nosniff') findings.push(`${path}: missing X-Content-Type-Options: nosniff`);
  }

  const missing = `/smoke-check-no-such-page-${Date.now().toString(36)}/`;
  const notFound = await get(missing);
  if ('error' in notFound) findings.push(`${missing}: ${notFound.error}`);
  else if (notFound.status !== 404) findings.push(`an address that does not exist answered ${notFound.status}, expected 404`);

  const home = pages.find(({ page }) => page.path === '/')?.res;
  if (home && !('error' in home)) {
    if (!home.headers.get('content-security-policy') && !home.headers.get('content-security-policy-report-only')) {
      findings.push('/: no Content-Security-Policy header');
    }
    const robots = home.headers.get('x-robots-tag');
    if (expect === 'preview' && !saysNoindex(robots)) findings.push(`/: a preview must carry X-Robots-Tag: noindex (it has ${JSON.stringify(robots)})`);
    if (expect === 'production' && saysNoindex(robots)) findings.push(`/: production carries X-Robots-Tag: ${robots}, which would take the site out of search results`);
  }
  const hashed = work.files.find((path) => path.startsWith('/_astro/'));
  if (hashed) {
    const res = files.find((f) => f.path === hashed)?.res;
    if (res && !('error' in res) && !/immutable/.test(res.headers.get('cache-control') ?? '')) {
      findings.push(`${hashed}: missing the long cache (Cache-Control: ${res.headers.get('cache-control')})`);
    }
  }

  return { checked: work.pages.length + work.files.length + work.redirects.length + (work.diagrams?.length ?? 0) + 1, findings };
}

/**
 * The whole check: rounds until one is clean, or the last one's findings.
 * @param {string} base @param {'preview' | 'production'} expect @param {string} dist
 * @param {{ rounds?: number, roundDelayMs?: number, attempts?: number, attemptDelayMs?: number, concurrency?: number, maxPages?: number, log?: (line: string) => void }} opts
 */
export async function smoke(base, expect, dist, opts = {}) {
  const { rounds = ROUNDS, roundDelayMs = ROUND_DELAY_MS, log = () => {} } = opts;
  const work = plan(dist, opts.maxPages ?? MAX_PAGES);
  let result = { checked: 0, findings: ['no round ran'] };
  for (let round = 1; round <= rounds; round += 1) {
    if (round > 1) {
      log(`smoke: round ${round - 1} found ${result.findings.length} problem(s); trying again in ${roundDelayMs / 1000}s`);
      await sleep(roundDelayMs);
    }
    result = await checkRound(base, expect, work, opts);
    if (result.findings.length === 0) return { ok: true, round, ...result };
  }
  return { ok: false, round: rounds, ...result };
}

/** @param {string[]} args @returns {{ base: string, expect: string, dist: string } | string} */
export function parseArgs(args) {
  const opts = { dist: 'dist' };
  for (let i = 0; i < args.length; i += 2) {
    const [flag, value] = [args[i], args[i + 1]];
    if (value === undefined) return `${flag} needs a value`;
    if (flag === '--base') opts.base = value;
    else if (flag === '--expect') opts.expect = value;
    else if (flag === '--dist') opts.dist = value;
    else return `unknown option ${flag}`;
  }
  if (!opts.base) return '--base <url> is required';
  let url;
  try {
    url = new URL(opts.base);
  } catch {
    return `--base ${opts.base} is not a URL`;
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return '--base must be https';
  opts.base = url.origin;
  if (!EXPECTS.has(opts.expect)) return '--expect must be preview or production';
  if (!existsSync(join(opts.dist, 'index.html'))) return `${opts.dist}/index.html not found; run \`npm run build\` first`;
  return opts;
}

async function main(args) {
  const opts = parseArgs(args);
  if (typeof opts === 'string') {
    console.error(`smoke: ${opts}`);
    console.error('usage: node scripts/smoke-site.mjs --base <url> --expect preview|production [--dist dist]');
    return 2;
  }
  const result = await smoke(opts.base, opts.expect, opts.dist, { log: (line) => console.log(line) });
  if (!result.ok) {
    for (const finding of result.findings) console.error(`::error::smoke (${opts.expect}): ${finding}`);
    console.error(`smoke: ${opts.base} failed ${result.findings.length} of ${result.checked} checks after ${result.round} round(s)`);
    return 1;
  }
  console.log(`smoke: ${opts.base} (${opts.expect}) passed all ${result.checked} checks in round ${result.round}`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
