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

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: `<language>en-us</language>`,
  });
}
