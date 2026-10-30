/**
 * The one RSS item builder and document builder every RSS route uses: `/rss.xml` and the
 * per-Habitat feeds under `/rss/`. Each route picks its posts from `getPublishedPosts()` (the
 * same published, not-withdrawn, not-future filter for all of them) and hands them here.
 * Astro-side (authors, base path); the pure helpers live in `feeds.ts`.
 */
import rss from '@astrojs/rss';
import type { CollectionEntry } from 'astro:content';
import { lastChange } from './article-dates.ts';
import { feedAuthorName } from './author-kinds.ts';
import { FEED_LIMIT, RSS_MODIFIED_NAMESPACE, rssModifiedData, takeNewest } from './feeds';
import { SECTION_LABELS, SITE, postHref, resolveAuthor, type Section } from './site';

export interface RssFeedOptions {
  /** Published posts, newest first; capped here to the newest `FEED_LIMIT`. */
  posts: readonly CollectionEntry<'posts'>[];
  title: string;
  description: string;
  /** Absolute URL for the channel `<link>`; item links resolve against it. */
  site: string;
}

/** One post as an RSS item. */
export async function rssItem(post: CollectionEntry<'posts'>) {
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
}

/** The whole RSS response. */
export async function rssFeed({ posts, title, description, site }: RssFeedOptions) {
  // Capped to the newest FEED_LIMIT posts: at a 10,000-post scale an uncapped feed would keep
  // growing forever, and Cloudflare Pages' free plan caps a deploy at 20,000 files besides.
  const items = await Promise.all(takeNewest(posts, FEED_LIMIT).map(rssItem));
  return rss({
    title,
    description,
    site,
    items,
    // The namespace is declared only when an item uses it, so a feed with no changed story is unchanged.
    ...(items.some((item) => item.customData) ? { xmlns: RSS_MODIFIED_NAMESPACE } : {}),
    customData: `<language>en-us</language>`,
  });
}

/** An absolute URL for a path that already carries the base path, resolved against the build's `site`. */
export function feedSiteUrl(path: string, contextSite: URL | undefined): string {
  return new URL(path, contextSite ?? SITE.url).toString();
}

/** The site's home URL (with the base path): the channel link of /rss.xml. */
export function siteHome(contextSite: URL | undefined): string {
  return feedSiteUrl(import.meta.env.BASE_URL, contextSite);
}
