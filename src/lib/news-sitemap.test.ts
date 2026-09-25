import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NEWS_WINDOW_HOURS, newsSitemapXml, recentNews } from './news-sitemap.ts';

const now = new Date('2026-09-25T12:00:00Z');
const item = (slug: string, iso: string) => ({ url: `https://aitamer.news/posts/${slug}/`, title: slug, published: new Date(iso) });

test('only the last two days, newest first, nothing from the future', () => {
  const picked = recentNews(
    [
      item('old', '2026-09-23T11:59:00Z'),
      item('edge', new Date(now.valueOf() - NEWS_WINDOW_HOURS * 3_600_000 + 60_000).toISOString()),
      item('new', '2026-09-25T11:00:00Z'),
      item('scheduled', '2026-09-26T08:00:00Z'),
    ],
    now,
  );
  assert.deepEqual(picked.map((i) => i.title), ['new', 'edge']);
});

test('titles are escaped and the news namespace is declared', () => {
  const xml = newsSitemapXml([item('a', '2026-09-25T11:00:00Z')].map((i) => ({ ...i, title: 'Q&A <GPT> "6"' })), {
    name: 'AI Tamer',
    language: 'en',
  });
  assert.match(xml, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
  assert.match(xml, /<news:title>Q&amp;A &lt;GPT&gt; &quot;6&quot;<\/news:title>/);
  assert.match(xml, /<news:publication_date>2026-09-25T11:00:00\.000Z<\/news:publication_date>/);
});

test('an empty window is still a valid, empty urlset', () => {
  const xml = newsSitemapXml([], { name: 'AI Tamer', language: 'en' });
  assert.match(xml, /<urlset[^>]*>\n\n<\/urlset>/);
});
