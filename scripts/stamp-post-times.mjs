#!/usr/bin/env node
/**
 * Stamp a publish time into each published post's frontmatter.
 *
 *   npm run stamp          rewrite date-only `pubDate: YYYY-MM-DD` lines to a full UTC time
 *   npm run check:times    exit 1 if a published post still has a date-only pubDate, or a hero that is
 *                          not its own image on the media host (CI; part of check:posts)
 *
 * Where the time comes from, in order:
 *   1. git: the committer time of the first commit where the file carried `draft: false`
 *      (for a post with no draft line, the commit that added it). That is when it went live.
 *   2. now, for a post published in the working tree but not committed yet.
 * The day in the frontmatter is the editorial date and always wins. When the chosen time
 * falls on another UTC day, the post keeps its date at 00:00 UTC (what Astro already
 * assumed for a date-only value) and is listed so an editor can set the real time.
 * Drafts are left alone; they get stamped when they are published.
 *
 * Frontmatter is read with a YAML parser (scripts/frontmatter.mjs), so `draft: True`, quoted
 * dates and trailing comments mean what they mean to Astro. Every file is checked before any is
 * written: one unreadable post stops the run with nothing changed.
 *
 * The hero rule (`--check` only; ADR 0020): a published post's `heroImage`, when it has one, is
 * `https://media.aitamer.news/heroes/<slug>.jpg` or, for a hero that was replaced, the content-addressed
 * `https://media.aitamer.news/heroes/<slug>-<8 lowercase hex>.jpg` (ADR 0024), or a hashed hero on
 * `https://bots.aitamer.news/heroes/<slug>-<8 lowercase hex>.jpg`, the slug being the post's
 * file name, byte for byte: no other host, scheme, case, query, fragment or encoding. The old repo-relative `/heroes/<slug>.jpg`
 * is refused with the way out, and so is a `public/heroes/` folder at all: images never go back into
 * the repository (the deep review of 0.2.45, N2). A post without a hero gets its section's cover.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOT_MEDIA_ORIGIN, MEDIA_ORIGIN, heroUrl, isOwnHeroUrl } from '../src/lib/media.ts';
import {
  assertOnlyChanged,
  isPublishedDraftField,
  pubDateOf,
  readFrontmatter,
  topLevelLine,
  withRaw,
} from './frontmatter.mjs';

export const POSTS_DIR = 'src/content/posts';
/** Where heroes lived in the repo before they moved to R2 (ADR 0020). Removed in 0.2.45; `--check` fails if it comes back. */
export const HEROES_DIR = 'public/heroes';
const POST_FILE = /\.mdx?$/;
/**
 * A diff line that makes a post published: `draft: false` in any YAML spelling of false, with or
 * without a trailing comment. git's -G takes a POSIX extended regex, matched per added/removed line.
 */
const DRAFT_FALSE_LINE = '^draft:[[:space:]]*(false|False|FALSE)([[:space:]]|$)';

/**
 * @param {string} text whole post file
 * @returns {string | null} the date-only pubDate (YYYY-MM-DD) of a published post, else null
 * @throws {Error} when the frontmatter is not valid YAML or its pubDate cannot be read
 */
export function dateOnlyPubDate(text) {
  const fm = readFrontmatter(text);
  if (fm === null || isPublishedDraftField(fm.data) !== true) return null;
  return pubDateOf(fm).day;
}

/**
 * @param {string} text whole post file
 * @param {string} slug the post's file name without its extension
 * @returns {string | null} what is wrong with a published post's `heroImage`, or null
 * @throws {Error} when the frontmatter is not valid YAML
 */
export function heroProblem(text, slug) {
  const fm = readFrontmatter(text);
  if (fm === null || isPublishedDraftField(fm.data) !== true || !Object.hasOwn(fm.data, 'heroImage')) return null;
  const value = fm.data.heroImage;
  const expected = heroUrl(slug);
  if (isOwnHeroUrl(slug, value)) return null;
  if (value === `/heroes/${slug}.jpg`) {
    return `heroImage ${value} is the retired repo path (heroes live on R2 now): upload the image as POST.md §3 says and write heroImage: ${expected}`;
  }
  return `heroImage must be ${expected} (the post's own hero on the media host), or ${MEDIA_ORIGIN}/heroes/${slug}-<8 lowercase hex>.jpg, or ${BOT_MEDIA_ORIGIN}/heroes/${slug}-<8 lowercase hex>.jpg, not ${JSON.stringify(value)}`;
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

/**
 * @param {string} text whole post file
 * @param {string} stamp full UTC time, e.g. 2026-09-24T09:15:12Z
 * @returns {string} text with only the pubDate line changed (a trailing comment on it is kept)
 * @throws {Error} when there is no date-only pubDate, or the edit would change anything else
 */
export function withStamp(text, stamp) {
  const fm = readFrontmatter(text);
  if (fm === null) throw new Error('post has no frontmatter');
  const { day, comment } = pubDateOf(fm);
  const line = topLevelLine(fm.raw, 'pubDate');
  if (day === null || line === null) throw new Error('post has no date-only pubDate');
  const next = `pubDate: ${stamp}${comment ? ` ${comment}` : ''}${line.cr ? '\r' : ''}`;
  const stamped = withRaw(text, fm, fm.raw.slice(0, line.start) + next + fm.raw.slice(line.end));
  const expected = new Date(stamp).valueOf();
  assertOnlyChanged(fm.data, stamped, 'pubDate', (value) => value instanceof Date && value.valueOf() === expected);
  return stamped;
}

/**
 * @param {string} file path as git knows it (relative to `cwd`)
 * @param {{ cwd?: string }} [options] the repository to ask; default the current directory
 * @returns {Date | null} when the post went live according to git
 */
export function gitPublishTime(file, { cwd } = {}) {
  const fm = readFrontmatter(readFileSync(cwd ? join(cwd, file) : file, 'utf8'));
  const args =
    fm !== null && Object.hasOwn(fm.data, 'draft')
      ? ['log', '--reverse', '--format=%cI', '-G', DRAFT_FALSE_LINE, '--', file]
      : ['log', '--reverse', '--format=%cI', '--diff-filter=A', '--', file];
  const first = execFileSync('git', args, { encoding: 'utf8', cwd }).split('\n').find(Boolean);
  return first ? new Date(first) : null;
}

/**
 * Replace a file by writing a sibling and renaming it over it, so a crash mid-write never
 * leaves half a post (rename is atomic on one filesystem).
 * @param {string} file @param {string} text
 */
export function writeFileAtomic(file, text) {
  const temp = `${file}.stamp-tmp`;
  writeFileSync(temp, text);
  renameSync(temp, file);
}

function postFiles(dir) {
  return readdirSync(dir)
    .filter((name) => POST_FILE.test(name))
    .sort()
    .map((name) => join(dir, name));
}

/**
 * Read every post; collect the ones that need a time, and every file that cannot be read.
 * @returns {{ pending: { file: string, text: string, day: string }[], errors: string[] }}
 */
function survey(dir) {
  const pending = [];
  const heroes = [];
  const errors = [];
  for (const file of postFiles(dir)) {
    const text = readFileSync(file, 'utf8');
    try {
      const day = dateOnlyPubDate(text);
      if (day !== null) pending.push({ file, text, day });
      const hero = heroProblem(text, basename(file).replace(POST_FILE, ''));
      if (hero !== null) heroes.push(`${file}: ${hero}`);
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
    }
  }
  return { pending, heroes, errors };
}

export function main(argv, { postsDir = POSTS_DIR, heroesDir = HEROES_DIR, now = new Date(), publishTime = gitPublishTime } = {}) {
  const check = argv.includes('--check');
  const { pending, heroes, errors } = survey(postsDir);
  if (check && existsSync(heroesDir)) {
    heroes.push(`${heroesDir}/: heroes live on R2, never in the repository (ADR 0020); upload each image as POST.md §3 says and remove the folder`);
  }

  if (errors.length > 0) {
    console.error(`${check ? 'check:times' : 'stamp'}: these posts cannot be read; fix them first (nothing was changed):`);
    for (const error of errors) console.error(`  ${error}`);
    return 1;
  }

  if (check) {
    if (pending.length === 0 && heroes.length === 0) {
      console.log('check:times: every published post has a publish time and its hero on the media host.');
      return 0;
    }
    if (pending.length > 0) {
      console.error('check:times: these published posts have a date but no time. Run `npm run stamp` and commit:');
      for (const { file } of pending) console.error(`  ${file}`);
    }
    if (heroes.length > 0) {
      console.error('check:times: these published posts have a hero image the site cannot serve:');
      for (const hero of heroes) console.error(`  ${hero}`);
    }
    return 1;
  }

  // Compute every new text before writing any, so a post that cannot be stamped changes nothing.
  const planned = [];
  try {
    for (const { file, text, day } of pending) {
      const { value, exact } = chooseStamp(day, publishTime(file) ?? now);
      planned.push({ file, value, exact, text: withStamp(text, value) });
    }
  } catch (error) {
    console.error(`stamp: ${pending[planned.length].file}: ${error.message} (nothing was changed)`);
    return 1;
  }
  for (const { file, value, text } of planned) {
    writeFileAtomic(file, text);
    console.log(`stamped ${file}: ${value}`);
  }
  if (planned.length === 0) console.log('stamp: nothing to do.');
  const inexact = planned.filter((p) => !p.exact).map((p) => p.file);
  if (inexact.length > 0) {
    console.warn('stamp: these went live on a different day than their pubDate, so they keep 00:00 UTC. Set the real time by hand:');
    for (const file of inexact) console.warn(`  ${file}`);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
