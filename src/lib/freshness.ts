/**
 * What the build publishes so an open page can tell the reader it is out of date, without a
 * request to anyone but the site itself (2026-10-02):
 *
 * - `/rev/<slug>.json`: one small document per story, `{ rev, updatedDate, corrections, withdrawn }`.
 *   `rev` hashes the story itself (frontmatter and body), never the page's HTML, so a rebuild that
 *   only changes related stories or the footer does not raise a false "updated" notice.
 * - `/latest.json`: the newest stories as `{ slug, section, pubDate }`, for the "new stories" bar on
 *   the front page and the section pages. It is built from the same published-posts list as the pages
 *   themselves, so a scheduled story is in it exactly when it is on the page.
 *
 * Pure: no `astro:content` import, so it is unit-tested directly.
 */
import { createHash } from 'node:crypto';

/** How many stories `/latest.json` lists: enough for a reader who left a tab open for a day. */
export const LATEST_LIMIT = 30;

/** Length of the hex digest kept as `rev`: 64 bits, far more than a handful of edits to one story need. */
const REV_LENGTH = 16;

/** The shape of `/rev/<slug>.json`. */
export interface RevDocument {
  rev: string;
  updatedDate: string | null;
  corrections: number;
  withdrawn: boolean;
}

/** One line of `/latest.json`. */
export interface LatestEntry {
  slug: string;
  section: string;
  pubDate: string;
}

/** The fields `revDocument` reads from a post entry (a `CollectionEntry<'posts'>` satisfies this). */
export interface RevSource {
  data: { updatedDate?: Date; corrections?: readonly unknown[]; withdrawn?: unknown } & Record<string, unknown>;
  body?: string;
}

/** The fields `latestEntries` reads from a post entry. */
export interface LatestSource {
  id: string;
  data: { section: string; pubDate: Date };
}

/** JSON with sorted keys, dates as ISO strings and undefined fields dropped, so key order never changes a hash. */
function canonical(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** @returns a short hex digest of the story's frontmatter and body. */
export function storyRev(data: Record<string, unknown>, body = ''): string {
  return createHash('sha256').update(canonical(data)).update('\n').update(body).digest('hex').slice(0, REV_LENGTH);
}

/** @returns the document written to `/rev/<slug>.json` for one story. */
export function revDocument(post: RevSource): RevDocument {
  return {
    rev: storyRev(post.data, post.body),
    updatedDate: post.data.updatedDate ? post.data.updatedDate.toISOString() : null,
    corrections: post.data.corrections?.length ?? 0,
    withdrawn: post.data.withdrawn !== undefined && post.data.withdrawn !== null,
  };
}

/** @returns the newest `limit` stories, newest first, ties broken by slug so the file never reorders between builds. */
export function latestEntries(posts: readonly LatestSource[], limit = LATEST_LIMIT): LatestEntry[] {
  return posts
    .map((post) => ({ slug: post.id, section: post.data.section, pubDate: post.data.pubDate.toISOString() }))
    .sort((a, b) => (a.pubDate === b.pubDate ? (a.slug < b.slug ? -1 : 1) : a.pubDate < b.pubDate ? 1 : -1))
    .slice(0, limit);
}
