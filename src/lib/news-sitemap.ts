/**
 * Google News sitemap: only stories published in the last two days, as Google News requires.
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 * Pure (no Astro imports) so it can be tested; the endpoint is src/pages/news-sitemap.xml.ts.
 */

/** Google News only reads articles published within this window. */
export const NEWS_WINDOW_HOURS = 48;
/** Google News reads at most this many URLs per news sitemap. */
export const NEWS_MAX_URLS = 1000;

export interface NewsItem {
  url: string;
  title: string;
  published: Date;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Items inside the window ending at `now`, newest first, capped. */
export function recentNews(items: readonly NewsItem[], now: Date): NewsItem[] {
  const since = now.valueOf() - NEWS_WINDOW_HOURS * 3_600_000;
  return items
    .filter((item) => item.published.valueOf() > since && item.published.valueOf() <= now.valueOf())
    .sort((a, b) => b.published.valueOf() - a.published.valueOf())
    .slice(0, NEWS_MAX_URLS);
}

export function newsSitemapXml(items: readonly NewsItem[], publication: { name: string; language: string }): string {
  const urls = items
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(publication.name)}</news:name>
        <news:language>${escapeXml(publication.language)}</news:language>
      </news:publication>
      <news:publication_date>${item.published.toISOString()}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;
}
