#!/usr/bin/env node
/**
 * The publisher path guard (phase 2 plan D12, ADR 0006): the desk's publisher may add, change or
 * delete `src/content/comments/<slug>.json` and nothing else.
 *
 *   node scripts/check-publisher-paths.mjs --files <pr-files.json> --modes <head-modes.txt>
 *
 *   PR_AUTHOR         the pull request author's login (github.event.pull_request.user.login)
 *   PUBLISHER_LOGIN   the publisher's login, e.g. `<app-slug>[bot]` (repository variable);
 *                     empty or unset means every pull request is held to the rule
 *   PR_CHANGED_FILES  the pull request's changed-file count (github.event.pull_request.changed_files),
 *                     so a list the API cut short is refused rather than half-checked
 *
 * `--files` is the GitHub API's pull request files list (`gh api .../pulls/<n>/files --paginate
 * --slurp`): an array of pages, each an array of `{ filename, status, previous_filename }`.
 * `--modes` is `git ls-tree -r -z <head sha>` over the pull request's head tree, fetched but never
 * checked out: it says whether each path is a plain file, an executable, a symlink or a submodule.
 *
 * `.github/workflows/check-publisher-pr.yml` runs this on every pull request into main, from
 * main's own copy of this file (`pull_request_target`), and it is a required check in the branch
 * ruleset. The rules:
 *   - the author is the publisher (or no publisher login is configured): every changed path must
 *     be `src/content/comments/<slug>.json` — not nested, not another name or extension, not a
 *     path outside the directory; a rename must start and end inside; a deletion is allowed (that
 *     is how a thread empties); an added or changed file must be a plain, non-executable file
 *     (mode 100644): no symlink, no submodule, no executable bit;
 *   - the author is anyone else: nothing to enforce, the maintainer reviews the pull request.
 * Exit 0 when the pull request passes, 1 when it does not, 2 on bad input.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SLUG } from './frontmatter.mjs';

/** The one directory the publisher may write into. */
export const PUBLISHER_LANE = 'src/content/comments/';

/** `src/content/comments/<slug>.json`, and only that: the slug rule is the posts' (`scripts/frontmatter.mjs`). */
export const COMMENT_FILE_PATH = new RegExp(`^${PUBLISHER_LANE.replace(/[/.]/g, '\\$&')}${SLUG.source.slice(1, -1)}\\.json$`);

/** git tree entry modes. Only a plain file may be added or changed. */
export const MODE_FILE = '100644';
const MODE_NAMES = {
  [MODE_FILE]: 'a plain file',
  '100755': 'an executable',
  '120000': 'a symbolic link',
  '160000': 'a submodule',
};

/** The GitHub API's file statuses that keep a file in the head tree. `removed` is the other one. */
const PRESENT_STATUSES = new Set(['added', 'modified', 'renamed', 'copied', 'changed', 'unchanged']);

/** @param {unknown} path @returns {boolean} whether `path` is a comment data file in the publisher's lane */
export function inPublisherLane(path) {
  return typeof path === 'string' && COMMENT_FILE_PATH.test(path);
}

/**
 * Whether the path rules apply to this pull request. With no configured publisher login every
 * pull request is checked (fail safe); with one, only the publisher's own.
 * @param {{ author?: string, publisherLogin?: string }} options
 */
export function enforcedFor({ author, publisherLogin }) {
  const login = (publisherLogin ?? '').trim().toLowerCase();
  if (!login) return true;
  return (author ?? '').trim().toLowerCase() === login;
}

/**
 * The problems with one changed file. Pure.
 * @param {{ filename?: unknown, status?: unknown, previous_filename?: unknown }} file one entry of the API's files list
 * @param {Map<string, string>} modes path → mode in the pull request's head tree
 * @returns {string[]} each naming the file; empty when the change is one the publisher may make
 */
export function fileProblems(file, modes) {
  const { filename, status, previous_filename: previous } = file;
  if (typeof filename !== 'string' || filename === '') return ['a changed file has no name'];
  const problems = [];
  if (!inPublisherLane(filename)) {
    problems.push(`${filename}: outside the publisher's lane; only ${PUBLISHER_LANE}<slug>.json may change`);
  }
  if (status === 'removed') return problems;
  if (status === 'renamed' && !inPublisherLane(previous)) {
    problems.push(`${filename}: renamed from ${typeof previous === 'string' ? previous : '(unknown)'}, which is outside the publisher's lane`);
  }
  if (!PRESENT_STATUSES.has(status)) {
    problems.push(`${filename}: unknown change status ${JSON.stringify(status)}`);
  }
  const mode = modes.get(filename);
  if (mode === undefined) {
    problems.push(`${filename}: not in the pull request's head tree, so its mode cannot be checked`);
  } else if (mode !== MODE_FILE) {
    problems.push(`${filename}: is ${MODE_NAMES[mode] ?? `mode ${mode}`} (${mode}); only a plain file (${MODE_FILE}) may be added or changed`);
  }
  return problems;
}

/**
 * The verdict on a pull request. Pure.
 * @param {{ author?: string, publisherLogin?: string, files: object[], modes: Map<string, string>, changedFiles?: number }} input
 * @returns {{ enforced: boolean, problems: string[] }}
 */
export function checkPullRequest({ author, publisherLogin, files, modes, changedFiles }) {
  if (!enforcedFor({ author, publisherLogin })) return { enforced: false, problems: [] };
  const problems = [];
  if (changedFiles !== undefined && changedFiles !== files.length) {
    problems.push(`the API listed ${files.length} changed files but the pull request changes ${changedFiles}; refusing to check a partial list`);
  }
  for (const file of files) problems.push(...fileProblems(file, modes));
  return { enforced: true, problems };
}

/**
 * The API's files list: a flat array of file entries, or (from `--paginate --slurp`) an array of
 * pages. Anything else is a broken input, never an empty pull request.
 * @param {string} text
 * @returns {object[]}
 */
export function parsePullRequestFiles(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('the files list must be a JSON array');
  const files = data.every(Array.isArray) ? data.flat(1) : data;
  for (const file of files) {
    if (file === null || typeof file !== 'object' || Array.isArray(file)) throw new Error('every entry of the files list must be an object');
  }
  return files;
}

/**
 * `git ls-tree -r -z <tree>`: `<mode> <type> <object>\t<path>` entries, NUL-terminated. Paths are
 * bytes as git stores them; a path with a newline or a tab survives because of `-z`.
 * @param {string} text
 * @returns {Map<string, string>} path → mode
 */
export function parseHeadModes(text) {
  const modes = new Map();
  for (const entry of text.split('\0')) {
    if (entry === '') continue;
    const match = /^([0-7]{6}) (\S+) ([0-9a-f]+)\t([^]+)$/.exec(entry);
    if (!match) throw new Error(`unreadable ls-tree entry: ${JSON.stringify(entry)}`);
    modes.set(match[4], match[1]);
  }
  return modes;
}

const USAGE = 'usage: check-publisher-paths.mjs --files <pr-files.json> --modes <head-modes.txt>  (env: PR_AUTHOR, PUBLISHER_LOGIN, PR_CHANGED_FILES)';

/**
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} env
 * @returns {number} the exit code
 */
export function main(argv, env = process.env) {
  const options = { files: undefined, modes: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i + 1];
    if ((argv[i] === '--files' || argv[i] === '--modes') && value !== undefined) {
      options[argv[i].slice(2)] = value;
      i += 1;
    } else {
      console.error(`check:publisher: unexpected argument ${argv[i]}\n${USAGE}`);
      return 2;
    }
  }
  if (!options.files || !options.modes) {
    console.error(`check:publisher: ${USAGE}`);
    return 2;
  }
  const changedFilesRaw = (env.PR_CHANGED_FILES ?? '').trim();
  const changedFiles = changedFilesRaw === '' ? undefined : Number(changedFilesRaw);
  if (changedFiles !== undefined && !Number.isInteger(changedFiles)) {
    console.error(`check:publisher: PR_CHANGED_FILES must be a whole number, not ${JSON.stringify(changedFilesRaw)}`);
    return 2;
  }
  let files;
  let modes;
  try {
    files = parsePullRequestFiles(readFileSync(options.files, 'utf8'));
    modes = parseHeadModes(readFileSync(options.modes, 'utf8'));
  } catch (error) {
    console.error(`check:publisher: cannot read the inputs: ${error.message}`);
    return 2;
  }

  const author = env.PR_AUTHOR ?? '';
  const publisherLogin = env.PUBLISHER_LOGIN ?? '';
  const { enforced, problems } = checkPullRequest({ author, publisherLogin, files, modes, changedFiles });
  if (!enforced) {
    console.log(`check:publisher: ${author || '(no author)'} is not the publisher (${publisherLogin}); nothing to enforce, the maintainer reviews this pull request.`);
    return 0;
  }
  const scope = publisherLogin
    ? `by the publisher ${publisherLogin}`
    : 'held to the publisher’s rule because PUBLISHER_LOGIN is not set';
  if (problems.length === 0) {
    console.log(`check:publisher: ${files.length} changed file${files.length === 1 ? '' : 's'} (${scope}), all ${PUBLISHER_LANE}<slug>.json.`);
    return 0;
  }
  console.error(`check:publisher: this pull request (${scope}) changes what the publisher may not:`);
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
