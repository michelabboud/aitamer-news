/**
 * Read a post's or an author's frontmatter exactly as Astro reads it, for every script that
 * judges content (stamp-post-times, stamp-specimens, due-posts, sitemap-data, check-authors,
 * check-rendered-body, and the posts App's authors lane in check-publisher-paths).
 *
 * Why a real parser: these scripts decide things Astro must agree with (is this post a draft?
 * does it have sources? what is its pubDate? who wrote it, and are they human?). Regexes over YAML
 * disagreed with Astro on the README's own template (trailing comments), on `draft: True`, on
 * flow-style and unindented lists (docs/reviews/2026-09-25-batch-a-deep-review.md, B1). So the
 * scripts parse with the same library and schema Astro's content layer uses: `js-yaml`'s `load()`
 * with its default schema (vetting: docs/reports/2026-09-25-yaml-vetting.md). That schema reads an
 * unquoted `2026-09-25` as a Date, exactly as Astro does.
 *
 * Why that was not enough (the deep review of PR #46, B1 and its addendum, 2026-09-28; ADR 0019):
 * Astro's content layer (`parseFrontmatter` in `@astrojs/internal-helpers/frontmatter`, called by
 * its Markdown content type) ends the block at the first line that merely STARTS with `---` or
 * `+++`, and takes `+++` as a TOML fence; this reader ended it only at a line of exactly `---`. A
 * YAML merge key (`<<: {author: desk-bot}`), overridden by an explicit key after a `+++: x` line,
 * then read `author: wiz-cat` (a human) to the checks and `author: desk-bot` to the build: the
 * checks granted a human's exemptions to a post Astro published under a bot. So `readFrontmatter`
 * now reads only a file that both readers must read the same, and refuses the rest, with a
 * message naming what to remove:
 *   - a byte-order mark or a carriage return anywhere in the file (LF only);
 *   - a block Astro sees and this reader does not (a `+++` fence, an opening `---` with text after
 *     it on the same line), or the reverse;
 *   - inside the block, a line starting with `---` or `+++` (only the closing `---` may);
 *   - a YAML merge key (`<<`), an anchor (`&a`), an alias (`*a`) or a tag (`!!str`, `!x`); a key
 *     written twice (js-yaml refuses it already);
 * and then it parses the file with Astro's own function as well, resolved from the installed
 * `astro` package (the very copy the build runs), and refuses the file unless both return the
 * same data. The site's content uses none of the refused forms.
 *
 * Writes stay textual and minimal: a script decides WHAT to write from the parsed values, then
 * edits one line of the raw block and splices the block back by index (never `String.replace`
 * with user text in the replacement, which expands `$$`, `$&` and `$'`; B6). Every edit is
 * re-parsed and compared with the original before anything is written (`assertOnlyChanged`).
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import yaml from 'js-yaml';

/** The slug rule and its length cap. They live in the dependency-free `./slug.mjs` (the publisher check imports it without `npm ci`). */
export { SLUG, SLUG_MAX_LENGTH } from './slug.mjs';

/**
 * Astro's own frontmatter functions: the `@astrojs/internal-helpers` that the installed `astro`
 * resolves, so a different copy cannot slip in between the build and these scripts.
 */
const astroHelpers = await import(pathToFileURL(
  createRequire(createRequire(import.meta.url).resolve('astro/package.json')).resolve('@astrojs/internal-helpers/frontmatter'),
).href);

/** @param {string} text @returns {Record<string, unknown>} the frontmatter as Astro's Markdown content type reads it (`safeParseFrontmatter`) */
export function astroFrontmatter(text) {
  return astroHelpers.parseFrontmatter(text, { frontmatter: 'empty-with-spaces' }).frontmatter;
}

/**
 * The frontmatter fence: optional leading blank lines, then `---`, the YAML, and a closing `---`
 * on its own line (trailing spaces allowed on either fence); an empty block (`---` then `---`) too,
 * which Astro reads as `{}`. LF only: a BOM and a CR are refused
 * before this runs. With no `---`/`+++`-prefixed line inside the block (refused), Astro's block
 * ends at the same line.
 */
const FENCE = /^((?:[ \t]*\n)*---[ \t]*\n)(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/;
/** A line Astro's reader would take as the end of the block. */
const FENCE_LIKE_LINE = /^(?:---|\+\+\+)/m;
/** js-yaml's default schema without the merge type: a `<<` key stays a key, so it can be found and refused. */
const NO_MERGE_SCHEMA = yaml.CORE_SCHEMA.extend({ implicit: [yaml.types.timestamp] });
/**
 * A node whose text starts with a property or an alias: `&anchor`, `!tag`, `*alias` (after the
 * `- ` of a block sequence). A plain scalar can never start with one of these, and a quoted one
 * starts with its quote, so `R&D`, `Hello!` and `"*"` are not caught.
 */
const NODE_PROPERTY = /^\s*(?:-\s+)?([&!*])/;
const PROPERTY_NAMES = { '&': 'an anchor', '!': 'a tag', '*': 'an alias' };

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

/** @param {unknown} value @returns {boolean} whether a mapping anywhere in `value` has a `<<` key */
function hasMergeKey(value) {
  if (Array.isArray(value)) return value.some(hasMergeKey);
  if (value === null || typeof value !== 'object' || value instanceof Date) return false;
  return Object.hasOwn(value, '<<') || Object.values(value).some(hasMergeKey);
}

/**
 * @param {string} text whole post file
 * @returns {Frontmatter | null} null when the file has no frontmatter block (to either reader)
 * @throws {FrontmatterError} when the block is not valid YAML or not a mapping, or is in a form the
 *   site's scripts and Astro could read differently (see the file's header), naming what to remove
 */
export function readFrontmatter(text) {
  if (text.includes('\uFEFF')) throw new FrontmatterError('the file has a byte-order mark (U+FEFF); save it as UTF-8 without one');
  if (text.includes('\r')) throw new FrontmatterError('the file has a carriage return; use LF line ends only');
  const match = FENCE.exec(text);
  const astroSees = astroHelpers.extractFrontmatter(text) !== undefined;
  if (!match) {
    if (astroSees) throw new FrontmatterError('Astro reads a frontmatter block here that the site\'s scripts do not (a `+++` fence, or text after the opening `---`): start the file with a line of exactly ---');
    return null;
  }
  if (!astroSees) throw new FrontmatterError('the site\'s scripts read a frontmatter block that Astro does not');
  const start = match[1].length;
  const raw = match[2] ?? '';
  const fenceLike = FENCE_LIKE_LINE.exec(raw);
  if (fenceLike) {
    const line = match[1].split('\n').length + raw.slice(0, fenceLike.index).split('\n').length - 1;
    throw new FrontmatterError(`line ${line} starts with --- or +++, which Astro reads as the end of the frontmatter; only its closing line may`);
  }
  const properties = [];
  const opened = [];
  let parsed;
  try {
    parsed = yaml.load(raw, {
      schema: NO_MERGE_SCHEMA,
      listener(event, state) {
        if (event === 'open') {
          opened.push(state.position);
          return;
        }
        const property = NODE_PROPERTY.exec(raw.slice(opened.pop(), state.position));
        if (property) properties.push(PROPERTY_NAMES[property[1]]);
      },
    });
  } catch (error) {
    throw new FrontmatterError(`frontmatter is not valid YAML: ${error.message.split('\n')[0]}`);
  }
  if (properties.length > 0) {
    throw new FrontmatterError(`frontmatter uses ${[...new Set(properties)].join(' and ')}; write every value out in full (no &anchor, *alias or !tag)`);
  }
  if (hasMergeKey(parsed)) throw new FrontmatterError('frontmatter uses a YAML merge key (<<); write every value out in full');
  if (parsed === undefined || parsed === null) parsed = {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new FrontmatterError('frontmatter must be a mapping of fields');
  }
  let astro;
  try {
    astro = astroFrontmatter(text);
  } catch (error) {
    throw new FrontmatterError(`Astro cannot read the frontmatter: ${error.message.split('\n')[0]}`);
  }
  if (!isDeepStrictEqual(parsed, astro)) throw new FrontmatterError('the site\'s scripts and Astro read different frontmatter from this file');
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
