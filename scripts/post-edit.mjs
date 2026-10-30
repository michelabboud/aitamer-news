#!/usr/bin/env node
/**
 * Post edits: change a post that is already on main, through the same pull request lane as a new post.
 * Michel's ask (2026-10-30): the bots own edits, corrections, updates and withdrawals of their own posts,
 * with no owner approval. The builder (`post-builder.mjs`) makes new posts; this tool changes existing ones,
 * writes the reader-facing notice in house style, and refuses an edit that touches a post's identity.
 *
 *   node scripts/post-edit.mjs <action> --slug <slug> [options] [--base origin/main] [--no-links]
 *
 *   edit      a copy edit made by hand in the file (typo, dead link swap). Checks it; adds no notice.
 *   correct   --text "What was wrong and what it says now."   appends a dated `corrections` entry
 *   update    --heading "What changed" (--text "..." | --text-file f.md)
 *             appends `## Update, <d Month yyyy>: <heading>` to the body and sets `updatedDate`
 *   withdraw  --reason "Why the story was taken down."         adds `withdrawn`
 *   restore   --text "Why the story is back."                 removes `withdrawn`, appends a dated correction
 *
 * Every action first accepts a hand edit of the text already in the file (fix the wrong sentence, then run
 * `correct`), then checks the result against the post on `--base`: the schema; pubDate, specimen, author and
 * draft unchanged; corrections added only by `correct`/`restore`, dated now, earlier ones kept as written; a
 * withdrawal added or removed only by its action; new body links in the sources and answering; no new working
 * notes in reader text. Dates come from the real clock. A post not yet live takes `edit` and `withdraw` only. The file is written only when every check
 * passes. Stdout is one JSON result { status, action, slug, file, changes, problems, warnings }; exit 0 on
 * ok, 1 when a check fails, 2 on bad usage.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { postSchema } from '../src/content/post-schema.ts';
import { LEAK_PATTERNS, POSTS_DIR } from './check-reader-text.mjs';
import { bodyLinks, checkLinks, SOFT_LINK_STATUSES } from './post-builder.mjs';

export const ACTIONS = Object.freeze(['edit', 'correct', 'update', 'withdraw', 'restore']);
/** A post's identity and history: no edit changes them (POST.md section 2: "Never change an already published date"). */
export const FROZEN_FIELDS = Object.freeze(['pubDate', 'specimen', 'author', 'draft']);
/** The schema's limit for a correction's text and a withdrawal's reason. */
export const NOTICE_MAX = 500;
/** How far ahead of this machine's clock a notice date may be, for clock skew between hosts. */
export const CLOCK_SKEW_MS = 5 * 60 * 1000;
export const DEFAULT_BASE = 'origin/main';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;
const TOP_KEY = /^([A-Za-z][\w-]*):(?:\s|$)/;
/** A file name under src/content/posts, never a path (one live post ends in a hyphen). */
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** UTC, to the minute, as the stamped posts write it: `2026-10-30T07:45:00Z`. */
export const stamp = (now) => `${now.toISOString().slice(0, 16)}:00Z`;
/** The house date in an update heading: `30 October 2026`. */
export const houseDate = (now) => `${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

/** @returns {{ fm: string, body: string }} */
export function splitPost(text) {
  if (text.includes('\r\n')) throw new Error('the file uses Windows line endings (CRLF); save it with LF');
  const m = FRONTMATTER.exec(text);
  if (!m) throw new Error('the file has no frontmatter block');
  return { fm: m[1], body: text.slice(m[0].length) };
}
const joinPost = (fm, body) => `---\n${fm}\n---\n${body}`;

/** Top-level frontmatter keys as line blocks, in order, so one key can change and every other byte stays. */
export function fmBlocks(fm) {
  const blocks = [];
  for (const line of fm.split('\n')) {
    const m = TOP_KEY.exec(line);
    if (m) blocks.push({ key: m[1], lines: [line] });
    else if (blocks.length) blocks.at(-1).lines.push(line);
    else throw new Error(`frontmatter starts with a line that is not a key: ${line.slice(0, 60)}`);
  }
  return blocks;
}
const fmText = (blocks) => blocks.map((b) => b.lines.join('\n')).join('\n');
const dumpKey = (key, value) => yaml.dump({ [key]: value }, { lineWidth: -1, quotingType: '"', forceQuotes: true }).trimEnd().split('\n');

/** Set (or, with `undefined`, remove) one top-level key; a new key goes after the last of `after` present, else at the end. */
export function setKey(fm, key, value, after = []) {
  const blocks = fmBlocks(fm);
  const i = blocks.findIndex((b) => b.key === key);
  if (value === undefined) { if (i !== -1) blocks.splice(i, 1); return fmText(blocks); }
  const block = { key, lines: dumpKey(key, value) };
  if (i !== -1) { blocks[i] = block; return fmText(blocks); }
  const anchor = Math.max(-1, ...after.map((k) => blocks.findIndex((b) => b.key === k)));
  blocks.splice(anchor === -1 ? blocks.length : anchor + 1, 0, block);
  return fmText(blocks);
}

/** Append one `{ date, text }` to `corrections`, leaving every earlier entry byte for byte as written. */
export function appendCorrection(fm, entry) {
  const blocks = fmBlocks(fm);
  const i = blocks.findIndex((b) => b.key === 'corrections');
  const item = yaml.dump([entry], { lineWidth: -1, quotingType: '"', forceQuotes: true }).trimEnd().split('\n');
  if (i === -1) {
    const anchor = blocks.findIndex((b) => b.key === 'sources');
    blocks.splice(anchor === -1 ? blocks.length : anchor, 0, { key: 'corrections', lines: ['corrections:', ...item.map((l) => `  ${l}`)] });
    return fmText(blocks);
  }
  const lines = blocks[i].lines;
  while (lines.length > 1 && !lines.at(-1).trim()) lines.pop();
  if (lines.length === 1) {
    // `corrections: []` (or empty): only an empty list may be rewritten in block style.
    const existing = yaml.load(lines[0])?.corrections;
    if (existing != null && !(Array.isArray(existing) && existing.length === 0)) throw new Error('corrections is written in flow style; rewrite it as a block list before adding an entry');
    blocks[i] = { key: 'corrections', lines: ['corrections:', ...item.map((l) => `  ${l}`)] };
    return fmText(blocks);
  }
  const indent = (/^(\s*)- /.exec(lines.find((l) => /^\s*- /.test(l)) ?? '') ?? [, '  '])[1];
  lines.push(...item.map((l) => `${indent}${l}`));
  return fmText(blocks);
}

const asTime = (v) => (v instanceof Date ? v.getTime() : typeof v === 'string' || typeof v === 'number' ? new Date(v).getTime() : NaN);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The text a reader sees, for the working-note check. */
const readerText = (data, body) => [data.title, data.description, data.verdict, data.heroAlt, data.wildness?.verified, data.wildness?.claimed,
  ...(data.corrections ?? []).map((c) => c?.text), data.withdrawn?.reason, body].filter((s) => typeof s === 'string').join('\n');

/**
 * Check an edited post against the post on main. Pure: no files, no network, no git.
 * @returns {{ problems: {code: string, field: string, message: string}[], warnings: {code: string, field: string, message: string}[], newUrls: string[] }}
 */
export function checkEdit(baseText, nextText, { action, now }) {
  const problems = []; const warnings = [];
  const P = (code, field, message) => problems.push({ code, field, message });
  let base; let next;
  try { const s = splitPost(baseText); base = { data: yaml.load(s.fm) ?? {}, body: s.body }; }
  catch (e) { return { problems: [{ code: 'base', field: '(post)', message: `the post on main does not parse: ${e.message}` }], warnings, newUrls: [] }; }
  try { const s = splitPost(nextText); next = { data: yaml.load(s.fm) ?? {}, body: s.body }; }
  catch (e) { return { problems: [{ code: 'yaml', field: '(post)', message: `the edited post does not parse: ${e.message}` }], warnings, newUrls: [] }; }

  if (nextText === baseText) P('no-change', '(post)', 'the post is the same as on main; there is nothing to submit');
  const parsed = postSchema.safeParse(next.data);
  if (!parsed.success) for (const issue of parsed.error.issues) P('schema', issue.path.join('.') || '(post)', issue.message);

  for (const k of FROZEN_FIELDS) {
    if (!same(base.data[k], next.data[k])) P('frozen', k, `${k} may not change in an edit (it is the post's identity or history)`);
  }

  const nowMs = now.getTime(); const pubMs = asTime(base.data.pubDate);
  // A scheduled post has no readers yet, so a notice on it is not tied to its pubDate.
  const live = pubMs <= nowMs; const liveFrom = live ? pubMs : -Infinity;
  const late = (t, from) => !(t >= from) || t > nowMs + CLOCK_SKEW_MS;
  const baseCorr = Array.isArray(base.data.corrections) ? base.data.corrections : []; const nextCorr = next.data.corrections ?? [];
  if (!Array.isArray(nextCorr) || nextCorr.length < baseCorr.length || !same(nextCorr.slice(0, baseCorr.length), baseCorr)) {
    P('corrections-history', 'corrections', 'earlier corrections must stay exactly as written; add a new entry instead of editing or removing one');
  }
  const added = Array.isArray(nextCorr) ? nextCorr.slice(baseCorr.length) : [];
  if (added.length && !['correct', 'restore'].includes(action)) P('corrections-history', 'corrections', 'a correction is added only by `correct` or `restore`, never by hand');
  if (added.length > 1) P('corrections-history', 'corrections', 'one edit adds one correction');
  // A new correction is never older than what it follows: the publication, the last correction, a withdrawal it lifts.
  const after = Math.max(liveFrom, ...baseCorr.map((c) => asTime(c?.date)).filter(Number.isFinite), action === 'restore' ? asTime(base.data.withdrawn?.date) || -Infinity : -Infinity);
  for (const c of added) if (late(asTime(c?.date), after)) P('notice-date', 'corrections', 'a new correction is dated now, not before the publication, the last correction or the withdrawal it lifts');

  if (base.data.withdrawn && !next.data.withdrawn) {
    if (action !== 'restore') P('withdrawn', 'withdrawn', 'only `restore` brings back a withdrawn post');
    if (!added.length) P('withdrawn', 'corrections', 'a restored post carries a dated correction saying why it is back');
  } else if (!base.data.withdrawn && next.data.withdrawn) {
    if (action !== 'withdraw') P('withdrawn', 'withdrawn', 'only `withdraw` takes a post down');
    if (late(asTime(next.data.withdrawn?.date), liveFrom)) P('notice-date', 'withdrawn', 'a withdrawal is dated now, not before the publication');
  } else if (!same(base.data.withdrawn, next.data.withdrawn)) {
    P('withdrawn', 'withdrawn', 'a withdrawal may not be edited; restore the post and withdraw it again');
  }

  if (!same(base.data.updatedDate, next.data.updatedDate) && next.data.updatedDate !== undefined) {
    const t = asTime(next.data.updatedDate); const before = base.data.updatedDate === undefined ? pubMs : asTime(base.data.updatedDate);
    if (!(t >= before) || t > nowMs + CLOCK_SKEW_MS) P('notice-date', 'updatedDate', 'updatedDate moves forward, between the previous update (or pubDate) and now');
  } else if (base.data.updatedDate !== undefined && next.data.updatedDate === undefined) {
    P('notice-date', 'updatedDate', 'updatedDate may not be removed');
  }

  // Counted per pattern, so a second working note is caught even where main already carries one.
  const count = (re, text) => (text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)) ?? []).length;
  const baseReader = readerText(base.data, base.body); const nextReader = readerText(next.data, next.body);
  for (const { name, re } of LEAK_PATTERNS) if (count(re, nextReader) > count(re, baseReader)) P('leak', 'prose', `working note in reader text: ${name}`);

  // Links: every new body link is a listed source; a link the post on main already left unsourced is not this edit's to fix.
  const urls = (d) => new Set((Array.isArray(d.sources) ? d.sources : []).map((s) => s?.url).filter(Boolean));
  const baseSources = urls(base.data); const nextSources = urls(next.data);
  const baseLinks = new Set(bodyLinks(base.body)); const nextLinks = bodyLinks(next.body);
  const grandfathered = new Set([...baseLinks].filter((u) => !baseSources.has(u)));
  for (const u of nextLinks) if (!nextSources.has(u) && !grandfathered.has(u)) P('link-not-in-sources', 'body', `body link ${u} is not in the sources list`);
  for (const u of baseSources) if (!nextSources.has(u) && nextLinks.includes(u)) P('link-not-in-sources', 'sources', `${u} was removed from the sources but the body still links it`);
  for (const u of nextSources) if (baseLinks.has(u) && !nextLinks.includes(u)) warnings.push({ code: 'source-not-linked', field: 'sources', message: `${u} is still a source but the edit removed its link from the body; check the claim it supported` });
  const newUrls = [...new Set([...nextSources, ...nextLinks])].filter((u) => !baseSources.has(u) && !baseLinks.has(u));
  return { problems, warnings, newUrls };
}

/**
 * Apply one action to the current file text, then check it against main.
 * @param {object} o { action, baseText, currentText, now, text, heading, reason, fetcher, noLinks }
 */
export async function editPost(o) {
  const { action, baseText, now } = o;
  let text = o.currentText;
  const changes = [];
  const usage = (message) => ({ status: 'error', file: null, changes, problems: [{ code: 'usage', field: '(action)', message }], warnings: [] });
  const notice = (name, value) => {
    const v = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    if (!v) return `${action} needs --${name}`;
    if (v.length > NOTICE_MAX) return `--${name} is ${v.length} characters; the post contract allows ${NOTICE_MAX}`;
    if (v.includes('—')) return `--${name} uses an em-dash; the house style uses a comma`;
    return null;
  };
  if (!ACTIONS.includes(action)) return usage(`unknown action "${action}"; use one of ${ACTIONS.join(', ')}`);
  let fm; let body; let onMain;
  try { ({ fm, body } = splitPost(text)); yaml.load(fm); onMain = yaml.load(splitPost(baseText).fm) ?? {}; }
  catch (e) { return { status: 'error', file: null, changes, problems: [{ code: 'yaml', field: '(post)', message: `the post does not parse: ${e.message}` }], warnings: [] }; }
  const date = stamp(now);
  if ((action === 'correct' || action === 'update') && !(asTime(onMain.pubDate) <= now.getTime())) {
    return usage(`the post is scheduled and not live yet; change its text with \`edit\` (no reader has seen it, so no notice is needed)`);
  }
  if (action === 'correct' || action === 'restore') {
    const bad = notice('text', o.text); if (bad) return usage(bad);
    const t = o.text.replace(/\s+/g, ' ').trim();
    if (action === 'restore') {
      if (!onMain.withdrawn) return usage('the post on main is not withdrawn; there is nothing to restore');
      fm = setKey(fm, 'withdrawn', undefined); changes.push('removed withdrawn');
    }
    fm = appendCorrection(fm, { date, text: t }); changes.push(`added correction dated ${date}`);
  } else if (action === 'update') {
    const heading = typeof o.heading === 'string' ? o.heading.replace(/\s+/g, ' ').trim() : '';
    const add = typeof o.text === 'string' ? o.text.replace(/\r\n/g, '\n').trim() : '';
    if (!heading || !add) return usage('update needs --heading and --text (or --text-file)');
    if (`${heading}\n${add}`.includes('—')) return usage('the update uses an em-dash; the house style uses a comma');
    body = `${body.trimEnd()}\n\n## Update, ${houseDate(now)}: ${heading}\n\n${add}\n`;
    changes.push(`appended "## Update, ${houseDate(now)}: ${heading}"`);
    fm = setKey(fm, 'updatedDate', date, ['pubDate', 'specimen']); changes.push(`set updatedDate ${date}`);
  } else if (action === 'withdraw') {
    const bad = notice('reason', o.reason); if (bad) return usage(bad);
    if (onMain.withdrawn) return usage('the post is already withdrawn');
    fm = setKey(fm, 'withdrawn', { date, reason: o.reason.replace(/\s+/g, ' ').trim() }, ['corrections', 'sources']);
    changes.push(`withdrew it, dated ${date}`);
  }
  text = joinPost(fm, body);
  const { problems, warnings, newUrls } = checkEdit(baseText, text, { action, now });
  if (!o.noLinks && newUrls.length) {
    for (const [u, st] of Object.entries(await checkLinks(newUrls, o.fetcher))) {
      if (typeof st === 'number' && st < 400) continue;
      if (typeof st === 'number' && SOFT_LINK_STATUSES.has(st)) warnings.push({ code: 'link-unverified', field: 'sources', message: `${u} answered ${st} (the site may block bots); check by hand` });
      else problems.push({ code: 'dead-link', field: 'sources', message: `${u} answered ${st}` });
    }
  }
  return { status: problems.length ? 'failed' : 'ok', file: problems.length ? null : text, changes, problems, warnings };
}

function arg(argv, name) { const i = argv.indexOf(name); return i === -1 ? undefined : argv[i + 1]; }

/** `now` is the real clock: a notice is dated when it is written, so the CLI takes no date. Tests pass one in. */
export async function main(argv, { cwd = process.cwd(), fetcher, now = new Date() } = {}) {
  const [action] = argv; const slug = arg(argv, '--slug'); const baseRef = arg(argv, '--base') ?? DEFAULT_BASE;
  const out = (result, code) => { console.log(JSON.stringify({ action, slug, ...result }, null, 2)); return code; };
  if (!ACTIONS.includes(action) || !slug) { console.error(`usage: post-edit.mjs <${ACTIONS.join('|')}> --slug <slug> [--text t | --text-file f] [--heading h] [--reason r] [--base ${DEFAULT_BASE}] [--no-links]`); return 2; }
  if (!SLUG.test(slug)) { console.error(`--slug must be a post slug (lowercase letters, digits and hyphens), not a path: ${slug}`); return 2; }
  const path = `${POSTS_DIR}/${slug}.md`;
  if (!existsSync(`${cwd}/${path}`)) return out({ status: 'error', file: null, changes: [], problems: [{ code: 'missing', field: '(post)', message: `${path} does not exist here; a new post is made with post-builder.mjs` }], warnings: [] }, 1);
  let baseText;
  try { baseText = execFileSync('git', ['show', `${baseRef}:${path}`], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { return out({ status: 'error', file: null, changes: [], problems: [{ code: 'not-on-main', field: '(post)', message: `${path} is not on ${baseRef}; only a post already on main can be edited (fetch ${baseRef} first, or make a new post with post-builder.mjs)` }], warnings: [] }, 1); }
  const textFile = arg(argv, '--text-file');
  const result = await editPost({
    action, baseText, currentText: readFileSync(`${cwd}/${path}`, 'utf8'), now, fetcher, noLinks: argv.includes('--no-links'),
    text: textFile ? readFileSync(textFile, 'utf8') : arg(argv, '--text'), heading: arg(argv, '--heading'), reason: arg(argv, '--reason'),
  });
  if (result.status === 'ok') writeFileSync(`${cwd}/${path}`, result.file);
  const { file, ...report } = result;
  return out({ ...report, file: result.status === 'ok' ? path : null }, result.status === 'ok' ? 0 : result.status === 'error' ? 2 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
