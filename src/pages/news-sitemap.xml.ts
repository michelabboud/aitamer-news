import { SITE, canonicalUrlFor, getPublishedPosts } from '../lib/site';
import { newsSitemapXml, recentNews } from '../lib/news-sitemap';

/** Google News sitemap: stories from the last 48 hours at build time. Listed in robots.txt. */
export async function GET() {
  const posts = await getPublishedPosts();
  const items = recentNews(
    posts.map((post) => ({
      url: canonicalUrlFor(`/posts/${post.id}/`),
      title: post.data.title,
      published: post.data.pubDate,
    })),
    new Date(),
  );
  return new Response(newsSitemapXml(items, { name: SITE.title, language: 'en' }), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
