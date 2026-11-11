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
import { SERIES_SLUG, type SeriesMeta } from './series.ts';

/** The keys a row may carry, in the order the file writes them. Anything else is refused. */
export const SERIES_KEYS = ['slug', 'title', 'description', 'heroImage', 'heroAlt'] as const;

/** The longest title, in characters. It sits in a badge on every part, so it stays short. */
export const SERIES_TITLE_MAX_LENGTH = 80;
/** The longest description, in characters: one or two sentences on `/series/`. */
export const SERIES_DESCRIPTION_MAX_LENGTH = 240;
/** The longest hero alt text, in characters. */
export const SERIES_HERO_ALT_MAX_LENGTH = 200;

/**
 * A series hero: a hashed JPEG on the media host's heroes folder, named for its own series
 * (`series-<slug>-<8 hex>.jpg`). `npm run check:media` checks it and its WebP twin are really there.
 * No other host and no other shape: a bot cannot point a page at a picture of its choosing elsewhere.
 */
export const SERIES_HERO = /^https:\/\/bots\.aitamer\.news\/heroes\/series-([a-z0-9]+(?:-[a-z0-9]+)*)-[0-9a-f]{8}\.jpg$/;

/**
 * Plain text only: no control characters (line breaks included), no angle brackets. Astro escapes
 * text anyway; this keeps a title from ever looking like markup in a feed, a log or a review.
 */
const NOT_PLAIN = /[\u0000-\u001f\u007f-\u009f<>]/;

export class SeriesCatalogError extends Error {
  constructor(message: string) {
    super(`series.json: ${message}`);
    this.name = 'SeriesCatalogError';
  }
}

function plainText(value: unknown, where: string, field: string, max: number): string {
  if (typeof value !== 'string') throw new SeriesCatalogError(`${where}: ${field} must be a string`);
  if (value.trim() === '') throw new SeriesCatalogError(`${where}: ${field} is empty`);
  if (value !== value.trim()) throw new SeriesCatalogError(`${where}: ${field} has leading or trailing spaces`);
  if (NOT_PLAIN.test(value)) throw new SeriesCatalogError(`${where}: ${field} must be plain text (no line breaks, control characters, < or >)`);
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
    return Object.freeze(meta);
  });
  return Object.freeze(rows);
}
