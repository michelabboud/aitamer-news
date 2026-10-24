import rss from '@astrojs/rss';
import { lastChange } from '../lib/article-dates.ts';
import { feedAuthorName } from '../lib/author-kinds.ts';
import type { APIContext } from 'astro';
import { FEED_LIMIT, RSS_MODIFIED_NAMESPACE, rssModifiedData, takeNewest } from '../lib/feeds';
import { SECTION_LABELS, SITE, getPublishedPosts, postHref, resolveAuthor, type Section } from '../lib/site';

export async function GET(context: APIContext) {
  // Capped to the newest FEED_LIMIT posts: at a 10,000-post scale an uncapped feed would keep
  // growing forever, and Cloudflare Pages' free plan caps a deploy at 20,000 files besides.
  const posts = takeNewest(await getPublishedPosts(), FEED_LIMIT);
  const items = await Promise.all(
    posts.map(async (post) => {
      const author = await resolveAuthor(post);
      const section = post.data.section as Section;
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: postHref(post),
        categories: [SECTION_LABELS[section], ...post.data.tags],
        author: author ? feedAuthorName(author.data.name, author.data.kind) : undefined,
        customData: rssModifiedData(lastChange(post.data)),
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
    // The namespace is declared only when an item uses it, so a feed with no changed story is unchanged.
    ...(items.some((item) => item.customData) ? { xmlns: RSS_MODIFIED_NAMESPACE } : {}),
    customData: `<language>en-us</language>`,
  });
}
