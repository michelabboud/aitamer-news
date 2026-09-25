/**
 * Read a post's frontmatter the way Astro reads it, for the build scripts (stamp-post-times,
 * stamp-specimens, due-posts).
 *
 * Why a real parser: these scripts decide things Astro must agree with (is this post a draft?
 * does it have sources? what is its pubDate?). Regexes over YAML disagreed with Astro on the
 * README's own template (trailing comments), on `draft: True`, on flow-style and unindented
 * lists (docs/reviews/2026-09-25-batch-a-deep-review.md, B1). So the scripts parse with the
 * same library and schema Astro's content layer uses: `js-yaml`'s `load()` with its default
 * schema, as in `@astrojs/internal-helpers/frontmatter` (vetting: docs/reports/2026-09-25-yaml-vetting.md).
 * That schema reads an unquoted `2026-09-25` as a Date, exactly as Astro does.
 *
 * Writes stay textual and minimal: a script decides WHAT to write from the parsed values, then
 * edits one line of the raw block and splices the block back by index (never `String.replace`
 * with user text in the replacement, which expands `$$`, `$&` and `$'`; B6). Every edit is
 * re-parsed and compared with the original before anything is written (`assertOnlyChanged`).
 */
import { isDeepStrictEqual } from 'node:util';
import yaml from 'js-yaml';

/** The slug rule and its length cap. They live in the dependency-free `./slug.mjs` (the publisher check imports it without `npm ci`). */
export { SLUG, SLUG_MAX_LENGTH } from './slug.mjs';

/**
 * The frontmatter fence. Like Astro's: an optional byte-order mark or leading blank lines, then
 * `---`, the YAML, and a closing `---` on its own line. LF or CRLF.
 */
const FENCE = /^(\uFEFF?(?:[ \t]*\r?\n)*---[ \t]*\r?\n)([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** A date-only pubDate scalar, plain or quoted, optionally followed by a YAML comment. */
const DATE_ONLY_VALUE = /^pubDate:[ \t]*(["']?)(\d{4}-\d{2}-\d{2})\1[ \t]*(#.*)?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class FrontmatterError extends Error {}

/**
 * @typedef {object} Frontmatter
 * @property {Record<string, unknown>} data the parsed mapping
 * @property {string} raw the YAML between the fences, exactly as in the file
 * @property {number} start index in the file where `raw` begins
 * @property {number} end index in the file where `raw` ends
 */

/**
 * @param {string} text whole post file
 * @returns {Frontmatter | null} null when the file has no frontmatter block
 * @throws {FrontmatterError} when the block is not valid YAML or not a mapping
 */
export function readFrontmatter(text) {
  const match = FENCE.exec(text);
  if (!match) return null;
  const start = match[1].length;
  const raw = match[2];
  let parsed;
  try {
    parsed = yaml.load(raw);
  } catch (error) {
    throw new FrontmatterError(`frontmatter is not valid YAML: ${error.message.split('\n')[0]}`);
  }
  if (parsed === undefined || parsed === null) parsed = {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new FrontmatterError('frontmatter must be a mapping of fields');
  }
  return { data: /** @type {Record<string, unknown>} */ (parsed), raw, start, end: start + raw.length };
}

/**
 * The line of a top-level key in the raw block, when it is written as a plain `key:` at column 0.
 * @param {string} raw
 * @param {string} key a plain identifier (no regex characters)
 * @returns {{ start: number, end: number, text: string, cr: boolean } | null} `end` excludes the
 *   line break; `text` excludes a trailing CR, which `cr` records
 */
export function topLevelLine(raw, key) {
  const match = new RegExp(`^${key}:.*$`, 'm').exec(raw);
  if (!match) return null;
  const cr = match[0].endsWith('\r');
  return { start: match.index, end: match.index + match[0].length, text: cr ? match[0].slice(0, -1) : match[0], cr };
}

/**
 * @param {string} text whole file
 * @param {Frontmatter} fm its frontmatter
 * @param {string} raw the new block
 * @returns {string} the file with only the block replaced
 */
export function withRaw(text, fm, raw) {
  return text.slice(0, fm.start) + raw + text.slice(fm.end);
}

/**
 * What the post's `pubDate` is.
 * @param {Frontmatter} fm
 * @returns {{ date: Date | null, day: string | null, comment: string | null }}
 *   `date`: the instant Astro would use, or null when missing or unreadable;
 *   `day`: YYYY-MM-DD when pubDate is written date-only (no time), else null;
 *   `comment`: a trailing YAML comment on a date-only line, kept when the line is rewritten
 */
export function pubDateOf(fm) {
  const value = fm.data.pubDate;
  let date = null;
  if (value instanceof Date) date = Number.isNaN(value.valueOf()) ? null : value;
  else if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) date = new Date(value);

  const line = topLevelLine(fm.raw, 'pubDate');
  if (line === null && Object.hasOwn(fm.data, 'pubDate')) {
    // Written inside a flow mapping or with a quoted key: the value alone cannot say whether a
    // time was written (a date-only value and midnight UTC load as the same Date), and the
    // stampers have no line to rewrite or anchor on. Refuse rather than guess.
    throw new FrontmatterError('pubDate must be written on its own top-level line, as `pubDate: <value>`');
  }
  const dateOnly = line ? DATE_ONLY_VALUE.exec(line.text) : null;
  if (dateOnly) {
    const day = dateOnly[2];
    const agrees =
      (value instanceof Date && value.toISOString() === `${day}T00:00:00.000Z`) || value === day;
    if (!agrees) throw new FrontmatterError(`pubDate line "${line.text}" does not parse as the date ${day}`);
    return { date, day, comment: dateOnly[3] ?? null };
  }
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    throw new FrontmatterError('pubDate is a date without a time, written in a form the stamper cannot rewrite; write it as `pubDate: YYYY-MM-DD` on one line');
  }
  return { date, day: null, comment: null };
}

/**
 * Whether the post is published as far as its `draft` field goes. Astro's schema is
 * `z.boolean().default(false)`: missing or `false` is published, `true` is a draft.
 * @param {Record<string, unknown>} data
 * @returns {boolean | null} null when `draft` is not a boolean (the build rejects it)
 */
export function isPublishedDraftField(data) {
  if (!Object.hasOwn(data, 'draft') || data.draft === false) return true;
  if (data.draft === true) return false;
  return null;
}

/**
 * Proof that an edit changed exactly one field: re-parse the new text and compare every field.
 * @param {Record<string, unknown>} before parsed data of the original
 * @param {string} afterText the whole edited file
 * @param {string} key the one field allowed to change
 * @param {(value: unknown) => boolean} expected accepts the new value of `key`
 * @throws {Error} when the edit changed anything else or wrote the wrong value
 */
export function assertOnlyChanged(before, afterText, key, expected) {
  const after = readFrontmatter(afterText);
  if (after === null) throw new Error(`editing ${key} lost the frontmatter`);
  if (!expected(after.data[key])) throw new Error(`editing ${key} wrote an unexpected value: ${String(after.data[key])}`);
  const rest = (data) => Object.fromEntries(Object.entries(data).filter(([k]) => k !== key));
  if (!isDeepStrictEqual(rest(before), rest(after.data))) {
    throw new Error(`editing ${key} changed other fields; nothing was written`);
  }
}
