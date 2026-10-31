#!/usr/bin/env node
/**
 * The pin command: the one way anyone (Michel, a Claude session, the desk's editor-in-chief)
 * changes `src/data/pins.json`. Plan: docs/plans/2026-10-31-top-nav-and-pinning.md, "Pin file rules".
 *
 *   npm run pin -- <slug> --by <name> [--until <date|timestamp>] [--proposed] [--auto]
 *   npm run unpin -- <slug>
 *
 * `pin` refuses a slug that is not a published post (the rule the site applies: not a draft,
 * `pubDate` already passed, not withdrawn), reads `--until` the way the build does, and writes the
 * file only after the whole new file passes the same validation the build runs. Pinning a slug that
 * is already pinned UPDATES that entry in place (every field is restated by the flags, so a missing
 * `--until` removes an old one); it is never a duplicate. The entry is `manual` and `active` unless
 * `--auto` / `--proposed` say otherwise. Afterwards it prints what the homepage card will show.
 *
 * The write is atomic: the new text goes to a temp file beside `pins.json` and is renamed over it,
 * so a failure at any point leaves the old file whole. This module reads no GitHub identity;
 * `--by` is a name for the record only.
 *
 * Exit 0 on success; 1 on any refusal or error (with a message on stderr); 2 on a usage error.
 */
import { closeSync, fsyncSync, openSync, readdirSync, readFileSync, renameSync, unlinkSync, writeSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { SLUG, SLUG_MAX_LENGTH } from './slug.mjs';
import { isPublishedDraftField, pubDateOf, readFrontmatter } from './frontmatter.mjs';
import { isLive } from '../src/lib/schedule.ts';
import { PIN_CARD_CAPACITY, PINNED_BY, parsePinsText, parseTimestamp, selectPinned, serializePinsFile, untilInstant } from '../src/lib/pins.ts';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PINS_PATH = 'src/data/pins.json';
export const POSTS_DIR = 'src/content/posts';
const POST_FILE = /\.mdx?$/;

/** A refusal with a message for the person at the terminal; the command prints it and exits 1. */
export class PinCommandError extends Error {}

/**
 * Why a post is or is not on the site, by the site's own rule (`isPublished` and `getPublishedPosts`
 * in `src/lib/site.ts`: `isLive` from `src/lib/schedule.ts`, and not withdrawn).
 * @param {string} text whole post file
 * @param {Date} now
 * @returns {'published' | 'draft' | 'scheduled' | 'withdrawn' | 'unreadable'}
 */
export function classifyPost(text, now) {
  let fm;
  try {
    fm = readFrontmatter(text);
  } catch {
    return 'unreadable';
  }
  if (fm === null) return 'unreadable';
  let date;
  try {
    ({ date } = pubDateOf(fm));
  } catch {
    return 'unreadable';
  }
  const published = isPublishedDraftField(fm.data);
  if (published === null || date === null) return 'unreadable';
  if (!published) return 'draft';
  if (!isLive({ draft: false, pubDate: date }, now)) return 'scheduled';
  return fm.data.withdrawn ? 'withdrawn' : 'published';
}

/**
 * The slugs of every post that appears in lists: the set `selectPinned` is given.
 * @param {string} postsDir
 * @param {Date} now
 * @returns {{ ids: Set<string>, unreadable: string[] }} `unreadable`: files whose frontmatter could not be read (left out of `ids`)
 */
export function loadPublishedIds(postsDir, now) {
  const ids = new Set();
  const unreadable = [];
  for (const name of readdirSync(postsDir).sort()) {
    if (!POST_FILE.test(name)) continue;
    const status = classifyPost(readFileSync(join(postsDir, name), 'utf8'), now);
    if (status === 'published') ids.add(name.replace(POST_FILE, ''));
    else if (status === 'unreadable') unreadable.push(name);
  }
  return { ids, unreadable };
}

/**
 * Write `text` to `path` so that a reader sees the old file or the new one, never half of either:
 * a temp file in the same directory (same filesystem, so the rename is atomic), flushed to disk,
 * then renamed over the target. The temp file is removed if anything fails.
 * @param {string} path
 * @param {string} text
 */
export function writeFileAtomic(path, text) {
  const temp = join(dirname(path), `.${basename(path)}.${process.pid}.tmp`);
  const fd = openSync(temp, 'wx', 0o644);
  try {
    writeSync(fd, text);
    fsyncSync(fd);
  } catch (error) {
    closeSync(fd);
    unlinkSync(temp);
    throw error;
  }
  closeSync(fd);
  try {
    renameSync(temp, path);
  } catch (error) {
    unlinkSync(temp);
    throw error;
  }
}

/** @param {string} pinsPath @returns {import('../src/lib/pins.ts').PinsFile} the current, validated file */
function readPins(pinsPath) {
  let text;
  try {
    text = readFileSync(pinsPath, 'utf8');
  } catch (error) {
    throw new PinCommandError(`cannot read ${pinsPath}: ${error.code ?? error.message}`);
  }
  try {
    return parsePinsText(text);
  } catch (error) {
    throw new PinCommandError(`${pinsPath} is broken, nothing was changed: ${error.message}`);
  }
}

/** @param {Date} now @returns {string} an ISO 8601 timestamp with a `Z`, to the second */
function stampNow(now) {
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * What the card shows after a change, as lines for the terminal.
 * @param {import('../src/lib/pins.ts').PinsFile} file
 * @param {string} postsDir
 * @param {Date} now
 * @returns {string[]}
 */
export function describeCard(file, postsDir, now) {
  const { ids, unreadable } = loadPublishedIds(postsDir, now);
  const { shown, dropped } = selectPinned(file, ids, now);
  const lines = [`homepage pin card now shows ${shown.length} of ${PIN_CARD_CAPACITY}${shown.length ? ', newest first' : ''}:`];
  for (const pin of shown) lines.push(`  ${pin.slug}  (${pin.source}, by ${pin.pinnedBy}${pin.until ? `, until ${pin.until}` : ''})`);
  if (shown.length === 0) lines.push('  (nothing: the card is not drawn)');
  const gone = new Set([...shown.map((p) => p.slug), ...dropped.map((d) => d.slug)]);
  for (const { slug, reason } of dropped) lines.push(`  not shown: ${slug} (${reason})`);
  for (const pin of file.pins) if (!gone.has(pin.slug)) lines.push(`  not shown: ${pin.slug} (no free slot)`);
  lines.push('  (a pinned post that is also the lead story is not repeated in the card)');
  for (const name of unreadable) lines.push(`  warning: could not read the frontmatter of ${name}; it counts as unpublished`);
  return lines;
}

/**
 * Pin or re-pin a post.
 * @param {object} o
 * @param {string} o.slug
 * @param {string} o.by
 * @param {string} [o.until]
 * @param {boolean} [o.proposed]
 * @param {boolean} [o.auto]
 * @param {string} o.pinsPath
 * @param {string} o.postsDir
 * @param {Date} o.now
 * @returns {{ action: 'pinned' | 'updated', file: import('../src/lib/pins.ts').PinsFile }}
 * @throws {PinCommandError} on any refusal; the file is untouched
 */
export function pinPost({ slug, by, until, proposed = false, auto = false, pinsPath, postsDir, now }) {
  if (!SLUG.test(slug) || slug.length > SLUG_MAX_LENGTH) {
    throw new PinCommandError(`"${slug}" is not a post slug (lowercase letters, digits and hyphens, at most ${SLUG_MAX_LENGTH} characters)`);
  }
  if (!PINNED_BY.test(by)) throw new PinCommandError(`--by "${by}" must match ${PINNED_BY} (lowercase name, at most 40 characters)`);
  let postText;
  for (const extension of ['md', 'mdx']) {
    try {
      postText = readFileSync(join(postsDir, `${slug}.${extension}`), 'utf8');
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new PinCommandError(`cannot read the post "${slug}": ${error.code ?? error.message}`);
    }
  }
  if (postText === undefined) throw new PinCommandError(`no post "${slug}" under ${postsDir}`);
  const status = classifyPost(postText, now);
  if (status !== 'published') {
    const why = {
      draft: 'it is a draft',
      scheduled: 'its pubDate has not passed yet',
      withdrawn: 'it is withdrawn and leaves every list',
      unreadable: 'its frontmatter cannot be read',
    }[status];
    throw new PinCommandError(`"${slug}" is not a published post: ${why}`);
  }
  if (until !== undefined) {
    if (parseTimestamp(until) === null && !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
      throw new PinCommandError(`--until "${until}" must be a timestamp with an offset or Z (2026-11-05T18:00:00+02:00) or a date (2026-11-05); a timestamp without an offset is refused`);
    }
    let end;
    try {
      end = untilInstant(until);
    } catch (error) {
      throw new PinCommandError(`--until "${until}" is not a real date or moment (${error.message.replace(/^pins\.json: /, '')})`);
    }
    if (now.valueOf() > end.valueOf()) throw new PinCommandError(`--until "${until}" is already past; the pin would never show`);
  }

  const current = readPins(pinsPath);
  const entry = {
    slug,
    source: auto ? 'auto' : 'manual',
    state: proposed ? 'proposed' : 'active',
    pinnedBy: by,
    pinnedAt: stampNow(now),
    ...(until === undefined ? {} : { until }),
  };
  const index = current.pins.findIndex((p) => p.slug === slug);
  const pins = index === -1 ? [...current.pins, entry] : current.pins.map((p, i) => (i === index ? entry : p));
  let text;
  try {
    text = serializePinsFile({ mode: current.mode, pins });
  } catch (error) {
    throw new PinCommandError(`the new file would be invalid, nothing was changed: ${error.message}`);
  }
  writeFileAtomic(pinsPath, text);
  return { action: index === -1 ? 'pinned' : 'updated', file: parsePinsText(text) };
}

/**
 * Remove a pin.
 * @param {{ slug: string, pinsPath: string }} o
 * @returns {{ file: import('../src/lib/pins.ts').PinsFile }}
 * @throws {PinCommandError} when the slug is not pinned or the file is broken; the file is untouched
 */
export function unpinPost({ slug, pinsPath }) {
  const current = readPins(pinsPath);
  if (!current.pins.some((p) => p.slug === slug)) throw new PinCommandError(`"${slug}" is not pinned; nothing to remove`);
  const next = { mode: current.mode, pins: current.pins.filter((p) => p.slug !== slug) };
  writeFileAtomic(pinsPath, serializePinsFile(next));
  return { file: next };
}

const USAGE = `usage:
  pins.mjs pin <slug> --by <name> [--until <date|timestamp>] [--proposed] [--auto]
  pins.mjs unpin <slug>`;

/**
 * @param {string[]} argv `['pin' | 'unpin', ...flags]`
 * @param {{ cwd?: string, now?: Date, stdout?: (line: string) => void, stderr?: (line: string) => void }} [io]
 * @returns {number} the exit code
 */
export function main(argv, { cwd = REPO_ROOT, now = new Date(), stdout = console.log, stderr = console.error } = {}) {
  const [command, ...rest] = argv;
  if (command !== 'pin' && command !== 'unpin') {
    stderr(USAGE);
    return 2;
  }
  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      allowPositionals: true,
      strict: true,
      options:
        command === 'pin'
          ? { by: { type: 'string' }, until: { type: 'string' }, proposed: { type: 'boolean' }, auto: { type: 'boolean' } }
          : {},
    });
  } catch (error) {
    stderr(`${error.message}\n${USAGE}`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (positionals.length !== 1) {
    stderr(`exactly one <slug> is required\n${USAGE}`);
    return 2;
  }
  if (command === 'pin' && !values.by) {
    stderr(`--by <name> is required (who asked for the pin)\n${USAGE}`);
    return 2;
  }
  const pinsPath = join(cwd, PINS_PATH);
  const postsDir = join(cwd, POSTS_DIR);
  try {
    if (command === 'pin') {
      const { action, file } = pinPost({ slug: positionals[0], by: values.by, until: values.until, proposed: values.proposed, auto: values.auto, pinsPath, postsDir, now });
      stdout(`${action} ${positionals[0]}${action === 'updated' ? ' (it was already pinned; the entry was restated from these flags)' : ''}`);
      for (const line of describeCard(file, postsDir, now)) stdout(line);
    } else {
      const { file } = unpinPost({ slug: positionals[0], pinsPath });
      stdout(`unpinned ${positionals[0]}`);
      for (const line of describeCard(file, postsDir, now)) stdout(line);
    }
    return 0;
  } catch (error) {
    stderr(`${command}: ${error instanceof PinCommandError ? error.message : `unexpected error: ${error.stack ?? error}`}`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
