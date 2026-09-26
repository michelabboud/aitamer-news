#!/usr/bin/env node
/**
 * Check that every post's `author` names an author profile (part of `npm run check:posts`).
 *
 *   node scripts/check-authors.mjs   exit 1 when a post names an author with no file under src/content/authors/
 *
 * Why this exists: `author` is a content reference. Measured on 2026-09-27 (posts MCP task B2, on the
 * real site): with an unknown author, neither `astro sync` nor `astro build` fails. Both log
 * `[ERROR] Invalid content reference` and exit 0, and the build silently drops the post, so a deploy
 * would succeed without it. The strict schema still owns every other rule about the field; this
 * check only closes that silent gap, for drafts and published posts alike.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrontmatterError, readFrontmatter } from './frontmatter.mjs';
import { POSTS_DIR } from './stamp-post-times.mjs';

export const AUTHORS_DIR = 'src/content/authors';

const POST_FILE = /\.mdx?$/;
const AUTHOR_FILE = /^(.+)\.mdx?$/;

/** The author ids that have a profile: the file names under `authorsDir`, without `.md`/`.mdx`. */
export function authorIds(authorsDir = AUTHORS_DIR) {
  const ids = new Set();
  for (const name of readdirSync(authorsDir)) {
    const match = AUTHOR_FILE.exec(name);
    if (match) ids.add(match[1]);
  }
  return ids;
}

/**
 * The problem with one post's author, or null. A post with no frontmatter or no `author` field is
 * left to the schema, which requires the field; this check only judges a value that is present.
 * @param {string} name the post's file name
 * @param {string} text the post's contents
 * @param {Set<string>} ids
 */
export function authorProblem(name, text, ids) {
  let frontmatter;
  try {
    frontmatter = readFrontmatter(text);
  } catch (error) {
    if (error instanceof FrontmatterError) return `${name}: ${error.message}`;
    throw error;
  }
  if (!frontmatter || !('author' in frontmatter.data)) return null;
  const author = frontmatter.data.author;
  if (typeof author !== 'string') return `${name}: author must be an author id (a string), not ${JSON.stringify(author)}`;
  if (!ids.has(author)) {
    return `${name}: author "${author}" has no profile in ${AUTHORS_DIR}/ (known: ${[...ids].sort().join(', ')}); the build would drop this post without failing`;
  }
  return null;
}

/** Every author problem across the posts directory, in file-name order. */
export function authorProblems({ postsDir = POSTS_DIR, authorsDir = AUTHORS_DIR } = {}) {
  const ids = authorIds(authorsDir);
  const problems = [];
  for (const name of readdirSync(postsDir).sort()) {
    if (!POST_FILE.test(name)) continue;
    const problem = authorProblem(name, readFileSync(join(postsDir, name), 'utf8'), ids);
    if (problem) problems.push(problem);
  }
  return problems;
}

export function main({ postsDir = POSTS_DIR, authorsDir = AUTHORS_DIR } = {}) {
  if (!existsSync(authorsDir)) {
    console.error(`check-authors: ${authorsDir} does not exist`);
    return 1;
  }
  const problems = authorProblems({ postsDir, authorsDir });
  for (const problem of problems) console.error(`check-authors: ${problem}`);
  return problems.length === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main();
}
