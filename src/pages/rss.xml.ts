import type { APIContext } from 'astro';
import { rssFeed, siteHome } from '../lib/rss-feed';
import { SITE, getPublishedPosts } from '../lib/site';

export async function GET(context: APIContext) {
  return rssFeed({
    posts: await getPublishedPosts(),
    title: SITE.title,
    description: SITE.description,
    site: siteHome(context.site),
  });
}
