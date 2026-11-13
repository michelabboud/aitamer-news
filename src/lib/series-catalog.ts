/**
 * The strict reader for `src/data/series.json`, the series catalog (ADR 0054).
 *
 * The catalog is data, not code, so the Grok and Cursor Apps can change it through the series lane
 * of the publisher path guard (`scripts/check-publisher-paths.mjs`) without being able to change
 * anything the build runs. Because a bot can write the file, this reader trusts nothing in it:
 * every key, type, length and character is checked, and any problem fails the build, the tests
 * and `npm run check:posts` with a message naming the row.
 *
 * Pure on purpose: no Astro, no filesystem. `src/data/series.ts` passes it the imported JSON. The
 * file is read when the site is built and never shipped as a file: the build turns it into HTML.
 */
import { SLUG_MAX_LENGTH } from '../../scripts/slug.mjs';
import { SERIES_SLUG, type SeriesArc, type SeriesMeta } from './series.ts';

/** The keys a row may carry. Anything else is refused. `arcs` stays last. The lesson-page fields are optional. */
export const SERIES_KEYS = ['slug', 'title', 'description', 'heroImage', 'heroAlt', 'audience', 'learns', 'lessonTime', 'unit', 'arcs'] as const;

/** The keys one arc may carry. `end` is omitted only on an open final arc. */
const ARC_KEYS = ['name', 'start', 'end'] as const;

/** The longest title, in characters. It sits in a badge on every part, so it stays short. */
export const SERIES_TITLE_MAX_LENGTH = 80;
/** The longest description, in characters: one or two sentences on `/series/`. */
export const SERIES_DESCRIPTION_MAX_LENGTH = 240;
/** The longest hero alt text, in characters. */
export const SERIES_HERO_ALT_MAX_LENGTH = 200;
/** The longest arc display name, in characters. It sits in the same badge as the series title. */
export const SERIES_ARC_NAME_MAX_LENGTH = 60;
/** Who the series is for, on the series page. */
export const SERIES_AUDIENCE_MAX_LENGTH = 240;
/** One thing a reader learns. */
export const SERIES_LEARN_MAX_LENGTH = 160;
/** How many learn lines a series page will list. */
export const SERIES_LEARNS_MAX = 8;
/** The stated time for a lesson, in the catalog's words. */
export const SERIES_LESSON_TIME_MAX_LENGTH = 80;

/**
 * A series hero: a hashed JPEG on the media host's heroes folder, named for its own series
 * (`series-<slug>-<8 hex>.jpg`). `npm run check:media` checks it and its WebP twin are really there.
 * No other host and no other shape: a bot cannot point a page at a picture of its choosing elsewhere.
 */
export const SERIES_HERO = /^https:\/\/bots\.aitamer\.news\/heroes\/series-([a-z0-9]+(?:-[a-z0-9]+)*)-[0-9a-f]{8}\.jpg$/;

/**
 * Plain text only: no control characters (line breaks included), no angle brackets, and no
 * invisible formatting characters (zero-width, direction marks and overrides, the byte-order mark),
 * which could make a title render reversed or differ from what a reviewer sees in the diff. Astro
 * escapes text anyway; this keeps a title from ever looking like markup or hiding text.
 */
const NOT_PLAIN = /[\u0000-\u001f\u007f-\u009f<>\u00ad\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff\ufff9-\ufffb]/;

export class SeriesCatalogError extends Error {
  constructor(message: string) {
    super(`series.json: ${message}`);
    this.name = 'SeriesCatalogError';
  }
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

/**
 * A fixed arc plan. Lessons start at 1 and run without gaps or overlaps. Only the last arc may
 * omit `end`; that arc then covers every later lesson.
 */
function parseArcs(value: unknown, where: string): readonly SeriesArc[] {
  if (!Array.isArray(value) || value.length === 0) throw new SeriesCatalogError(`${where}: arcs must be a non-empty array`);
  const names = new Set<string>();
  const arcs: SeriesArc[] = value.map((item, index) => {
    const at = `${where}: arcs[${index + 1}]`;
    if (item === null || typeof item !== 'object' || Array.isArray(item)) throw new SeriesCatalogError(`${at}: must be an object`);
    const record = item as Record<string, unknown>;
    const unknown = Object.keys(record).filter((key) => !(ARC_KEYS as readonly string[]).includes(key));
    if (unknown.length) throw new SeriesCatalogError(`${at}: unknown key${unknown.length === 1 ? '' : 's'} ${unknown.map((key) => JSON.stringify(key)).join(', ')}`);
    const name = plainText(record.name, at, 'name', SERIES_ARC_NAME_MAX_LENGTH);
    if (names.has(name)) throw new SeriesCatalogError(`${at} ("${name}"): the name is already used`);
    names.add(name);
    if (!positiveInteger(record.start)) throw new SeriesCatalogError(`${at}: start must be a positive integer`);
    const arc: SeriesArc = { name, start: record.start };
    if ('end' in record) {
      if (!positiveInteger(record.end) || record.end < record.start) {
        throw new SeriesCatalogError(`${at}: end must be an integer from start onward`);
      }
      arc.end = record.end;
    }
    return arc;
  });
  if (arcs[0].start !== 1) throw new SeriesCatalogError(`${where}: arcs must start at lesson 1`);
  for (let i = 0; i < arcs.length; i++) {
    const arc = arcs[i];
    const at = `${where}: arcs[${i + 1}] ("${arc.name}")`;
    if (arc.end === undefined && i !== arcs.length - 1) {
      throw new SeriesCatalogError(`${at}: an arc without an end has to be the last one`);
    }
    if (i === 0) continue;
    const prev = arcs[i - 1];
    if (prev.end === undefined) throw new SeriesCatalogError(`${where}: arcs[${i}] ("${prev.name}"): an arc without an end has to be the last one`);
    if (arc.start <= prev.end) throw new SeriesCatalogError(`${at}: overlaps the previous arc, which ends at lesson ${prev.end}`);
    if (arc.start > prev.end + 1) throw new SeriesCatalogError(`${at}: starts at ${arc.start}, leaving a gap after lesson ${prev.end}`);
  }
  return Object.freeze(arcs.map((arc) => Object.freeze(arc)));
}

function parseLearns(value: unknown, where: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) throw new SeriesCatalogError(`${where}: learns must be a non-empty array`);
  if (value.length > SERIES_LEARNS_MAX) throw new SeriesCatalogError(`${where}: learns lists more than ${SERIES_LEARNS_MAX} lines`);
  return Object.freeze(value.map((item, index) => plainText(item, where, `learns[${index + 1}]`, SERIES_LEARN_MAX_LENGTH)));
}

function plainText(value: unknown, where: string, field: string, max: number): string {
  if (typeof value !== 'string') throw new SeriesCatalogError(`${where}: ${field} must be a string`);
  if (value.trim() === '') throw new SeriesCatalogError(`${where}: ${field} is empty`);
  if (value !== value.trim()) throw new SeriesCatalogError(`${where}: ${field} has leading or trailing spaces`);
  if (NOT_PLAIN.test(value)) throw new SeriesCatalogError(`${where}: ${field} must be plain text (no line breaks, control or invisible formatting characters, < or >)`);
  if ([...value].length > max) throw new SeriesCatalogError(`${where}: ${field} is longer than ${max} characters`);
  return value;
}

/**
 * Read the catalog. Returns frozen rows in file order (the order of the `/series/` index), or
 * throws a `SeriesCatalogError` naming the first problem.
 */
export function parseSeriesCatalog(data: unknown): readonly SeriesMeta[] {
  if (!Array.isArray(data)) throw new SeriesCatalogError('the file must be a JSON array of series');
  const seen = new Set<string>();
  const rows = data.map((row: unknown, index): SeriesMeta => {
    let where = `row ${index + 1}`;
    if (row === null || typeof row !== 'object' || Array.isArray(row)) throw new SeriesCatalogError(`${where}: must be an object`);
    const record = row as Record<string, unknown>;
    const unknown = Object.keys(record).filter((key) => !(SERIES_KEYS as readonly string[]).includes(key));
    if (unknown.length) throw new SeriesCatalogError(`${where}: unknown key${unknown.length === 1 ? '' : 's'} ${unknown.map((key) => JSON.stringify(key)).join(', ')}`);

    const { slug } = record;
    if (typeof slug !== 'string' || !SERIES_SLUG.test(slug) || slug.length > SLUG_MAX_LENGTH) {
      throw new SeriesCatalogError(`${where}: slug ${JSON.stringify(slug)} is not a lowercase slug of at most ${SLUG_MAX_LENGTH} characters`);
    }
    where = `row ${index + 1} ("${slug}")`;
    if (seen.has(slug)) throw new SeriesCatalogError(`${where}: the slug is already used by an earlier row`);
    seen.add(slug);

    const meta: SeriesMeta = {
      slug,
      title: plainText(record.title, where, 'title', SERIES_TITLE_MAX_LENGTH),
      description: plainText(record.description, where, 'description', SERIES_DESCRIPTION_MAX_LENGTH),
    };

    const hasImage = 'heroImage' in record;
    const hasAlt = 'heroAlt' in record;
    if (hasImage !== hasAlt) throw new SeriesCatalogError(`${where}: heroImage and heroAlt go together; set both or neither`);
    if (hasImage) {
      const image = record.heroImage;
      const match = typeof image === 'string' ? SERIES_HERO.exec(image) : null;
      if (!match) throw new SeriesCatalogError(`${where}: heroImage must be https://bots.aitamer.news/heroes/series-${slug}-<8 hex>.jpg`);
      if (match[1] !== slug) throw new SeriesCatalogError(`${where}: heroImage is named for series "${match[1]}", not "${slug}"`);
      meta.heroImage = image as string;
      meta.heroAlt = plainText(record.heroAlt, where, 'heroAlt', SERIES_HERO_ALT_MAX_LENGTH);
    }
    if ('audience' in record) meta.audience = plainText(record.audience, where, 'audience', SERIES_AUDIENCE_MAX_LENGTH);
    if ('learns' in record) meta.learns = parseLearns(record.learns, where);
    if ('lessonTime' in record) meta.lessonTime = plainText(record.lessonTime, where, 'lessonTime', SERIES_LESSON_TIME_MAX_LENGTH);
    if ('unit' in record) {
      const unit = plainText(record.unit, where, 'unit', 20);
      if (!/^[a-z]+$/.test(unit)) throw new SeriesCatalogError(`${where}: unit must be a singular lowercase word`);
      meta.unit = unit;
    }
    if ('arcs' in record) meta.arcs = parseArcs(record.arcs, where);
    return Object.freeze(meta);
  });
  return Object.freeze(rows);
}
