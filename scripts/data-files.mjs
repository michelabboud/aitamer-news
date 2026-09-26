/**
 * The shared half of `check-comments.mjs` and `check-reactions.mjs`: the rules every directory of
 * the desk's data files follows, with a directory's own words for its messages.
 *
 * The desk's publisher writes `src/content/<lane>/<slug>.json` (ADR 0006 for comments; the
 * reactions contract is `src/content/reaction-schema.ts`); a human only ever removes. These
 * checks catch what a schema cannot see, because they need the directory listing, the file name
 * and the posts directory:
 *   - every entry in the directory is `README.md` or a regular file named `<slug>.json` — lowercase
 *     slug, `.json` exactly. Anything else is a problem, named: a symbolic link (never followed,
 *     dangling or not), a folder (the build reads `*.json` in the directory and nowhere deeper: a
 *     nested file would be silently ignored), a pipe or socket, `x.JSON`, `x.jsonc`, `x.json.bak`,
 *     a dotfile;
 *   - the file parses as JSON, and its `slug` field equals the file name;
 *   - a post with that slug exists under src/content/posts/ (draft or not: a data file for a draft
 *     is the publisher's mistake to fix, but not an orphan). An orphan is a file for a post that
 *     was deleted or renamed; the publisher removes it, or a human deletes it.
 * Everything else about a file — every field and its rules — is the strict schema's job, at
 * `npm run build`. This module needs nothing but Node so the checks run before the build, on the
 * pull request, and name the file.
 */
import { lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SLUG } from './frontmatter.mjs';

/** The one file in a data directory that is not a data file. */
export const DATA_README = 'README.md';
const DATA_FILE = /\.json$/;
/** A data file's whole name: a slug (the same shape as the posts', from `frontmatter.mjs`) and `.json`, exactly. */
export const DATA_FILE_NAME = new RegExp(`${SLUG.source.replace(/\$$/, '')}\\.json$`);
const POST_FILE = /\.mdx?$/;

/**
 * @typedef {object} DataLane one directory of data files and the words its messages use
 * @property {string} dir the directory, relative to the repository root
 * @property {string} noun "comment" or "reaction": the files are "<noun> files"
 * @property {string} docs where the format is documented, e.g. "POST.md section 8"
 * @property {string} check the check's name at the start of its output, e.g. "check:comments"
 */

/**
 * The problems with one data file. Pure: no filesystem.
 * @param {DataLane} lane
 * @param {string} name the file name, e.g. `grok-4-7.json`
 * @param {string} text the file's contents
 * @param {Set<string>} postSlugs every post's slug (file name without extension), drafts included
 * @returns {string[]} problems, each naming the file; empty when the file belongs where it is
 */
export function dataFileProblems(lane, name, text, postSlugs) {
  const slug = name.replace(DATA_FILE, '');
  if (!SLUG.test(slug)) {
    return [`${name}: the file name is not a slug (lowercase letters, digits and hyphens, starting with a letter or digit)`];
  }
  const problems = [];
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    problems.push(`${name}: not valid JSON: ${error.message}`);
  }
  if (data !== undefined) {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      problems.push(`${name}: the file must be a JSON object`);
    } else if (data.slug !== slug) {
      problems.push(`${name}: its slug field is ${JSON.stringify(data.slug)} but the file is named ${JSON.stringify(slug)}; a ${lane.noun} file is named after its post`);
    }
  }
  if (!postSlugs.has(slug)) {
    problems.push(`${name}: no post src/content/posts/${slug}.md (or .mdx) exists; an orphan ${lane.noun} file is removed, never kept (${lane.docs})`);
  }
  return problems;
}

/**
 * Every post slug under `dir`, drafts included. Only files directly in the directory: a post in a
 * subfolder is already a `check:specimens` problem, and a data file for it must not pass here.
 * @param {string} dir
 * @returns {Set<string>}
 */
export function postSlugs(dir) {
  return new Set(
    readdirSync(dir)
      .filter((name) => POST_FILE.test(name) && statSync(join(dir, name)).isFile())
      .map((name) => name.replace(POST_FILE, '')),
  );
}

/**
 * Why one directory entry is not a data file, or `undefined` when it is one (or the README).
 * Decided from `lstat`, so a link is judged as a link and never followed.
 * @param {DataLane} lane
 * @param {string} name the entry's name
 * @param {import('node:fs').Stats} stat the entry's `lstat`
 * @param {string} dir the directory, for the message
 * @returns {string | undefined}
 */
export function dataEntryProblem(lane, name, stat, dir) {
  const files = `${lane.noun} files`;
  if (stat.isSymbolicLink()) return `${name}: a symbolic link; ${files} are regular files, and links are never followed`;
  if (stat.isDirectory()) return `${name}/: a folder; ${files} live directly in ${dir}, and the build ignores anything deeper`;
  if (!stat.isFile()) return `${name}: not a regular file (a pipe, a socket or a device); ${files} are regular files`;
  if (name === DATA_README || DATA_FILE_NAME.test(name)) return undefined;
  return `${name}: only ${DATA_README} and <slug>.json ${files} (lowercase slug, .json exactly) belong in ${dir}; the build ignores this entry`;
}

/**
 * Every data file under `dir`, and every entry that does not belong there. A missing directory
 * is zero files, not an error: the directory holds only a README until the desk publishes a first
 * file. A `dir` that exists and is not a directory is one problem.
 * @param {DataLane} lane
 * @param {string} dir
 * @returns {{ files: { name: string, text: string }[], problems: string[] }}
 */
export function loadDataFiles(lane, dir) {
  const files = [];
  const problems = [];
  let dirStat;
  try {
    dirStat = statSync(dir);
  } catch (error) {
    if (error.code === 'ENOENT') return { files, problems };
    throw error;
  }
  if (!dirStat.isDirectory()) {
    problems.push(`${dir}: not a directory; the ${lane.noun} files live in a directory of that name`);
    return { files, problems };
  }
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const problem = dataEntryProblem(lane, name, lstatSync(path), dir);
    if (problem !== undefined) {
      problems.push(problem);
    } else if (name !== DATA_README) {
      files.push({ name, text: readFileSync(path, 'utf8') });
    }
  }
  return { files, problems };
}

/**
 * Run one lane's check and print its verdict.
 * @param {DataLane} lane
 * @param {{ postsDir: string, dataDir: string }} dirs
 * @returns {number} the exit code
 */
export function checkDataFiles(lane, { postsDir, dataDir }) {
  const slugs = postSlugs(postsDir);
  const { files, problems } = loadDataFiles(lane, dataDir);
  for (const { name, text } of files) problems.push(...dataFileProblems(lane, name, text, slugs));
  if (problems.length === 0) {
    console.log(`${lane.check}: ${files.length} ${lane.noun} file${files.length === 1 ? '' : 's'}, each named after a post that exists.`);
    return 0;
  }
  console.error(`${lane.check}: fix these, then commit:`);
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
}
