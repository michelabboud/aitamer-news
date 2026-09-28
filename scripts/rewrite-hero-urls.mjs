#!/usr/bin/env node
/**
 * Point every post's `heroImage` at the media host (plan 2026-09-25-comments-and-r2-media §7.4 step 3; ADR 0020).
 *
 *   node scripts/rewrite-hero-urls.mjs           rewrite `heroImage: /heroes/<slug>.jpg` to `https://media.aitamer.news/heroes/<slug>.jpg`
 *   node scripts/rewrite-hero-urls.mjs --check   list what would change, write nothing (exit 1 when anything would)
 *
 * Run it only after `npm run check:media -- --local public/heroes` reports every hero on the media host with
 * matching bytes: this script trusts that the upload happened and does not look at the network.
 *
 * The edit is the one the stampers make (scripts/frontmatter.mjs): the `heroImage` line of the raw block is
 * replaced by index, the whole file is re-parsed with the same reader Astro agrees with, and every other field
 * must come back identical, or nothing is written. Bodies are never touched. A post whose `heroImage` names
 * another post's file (`/heroes/<other>.jpg`), or any value that is neither the old path nor the new URL of its
 * own slug, is refused: moving it would publish an image the upload never checked for this post. Every file is
 * planned before any is written, so one refusal changes nothing. Running it twice is a no-op.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { heroUrl } from '../src/lib/media.ts';
import { assertOnlyChanged, readFrontmatter, topLevelLine, withRaw } from './frontmatter.mjs';
import { POSTS_DIR, writeFileAtomic } from './stamp-post-times.mjs';

const POST_FILE = /\.mdx?$/;

/** @param {string} slug @returns {string} the pre-migration, repo-relative hero path */
export const legacyHeroPath = (slug) => `/heroes/${slug}.jpg`;

/** @param {string} file @returns {string} the post's slug: its file name without the extension */
export const slugOf = (file) => basename(file).replace(POST_FILE, '');

/**
 * @param {string} text whole post file
 * @param {string} slug the post's slug (its file name)
 * @returns {string | null} the rewritten file, or null when there is nothing to do (no hero, or already moved)
 * @throws {Error} when the hero is not this post's own `/heroes/<slug>.jpg`, or the edit would change anything else
 */
export function withMediaHero(text, slug) {
  const fm = readFrontmatter(text);
  if (fm === null || !Object.hasOwn(fm.data, 'heroImage')) return null;
  const value = fm.data.heroImage;
  const target = heroUrl(slug);
  if (value === target) return null;
  if (value !== legacyHeroPath(slug)) {
    throw new Error(`heroImage is ${JSON.stringify(value)}, not ${legacyHeroPath(slug)}: only a post's own hero is moved; fix it by hand`);
  }
  const line = topLevelLine(fm.raw, 'heroImage');
  // A plain `heroImage: /heroes/<slug>.jpg` line, nothing after it: any other spelling (quotes, a comment,
  // a flow mapping) is rare enough to do by hand and not worth a rewrite rule that could get it wrong.
  if (line === null || line.text !== `heroImage: ${legacyHeroPath(slug)}`) {
    throw new Error(`heroImage is not written as a plain \`heroImage: ${legacyHeroPath(slug)}\` line; fix it by hand`);
  }
  const next = withRaw(text, fm, fm.raw.slice(0, line.start) + `heroImage: ${target}` + fm.raw.slice(line.end));
  assertOnlyChanged(fm.data, next, 'heroImage', (after) => after === target);
  return next;
}

/**
 * @param {string[]} argv
 * @param {{ postsDir?: string }} [options]
 * @returns {number} exit code
 */
export function main(argv, { postsDir = POSTS_DIR } = {}) {
  const check = argv.includes('--check');
  const files = readdirSync(postsDir).filter((name) => POST_FILE.test(name)).sort().map((name) => join(postsDir, name));
  const planned = [];
  const errors = [];
  for (const file of files) {
    try {
      const next = withMediaHero(readFileSync(file, 'utf8'), slugOf(file));
      if (next !== null) planned.push({ file, text: next });
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
    }
  }
  if (errors.length > 0) {
    console.error('rewrite-hero-urls: these posts cannot be moved (nothing was changed):');
    for (const error of errors) console.error(`  ${error}`);
    return 1;
  }
  if (check) {
    for (const { file } of planned) console.log(`would rewrite ${file}`);
    console.log(`rewrite-hero-urls --check: ${planned.length} of ${files.length} post(s) would change.`);
    return planned.length === 0 ? 0 : 1;
  }
  for (const { file, text } of planned) {
    writeFileAtomic(file, text);
    console.log(`rewrote ${file}`);
  }
  console.log(`rewrite-hero-urls: ${planned.length} of ${files.length} post(s) rewritten.`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
