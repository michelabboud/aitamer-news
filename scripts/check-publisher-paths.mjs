#!/usr/bin/env node
/**
 * The publisher path guard (phase 2 plan D12, ADR 0006; widened to two lanes by ADR 0008): the
 * desk's publisher may add, change or delete `src/content/comments/<slug>.json` and
 * `src/content/reactions/<slug>.json`, and nothing else.
 *
 *   node scripts/check-publisher-paths.mjs pr --base <sha> --head <sha>
 *     PR_ACTION        github.event.action (opened, synchronize, reopened, edited)
 *     PR_AUTHOR_ID     github.event.pull_request.user.id
 *     EVENT_SENDER_ID  github.event.sender.id
 *     MAINTAINER_ID    the maintainer's numeric account id (repository variable)
 *     PR_HEAD_REF      github.event.pull_request.head.ref (the authors lane's branch)
 *     POSTS_ACTOR_ID   the posts App's numeric bot account id (repository variable)
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
 * The rule: every changed path must be `<lane><slug>.json` in one of the two lanes,
 * `src/content/comments/` and `src/content/reactions/` — not nested, not another name or
 * extension, not a path outside the directories; a rename git detects must start and end inside
 * **the same** lane (a comment file never becomes a reactions file, or the reverse). That last rule
 * is a tripwire, not a guarantee: git pairs a deletion and an addition as a rename only when the
 * two files are at least half alike, so a deletion in one lane plus a dissimilar addition in the
 * other is judged as two lane changes and passes — both are paths the publisher may write. What
 * holds each lane to its own shape is its contract, which the required check `check` enforces
 * (ADR 0008, amendment of 2026-09-26). A deletion is allowed
 * (that is how a thread empties, or a story's reactions go back to none); an added or changed file
 * must be a plain, non-executable file (mode 100644): no symlink, no submodule, no executable bit.
 *
 * The posts App's authors lane (ADR 0018), pull requests only: a pull request whose author AND
 * this event's sender are the posts App (numeric id, repository variable `POSTS_ACTOR_ID`, compared
 * as `MAINTAINER_ID` is; unset, empty or not a number gives the lane to nobody), on an `opened` or
 * `synchronize` event, from a head branch `desk/authors-<desk>-<16 hex>-<id>` (the posts MCP's
 * `author_branch`, its ADR 0024), is judged by this lane's rule INSTEAD of the publisher's, and
 * gains nothing else:
 *   - exactly one changed path, `src/content/authors/<id>.md` (not `.mdx`, not nested; `<id>` the
 *     posts MCP's author id rule, and the id the branch name ends with), added or modified only
 *     (no delete, no rename, no copy), a plain file;
 *   - honesty, judged on the file at the merge base AND on main as it is now (the event's base
 *     commit) against the file at the head, so a stale branch is judged on today's facts (review
 *     of PR #46, B3) (fetched objects, read with `git cat-file`, never checked out or run): the
 *     lane touches only `kind: ai` and `kind: bot` files, judged at both for a modified file (a human's file, or one of
 *     an unknown kind, changes only through the maintainer, whatever changed) and at the head for
 *     an added one (a new human is the maintainer's to add); a modified file keeps its `kind` and
 *     its `name` (no AI or bot renames itself, or passes as a person); an added file's name may
 *     not be another author's at the head or on main (compared by `comparableName`: NFKC and full
 *     Unicode case folding), and its path must not be on main already.
 * Every file the lane judges is read by `readAuthorFile`, which refuses before any judgement a
 * form the site's reader and Astro's could read differently (the two cut the frontmatter block
 * differently, and YAML merge keys can hide a value from one of them; review of PR #46, B1): only
 * `key: <one-line scalar>` lines with the authors schema's keys, once each, and `beats` as `  - `
 * items; no BOM, no CR, no other line starting with `---` or `+++`. Then it parses the file with
 * both the site's reader (`scripts/frontmatter.mjs`) and Astro's own (`parseFrontmatter` from the
 * installed astro's `@astrojs/internal-helpers`) and requires the same data. Both are imported
 * only when this lane applies, so the publisher's lanes and the `push` mode still run with a bare
 * `node`; the workflow installs the lockfile (`npm ci --ignore-scripts`, from main) only for a
 * pull request whose author is the posts App. A missing reader fails the check. Everything else about an author file (its schema, a writer page's name
 * clash) stays with the required check `check`, which builds the site.
 *
 * `.github/workflows/check-publisher-pr.yml` runs the `pr` mode from main's own copy of this file
 * (`pull_request_target`), as the required check `publisher-paths`; `.github/workflows/deploy-pages.yml`
 * runs the `push` mode, from the copy in the commit before the push, when the publisher pushed.
 * Exit 0 when the change passes, 1 when it does not (or cannot be judged), 2 on bad usage.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { SLUG } from './slug.mjs';

/** The comment data files' directory: the publisher's first lane (ADR 0006, ADR 0007). */
export const COMMENTS_LANE = 'src/content/comments/';
/** The reactions data files' directory: the publisher's second lane (ADR 0008). */
export const REACTIONS_LANE = 'src/content/reactions/';
/** Every directory the publisher may write into, and nothing else. */
export const PUBLISHER_LANES = Object.freeze([COMMENTS_LANE, REACTIONS_LANE]);

/** `<lane><slug>.json`, and only that: the slug rule is the posts' (`scripts/slug.mjs`). */
const laneFilePath = (lane) => new RegExp(`^${lane.replace(/[/.]/g, '\\$&')}${SLUG.source.slice(1, -1)}\\.json$`);
/** `src/content/comments/<slug>.json`, exactly. */
export const COMMENT_FILE_PATH = laneFilePath(COMMENTS_LANE);
/** `src/content/reactions/<slug>.json`, exactly. */
export const REACTION_FILE_PATH = laneFilePath(REACTIONS_LANE);
const LANE_FILE_PATHS = new Map([
  [COMMENTS_LANE, COMMENT_FILE_PATH],
  [REACTIONS_LANE, REACTION_FILE_PATH],
]);
/** How the messages name what may change. */
const LANES_TEXT = PUBLISHER_LANES.map((lane) => `${lane}<slug>.json`).join(' or ');

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
/** Output larger than this is not a publisher batch; git's output is refused rather than truncated. */
const GIT_MAX_BUFFER = 256 * 1024 * 1024;

/** A problem with the inputs that means the change cannot be judged: it fails, never passes. */
export class UnjudgeableError extends Error {}

// ---- the posts App's authors lane (ADR 0018) ----

/** The author profiles' directory: the posts App's one lane. */
export const AUTHORS_LANE = 'src/content/authors/';
/** An author id, as the posts MCP checks it (`is_author_id`, its ADR 0024): a slug, no doubled or trailing hyphen. */
const AUTHOR_ID_SOURCE = '[a-z0-9]+(?:-[a-z0-9]+)*';
/** The longest author id, in characters: the posts MCP's `AUTHOR_ID_MAX_CHARS`. */
export const AUTHOR_ID_MAX_LENGTH = 64;
/** `src/content/authors/<id>.md`, exactly: a Markdown profile, never `.mdx` (whose body runs code at build time). */
export const AUTHOR_FILE_PATH = new RegExp(`^src/content/authors/(${AUTHOR_ID_SOURCE})\\.md$`);
/** Any author profile, nested ones included (the collection's glob is `**\/*.{md,mdx}`), to collect the other authors' names. */
const ANY_AUTHOR_FILE = /^src\/content\/authors\/.+\.mdx?$/;
/**
 * The posts MCP's author branch, `desk/authors-<desk>-<digest>-<id>` (`author_branch`): a desk id
 * of 1 to 16 lowercase letters or digits, the call digest's first 16 lowercase hex characters, the id.
 */
export const AUTHOR_BRANCH = new RegExp(`^desk/authors-[a-z0-9]{1,16}-[0-9a-f]{16}-(${AUTHOR_ID_SOURCE})$`);
/** The change statuses the authors lane allows: an added or a modified profile. */
const AUTHOR_LANE_STATUSES = new Set(['A', 'M']);
/**
 * The only kinds of author whose files the posts App may touch: at the merge base for a modified
 * file, at the head for an added one. A human's file (or one of an unknown kind) changes only
 * through the maintainer.
 */
export const AUTHOR_LANE_KINDS = Object.freeze(['ai', 'bot']);
/** An author file larger than this is not a profile; it is refused before it is read. */
export const AUTHOR_FILE_MAX_BYTES = 64 * 1024;

/** @param {unknown} path @returns {string | null} the author id when `path` is `src/content/authors/<id>.md`, else null */
export function authorIdOf(path) {
  if (typeof path !== 'string') return null;
  const match = AUTHOR_FILE_PATH.exec(path);
  return match && match[1].length <= AUTHOR_ID_MAX_LENGTH ? match[1] : null;
}

/** @param {unknown} ref @returns {string | null} the author id an author branch ends with, or null when `ref` is not one */
export function authorBranchId(ref) {
  if (typeof ref !== 'string') return null;
  const match = AUTHOR_BRANCH.exec(ref);
  return match && match[1].length <= AUTHOR_ID_MAX_LENGTH ? match[1] : null;
}

/**
 * Whether this pull request event gets the posts App's authors lane, and why. Pure. `postsApp`
 * says whether the author is the posts App at all, so a refusal can say why the lane did not apply.
 * @param {{ action?: string, authorId?: string, senderId?: string, headRef?: string, postsActorId?: string }} event
 * @returns {{ applies: boolean, postsApp: boolean, reason: string }}
 */
export function authorsLaneScope({ action, authorId, senderId, headRef, postsActorId }) {
  if ((postsActorId ?? '').trim() === '') return { applies: false, postsApp: false, reason: 'POSTS_ACTOR_ID is not set, so no pull request gets the authors lane' };
  const posts = accountId(postsActorId);
  if (posts === null) return { applies: false, postsApp: false, reason: 'POSTS_ACTOR_ID is not a numeric account id, so no pull request gets the authors lane' };
  if (accountId(authorId) !== posts) return { applies: false, postsApp: false, reason: 'the author is not the posts App' };
  if (accountId(senderId) !== posts) return { applies: false, postsApp: true, reason: 'the posts App’s pull request, but this event’s sender is someone else' };
  if (!EXEMPTING_ACTIONS.has(action ?? '')) {
    return { applies: false, postsApp: true, reason: `a ${JSON.stringify(action ?? '')} event does not show who pushed the head, so it opens no lane` };
  }
  if (authorBranchId(headRef) === null) {
    return { applies: false, postsApp: true, reason: `the head branch ${JSON.stringify(headRef ?? '')} is not a desk/authors-<desk>-<digest>-<id> branch` };
  }
  return { applies: true, postsApp: true, reason: `the author and this event’s sender are the posts App (account ${posts}), on ${headRef}` };
}

/**
 * The path-level problems with an authors-lane change set: one plain `src/content/authors/<id>.md`,
 * added or modified, whose id the branch name ends with. Pure.
 * @param {{ changes: { status: string, path: string, from?: string }[], modes: Map<string, string>, headRef: string }} input
 * @returns {string[]}
 */
export function authorPathProblems({ changes, modes, headRef }) {
  if (changes.length !== 1) {
    const listed = changes.map((change) => JSON.stringify(change.path)).join(', ') || 'none';
    return [`the authors lane changes exactly one author file; this pull request changes ${changes.length} (${listed})`];
  }
  const [{ status, path, from }] = changes;
  const problems = [];
  const id = authorIdOf(path);
  // A path that is not an author file is shown quoted: it came from the pull request, and may hold a line break.
  const shown = id === null ? JSON.stringify(path) : path;
  if (id === null) problems.push(`${shown}: not an author file; only ${AUTHORS_LANE}<id>.md may change in the authors lane`);
  if (!AUTHOR_LANE_STATUSES.has(status)) {
    const what = status === 'D' ? 'deleted' : status === 'R' ? `renamed from ${JSON.stringify(from)}` : status === 'C' ? `copied from ${JSON.stringify(from)}` : `changed with status ${JSON.stringify(status)}`;
    problems.push(`${shown}: ${what}; an author file may only be added or modified in the authors lane`);
  }
  const branchId = authorBranchId(headRef);
  if (id !== null && branchId !== id) {
    problems.push(`${path}: the branch ${headRef} is for the author ${JSON.stringify(branchId)}, not ${JSON.stringify(id)}`);
  }
  if (status !== 'D') {
    const mode = modes.get(path);
    if (mode === undefined) problems.push(`${shown}: not in the tree being checked, so its mode cannot be checked`);
    else if (mode !== MODE_FILE) problems.push(`${shown}: is ${MODE_NAMES[mode] ?? `mode ${mode}`} (${mode}); only a plain file (${MODE_FILE}) may be added or changed`);
  }
  return problems;
}

/**
 * The name as compared for clashes, or null when it is not a string. Unicode caseless matching
 * without a new dependency (Ari's review of 49236a3, finding 3: `toLowerCase` alone left
 * `STRASSE` and `Straße` apart). Exactly: NFKC (ligatures, full-width and compatibility letters
 * such as `ﬀ`, `Ｗ`, `ſ`, `K`), then lower, upper and lower case again (the round trip applies
 * Unicode's full, multi-code-point case mappings, so `ß` and `ẞ` become `ss`, `ŉ` becomes `ʼn`),
 * then every final sigma `ς` becomes `σ`, then NFKC again, trimming, and runs of white space made
 * one space. This folds at least as much as Unicode's NFKC_Casefold (dotless `ı` also meets `i`),
 * which for a clash rule errs toward refusing.
 * @param {unknown} name @returns {string | null}
 */
export function comparableName(name) {
  if (typeof name !== 'string') return null;
  const folded = name.normalize('NFKC').toLowerCase().toUpperCase().toLowerCase().replaceAll('ς', 'σ');
  return folded.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

/**
 * The top-level keys an author file may have in the lane: the `authors` collection's schema in
 * `src/content.config.ts`, and nothing else (a test pins the two together). An unknown key is
 * refused because Astro gives some meaning (`slug` moves the entry's id; review of PR #46, B2)
 * and the lane cannot vouch for what it does not know.
 */
export const AUTHOR_KEYS = Object.freeze(['name', 'kind', 'bio', 'avatar', 'portrait', 'portraitAlt', 'beats']);
/** The one key whose value is a list (of strings); every other key's value is a string. */
const AUTHOR_LIST_KEY = 'beats';
/** The fence both readers agree on, when it is the only line of its kind: exactly `---`. */
const FENCE_LINE = '---';
/** A line Astro's reader may take as a fence: anything starting with `---` or `+++`. */
const FENCE_LIKE = /^(?:---|\+\+\+)/;
/** `key: value` or `key:` at column 0, the key a plain word. */
const KEY_LINE = /^([A-Za-z][A-Za-z0-9]*):(?: (.*))?$/;
/** A list item under the list key: two spaces, a dash, a space, the value. */
const ITEM_LINE = /^  - (.*)$/;
/** One-line scalars: double-quoted, single-quoted, or plain and starting with none of YAML's indicators. */
const DOUBLE_QUOTED = /^"(?:[^"\\]|\\.)*"$/;
const SINGLE_QUOTED = /^'(?:[^']|'')*'$/;
const PLAIN_START = /^[^\s&*!|>'"%@`{}[\],#?:\-]/;

/** @param {string} value @returns {boolean} whether `value` is a one-line scalar the lane reads: no anchor, alias, tag, flow collection or block scalar */
function isPlainScalarText(value) {
  return DOUBLE_QUOTED.test(value) || SINGLE_QUOTED.test(value) || (PLAIN_START.test(value) && !/\s$/.test(value));
}

/**
 * Read an author file the way both the site's scripts and Astro read it, and only when they must
 * agree (review of PR #46, B1: the two readers cut the block differently, and YAML merge keys let
 * each see a different `kind` or `name`). Refused before any judgement: a byte-order mark or a
 * carriage return anywhere; a first line that is not exactly `---`; a first later line starting
 * with `---` or `+++` that is not exactly `---`, or any other such line after it; a YAML line that
 * is not `key: <one-line scalar>`, `beats:` or `  - <one-line scalar>` under it (so no merge key,
 * anchor, alias, tag, flow collection, block scalar, comment or continuation line); a key outside
 * `AUTHOR_KEYS`; a key twice. Then both readers parse the file and must return the same data, and
 * every value must be a string (the list key: a list of strings). Pure: the readers are passed in.
 * @param {string} text the whole file
 * @param {{ site: (text: string) => ({ data: Record<string, unknown> } | null), astro: (text: string) => Record<string, unknown> }} readers
 * @returns {{ data: Record<string, unknown> } | { problem: string }}
 */
export function readAuthorFile(text, readers) {
  if (text.includes('\uFEFF')) return { problem: 'it has a byte-order mark' };
  if (text.includes('\r')) return { problem: 'it has a carriage return; author files use LF line ends' };
  const lines = text.split('\n');
  if (lines[0] !== FENCE_LINE) return { problem: 'its first line is not exactly ---' };
  const close = lines.findIndex((line, index) => index > 0 && FENCE_LIKE.test(line));
  if (close === -1 || lines[close] !== FENCE_LINE) {
    return { problem: `its frontmatter does not end at a line that is exactly ---${close === -1 ? '' : ` (line ${close + 1} starts like a fence)`}` };
  }
  const extra = lines.findIndex((line, index) => index > close && FENCE_LIKE.test(line));
  if (extra !== -1) return { problem: `line ${extra + 1} starts with --- or +++, which a reader could take for a fence` };
  const seen = new Set();
  let inList = false;
  for (let index = 1; index < close; index += 1) {
    const line = lines[index];
    const where = `line ${index + 1}`;
    if (line === '') continue;
    const item = ITEM_LINE.exec(line);
    if (item) {
      if (!inList) return { problem: `${where}: a list item outside ${AUTHOR_LIST_KEY}` };
      if (!isPlainScalarText(item[1])) return { problem: `${where}: not a one-line value (no anchor, alias, tag, flow collection or block scalar)` };
      continue;
    }
    const entry = KEY_LINE.exec(line);
    if (!entry) return { problem: `${where}: not a \`key: value\` line the lane reads (no merge key, anchor, alias, tag, comment or continuation)` };
    const [, key, value] = entry;
    if (!AUTHOR_KEYS.includes(key)) return { problem: `${where}: the key ${JSON.stringify(key)} is not in the authors schema (${AUTHOR_KEYS.join(', ')})` };
    if (seen.has(key)) return { problem: `${where}: the key ${JSON.stringify(key)} is written twice` };
    seen.add(key);
    inList = key === AUTHOR_LIST_KEY && value === undefined;
    if (!inList && (value === undefined || !isPlainScalarText(value))) {
      return { problem: `${where}: the value of ${key} is not a one-line value (no anchor, alias, tag, flow collection or block scalar)` };
    }
  }
  let site;
  let astro;
  try {
    site = readers.site(text)?.data;
  } catch (error) {
    return { problem: `the site's reader cannot read it: ${error.message.split('\n')[0]}` };
  }
  try {
    astro = readers.astro(text);
  } catch (error) {
    return { problem: `Astro's reader cannot read it: ${error.message.split('\n')[0]}` };
  }
  if (!site) return { problem: 'the site\'s reader finds no frontmatter' };
  if (!isDeepStrictEqual(site, astro)) return { problem: 'the site\'s reader and Astro\'s read different data from it' };
  for (const [key, value] of Object.entries(site)) {
    const ok = key === AUTHOR_LIST_KEY
      ? Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string')
      : typeof value === 'string';
    if (!ok) return { problem: `the value of ${key} is not ${key === AUTHOR_LIST_KEY ? 'a list of strings' : 'a string'}` };
  }
  return { data: site };
}

/**
 * The names an author file gives, read leniently for the name-clash rule: whatever either reader
 * finds (a file the lane does not change may be in any form the maintainer wrote). Pure.
 * @param {string} text @param {Parameters<typeof readAuthorFile>[1]} readers
 * @returns {string[] | null} null when neither reader can read it
 */
export function namesIn(text, readers) {
  const names = [];
  let read = false;
  try {
    const data = readers.site(text)?.data;
    read = true;
    if (typeof data?.name === 'string') names.push(data.name);
  } catch { /* the other reader may still read it */ }
  try {
    const data = readers.astro(text);
    read = true;
    if (typeof data?.name === 'string') names.push(data.name);
  } catch { /* judged below */ }
  return read ? names : null;
}

/**
 * The honesty problems with one authors-lane change. Pure: the caller reads the files and passes
 * both frontmatter readers in (`loadFrontmatterReaders`); every file is read by `readAuthorFile`.
 * A modified file is judged against the file at the merge base AND at main as it is now (the
 * pull request's base commit): a branch cut before the maintainer re-kinded or renamed an author
 * would otherwise be judged on stale facts, and merge into them (review of PR #46, B3).
 * @param {{
 *   status: 'A' | 'M', path: string,
 *   baseText: string | null, mainText: string | null, headText: string,
 *   otherNames: string[],
 *   readers: Parameters<typeof readAuthorFile>[1],
 * }} input `baseText` is the file at the merge base and `mainText` at the pull request's base
 *   commit (null where it is absent); `otherNames` are the names of every other author at the head
 *   and at the base commit
 * @returns {string[]}
 */
export function authorContentProblems({ status, path, baseText, mainText, headText, otherNames, readers }) {
  const read = (text, when) => {
    const result = readAuthorFile(text, readers);
    return 'problem' in result ? { problem: `${path}: the file ${when} is refused: ${result.problem}` } : result;
  };
  const head = read(headText, 'at the head');
  if (head.problem) return [head.problem];
  const after = head.data;
  const kinds = AUTHOR_LANE_KINDS.map((kind) => `kind: ${kind}`).join(' or ');
  if (status === 'M') {
    const problems = [];
    for (const [text, where, missing] of [
      [baseText, 'at the merge base', 'modified, but it is not at the merge base'],
      [mainText, 'on main now', 'modified, but it is not on main now'],
    ]) {
      if (text === null) return [`${path}: ${missing}`];
      const base = read(text, where);
      if (base.problem) return [base.problem];
      const before = base.data;
      if (!AUTHOR_LANE_KINDS.includes(/** @type {string} */ (before.kind))) {
        return [`${path}: ${where}, an author of kind ${JSON.stringify(before.kind)}; the authors lane changes only ${kinds} files (a human's file changes only through the maintainer)`];
      }
      if (!isDeepStrictEqual(before.kind, after.kind)) {
        problems.push(`${path}: ${where}, its kind is ${JSON.stringify(before.kind)}, and the head's is ${JSON.stringify(after.kind)}; an author's kind never changes in the authors lane`);
      }
      if (!isDeepStrictEqual(before.name, after.name)) {
        problems.push(`${path}: ${where}, its name is ${JSON.stringify(before.name)}, and the head's is ${JSON.stringify(after.name)}; an author of kind ${JSON.stringify(before.kind)} keeps its name`);
      }
    }
    return problems;
  }
  if (mainText !== null) return [`${path}: added, but main has it now; the change would replace that author`];
  const problems = [];
  if (!AUTHOR_LANE_KINDS.includes(/** @type {string} */ (after.kind))) {
    problems.push(`${path}: a new author of kind ${JSON.stringify(after.kind)}; the authors lane adds only ${kinds} (a new human is the maintainer's to add)`);
  }
  const name = comparableName(after.name);
  if (name !== null && otherNames.some((other) => comparableName(other) === name)) {
    problems.push(`${path}: the name ${JSON.stringify(after.name)} is another author's; no author passes as another`);
  }
  return problems;
}

/** @param {unknown} path @returns {string | null} the lane `path` is a data file of, or null when it is in none */
export function laneOf(path) {
  if (typeof path !== 'string') return null;
  for (const [lane, pattern] of LANE_FILE_PATHS) if (pattern.test(path)) return lane;
  return null;
}

/** @param {unknown} path @returns {boolean} whether `path` is a data file in one of the publisher's lanes */
export function inPublisherLane(path) {
  return laneOf(path) !== null;
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
  const lane = laneOf(path);
  if (lane === null) {
    problems.push(`${path}: outside the publisher's lanes; only ${LANES_TEXT} may change`);
  }
  if (status === 'D') return problems;
  if (status === 'R') {
    const fromLane = laneOf(from);
    if (fromLane === null) {
      problems.push(`${path}: renamed from ${typeof from === 'string' ? from : '(unknown)'}, which is outside the publisher's lanes`);
    } else if (lane !== null && fromLane !== lane) {
      problems.push(`${path}: renamed from ${from}, in another lane; a file never moves between ${PUBLISHER_LANES.join(' and ')}`);
    }
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
  return { ...collect(cwd, mergeBase, headId), mergeBase, head: headId, base: baseId };
}

/**
 * A file's text at a commit, from the clone's objects, never checked out. Refuses a blob over
 * `AUTHOR_FILE_MAX_BYTES` before reading it.
 * @param {string} cwd @param {string} commit a validated commit id @param {string} path a validated author path
 */
function authorFileAt(cwd, commit, path) {
  const spec = `${commit}:${path}`;
  const size = Number(git(cwd, ['cat-file', '-s', spec]).trim());
  if (!Number.isSafeInteger(size)) throw new UnjudgeableError(`${path}: its size cannot be read`);
  if (size > AUTHOR_FILE_MAX_BYTES) throw new UnjudgeableError(`${path}: ${size} bytes, more than an author file's ${AUTHOR_FILE_MAX_BYTES}`);
  return git(cwd, ['cat-file', 'blob', spec]);
}

/** `authorFileAt`, or null when the commit's tree has no such file. */
function authorFileAtOrNull(cwd, commit, path) {
  const entry = git(cwd, ['ls-tree', '-z', '--full-tree', commit, '--', path]);
  return entry === '' ? null : authorFileAt(cwd, commit, path);
}

/**
 * Every problem with a pull request in the posts App's authors lane: the paths first, then (only
 * when they pass) the honesty rules on the file's content.
 * @param {{ cwd: string, collected: ReturnType<typeof collectPullRequest>, headRef: string, readers: Parameters<typeof readAuthorFile>[1] }} input
 * @returns {string[]}
 */
export function authorsLaneProblems({ cwd, collected, headRef, readers }) {
  const { changes, modes, mergeBase, head, base } = collected;
  const pathProblems = authorPathProblems({ changes, modes, headRef });
  if (pathProblems.length > 0) return pathProblems;
  const [{ status, path }] = changes;
  // Only an added author's name can clash (a modified one keeps its name): every other author at
  // the head and on main now, so an author main added after the branch was cut counts too.
  const otherNames = [];
  if (status === 'A') {
    const baseModes = parseHeadModes(git(cwd, ['ls-tree', '-r', '-z', '--full-tree', base]));
    for (const [commit, tree] of [[head, modes], [base, baseModes]]) {
      for (const other of [...tree.keys()].filter((p) => p !== path && ANY_AUTHOR_FILE.test(p)).sort()) {
        const names = namesIn(authorFileAt(cwd, commit, other), readers);
        if (names === null) throw new UnjudgeableError(`${other}: another author's file cannot be read, so the names cannot be compared`);
        otherNames.push(...names);
      }
    }
  }
  return authorContentProblems({
    status,
    path,
    baseText: status === 'M' ? authorFileAt(cwd, mergeBase, path) : null,
    mainText: authorFileAtOrNull(cwd, base, path),
    headText: authorFileAt(cwd, head, path),
    otherNames,
    readers,
  });
}

/**
 * The two frontmatter readers the authors lane requires to agree, loaded only for that lane (both
 * need the lockfile, from `npm ci`): the site's own (`scripts/frontmatter.mjs`) and Astro's
 * content layer's (`parseFrontmatter` from `@astrojs/internal-helpers/frontmatter`, resolved from
 * the installed `astro` package so it is the very copy the build uses, called as Astro's
 * `safeParseFrontmatter` calls it).
 * @returns {Promise<Parameters<typeof readAuthorFile>[1]>}
 */
export async function loadFrontmatterReaders() {
  try {
    const site = (await import('./frontmatter.mjs')).readFrontmatter;
    const astroPackage = createRequire(import.meta.url).resolve('astro/package.json');
    const helpers = createRequire(astroPackage).resolve('@astrojs/internal-helpers/frontmatter');
    const { parseFrontmatter } = await import(pathToFileURL(helpers).href);
    return { site, astro: (text) => parseFrontmatter(text, { frontmatter: 'empty-with-spaces' }).frontmatter };
  } catch (error) {
    throw new UnjudgeableError(`the frontmatter readers cannot be loaded (is the lockfile installed?): ${error.message.split('\n')[0]}`);
  }
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
  'usage: check-publisher-paths.mjs pr --base <sha> --head <sha>   (env: PR_ACTION, PR_AUTHOR_ID, EVENT_SENDER_ID, MAINTAINER_ID, PR_HEAD_REF, POSTS_ACTOR_ID)',
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
export async function main(argv, env = process.env, cwd = process.cwd()) {
  const parsed = parseArgs(argv);
  if (!parsed) {
    console.error(`check:publisher: ${USAGE}`);
    return 2;
  }
  const { mode, options } = parsed;
  let subject;
  let why;
  let lane = { applies: false };
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
    lane = authorsLaneScope({
      action: env.PR_ACTION,
      authorId: env.PR_AUTHOR_ID,
      senderId: env.EVENT_SENDER_ID,
      headRef: env.PR_HEAD_REF,
      postsActorId: env.POSTS_ACTOR_ID,
    });
    if (lane.applies) why = `in the posts App's authors lane because ${lane.reason}`;
    else if (lane.postsApp) why = `held to the rule because ${reason}, and not in the authors lane because ${lane.reason}`;
    else why = `held to the rule because ${reason}`;
  } else {
    subject = 'push';
    why = 'the pusher is the publisher';
  }

  let collected;
  let problems;
  try {
    collected = mode === 'pr'
      ? collectPullRequest({ cwd, base: options.base, head: options.head })
      : collectPush({ cwd, before: options.before, after: options.after });
    problems = lane.applies
      ? authorsLaneProblems({ cwd, collected, headRef: env.PR_HEAD_REF, readers: await loadFrontmatterReaders() })
      : changeProblems(collected);
  } catch (error) {
    if (!(error instanceof UnjudgeableError)) throw error;
    console.error(`check:publisher: this ${subject} cannot be judged, so it fails (${why}): ${error.message}`);
    return 1;
  }
  const count = collected.changes.length;
  if (problems.length === 0) {
    const what = lane.applies ? `${AUTHORS_LANE}<id>.md, honest` : `all ${LANES_TEXT}`;
    console.log(`check:publisher: ${count} changed file${count === 1 ? '' : 's'} in this ${subject}, ${what} (${why}).`);
    return 0;
  }
  const who = lane.applies ? 'the posts App' : 'the publisher';
  console.error(`check:publisher: this ${subject} changes what ${who} may not (${why}):`);
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
