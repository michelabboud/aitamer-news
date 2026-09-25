import type { APIContext } from 'astro';
import { FEED_LIMIT, buildJsonFeed, takeNewest, type FeedPost } from '../lib/feeds';
import {
  SECTION_LABELS,
  SITE,
  canonicalUrlFor,
  getPublishedPosts,
  postHref,
  resolveAuthor,
  withBase,
  type Section,
} from '../lib/site';

/** `/heroes/<slug>.jpg` (site-relative) or an already-absolute `https://` URL (R2, later). */
function absoluteHeroImageUrl(heroImage: string | undefined): string | undefined {
  const trimmed = heroImage?.trim();
  if (!trimmed) return undefined;
  return new URL(trimmed, SITE.url).toString();
}

export async function GET(_context: APIContext) {
  const posts = takeNewest(await getPublishedPosts(), FEED_LIMIT);
  const feedPosts: FeedPost[] = await Promise.all(
    posts.map(async (post) => {
      const author = await resolveAuthor(post);
      const section = post.data.section as Section;
      const url = canonicalUrlFor(postHref(post));
      return {
        url,
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        updatedDate: post.data.updatedDate,
        habitat: section,
        habitatLabel: SECTION_LABELS[section],
        tags: post.data.tags,
        authorName: author?.data.name,
        imageUrl: absoluteHeroImageUrl(post.data.heroImage),
        specimen: post.data.specimen,
        wildness: post.data.wildness,
        verdict: post.data.verdict,
        sunset: post.data.sunset,
      };
    }),
  );

  const feed = buildJsonFeed(feedPosts, {
    title: SITE.title,
    homePageUrl: SITE.url,
    feedUrl: canonicalUrlFor(withBase('/feed.json')),
    description: SITE.description,
  });

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
