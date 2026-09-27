/**
 * News and Columns (ADR 0013) are paginated listings over every published post. Pure, so it runs
 * under `node:test`.
 */

/** Cards per listing page: a multiple of 2 and 3, so the grid's last row is full at every width. */
export const LISTING_PAGE_SIZE = 24;

/** The listing's `<title>`: the name alone on page 1, "News · page 2" after it. */
export function listingTitle(name: string, page: number): string {
  if (!Number.isInteger(page) || page < 1) throw new Error(`listingTitle: page must be a whole number from 1, got ${page}`);
  return page === 1 ? name : `${name} · page ${page}`;
}

/** A site path with exactly one trailing slash, keeping any query or fragment: "/news" → "/news/". */
export function withTrailingSlash(path: string): string {
  const cut = path.search(/[?#]/);
  const [base, rest] = cut === -1 ? [path, ''] : [path.slice(0, cut), path.slice(cut)];
  return `${base.replace(/\/+$/, '')}/${rest}`;
}
