#!/usr/bin/env node
/**
 * Find posts whose scheduled publish time fell due recently, for the hourly
 * `scheduled-publish.yml` workflow: a static build only reflects a scheduled post once
 * something rebuilds the site after its `pubDate` passes, so this script tells that
 * workflow when a rebuild is actually needed.
 *
 *   node scripts/due-posts.mjs                       print due slugs (default 120-minute window)
 *   node scripts/due-posts.mjs --window-minutes 180   use a wider window
 *
 * A post is due when it is not a draft and its full-ISO `pubDate` (the exact time
 * `npm run stamp` wrote, e.g. `2026-09-26T08:00:00Z`) falls in `(now - window, now]`. A
 * date-only `pubDate` is never due here: it has no exact time to compare against, and
 * going live for it is `isLive`'s job at build time, not this script's job to trigger an
 * out-of-band deploy.
 *
 * The window (120 minutes, more than the hourly cron interval) means a skipped or delayed
 * cron run is caught by the run after it; triggering the deploy twice for the same post is
 * harmless — deploy-pages.yml is idempotent and reuses Astro's incremental build cache.
 *
 * Always exits 0: finding nothing due is a normal result, not a failure. With
 * `$GITHUB_OUTPUT` set, writes `due=true` or `due=false` there so the workflow's next step
 * can decide whether to trigger a deploy.
 */
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontmatterOf } from './stamp-post-times.mjs';

export const POSTS_DIR = 'src/content/posts';
export const DEFAULT_WINDOW_MINUTES = 120;
const POST_FILE = /\.mdx?$/;
const DRAFT_TRUE = /^draft:[ \t]*true[ \t]*$/m;
const FULL_ISO_PUBDATE = /^pubDate:[ \t]*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)[ \t]*$/m;

/**
 * @param {string} text whole post file
 * @returns {Date | null} the full-ISO pubDate of a non-draft post, else null
 */
export function fullIsoPubDate(text) {
  const fm = frontmatterOf(text);
  if (fm === null || DRAFT_TRUE.test(fm)) return null;
  const match = FULL_ISO_PUBDATE.exec(fm);
  return match ? new Date(match[1]) : null;
}

/**
 * @param {Date} pubDate
 * @param {Date} now
 * @param {number} windowMinutes
 * @returns {boolean} true when pubDate is in (now - windowMinutes, now]
 */
export function isDue(pubDate, now, windowMinutes) {
  const windowStart = now.valueOf() - windowMinutes * 60_000;
  return pubDate.valueOf() > windowStart && pubDate.valueOf() <= now.valueOf();
}

/**
 * @param {string[]} argv
 * @returns {number} the requested window in minutes, or the default
 */
export function parseWindowMinutes(argv) {
  const flagIndex = argv.indexOf('--window-minutes');
  if (flagIndex === -1) return DEFAULT_WINDOW_MINUTES;
  const raw = argv[flagIndex + 1];
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`--window-minutes must be a positive number, got "${raw}"`);
  }
  return value;
}

function postFiles(dir) {
  return readdirSync(dir)
    .filter((name) => POST_FILE.test(name))
    .sort()
    .map((name) => join(dir, name));
}

/** @param {string} file @returns {string} the slug (file name without extension) */
function slugOf(file) {
  return file.slice(file.lastIndexOf('/') + 1).replace(POST_FILE, '');
}

function main(argv) {
  const windowMinutes = parseWindowMinutes(argv);
  const now = new Date();
  const due = postFiles(POSTS_DIR)
    .map((file) => ({ slug: slugOf(file), pubDate: fullIsoPubDate(readFileSync(file, 'utf8')) }))
    .filter((post) => post.pubDate !== null && isDue(post.pubDate, now, windowMinutes))
    .map((post) => post.slug);

  if (due.length === 0) {
    console.log(`due-posts: nothing due in the last ${windowMinutes} minutes.`);
  } else {
    for (const slug of due) console.log(slug);
  }

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    appendFileSync(githubOutput, `due=${due.length > 0}\n`);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
