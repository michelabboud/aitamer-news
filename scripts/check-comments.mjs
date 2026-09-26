#!/usr/bin/env node
/**
 * Check the comment data files against the posts (part of `npm run check:posts`).
 *
 *   node scripts/check-comments.mjs   exit 1 when a comment file has no post, or is not what it says it is
 *
 * The desk's publisher writes `src/content/comments/<slug>.json` (ADR 0006); a human only ever
 * removes. The rules — what belongs in the directory, the file parses, its `slug` is its name, its
 * post exists — are shared with the reactions check and live in `./data-files.mjs`; this file
 * binds them to the comment directory and keeps the names the rest of the repository imports.
 * Everything else about a file — every field and its rules — is the strict schema's job, at
 * `npm run build` (src/content/comment-schema.ts).
 */
import { fileURLToPath } from 'node:url';
import { DATA_FILE_NAME, DATA_README, checkDataFiles, dataEntryProblem, dataFileProblems, loadDataFiles, postSlugs } from './data-files.mjs';
import { POSTS_DIR } from './stamp-post-times.mjs';

export const COMMENTS_DIR = 'src/content/comments';
/** The one file in the directory that is not a comment file. */
export const COMMENTS_README = DATA_README;
/** A comment file's whole name: a slug (the same shape as the posts', from `frontmatter.mjs`) and `.json`, exactly. */
export const COMMENT_FILE_NAME = DATA_FILE_NAME;

/** @type {import('./data-files.mjs').DataLane} */
export const COMMENTS_LANE = Object.freeze({ dir: COMMENTS_DIR, noun: 'comment', docs: 'POST.md section 8', check: 'check:comments' });

export { postSlugs };

/**
 * The problems with one comment file. Pure: no filesystem.
 * @param {string} name the file name, e.g. `grok-4-7.json`
 * @param {string} text the file's contents
 * @param {Set<string>} slugs every post's slug (file name without extension), drafts included
 * @returns {string[]} problems, each naming the file; empty when the file belongs where it is
 */
export function commentFileProblems(name, text, slugs) {
  return dataFileProblems(COMMENTS_LANE, name, text, slugs);
}

/**
 * Why one directory entry is not a comment file, or `undefined` when it is one (or the README).
 * @param {string} name @param {import('node:fs').Stats} stat the entry's `lstat` @param {string} dir
 * @returns {string | undefined}
 */
export function entryProblem(name, stat, dir) {
  return dataEntryProblem(COMMENTS_LANE, name, stat, dir);
}

/**
 * Every comment file under `dir`, and every entry that does not belong there.
 * @param {string} dir
 * @returns {{ files: { name: string, text: string }[], problems: string[] }}
 */
export function loadCommentFiles(dir) {
  return loadDataFiles(COMMENTS_LANE, dir);
}

/**
 * @param {string[]} _argv no options today; kept for symmetry with the other checks
 * @param {{ postsDir?: string, commentsDir?: string }} [options]
 * @returns {number} the exit code
 */
export function main(_argv, { postsDir = POSTS_DIR, commentsDir = COMMENTS_DIR } = {}) {
  return checkDataFiles(COMMENTS_LANE, { postsDir, dataDir: commentsDir });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
