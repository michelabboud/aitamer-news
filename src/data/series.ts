/**
 * Series a post can join. The rows live in `series.json` beside this file (ADR 0054): the slug is
 * what frontmatter `series` names; the title and description are what `/series/` and the part
 * badge show. Add a row there before a post uses the slug. The order of the rows is the order of
 * the index.
 *
 * The JSON is data the Grok and Cursor Apps may change through the series lane; this module is the
 * code that reads it, and no App may change it. `parseSeriesCatalog` checks every row, so a broken
 * or hostile file fails the build instead of reaching a page. The file is read when the site is
 * built; it is never copied into the site.
 */
import catalog from './series.json' with { type: 'json' };
import { parseSeriesCatalog } from '../lib/series-catalog.ts';
import type { SeriesMeta } from '../lib/series.ts';

export type { SeriesMeta };

export const SERIES: readonly SeriesMeta[] = parseSeriesCatalog(catalog);

export function seriesMeta(slug: string): SeriesMeta | undefined {
  return SERIES.find((series) => series.slug === slug);
}
