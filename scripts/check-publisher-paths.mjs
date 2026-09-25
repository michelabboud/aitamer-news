#!/usr/bin/env node
/**
 * The publisher path guard (phase 2 plan D12, ADR 0006): the desk's publisher may add, change or
 * delete `src/content/comments/<slug>.json` and nothing else.
 *
 *   node scripts/check-publisher-paths.mjs pr --base <sha> --head <sha>
 *     PR_ACTION        github.event.action (opened, synchronize, reopened, edited)
 *     PR_AUTHOR_ID     github.event.pull_request.user.id
 *     EVENT_SENDER_ID  github.event.sender.id
 *     MAINTAINER_ID    the maintainer's numeric account id (repository variable)
 *
 *   node scripts/check-publisher-paths.mjs push --before <sha> --after <sha>
 *     always enforced: the deploy runs it when the pusher is the publisher
 *
 * Both modes read git objects that are already in the clone in the current directory, and never
 * check anything out: the changes come from `git diff --name-status -z -M`, the modes from
 * `git ls-tree -r -z` at the one commit being judged. For a pull request the diff runs from the
 * merge base of the base and head commits (what GitHub shows as the pull request's changes); for
 * a push it runs from `before` to `after`. Git runs through `execFileSync` with an argument list,
 * never a shell, and every commit id is checked to be hexadecimal first.
 *
 * Who is held to the rule (pull requests): EVERYONE, unless the pull request's author and the
 * event's sender are both the maintainer, compared by numeric account id (logins can be renamed
 * and re-registered; ids cannot), and the event is `opened` or `synchronize`, the two whose
 * sender is the one who put the head there. An `edited` or `reopened` event's sender only
 * touched the pull request's title, base or state, not its commits, so it never exempts: someone
 * else (the publisher, say) may have pushed the head. An unset, empty or non-numeric
 * `MAINTAINER_ID` exempts nobody.
 *
 * The rule: every changed path must be `src/content/comments/<slug>.json` — not nested, not
 * another name or extension, not a path outside the directory; a rename must start and end
 * inside; a deletion is allowed (that is how a thread empties); an added or changed file must be
 * a plain, non-executable file (mode 100644): no symlink, no submodule, no executable bit.
 *
 * `.github/workflows/check-publisher-pr.yml` runs the `pr` mode from main's own copy of this file
 * (`pull_request_target`), as the required check `publisher-paths`; `.github/workflows/deploy-pages.yml`
 * runs the `push` mode, from the copy in the commit before the push, when the publisher pushed.
 * Exit 0 when the change passes, 1 when it does not (or cannot be judged), 2 on bad usage.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SLUG } from './slug.mjs';

/** The one directory the publisher may write into. */
export const PUBLISHER_LANE = 'src/content/comments/';

/** `src/content/comments/<slug>.json`, and only that: the slug rule is the posts' (`scripts/slug.mjs`). */
export const COMMENT_FILE_PATH = new RegExp(`^${PUBLISHER_LANE.replace(/[/.]/g, '\\$&')}${SLUG.source.slice(1, -1)}\\.json$`);

/** git tree entry modes. Only a plain file may be added or changed. */
export const MODE_FILE = '100644';
const MODE_NAMES = {
  [MODE_FILE]: 'a plain file',
  '100755': 'an executable',
  '120000': 'a symbolic link',
  '160000': 'a submodule',
};

/** Pull request events whose sender is the one who put the head commit there. */
export const EXEMPTING_ACTIONS = new Set(['opened', 'synchronize']);

/** A GitHub account id: a positive whole number, kept as a string so no precision is lost. */
const ACCOUNT_ID = /^[1-9][0-9]*$/;
/** A full commit id: SHA-1 or SHA-256, lowercase hexadecimal. */
const OBJECT_ID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
/** The id a push event carries as `before` when there was no previous commit. */
const NULL_OBJECT_ID = /^0+$/;

/** `git diff --name-status` letters that leave a file in the new tree. `D` is the other kept one. */
const PRESENT_STATUSES = new Set(['A', 'M', 'R', 'C', 'T']);
const STATUS_TOKEN = /^([A-Z])([0-9]{0,3})$/;
/** Output larger than this is not a comment batch; git's output is refused rather than truncated. */
const GIT_MAX_BUFFER = 256 * 1024 * 1024;

/** A problem with the inputs that means the change cannot be judged: it fails, never passes. */
export class UnjudgeableError extends Error {}

/** @param {unknown} path @returns {boolean} whether `path` is a comment data file in the publisher's lane */
export function inPublisherLane(path) {
  return typeof path === 'string' && COMMENT_FILE_PATH.test(path);
}

/** @param {unknown} value @returns {string | null} the trimmed account id, or null when it is not one */
export function accountId(value) {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  return ACCOUNT_ID.test(text) ? text : null;
}

/**
 * Whether the path rules apply to this pull request event, and why. Pure.
 * @param {{ action?: string, authorId?: string, senderId?: string, maintainerId?: string }} event
 * @returns {{ enforced: boolean, reason: string }}
 */
export function pullRequestScope({ action, authorId, senderId, maintainerId }) {
  if ((maintainerId ?? '').trim() === '') return { enforced: true, reason: 'MAINTAINER_ID is not set, so every pull request is held to the rule' };
  const maintainer = accountId(maintainerId);
  if (maintainer === null) return { enforced: true, reason: 'MAINTAINER_ID is not a numeric account id, so every pull request is held to the rule' };
  if (accountId(authorId) !== maintainer) return { enforced: true, reason: 'the author is not the maintainer' };
  if (accountId(senderId) !== maintainer) return { enforced: true, reason: 'the maintainer’s pull request, but this event’s sender is someone else' };
  if (!EXEMPTING_ACTIONS.has(action ?? '')) {
    return { enforced: true, reason: `a ${JSON.stringify(action ?? '')} event does not show who pushed the head, so it exempts nobody` };
  }
  return { enforced: false, reason: `the author and this event’s sender are both the maintainer (account ${maintainer})` };
}

/**
 * `git diff --name-status -z`: `<status>\0<path>\0`, or for a rename or copy
 * `<R|C><score>\0<from>\0<to>\0`. Paths are as git stores them; `-z` keeps tabs and newlines.
 * @param {string} text
 * @returns {{ status: string, path: string, from?: string }[]}
 */
export function parseNameStatus(text) {
  const tokens = text.split('\0');
  if (tokens.at(-1) === '') tokens.pop();
  const changes = [];
  for (let i = 0; i < tokens.length; ) {
    const match = STATUS_TOKEN.exec(tokens[i]);
    if (!match) throw new UnjudgeableError(`unreadable diff status ${JSON.stringify(tokens[i])}`);
    const status = match[1];
    const width = status === 'R' || status === 'C' ? 2 : 1;
    const paths = tokens.slice(i + 1, i + 1 + width);
    if (paths.length !== width || paths.some((path) => path === '')) {
      throw new UnjudgeableError(`diff entry ${JSON.stringify(tokens[i])} is missing its path`);
    }
    changes.push(width === 2 ? { status, from: paths[0], path: paths[1] } : { status, path: paths[0] });
    i += 1 + width;
  }
  return changes;
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
    if (!match) throw new UnjudgeableError(`unreadable ls-tree entry: ${JSON.stringify(entry)}`);
    modes.set(match[4], match[1]);
  }
  return modes;
}

/**
 * The problems with one changed file. Pure.
 * @param {{ status: string, path: string, from?: string }} change one entry of `parseNameStatus`
 * @param {Map<string, string>} modes path → mode in the tree being judged
 * @returns {string[]} each naming the file; empty when the change is one the publisher may make
 */
export function fileProblems(change, modes) {
  const { status, path, from } = change;
  if (typeof path !== 'string' || path === '') return ['a changed file has no name'];
  const problems = [];
  if (!inPublisherLane(path)) {
    problems.push(`${path}: outside the publisher's lane; only ${PUBLISHER_LANE}<slug>.json may change`);
  }
  if (status === 'D') return problems;
  if (status === 'R' && !inPublisherLane(from)) {
    problems.push(`${path}: renamed from ${typeof from === 'string' ? from : '(unknown)'}, which is outside the publisher's lane`);
  }
  if (!PRESENT_STATUSES.has(status)) {
    problems.push(`${path}: unexpected change status ${JSON.stringify(status)}`);
  }
  const mode = modes.get(path);
  if (mode === undefined) {
    problems.push(`${path}: not in the tree being checked, so its mode cannot be checked`);
  } else if (mode !== MODE_FILE) {
    problems.push(`${path}: is ${MODE_NAMES[mode] ?? `mode ${mode}`} (${mode}); only a plain file (${MODE_FILE}) may be added or changed`);
  }
  return problems;
}

/**
 * Every problem with a set of changes. Pure.
 * @param {{ changes: { status: string, path: string, from?: string }[], modes: Map<string, string> }} input
 * @returns {string[]}
 */
export function changeProblems({ changes, modes }) {
  return changes.flatMap((change) => fileProblems(change, modes));
}

/** @param {string} cwd @param {string[]} args @returns {string} git's stdout */
function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const stderr = typeof error.stderr === 'string' ? error.stderr.trim() : '';
    throw new UnjudgeableError(`git ${args[0]} failed${stderr ? `: ${stderr}` : ''}`);
  }
}

/** @param {string} name @param {unknown} value @returns {string} the commit id, validated */
function objectId(name, value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!OBJECT_ID.test(text)) throw new UnjudgeableError(`${name} must be a full lowercase commit id, not ${JSON.stringify(value)}`);
  return text;
}

/** @param {string} cwd @param {string} id @returns {string} `id`, once git confirms the commit is in the clone */
function requireCommit(cwd, id) {
  git(cwd, ['cat-file', '-e', `${id}^{commit}`]);
  return id;
}

/**
 * The changes from `from` to `to` and the modes of `to`'s tree, read from the clone at `cwd`.
 * @param {string} cwd @param {string} from @param {string} to
 */
function collect(cwd, from, to) {
  const changes = parseNameStatus(git(cwd, ['diff', '--name-status', '-z', '-M', '--no-relative', from, to, '--']));
  const modes = parseHeadModes(git(cwd, ['ls-tree', '-r', '-z', '--full-tree', to]));
  return { changes, modes };
}

/**
 * A pull request's changes: from the merge base of `base` and `head` to `head`, as GitHub shows
 * them, so commits that landed on main after the branch was cut are not counted as the branch's.
 * @param {{ cwd: string, base: string, head: string }} input
 */
export function collectPullRequest({ cwd, base, head }) {
  const baseId = requireCommit(cwd, objectId('--base', base));
  const headId = requireCommit(cwd, objectId('--head', head));
  const mergeBase = git(cwd, ['merge-base', baseId, headId]).trim();
  if (!OBJECT_ID.test(mergeBase)) throw new UnjudgeableError(`the base and head have no merge base (${JSON.stringify(mergeBase)})`);
  return collect(cwd, mergeBase, headId);
}

/**
 * A push's changes: from `before` to `after`. A push with no `before` (all zeros: a new branch)
 * or a `before` that is not in the clone cannot be judged, so it fails.
 * @param {{ cwd: string, before: string, after: string }} input
 */
export function collectPush({ cwd, before, after }) {
  if (typeof before === 'string' && NULL_OBJECT_ID.test(before.trim())) {
    throw new UnjudgeableError('the push has no previous commit (before is all zeros), so what it changed cannot be told');
  }
  const beforeId = objectId('--before', before);
  const afterId = objectId('--after', after);
  try {
    requireCommit(cwd, beforeId);
  } catch (error) {
    throw new UnjudgeableError(`the commit before the push, ${beforeId}, is not in this clone (${error.message})`);
  }
  requireCommit(cwd, afterId);
  return collect(cwd, beforeId, afterId);
}

const USAGE = [
  'usage: check-publisher-paths.mjs pr --base <sha> --head <sha>   (env: PR_ACTION, PR_AUTHOR_ID, EVENT_SENDER_ID, MAINTAINER_ID)',
  '       check-publisher-paths.mjs push --before <sha> --after <sha>',
].join('\n');

const MODE_OPTIONS = { pr: ['base', 'head'], push: ['before', 'after'] };

/** @param {string[]} argv @returns {{ mode: string, options: Record<string, string> } | null} */
function parseArgs(argv) {
  const [mode, ...rest] = argv;
  const names = MODE_OPTIONS[mode];
  if (!names) return null;
  const options = {};
  for (let i = 0; i < rest.length; i += 2) {
    const name = rest[i]?.startsWith('--') ? rest[i].slice(2) : '';
    const value = rest[i + 1];
    if (!names.includes(name) || value === undefined || name in options) return null;
    options[name] = value;
  }
  return names.every((name) => name in options) ? { mode, options } : null;
}

/**
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} env
 * @param {string} cwd the clone to read
 * @returns {number} the exit code
 */
export function main(argv, env = process.env, cwd = process.cwd()) {
  const parsed = parseArgs(argv);
  if (!parsed) {
    console.error(`check:publisher: ${USAGE}`);
    return 2;
  }
  const { mode, options } = parsed;
  let subject;
  let why;
  if (mode === 'pr') {
    const { enforced, reason } = pullRequestScope({
      action: env.PR_ACTION,
      authorId: env.PR_AUTHOR_ID,
      senderId: env.EVENT_SENDER_ID,
      maintainerId: env.MAINTAINER_ID,
    });
    if (!enforced) {
      console.log(`check:publisher: ${reason}; nothing to enforce.`);
      return 0;
    }
    subject = 'pull request';
    why = `held to the rule because ${reason}`;
  } else {
    subject = 'push';
    why = 'the pusher is the publisher';
  }

  let collected;
  try {
    collected = mode === 'pr'
      ? collectPullRequest({ cwd, base: options.base, head: options.head })
      : collectPush({ cwd, before: options.before, after: options.after });
  } catch (error) {
    if (!(error instanceof UnjudgeableError)) throw error;
    console.error(`check:publisher: this ${subject} cannot be judged, so it fails (${why}): ${error.message}`);
    return 1;
  }
  const problems = changeProblems(collected);
  const count = collected.changes.length;
  if (problems.length === 0) {
    console.log(`check:publisher: ${count} changed file${count === 1 ? '' : 's'} in this ${subject}, all ${PUBLISHER_LANE}<slug>.json (${why}).`);
    return 0;
  }
  console.error(`check:publisher: this ${subject} changes what the publisher may not (${why}):`);
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
