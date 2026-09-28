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
 *
 * It also fails when two author files give one id (`x.md` and `x.mdx`, the only way left once the
 * collection's id is the file name, `src/content/author-id.ts`): Astro would only warn and keep
 * one of them (review of PR #46, B2). Author files are found as the collection's glob finds them,
 * nested ones included.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { authorEntryId } from '../src/content/author-id.ts';
import { fileURLToPath } from 'node:url';
import { FrontmatterError, readFrontmatter } from './frontmatter.mjs';
import { POSTS_DIR } from './stamp-post-times.mjs';

export const AUTHORS_DIR = 'src/content/authors';

const POST_FILE = /\.mdx?$/;
const AUTHOR_FILE = /\.mdx?$/;

/**
 * Every author file under `authorsDir`, as the collection's `**\/*.{md,mdx}` glob finds them,
 * with the id the collection gives each.
 * @returns {Map<string, string[]>} id → the files (relative, `/`-separated) that give it
 */
export function authorFiles(authorsDir = AUTHORS_DIR) {
  const byId = new Map();
  for (const entry of readdirSync(authorsDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !AUTHOR_FILE.test(entry.name)) continue;
    const file = relative(authorsDir, join(entry.parentPath, entry.name)).split(sep).join('/');
    const id = authorEntryId({ entry: file });
    byId.set(id, [...(byId.get(id) ?? []), file].sort());
  }
  return byId;
}

/** The author ids that have a profile, as the collection names them (`src/content/author-id.ts`). */
export function authorIds(authorsDir = AUTHORS_DIR) {
  return new Set(authorFiles(authorsDir).keys());
}

/** A problem for every id more than one author file gives: the build would keep one and warn. */
export function duplicateAuthorIdProblems(authorsDir = AUTHORS_DIR) {
  return [...authorFiles(authorsDir)]
    .filter(([, files]) => files.length > 1)
    .map(([id, files]) => `the author id "${id}" is given by more than one file (${files.join(', ')}); the build would keep only one`);
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
  const problems = [...duplicateAuthorIdProblems(authorsDir), ...authorProblems({ postsDir, authorsDir })];
  for (const problem of problems) console.error(`check-authors: ${problem}`);
  return problems.length === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main();
}
