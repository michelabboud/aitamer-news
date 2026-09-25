#!/usr/bin/env node
/**
 * Stamp a publish time into each published post's frontmatter.
 *
 *   npm run stamp          rewrite date-only `pubDate: YYYY-MM-DD` lines to a full UTC time
 *   npm run check:times    exit 1 if a published post still has a date-only pubDate (CI)
 *
 * Where the time comes from, in order:
 *   1. git: the committer time of the first commit where the file carried `draft: false`
 *      (for a post with no draft line, the commit that added it). That is when it went live.
 *   2. now, for a post published in the working tree but not committed yet.
 * The day in the frontmatter is the editorial date and always wins. When the chosen time
 * falls on another UTC day, the post keeps its date at 00:00 UTC (what Astro already
 * assumed for a date-only value) and is listed so an editor can set the real time.
 * Drafts are left alone; they get stamped when they are published.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const POSTS_DIR = 'src/content/posts';
const POST_FILE = /\.mdx?$/;
const DATE_ONLY_PUBDATE = /^pubDate:[ \t]*(["']?)(\d{4}-\d{2}-\d{2})\1[ \t]*$/m;
const DRAFT_TRUE = /^draft:[ \t]*true[ \t]*$/m;
const HAS_DRAFT_LINE = /^draft:/m;

/** @param {string} text @returns {string | null} the frontmatter block without its fences */
export function frontmatterOf(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  return match ? match[1] : null;
}

/**
 * @param {string} text whole post file
 * @returns {string | null} the date-only pubDate (YYYY-MM-DD) of a published post, else null
 */
export function dateOnlyPubDate(text) {
  const fm = frontmatterOf(text);
  if (fm === null || DRAFT_TRUE.test(fm)) return null;
  const match = DATE_ONLY_PUBDATE.exec(fm);
  return match ? match[2] : null;
}

/** @param {Date} date @returns {string} e.g. 2026-09-24T09:15:12Z */
export function isoUtcSeconds(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * @param {string} day editorial date, YYYY-MM-DD
 * @param {Date} candidate git publish time, or now
 * @returns {{ value: string, exact: boolean }}
 */
export function chooseStamp(day, candidate) {
  const value = isoUtcSeconds(candidate);
  if (value.slice(0, 10) === day) return { value, exact: true };
  return { value: `${day}T00:00:00Z`, exact: false };
}

/** @param {string} text @param {string} stamp @returns {string} text with only the pubDate line changed */
export function withStamp(text, stamp) {
  const fm = frontmatterOf(text);
  if (fm === null) throw new Error('post has no frontmatter');
  const stamped = fm.replace(DATE_ONLY_PUBDATE, `pubDate: ${stamp}`);
  if (stamped === fm) throw new Error('post has no date-only pubDate');
  return text.replace(fm, stamped);
}

/** @param {string} file @returns {Date | null} when the post went live according to git */
export function gitPublishTime(file) {
  const text = readFileSync(file, 'utf8');
  const fm = frontmatterOf(text) ?? '';
  const args = HAS_DRAFT_LINE.test(fm)
    ? ['log', '--reverse', '--format=%cI', '-S', 'draft: false', '--', file]
    : ['log', '--reverse', '--format=%cI', '--diff-filter=A', '--', file];
  const first = execFileSync('git', args, { encoding: 'utf8' }).split('\n').find(Boolean);
  return first ? new Date(first) : null;
}

function postFiles(dir) {
  return readdirSync(dir)
    .filter((name) => POST_FILE.test(name))
    .sort()
    .map((name) => join(dir, name));
}

function main(argv) {
  const check = argv.includes('--check');
  const pending = postFiles(POSTS_DIR)
    .map((file) => ({ file, day: dateOnlyPubDate(readFileSync(file, 'utf8')) }))
    .filter((post) => post.day !== null);

  if (check) {
    if (pending.length === 0) {
      console.log('check:times: every published post has a publish time.');
      return 0;
    }
    console.error('check:times: these published posts have a date but no time. Run `npm run stamp` and commit:');
    for (const { file } of pending) console.error(`  ${file}`);
    return 1;
  }

  const now = new Date();
  const inexact = [];
  for (const { file, day } of pending) {
    const { value, exact } = chooseStamp(day, gitPublishTime(file) ?? now);
    writeFileSync(file, withStamp(readFileSync(file, 'utf8'), value));
    console.log(`stamped ${file}: ${value}`);
    if (!exact) inexact.push(file);
  }
  if (pending.length === 0) console.log('stamp: nothing to do.');
  if (inexact.length > 0) {
    console.warn('stamp: these went live on a different day than their pubDate, so they keep 00:00 UTC. Set the real time by hand:');
    for (const file of inexact) console.warn(`  ${file}`);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
