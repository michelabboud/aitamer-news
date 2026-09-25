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
 * Always exits 0: finding nothing due is a normal result, not a failure, and a post whose
 * frontmatter cannot be read is reported on stderr and skipped (the deploy refuses it). With
 * `$GITHUB_OUTPUT` set, writes `due=true` or `due=false` there so the workflow's next step
 * can decide whether to trigger a deploy.
 */
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublishedDraftField, pubDateOf, readFrontmatter } from './frontmatter.mjs';

export const POSTS_DIR = 'src/content/posts';
export const DEFAULT_WINDOW_MINUTES = 120;
const POST_FILE = /\.mdx?$/;

/**
 * @param {string} text whole post file
 * @returns {Date | null} the exact pubDate (a date with a time) of a non-draft post, else null.
 *   Read with the same YAML rules as Astro (scripts/frontmatter.mjs), so `draft: True` is a draft
 *   and a trailing comment does not hide a time. A date-only pubDate has no time: null.
 * @throws {Error} when the frontmatter is not valid YAML
 */
export function fullIsoPubDate(text) {
  const fm = readFrontmatter(text);
  if (fm === null || isPublishedDraftField(fm.data) !== true) return null;
  const { date, day } = pubDateOf(fm);
  return day === null ? date : null;
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
  const due = [];
  for (const file of postFiles(POSTS_DIR)) {
    let pubDate;
    try {
      pubDate = fullIsoPubDate(readFileSync(file, 'utf8'));
    } catch (error) {
      // One unreadable post must not stop another post from going live on time. The deploy's
      // check:posts refuses the unreadable one loudly; here it is reported and skipped.
      console.error(`due-posts: skipping ${file}: ${error.message}`);
      continue;
    }
    if (pubDate !== null && isDue(pubDate, now, windowMinutes)) due.push(slugOf(file));
  }

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
