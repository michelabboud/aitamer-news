#!/usr/bin/env node
/**
 * Render a post exactly as the site does and check the HTML against the exact allowlist in
 * `./rendered-body-allowlist.mjs` (ADR 0009, `SECURITY.md` "Bot posts").
 *
 *   node scripts/check-rendered-body.mjs                 the build gate: every post whose author is a bot
 *   node scripts/check-rendered-body.mjs <file>...       these post files, whoever wrote them
 *   node scripts/check-rendered-body.mjs --all           every post (a report; human posts are not gated)
 *   node scripts/check-rendered-body.mjs --stdin [--name <slug>.md]   one post file on standard input
 *   node scripts/check-rendered-body.mjs --against-build   after `astro build`: the checker renders every
 *                                                           post exactly as the build did, and the gated
 *                                                           posts' shipped HTML passes the allowlist
 *   add --json for findings as JSON on standard output
 *
 * Exit 0 when nothing was found, 1 on any finding, 2 on a usage error.
 *
 * **The render is the site's own path.** A worker process loads the site's `astro.config.mjs`
 * through Astro's own config resolver, then renders each post with the two functions the content
 * layer's glob loader calls for a `.md` entry: `markdownContentEntryType.getEntryInfo` on the whole
 * file (front matter and body, exactly as the publisher writes it) and the renderer from
 * `getRenderFunction(config)`, which is `@astrojs/markdown-satteri` with the site's markdown, Shiki
 * and image settings. Those modules are Astro internals, imported by path from this checkout's
 * `node_modules`: when an upgrade moves them, the worker fails to start and every post is a
 * finding — the gate fails closed, never open.
 *
 * **Untrusted input runs in a child process** with a memory cap (`--max-old-space-size`) and a
 * per-post timeout. A post that hangs or exhausts the renderer becomes a finding for that post;
 * the worker is restarted for the rest. The library entry points (`checkPostFiles`,
 * `checkPostSources`) always go through the child; `createPostChecker` renders in-process and is
 * for trusted callers that already run in a child (the worker itself).
 *
 * **Which posts the build gates:** those whose `author` is an author marked `kind: bot` under
 * `src/content/authors/` (`desk-bot` today). Human posts are trusted writers' (`SECURITY.md`,
 * "Trust model") and are not gated; `--all` shows what the gate would say about them.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, createWriteStream } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFrontmatter } from './frontmatter.mjs';
import { SHIKI_THEME, builtPageProblems, checkRenderedHtml } from './rendered-body-allowlist.mjs';

export * from './rendered-body-allowlist.mjs';

/** The site checkout this script belongs to: the checker always renders with its own checkout's config. */
export const SITE_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const POSTS_DIR = 'src/content/posts';
export const AUTHORS_DIR = 'src/content/authors';
/** An author file marks a bot with `kind: bot` (the `authors` collection in `src/content.config.ts`). */
export const BOT_AUTHOR_KIND = 'bot';

/**
 * How long one post may take to render and check, in milliseconds. The slowest post on `main`
 * renders in well under a second once the worker is warm; Shiki loads a language's grammar the
 * first time it meets it, which is the long tail. Past this the post is a finding and the worker
 * is killed and restarted.
 */
export const RENDER_TIMEOUT_MS = 20_000;
/** How long the worker may take to load Astro, the site's config and Shiki before the first post. */
export const WORKER_STARTUP_TIMEOUT_MS = 60_000;
/** The worker's V8 heap cap, in MiB. A post that needs more is a finding, not a crashed build. */
export const WORKER_MAX_OLD_SPACE_MB = 512;
/**
 * The largest post file the checker renders: 512 KiB. The largest post on `main` is a few dozen
 * KiB; a bot post many times that is refused by size before any parser sees it.
 */
export const POST_MAX_BYTES = 512 * 1024;
/**
 * Bot posts on `main` from before the gate that it would refuse, each exempt from **exactly** the
 * findings listed and only while the file is byte-for-byte the one hashed here. Any edit to the
 * file, or any other finding in it (a renderer upgrade that renders it differently), and the post
 * is gated in full again. An entry that no longer matches its file exactly (changed bytes, a listed
 * finding gone, the file gone, its author's file no longer marking `kind: bot`) is itself a finding, so the build fails
 * until the entry is removed: it cannot silently outlive an edit. Nothing may be added here for a
 * new post: a new bot post passes the gate or does not land. ADR 0009, "The one existing exception".
 *
 * - `made-on-youtube-2026-gemini-ask-studio.md` embeds two YouTube players as raw `<iframe>`s. It
 *   predates the `video` front matter field and `VideoEmbed.astro` (which holds one video, where
 *   this post has two); whether and how to move it is Michel's call (posts MCP plan, Q4).
 */
export const GRANDFATHERED_POSTS = Object.freeze({
  'src/content/posts/made-on-youtube-2026-gemini-ask-studio.md': Object.freeze({
    sha256: '52e103385819d3511391d7847cd6d6a4fde2fba53bf09671e2aedb17c4579580',
    findings: Object.freeze([
      Object.freeze({ path: 'iframe[1]', element: 'iframe', problem: 'element <iframe> is not allowed' }),
      Object.freeze({ path: 'iframe[2]', element: 'iframe', problem: 'element <iframe> is not allowed' }),
    ]),
  }),
});

const findingKey = (f) => JSON.stringify([f.path, f.element, f.attribute ?? null, f.problem]);
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const STALE_ENTRY = 'remove or update its GRANDFATHERED_POSTS entry in scripts/check-rendered-body.mjs';

/**
 * Split a post's findings into those a grandfather entry excuses and those it does not. An entry
 * that no longer describes the file exactly is itself a finding, so it cannot outlive an edit:
 * the file's hash has changed, or the file no longer has every finding the entry lists.
 * Entries are keyed by the post's path from the site root (`src/content/posts/<name>`), so a file of
 * the same name anywhere else (a subfolder, a copy elsewhere) is never excused.
 * @param {string} path the post's path from the site root, `/`-separated
 * @param {string} contents @param {Finding[]} findings
 * @returns {{ failing: Finding[], excused: Finding[] }}
 */
export function applyGrandfather(path, contents, findings) {
  const entry = Object.hasOwn(GRANDFATHERED_POSTS, path) ? GRANDFATHERED_POSTS[path] : undefined;
  if (!entry) return { failing: findings, excused: [] };
  if (sha256(contents) !== entry.sha256) {
    return { failing: [...findings, postFinding(`this file changed since it was grandfathered, so its exemption is void: ${STALE_ENTRY}`)], excused: [] };
  }
  const allowed = new Set(entry.findings.map(findingKey));
  const failing = findings.filter((f) => !allowed.has(findingKey(f)));
  const excused = findings.filter((f) => allowed.has(findingKey(f)));
  const present = new Set(excused.map(findingKey));
  if (entry.findings.some((f) => !present.has(findingKey(f)))) {
    failing.push(postFinding(`the grandfather entry lists findings this file no longer has: ${STALE_ENTRY}`));
  }
  return { failing, excused };
}

/**
 * Grandfather entries that match no file as it stands: the file is gone (deleted or renamed), its
 * bytes changed, or it is no longer gated. The post's own `author` line is covered by the hash, so
 * the last case is its author's file under `src/content/authors/` no longer saying `kind: bot`.
 * The gate reports each one as a finding, whether or not the file is otherwise checked.
 * @param {string} [root] @returns {{ file: string, findings: Finding[], excused: Finding[] }[]}
 */
export function staleGrandfatherEntries(root = SITE_ROOT) {
  const bots = botAuthorIds(root);
  const out = [];
  for (const [path, entry] of Object.entries(GRANDFATHERED_POSTS)) {
    const file = join(root, path);
    let contents;
    try {
      contents = readFileSync(file, 'utf8');
    } catch {
      out.push({ file, findings: [postFinding(`the file is gone: ${STALE_ENTRY}`)], excused: [] });
      continue;
    }
    if (sha256(contents) !== entry.sha256) out.push({ file, findings: [postFinding(`this file changed since it was grandfathered, so its exemption is void: ${STALE_ENTRY}`)], excused: [] });
    else if (!isGated(contents, bots)) out.push({ file, findings: [postFinding(`its author is no longer marked kind: ${BOT_AUTHOR_KIND} in ${AUTHORS_DIR}: ${STALE_ENTRY}`)], excused: [] });
  }
  return out;
}

/**
 * Merge per-file results, the same finding reported twice kept once.
 * @param {{ file: string, findings: Finding[], excused: Finding[] }[][]} lists
 */
export function mergeResults(...lists) {
  const byFile = new Map();
  for (const result of lists.flat()) {
    const seen = byFile.get(result.file);
    if (!seen) {
      byFile.set(result.file, { ...result, findings: [...result.findings], excused: [...result.excused] });
      continue;
    }
    const keys = new Set(seen.findings.map(findingKey));
    for (const f of result.findings) if (!keys.has(findingKey(f))) seen.findings.push(f);
    seen.excused.push(...result.excused.filter((f) => !seen.excused.some((e) => findingKey(e) === findingKey(f))));
  }
  return [...byFile.values()];
}

/** A file's path from `root`, `/`-separated: the key `GRANDFATHERED_POSTS` uses. */
export function rootPath(root, file) {
  return relative(root, file).split(sep).join('/');
}

/** How much of the worker's standard error is kept for a crash report. */
const STDERR_TAIL_BYTES = 4096;

/** Astro internals the render goes through, relative to `node_modules/` (see the header). */
const ASTRO_CONFIG_MODULE = 'astro/dist/core/config/config.js';
const ASTRO_MARKDOWN_ENTRY_MODULE = 'astro/dist/vite-plugin-markdown/content-entry-type.js';

/** @typedef {import('./rendered-body-allowlist.mjs').Finding} Finding */

/** A finding about the whole post rather than one element. */
const postFinding = (problem) => ({ path: '', element: '#post', problem });

/**
 * Ids of the authors marked as bots.
 * @param {string} [root] @returns {Set<string>}
 */
export function botAuthorIds(root = SITE_ROOT) {
  const dir = join(root, AUTHORS_DIR);
  const ids = new Set();
  for (const name of readdirSync(dir)) {
    const ext = extname(name);
    if (ext !== '.md' && ext !== '.mdx') continue;
    const front = readFrontmatter(readFileSync(join(dir, name), 'utf8'));
    if (front?.data.kind === BOT_AUTHOR_KIND) ids.add(basename(name, ext));
  }
  return ids;
}

/**
 * Every post file, recursively, as the collection's glob (`**\/*.{md,mdx}`) sees it.
 * @param {string} [root] @returns {string[]} absolute paths, sorted
 */
export function postFiles(root = SITE_ROOT) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.mdx?$/.test(entry.name)) out.push(path);
    }
  };
  walk(join(root, POSTS_DIR));
  return out.sort();
}

/**
 * Whether the build gates this post: its author is a bot, or its author cannot be read (fail
 * closed: a post the gate cannot attribute is checked). The front matter is read with the same
 * parser and schema as Astro's (`./frontmatter.mjs`).
 * @param {string} text the whole post file @param {Set<string>} bots @returns {boolean}
 */
export function isGated(text, bots) {
  let front;
  try {
    front = readFrontmatter(text);
  } catch {
    return true;
  }
  const author = front?.data.author;
  return typeof author !== 'string' || bots.has(author);
}

/**
 * @typedef {object} PostResult
 * @property {Finding[]} findings empty when the rendered body passes the allowlist
 * @property {string | null} html the body as the site renders it; `null` when it was not rendered
 */

/**
 * Render and check in this process. Only for code already isolated in a child process.
 * @param {{ root?: string }} [options]
 * @returns {Promise<(contents: string, name: string) => Promise<PostResult>>}
 */
export async function createPostChecker({ root = SITE_ROOT } = {}) {
  const load = (path) => import(pathToFileURL(join(root, 'node_modules', path)).href);
  const { resolveConfig } = await load(ASTRO_CONFIG_MODULE);
  const { markdownContentEntryType } = await load(ASTRO_MARKDOWN_ENTRY_MODULE);
  const { astroConfig } = await resolveConfig({ root, logLevel: 'silent' }, 'build');
  const { processor, shikiConfig, syntaxHighlight } = astroConfig.markdown;
  // The allowlist knows one renderer and one Shiki output. Anything else is refused before any post.
  if (processor?.name !== 'satteri') throw new Error(`the site's Markdown processor is "${processor?.name}", not satteri; review the allowlist`);
  const highlighter = typeof syntaxHighlight === 'object' ? syntaxHighlight?.type : syntaxHighlight;
  if (highlighter !== 'shiki') throw new Error(`the site's syntax highlighter is "${highlighter}", not shiki; review the allowlist`);
  if (shikiConfig.theme !== SHIKI_THEME || Object.keys(shikiConfig.themes ?? {}).length || shikiConfig.wrap || shikiConfig.transformers?.length) {
    throw new Error(`the site's Shiki settings changed (theme "${shikiConfig.theme}", themes, wrap or transformers); review the allowlist`);
  }
  const render = await markdownContentEntryType.getRenderFunction(astroConfig);
  const postsDir = join(root, POSTS_DIR);

  return async function check(contents, name) {
    const refuse = (problem) => ({ findings: [postFinding(problem)], html: null });
    if (!name.endsWith('.md')) return refuse('a bot post must be a .md file (an .mdx file runs code at build time and is rendered by another pipeline)');
    if (Buffer.byteLength(contents, 'utf8') > POST_MAX_BYTES) return refuse(`the post is larger than ${POST_MAX_BYTES} bytes`);
    const fileUrl = pathToFileURL(join(postsDir, name));
    let rendered;
    try {
      const { data, body } = await markdownContentEntryType.getEntryInfo({ contents, fileUrl });
      rendered = await render({ id: basename(name, '.md'), data, body, filePath: fileURLToPath(fileUrl) });
    } catch (error) {
      return refuse(`the site's renderer failed on this post: ${error?.message ?? String(error)}`);
    }
    const findings = checkRenderedHtml(rendered.html);
    if (rendered.metadata?.imagePaths?.length) {
      findings.push(postFinding(`images go through Astro's image pipeline: ${rendered.metadata.imagePaths.join(', ')}`));
    }
    return { findings, html: rendered.html };
  };
}

/**
 * The worker: reads one JSON job per line on standard input (`{ id, name, contents }`) and writes
 * one JSON result per line on file descriptor 3 (`{ ready }` once, then `{ id, findings, html }`), so
 * nothing the renderer logs can be mistaken for a result.
 */
async function runWorker() {
  const out = createWriteStream('', { fd: 3 });
  const send = (message) => out.write(`${JSON.stringify(message)}\n`);
  // Nothing on stdout; the renderer's own warnings (Shiki's unknown-language note) go to stderr.
  console.log = console.info = console.warn;
  let check;
  try {
    check = await createPostChecker();
  } catch (error) {
    send({ ready: false, error: error?.message ?? String(error) });
    out.end();
    return;
  }
  send({ ready: true });
  for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    const { id, name, contents } = JSON.parse(line);
    send({ id, ...(await check(contents, name)) });
  }
  out.end();
}

/**
 * @typedef {object} CheckOptions
 * @property {number} [timeoutMs] per post, default `RENDER_TIMEOUT_MS`
 * @property {number} [startupTimeoutMs] default `WORKER_STARTUP_TIMEOUT_MS`
 * @property {number} [maxOldSpaceMb] default `WORKER_MAX_OLD_SPACE_MB`
 * @property {string} [workerScript] the script run with `--worker`; tests substitute a misbehaving one
 */

/**
 * Check post sources in a child process, one post at a time.
 * @param {{ name: string, contents: string }[]} posts `name` is the file name (`<slug>.md`)
 * @param {CheckOptions} [options]
 * @returns {Promise<PostResult[]>} one result per post, in order
 */
export async function checkPostSources(posts, options = {}) {
  const {
    timeoutMs = RENDER_TIMEOUT_MS,
    startupTimeoutMs = WORKER_STARTUP_TIMEOUT_MS,
    maxOldSpaceMb = WORKER_MAX_OLD_SPACE_MB,
    workerScript = fileURLToPath(import.meta.url),
  } = options;
  const results = posts.map(() => /** @type {PostResult | undefined} */ (undefined));
  const refused = (problem) => ({ findings: [postFinding(problem)], html: null });
  let next = 0;
  while (next < posts.length) {
    const worker = startWorker(workerScript, maxOldSpaceMb);
    const ready = await worker.receive(startupTimeoutMs);
    if (!ready.ok || ready.message.ready !== true) {
      // The renderer cannot start: nothing can be judged, so every remaining post is a finding.
      const why = ready.ok ? ready.message.error : ready.reason;
      worker.kill();
      for (; next < posts.length; next++) results[next] = refused(`the checker could not start the site's renderer: ${why}`);
      break;
    }
    for (; next < posts.length; next++) {
      const { name, contents } = posts[next];
      worker.send({ id: next, name, contents });
      const reply = await worker.receive(timeoutMs);
      if (reply.ok && reply.message.id === next) {
        results[next] = { findings: reply.message.findings, html: reply.message.html ?? null };
        continue;
      }
      results[next] = refused(reply.ok ? 'the renderer answered out of order' : reply.reason);
      worker.kill();
      next++;
      break;
    }
    worker.close();
  }
  return /** @type {PostResult[]} */ (results);
}

/**
 * A worker process and its line protocol.
 * @param {string} script @param {number} maxOldSpaceMb
 */
function startWorker(script, maxOldSpaceMb) {
  const child = spawn(process.execPath, [`--max-old-space-size=${maxOldSpaceMb}`, script, '--worker'], {
    cwd: SITE_ROOT,
    stdio: ['pipe', 'ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr = (stderr + chunk).slice(-STDERR_TAIL_BYTES);
  });
  child.stdin.on('error', () => {}); // a dead worker is reported by `receive`, not by a write
  const queue = [];
  let waiting = null;
  let exited = null;
  const deliver = (item) => (waiting ? (waiting(item), (waiting = null)) : queue.push(item));
  createInterface({ input: child.stdio[3], crlfDelay: Infinity }).on('line', (line) => {
    try {
      deliver({ ok: true, message: JSON.parse(line) });
    } catch {
      deliver({ ok: false, reason: 'the renderer wrote an unreadable result' });
    }
  });
  child.on('error', (error) => {
    exited = `the renderer could not run: ${error.message}`;
    deliver({ ok: false, reason: exited });
  });
  child.on('exit', (code, signal) => {
    const tail = stderr.trim().split('\n').slice(-3).join(' | ');
    const oom = /heap out of memory|Allocation failed/i.test(stderr);
    exited = oom
      ? `the renderer ran out of memory (cap ${maxOldSpaceMb} MiB)`
      : `the renderer exited (${signal ?? `code ${code}`})${tail ? `: ${tail}` : ''}`;
    // Let any result already on the pipe arrive first.
    setImmediate(() => deliver({ ok: false, reason: exited }));
  });
  return {
    /** @param {object} job */
    send(job) {
      if (!exited) child.stdin.write(`${JSON.stringify(job)}\n`);
    },
    /** @param {number} ms @returns {Promise<{ ok: true, message: any } | { ok: false, reason: string }>} */
    receive(ms) {
      if (queue.length) return Promise.resolve(queue.shift());
      return new Promise((resolvePromise) => {
        const timer = setTimeout(() => {
          waiting = null;
          resolvePromise({ ok: false, reason: `the render did not finish within ${ms} ms` });
        }, ms);
        waiting = (item) => {
          clearTimeout(timer);
          resolvePromise(item);
        };
      });
    },
    kill() {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    },
    close() {
      child.stdin.end();
    },
  };
}

/**
 * Check post files on disk in a child process. A grandfathered post's listed findings come back
 * under `excused`, never under `findings` (`GRANDFATHERED_POSTS`).
 * @param {string[]} files @param {CheckOptions} [options]
 * @returns {Promise<{ file: string, findings: Finding[], excused: Finding[] }[]>}
 */
export async function checkPostFiles(files, options = {}) {
  const posts = [];
  const early = new Map();
  files.forEach((file, index) => {
    try {
      if (statSync(file).size > POST_MAX_BYTES) early.set(index, [postFinding(`the post is larger than ${POST_MAX_BYTES} bytes`)]);
      else posts.push({ index, name: basename(file), path: rootPath(SITE_ROOT, file), contents: readFileSync(file, 'utf8') });
    } catch (error) {
      early.set(index, [postFinding(`cannot read the post: ${error.message}`)]);
    }
  });
  const checked = await checkPostSources(posts, options);
  const byIndex = new Map(posts.map((post, i) => [post.index, applyGrandfather(post.path, post.contents, checked[i].findings)]));
  return files.map((file, index) => {
    if (early.has(index)) return { file, findings: early.get(index), excused: [] };
    const { failing, excused } = byIndex.get(index);
    return { file, findings: failing, excused };
  });
}

/**
 * The gate's own precondition: at least one author is marked `kind: bot`. With none, the gate would
 * check nothing and pass, which is exactly how a renamed field or a moved directory would switch it
 * off. So an empty bot set is a finding, not an empty pass.
 * @param {string} [root] @returns {{ file: string, findings: Finding[], excused: Finding[] }[]}
 */
export function botSetProblems(root = SITE_ROOT) {
  let bots;
  try {
    bots = botAuthorIds(root);
  } catch (error) {
    return [{ file: join(root, AUTHORS_DIR), findings: [postFinding(`cannot read the authors: ${error.message}`)], excused: [] }];
  }
  if (bots.size) return [];
  return [{ file: join(root, AUTHORS_DIR), findings: [postFinding(`no author is marked kind: ${BOT_AUTHOR_KIND}, so the gate would check nothing`)], excused: [] }];
}

/**
 * The posts the build gates: every post whose author is a bot.
 * @param {string} [root] @returns {string[]}
 */
export function gatedPostFiles(root = SITE_ROOT) {
  const bots = botAuthorIds(root);
  return postFiles(root).filter((file) => isGated(readFileSync(file, 'utf8'), bots));
}

/** Where `astro build` writes the site (`outDir`, Astro's default; `astro.config.mjs` sets none). */
export const BUILD_DIST_DIR = 'dist';
/** Where `astro build` leaves its content data store (Astro's `DATA_STORE_FILE` in its cache dir). */
export const BUILD_DATA_STORE = 'node_modules/.astro/data-store.json';
const ASTRO_DATA_STORE_MODULE = 'astro/dist/content/mutable-data-store.js';

/**
 * After `astro build`: compare the checker's render of every `.md` post with the HTML the build
 * stored for it, and check the stored HTML of every gated post against the allowlist. The first
 * proves the checker renders exactly what the site ships (the same config, integrations, Astro and
 * satteri); the second judges the shipped bytes themselves. A difference is a finding: the gate can
 * no longer vouch for the site, whatever the reason (an upgrade, an integration hook, a stale cache).
 * @param {{ root?: string, options?: CheckOptions }} [args]
 * @returns {Promise<{ file: string, findings: Finding[], excused: Finding[] }[]>}
 */
export async function checkAgainstBuild({ root = SITE_ROOT, options = {} } = {}) {
  const storePath = join(root, BUILD_DATA_STORE);
  let text;
  try {
    text = readFileSync(storePath, 'utf8');
  } catch (error) {
    return [{ file: BUILD_DATA_STORE, findings: [postFinding(`cannot read the build's data store (run npm run build first): ${error.message}`)], excused: [] }];
  }
  const { MutableDataStore } = await import(pathToFileURL(join(root, 'node_modules', ASTRO_DATA_STORE_MODULE)).href);
  const store = await MutableDataStore.fromString(text);
  const entries = new Map([...store.values('posts')].map((entry) => [resolve(root, entry.filePath), entry]));
  const botProblems = botSetProblems(root);
  if (botProblems.length) return botProblems;
  const bots = botAuthorIds(root);
  const files = postFiles(root);
  const posts = [];
  const results = new Map();
  for (const file of files) {
    const contents = readFileSync(file, 'utf8');
    const entry = entries.get(file);
    // Gated if either reading names a bot: ours of the front matter, or the author Astro stored.
    // A difference between the two parsers can then only add checks, never skip one.
    const gated = isGated(contents, bots) || storedAuthorIsBot(entry, bots);
    const findings = [];
    let excused = [];
    if (!entry) findings.push(postFinding('the build stored no entry for this post'));
    else if (typeof entry.rendered?.html !== 'string') {
      if (gated) findings.push(postFinding('the build did not render this post (see the build log)'));
    } else if (gated) {
      const split = applyGrandfather(rootPath(root, file), contents, checkRenderedHtml(entry.rendered.html));
      findings.push(...split.failing);
      excused = split.excused;
    }
    results.set(file, { file, findings, excused });
    if (entry && typeof entry.rendered?.html === 'string' && file.endsWith('.md')) posts.push({ file, name: basename(file), contents, html: entry.rendered.html });
  }
  for (const file of entries.keys()) {
    if (!results.has(file)) results.set(file, { file, findings: [postFinding('the build stored a post that is not on disk')], excused: [] });
  }
  const rendered = await checkPostSources(posts, options);
  posts.forEach((post, i) => {
    const html = rendered[i].html;
    if (html === post.html) return;
    const why = html === null
      ? `the checker could not render it: ${rendered[i].findings.map((f) => f.problem).join('; ')}`
      : `first difference at character ${firstDifference(html, post.html)}`;
    results.get(post.file).findings.push(postFinding(`the checker's render differs from the build's (${why})`));
  });
  // Every built story page: the body sits where the stand-in says, and the page parses cleanly.
  let pagesChecked = 0;
  for (const [file, entry] of entries) {
    const page = join(root, BUILD_DIST_DIR, 'posts', entry.id, 'index.html');
    let text;
    try {
      text = readFileSync(page, 'utf8');
    } catch {
      continue; // a draft or scheduled post has no page
    }
    pagesChecked += 1;
    const problems = builtPageProblems(text, { withdrawn: Boolean(entry.data?.withdrawn) });
    const result = results.get(file);
    for (const problem of problems) result.findings.push(postFinding(`${relative(root, page)}: ${problem}`));
  }
  if (pagesChecked === 0 && entries.size > 0) {
    results.set(join(root, BUILD_DIST_DIR), {
      file: join(root, BUILD_DIST_DIR),
      findings: [postFinding(`no built story page under ${BUILD_DIST_DIR}/posts/ to check the page chain against (run npm run build first)`)],
      excused: [],
    });
  }
  return [...results.values()];
}

/**
 * Whether the author the build stored for a post (`reference('authors')`: `{ collection, id }`,
 * or a bare id) is a bot. An entry with an author the gate cannot read counts as a bot.
 * @param {any} entry @param {Set<string>} bots @returns {boolean}
 */
export function storedAuthorIsBot(entry, bots) {
  if (!entry) return false;
  const author = entry.data?.author;
  const id = typeof author === 'string' ? author : author?.id;
  return typeof id !== 'string' || bots.has(id);
}

/** @param {string} a @param {string} b @returns {number} */
function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** @param {Finding} f @returns {string} */
export function formatFinding(f) {
  const where = f.path ? `${f.path}${f.attribute ? ` @${f.attribute}` : ''}` : '(whole post)';
  return `${where}: ${f.problem}`;
}

const USAGE = 'usage: check-rendered-body.mjs [--json] [--all | --against-build | --stdin [--name <slug>.md] | <post file>...]';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * @param {string[]} argv @returns {Promise<number>} the exit code
 */
export async function main(argv) {
  const args = [...argv];
  const flag = (name) => {
    const at = args.indexOf(name);
    if (at < 0) return false;
    args.splice(at, 1);
    return true;
  };
  const json = flag('--json');
  const all = flag('--all');
  const stdin = flag('--stdin');
  const againstBuild = flag('--against-build');
  let name = 'stdin.md';
  const nameAt = args.indexOf('--name');
  if (nameAt >= 0) {
    name = args[nameAt + 1];
    args.splice(nameAt, 2);
    if (!name || name.includes('/') || name.includes('\\')) {
      console.error(USAGE);
      return 2;
    }
  }
  const modes = [stdin, all, againstBuild, args.length > 0].filter(Boolean).length;
  if (args.some((a) => a.startsWith('--')) || modes > 1) {
    console.error(USAGE);
    return 2;
  }

  let results;
  let scope;
  if (againstBuild) {
    results = mergeResults(await checkAgainstBuild(), staleGrandfatherEntries()).map((r) => ({ ...r, file: relative(process.cwd(), r.file) || r.file }));
    scope = `the build's ${results.length} posts`;
  } else if (stdin) {
    const contents = await readStdin();
    const [{ findings }] = await checkPostSources([{ name, contents }]);
    const { failing, excused } = applyGrandfather(`${POSTS_DIR}/${name}`, contents, findings);
    results = [{ file: name, findings: failing, excused }];
    scope = 'the post on standard input';
  } else {
    const gate = !args.length && !all;
    const botProblems = gate ? botSetProblems() : [];
    const files = args.length ? args.map((a) => resolve(a)) : all ? postFiles() : botProblems.length ? [] : gatedPostFiles();
    results = await checkPostFiles(files);
    // The gate and the full report also refuse a grandfather entry that no longer matches its file.
    if (!args.length) results = mergeResults(botProblems, results, botProblems.length ? [] : staleGrandfatherEntries());
    results = results.map((r) => ({ ...r, file: relative(process.cwd(), r.file) || r.file }));
    scope = args.length ? `${files.length} post file(s)` : all ? `all ${files.length} posts` : `${files.length} bot-authored post(s)`;
  }

  const failed = results.filter((r) => r.findings.length);
  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: failed.length === 0, results }, null, 2)}\n`);
  } else {
    for (const { file, excused } of results) {
      if (excused.length) console.log(`${file}: ${excused.length} known finding(s) excused while the file is unchanged (GRANDFATHERED_POSTS)`);
    }
    for (const { file, findings } of failed) {
      console.error(`${file}:`);
      for (const f of findings) console.error(`  ${formatFinding(f)}`);
    }
    const summary = `check-rendered-body: ${scope}, ${failed.length} with findings`;
    (failed.length ? console.error : console.log)(summary);
  }
  return failed.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--worker') {
    await runWorker();
  } else {
    process.exitCode = await main(process.argv.slice(2));
  }
}
