#!/usr/bin/env node
/**
 * The desk bots' own gate, run before they open a pull request (`npm run preflight`). It is the
 * written house style as code, so a bot that writes the post "our way" passes and a bot that does not
 * is told exactly what to fix, with no human in the loop.
 *
 *   node scripts/bot-preflight.mjs                  check every post this branch adds or changes against origin/main
 *   node scripts/bot-preflight.mjs --files a.md b.md   check these post files
 *   node scripts/bot-preflight.mjs --news [--files ...]   news burst: publish now, off the half-hour grid and sharing a slot is allowed
 *   node scripts/bot-preflight.mjs --next-slot [N]   print the next N free half-hour slots (default 1), in UTC
 *
 * It exits 1 on any problem. It is the bots' pre-flight, not a gate on the site: CI stays as it is
 * (Michel's rule, 2026-10-01: bots are allowed to post and the site never blocks a good post). What it
 * adds to `check:posts` is the part that check cannot see: the hero is present with its alt text, the
 * publish time sits on the shared 30-minute grid and is free, and the prose follows the style rules
 * in docs/guides/bot-content-contract.md.
 *
 * Why it exists: on 2026-10-02 five bot posts shipped a repository hero path, were merged on a red
 * check, and stopped every deploy for about an hour; the audit that followed found the same house-style
 * breaks (em-dash asides, descriptions far over the front-page length, no hero alt text, publish times off
 * the grid and on top of other writers' slots) across most bot posts.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRONTMATTER_SECTIONS } from '../src/lib/habitats.ts';
import { readFrontmatter } from './frontmatter.mjs';

export const POSTS_DIR = 'src/content/posts';
export const HEROES_DIR = 'public/heroes';
/** The site publishes one post per half hour (scheduled-publish.yml checks at :07 and :37). */
export const SLOT_MINUTES = 30;
/** The front page prints the description in full beside the hero; the schema limit (400) is a ceiling, not a target. */
export const DESCRIPTION_SOFT_MAX = 260;
/** wildness.verified and wildness.claimed fail the build at 120; stay under so an edit never trips it. */
export const WILDNESS_LINE_SOFT_MAX = 110;
export const TITLE_SOFT_MAX = 120;
/** A news burst goes live at the next publish check, so its pubDate may be at most this far ahead. */
export const NEWS_MAX_AHEAD_MINUTES = 180;

const HYPE = /\b(revolutionary|game-changing|game changer|groundbreaking|cutting-edge|supercharge[sd]?|unleash(?:es|ed)?|seamless(?:ly)?|robust|powerful|blazing|next-generation|unlock(?:s|ed)?|paradigm|delve|ever-evolving|testament)\b/gi;
const NOT_X_BUT_Y = /\bnot (?:just |only |merely )?[^.;\n]{1,60}?,? but\b/gi;

/** @param {string} text whole post file @returns {{data: Record<string, any>, body: string} | null} */
function parse(text) {
  const fm = readFrontmatter(text);
  if (fm === null) return null;
  const afterFence = text.slice(fm.end);
  return { data: fm.data, body: afterFence.replace(/^\n?---[ \t]*\n?/, '') };
}

/** Prose with fenced code removed, so code and shell lines are not judged as sentences. */
const prose = (body) => body.replace(/```[\s\S]*?```/g, ' ');

/**
 * House-style problems in one post's text.
 * @param {Record<string, any>} data frontmatter @param {string} body @returns {string[]}
 */
export function styleProblems(data, body) {
  const out = [];
  const text = prose(body);
  const dashes = (text.match(/—/g) ?? []).length;
  if (dashes > 0) out.push(`${dashes} em-dash(es) in the prose: write two sentences, or use a colon or a comma (no em-dash asides)`);
  if (!FRONTMATTER_SECTIONS.includes(data.section)) out.push(`section ${JSON.stringify(data.section)} is not a habitat: use one of ${FRONTMATTER_SECTIONS.join(', ')}`);
  const title = String(data.title ?? '');
  if (title.length > TITLE_SOFT_MAX) out.push(`title is ${title.length} characters; keep it under ${TITLE_SOFT_MAX} so a card shows it whole`);
  const description = String(data.description ?? '');
  if (description.length > DESCRIPTION_SOFT_MAX) out.push(`description is ${description.length} characters; the front page prints it in full, keep it to one or two plain sentences under ${DESCRIPTION_SOFT_MAX}`);
  for (const key of ['verified', 'claimed']) {
    const line = String(data.wildness?.[key] ?? '');
    if (line.length > WILDNESS_LINE_SOFT_MAX) out.push(`wildness.${key} is ${line.length} characters; keep it under ${WILDNESS_LINE_SOFT_MAX} (the build fails at 120)`);
  }
  const isPoem = Array.isArray(data.tags) && data.tags.includes('poem');
  if (!isPoem && (!Array.isArray(data.sources) || data.sources.length === 0)) out.push('no sources: bots always cite, with deep links to what was actually read');
  return out;
}

/**
 * Style notes: patterns that are usually a break of the house style but can be a fair sentence
 * ("It does not say X today, but it does say Y"), so they are listed for the writer to judge and never fail the run.
 * @param {string} body @returns {string[]}
 */
export function styleNotes(body) {
  const out = [];
  const text = prose(body);
  const nxby = (text.match(NOT_X_BUT_Y) ?? []).length;
  if (nxby > 0) out.push(`${nxby} "not X, but Y" construction(s): if it is a rhetorical contrast, say what the thing is, plainly`);
  const qh = (body.match(/^#{2,4} .*\?\s*$/gm) ?? []).length;
  if (qh > 0) out.push(`${qh} question heading(s): a heading says what the section contains`);
  const hype = [...new Set((text.match(HYPE) ?? []).map((w) => w.toLowerCase()))];
  if (hype.length) out.push(`hype word(s): ${hype.join(', ')}`);
  return out;
}

/**
 * Hero problems: every post has a hero (the site's signature), on the media host, with alt text.
 * @param {Record<string, any>} data @returns {string[]}
 */
export function heroProblems(data) {
  const out = [];
  const hero = typeof data.heroImage === 'string' ? data.heroImage.trim() : '';
  if (!hero) out.push('no heroImage: every post needs a hero (upload the image to the media host first)');
  else if (hero.startsWith('/')) out.push(`heroImage ${hero} is a repository path: heroes live on the media host (https://media.aitamer.news/heroes/...), never in the repository`);
  const alt = typeof data.heroAlt === 'string' ? data.heroAlt.trim() : '';
  if (hero && !alt) out.push('no heroAlt: add one true sentence saying what the picture shows');
  return out;
}

/** @param {string | Date | undefined} value @returns {Date | null} */
function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.valueOf()) ? null : value;
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

/** @param {Date} date @returns {string} e.g. 2026-10-03T04:30 (UTC) */
export const slotKey = (date) => date.toISOString().slice(0, 16);

/**
 * Publish-time problems: on the half-hour grid and not taken by another post.
 * @param {unknown} pubDate @param {Set<string>} taken slot keys used by other posts @returns {string[]}
 */
export function slotProblems(pubDate, taken) {
  const date = toDate(/** @type {any} */ (pubDate));
  if (!date) return ['no readable pubDate: write one on the half hour, for example 2026-10-03T04:30:00Z'];
  const out = [];
  if (date.getUTCMinutes() % SLOT_MINUTES !== 0 || date.getUTCSeconds() !== 0) {
    out.push(`pubDate ${date.toISOString()} is off the ${SLOT_MINUTES}-minute grid: use :00 or :30 (the site publishes one post per half hour)`);
  }
  if (taken.has(slotKey(date))) out.push(`pubDate ${slotKey(date)}Z is already taken by another post: run \`npm run preflight -- --next-slot\``);
  return out;
}

/**
 * Publish-time problems for a news burst (backoffice or desk-bot news): news is not held for a free slot,
 * the publisher takes every post due at a check in one deploy, so only a readable, near pubDate is required.
 * @param {unknown} pubDate @param {Date} now @returns {string[]}
 */
export function newsSlotProblems(pubDate, now) {
  const date = toDate(/** @type {any} */ (pubDate));
  if (!date) return ['no readable pubDate: write the time the news should go live, for example 2026-10-03T09:15:00Z'];
  if (date.valueOf() - now.valueOf() > NEWS_MAX_AHEAD_MINUTES * 60_000) {
    return [`pubDate ${date.toISOString()} is more than ${NEWS_MAX_AHEAD_MINUTES} minutes ahead: news goes live now; later times belong to the scheduled evergreen queue`];
  }
  return [];
}

/**
 * The next free half-hour slots after `from`.
 * @param {Set<string>} taken @param {Date} from @param {number} [count] @returns {string[]} ISO strings, UTC
 */
export function nextFreeSlots(taken, from, count = 1) {
  const step = SLOT_MINUTES * 60_000;
  let t = Math.ceil(from.valueOf() / step) * step;
  const out = [];
  while (out.length < count) {
    const d = new Date(t);
    if (!taken.has(slotKey(d))) out.push(`${slotKey(d)}:00Z`);
    t += step;
  }
  return out;
}

/** The slot keys of every post under `postsDir`, except the files named in `skip`. */
export function takenSlots(postsDir = POSTS_DIR, skip = new Set()) {
  const taken = new Set();
  for (const name of readdirSync(postsDir)) {
    if (!/\.mdx?$/.test(name) || skip.has(name)) continue;
    let parsed;
    try {
      parsed = parse(readFileSync(join(postsDir, name), 'utf8'));
    } catch {
      continue;
    }
    const date = toDate(parsed?.data.pubDate);
    if (date) taken.add(slotKey(date));
  }
  return taken;
}

/** Post files this branch adds or changes relative to `base`. */
export function changedPosts(base = 'origin/main', cwd = process.cwd()) {
  const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`, '--', POSTS_DIR], { cwd, encoding: 'utf8' });
  return out.split('\n').filter((f) => /\.mdx?$/.test(f));
}

/**
 * @param {string[]} files post file paths @param {{postsDir?: string, heroesDir?: string}} [options]
 * @returns {{file: string, problems: string[], notes: string[]}[]} only the files with problems or notes; a repository hero folder is reported under its own path
 */
export function preflight(files, { postsDir = POSTS_DIR, heroesDir = HEROES_DIR, news = false, now = new Date() } = {}) {
  const results = [];
  const own = new Set(files.map((f) => basename(f)));
  const taken = takenSlots(postsDir, own);
  const seen = new Set();
  for (const file of files) {
    const problems = [];
    const notes = [];
    let parsed = null;
    try {
      parsed = parse(readFileSync(file, 'utf8'));
    } catch (error) {
      problems.push(`unreadable frontmatter: ${error.message}`);
    }
    if (parsed) {
      problems.push(...heroProblems(parsed.data), ...(news ? newsSlotProblems(parsed.data.pubDate, now) : slotProblems(parsed.data.pubDate, taken)), ...styleProblems(parsed.data, parsed.body));
      notes.push(...styleNotes(parsed.body));
      const key = !news && toDate(parsed.data.pubDate) ? slotKey(toDate(parsed.data.pubDate)) : null;
      if (key && seen.has(key)) problems.push(`pubDate ${key}Z is also used by another post in this same pull request`);
      if (key) seen.add(key);
    }
    if (problems.length || notes.length) results.push({ file, problems, notes });
  }
  if (existsSync(heroesDir)) {
    results.push({ file: `${heroesDir}/`, problems: ['this folder must not exist: heroes live on the media host, never in the repository (remove it from the pull request)'], notes: [] });
  }
  return results;
}

export function main(argv, now = new Date()) {
  const slotIndex = argv.indexOf('--next-slot');
  if (slotIndex !== -1) {
    const count = Number.parseInt(argv[slotIndex + 1] ?? '', 10);
    console.log(nextFreeSlots(takenSlots(), now, Number.isInteger(count) && count > 0 ? count : 1).join('\n'));
    return 0;
  }
  const filesIndex = argv.indexOf('--files');
  const files = filesIndex !== -1 ? argv.slice(filesIndex + 1) : changedPosts();
  if (files.length === 0) {
    console.log('preflight: no post files added or changed; nothing to check.');
    return 0;
  }
  const results = preflight(files, { news: argv.includes('--news'), now });
  const failing = results.filter((r) => r.problems.length);
  for (const { file, notes } of results) {
    if (notes.length === 0) continue;
    console.log(`\n${file}  (read these; fix any that is a real break, they do not fail the run)`);
    for (const note of notes) console.log(`  ? ${note}`);
  }
  if (failing.length === 0) {
    console.log(`\npreflight: ${files.length} post(s) pass the hero rule, the slot grid and the house style. Now run \`npm run check:posts\`, \`npm run check:media\` and \`npm test\`.`);
    return 0;
  }
  console.error('\npreflight: fix these before you open the pull request:');
  for (const { file, problems } of failing) {
    console.error(`\n${file}`);
    for (const problem of problems) console.error(`  - ${problem}`);
  }
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
