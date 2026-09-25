/**
 * Month grouping for the archive. No Astro imports, so `npm test` can run it directly.
 * Months are UTC, like the publish times stored in `pubDate`.
 */

export interface ArchiveMonth<P> {
  year: string;
  month: string;
  posts: P[];
}

/** Year and zero-padded month of a publish time, in UTC: { year: '2026', month: '09' }. */
export function archiveMonthOf(date: Date): { year: string; month: string } {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
  };
}

/**
 * Group posts by publish month, newest month first.
 * Posts keep the order they arrive in, so pass them newest first.
 */
export function groupByMonth<P extends { data: { pubDate: Date } }>(posts: P[]): ArchiveMonth<P>[] {
  const months = new Map<string, ArchiveMonth<P>>();
  for (const post of posts) {
    const { year, month } = archiveMonthOf(post.data.pubDate);
    const key = `${year}-${month}`;
    const entry = months.get(key) ?? { year, month, posts: [] };
    entry.posts.push(post);
    months.set(key, entry);
  }
  return [...months.values()].sort((a, b) =>
    `${b.year}-${b.month}`.localeCompare(`${a.year}-${a.month}`),
  );
}

/** "September 2026". */
export function formatArchiveMonth(year: string, month: string): string {
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}
