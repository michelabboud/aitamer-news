import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE, getPublishedPosts, postHref, resolveAuthor } from '../lib/site';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  const items = await Promise.all(
    posts.map(async (post) => {
      const author = await resolveAuthor(post);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: postHref(post),
        categories: [post.data.section, ...post.data.tags],
        author: author?.data.name,
      };
    }),
  );

  const origin = context.site ?? SITE.url;
  const site = new URL(import.meta.env.BASE_URL, origin).toString();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site,
    items,
    customData: `<language>en-us</language>`,
  });
}
