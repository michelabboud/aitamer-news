#!/usr/bin/env node
/**
 * Check the reactions data files against the posts (part of `npm run check:posts`).
 *
 *   node scripts/check-reactions.mjs   exit 1 when a reactions file has no post, or is not what it says it is
 *
 * The desk's publisher writes `src/content/reactions/<slug>.json`, one per post whose reactions
 * add up to more than zero; a human only ever removes. The same rules as the comment files, from
 * `./data-files.mjs`: every entry is `README.md` or a regular `<slug>.json`, the file parses as
 * JSON, its `slug` field is its name, and a post with that slug exists. Every field and its rules
 * are the strict schema's job, at `npm run build` (src/content/reaction-schema.ts).
 */
import { fileURLToPath } from 'node:url';
import { checkDataFiles, dataEntryProblem, dataFileProblems, loadDataFiles } from './data-files.mjs';
import { POSTS_DIR } from './stamp-post-times.mjs';

export const REACTIONS_DIR = 'src/content/reactions';

/**
 * The largest reactions file the check accepts: 8 KiB. The largest file the contract allows —
 * 64 ids of 24 characters, each with a count of 9,007,199,254,740,991, and a 120-character slug —
 * is 5,358 bytes as the publisher writes it (two-space indent) and 6,646 bytes with a four-space
 * indent; `check-reactions.test.mjs` builds it and proves it fits. So the cap never refuses a
 * valid file, and a file past it is refused by size alone, before it is read.
 */
export const REACTION_FILE_MAX_BYTES = 8 * 1024;

/** @type {import('./data-files.mjs').DataLane} */
export const REACTIONS_LANE = Object.freeze({
  dir: REACTIONS_DIR,
  noun: 'reaction',
  docs: 'POST.md section 9',
  check: 'check:reactions',
  maxBytes: REACTION_FILE_MAX_BYTES,
});

/**
 * The problems with one reactions file. Pure: no filesystem.
 * @param {string} name @param {string} text @param {Set<string>} slugs every post's slug, drafts included
 * @returns {string[]}
 */
export function reactionFileProblems(name, text, slugs) {
  return dataFileProblems(REACTIONS_LANE, name, text, slugs);
}

/**
 * Why one directory entry is not a reactions file, or `undefined` when it is one (or the README).
 * @param {string} name @param {import('node:fs').Stats} stat the entry's `lstat` @param {string} dir
 * @returns {string | undefined}
 */
export function entryProblem(name, stat, dir) {
  return dataEntryProblem(REACTIONS_LANE, name, stat, dir);
}

/**
 * Every reactions file under `dir`, and every entry that does not belong there.
 * @param {string} dir
 * @returns {{ files: { name: string, text: string }[], problems: string[] }}
 */
export function loadReactionFiles(dir) {
  return loadDataFiles(REACTIONS_LANE, dir);
}

/**
 * @param {string[]} _argv no options today; kept for symmetry with the other checks
 * @param {{ postsDir?: string, reactionsDir?: string }} [options]
 * @returns {number} the exit code
 */
export function main(_argv, { postsDir = POSTS_DIR, reactionsDir = REACTIONS_DIR } = {}) {
  return checkDataFiles(REACTIONS_LANE, { postsDir, dataDir: reactionsDir });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
