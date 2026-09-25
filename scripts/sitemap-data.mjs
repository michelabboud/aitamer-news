/**
 * What the sitemap needs to know about each post, read at config time (astro.config.mjs cannot
 * use the content collection API): which post URLs to leave out, and when each post last changed.
 *
 * Left out: withdrawn posts (they keep a `noindex` page, POST.md §2), drafts, and posts scheduled
 * after the build. Last changed: the newest of pubDate, updatedDate and any correction date.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFrontmatter } from './frontmatter.mjs';

export const POSTS_DIR = 'src/content/posts';
const POST_FILE = /\.mdx?$/;

/** @param {unknown} value */
function asDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date;
  }
  return null;
}

/**
 * @param {string} slug
 * @param {Record<string, any>} data parsed frontmatter
 * @param {Date} now build time
 * @returns {{ slug: string, listed: boolean, lastmod: Date | null }}
 */
export function sitemapEntry(slug, data, now) {
  const published = asDate(data.pubDate);
  const live = data.draft !== true && published !== null && published.valueOf() <= now.valueOf();
  const changes = [published, asDate(data.updatedDate), ...(data.corrections ?? []).map((c) => asDate(c?.date))]
    .filter((d) => d !== null);
  const lastmod = changes.length ? new Date(Math.max(...changes.map((d) => d.valueOf()))) : null;
  return { slug, listed: live && !data.withdrawn, lastmod };
}

/** @returns {Map<string, { listed: boolean, lastmod: Date | null }>} keyed by slug */
export function loadSitemapData(dir = POSTS_DIR, now = new Date()) {
  const entries = new Map();
  for (const name of readdirSync(dir)) {
    if (!POST_FILE.test(name)) continue;
    const slug = name.replace(POST_FILE, '');
    const fm = readFrontmatter(readFileSync(join(dir, name), 'utf8'));
    if (fm === null) throw new Error(`sitemap: ${join(dir, name)} has no frontmatter (POST.md §2)`);
    const { data } = fm;
    const { listed, lastmod } = sitemapEntry(slug, data, now);
    entries.set(slug, { listed, lastmod });
  }
  return entries;
}

/** The post slug in a page URL, or null for pages that are not posts. */
export function postSlugOf(url) {
  const match = /\/posts\/([^/]+)\/?$/.exec(new URL(url).pathname);
  return match ? match[1] : null;
}
