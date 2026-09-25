/**
 * Machine-readable feeds: shared shapes and pure builders for `/rss.xml`, `/feed.json` and
 * `/llms.txt`. No Astro imports, so `npm test` can run this directly against plain objects —
 * the pages under `src/pages/*.ts` do the Astro-side work (resolving authors, canonical URLs,
 * absolute image URLs) and hand the result to these functions.
 *
 * Every feed is capped to the newest `FEED_LIMIT` posts: at a 10,000-post scale, an uncapped
 * feed or a page per post would blow past Cloudflare Pages' 20,000-files-per-deploy limit on
 * the free plan, and nobody reads post 9,000 of an RSS feed anyway.
 */
import { formatSpecimen } from './specimen.ts';

/** Newest posts kept in every feed (RSS, JSON Feed, llms.txt's "Latest" list). */
export const FEED_LIMIT = 50;

/** https://www.jsonfeed.org/version/1.1/ */
export const JSON_FEED_VERSION = 'https://jsonfeed.org/version/1.1';

export interface FeedWildness {
  rating: number;
  verified: string;
  claimed: string;
}

export interface FeedSunset {
  date: Date;
  what: string;
  replacement?: string;
}

/**
 * A post, flattened to plain data for feed building. Callers (the `.ts` pages) build this from
 * a `CollectionEntry<'posts'>` plus its resolved author and absolute URLs — nothing here reaches
 * back into `astro:content`.
 */
export interface FeedPost {
  /** Canonical absolute URL of the post; also used as the JSON Feed item id. */
  url: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  /** Habitat slug, e.g. `models` (`src/lib/habitats.ts`). */
  habitat: string;
  /** Reader-facing habitat name, e.g. `Models`. */
  habitatLabel: string;
  tags: string[];
  authorName?: string;
  /** Absolute URL of the hero image, when the post has one. */
  imageUrl?: string;
  specimen?: number;
  wildness?: FeedWildness;
  verdict?: string;
  sunset?: FeedSunset;
}

/** Newest-first slice of a feed. `posts` must already be sorted newest first. */
export function takeNewest<T>(posts: readonly T[], limit: number = FEED_LIMIT): T[] {
  return posts.slice(0, limit);
}

export interface JsonFeedAuthor {
  name: string;
}

/** `_`-prefixed per JSON Feed 1.1's extension rule; see jsonfeed.org/version/1.1/#extensions. */
export interface AitamerExtension {
  specimen?: number;
  habitat?: string;
  wildness?: FeedWildness;
  verdict?: string;
  sunset?: {
    date: string;
    what: string;
    replacement?: string;
  };
}

export interface JsonFeedItem {
  id: string;
  url: string;
  title: string;
  summary: string;
  /**
   * JSON Feed 1.1 requires `content_html` or `content_text` on every item. This site's feed is a
   * links-and-summaries feed, not a full-text one, so `content_text` repeats `summary` — present
   * for spec compliance, not because it carries more than the summary does.
   */
  content_text: string;
  date_published: string;
  date_modified?: string;
  authors?: JsonFeedAuthor[];
  tags?: string[];
  image?: string;
  _aitamer: AitamerExtension;
}

export interface JsonFeed {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description: string;
  language: string;
  items: JsonFeedItem[];
}

export interface JsonFeedMeta {
  title: string;
  homePageUrl: string;
  feedUrl: string;
  description: string;
  /** BCP 47 tag. Defaults to `en-us`, matching the RSS feed's `<language>`. */
  language?: string;
}

/** One post's `_aitamer` extension: always carries `habitat`; the rest appear only when set. */
function toAitamerExtension(post: FeedPost): AitamerExtension {
  const ext: AitamerExtension = { habitat: post.habitat };
  if (post.specimen !== undefined) ext.specimen = post.specimen;
  if (post.wildness) ext.wildness = post.wildness;
  if (post.verdict) ext.verdict = post.verdict;
  if (post.sunset) {
    ext.sunset = {
      date: post.sunset.date.toISOString(),
      what: post.sunset.what,
      ...(post.sunset.replacement ? { replacement: post.sunset.replacement } : {}),
    };
  }
  return ext;
}

export function toJsonFeedItem(post: FeedPost): JsonFeedItem {
  const item: JsonFeedItem = {
    id: post.url,
    url: post.url,
    title: post.title,
    summary: post.description,
    content_text: post.description,
    date_published: post.pubDate.toISOString(),
    _aitamer: toAitamerExtension(post),
  };
  if (post.updatedDate) item.date_modified = post.updatedDate.toISOString();
  if (post.authorName) item.authors = [{ name: post.authorName }];
  if (post.tags.length > 0) item.tags = post.tags;
  if (post.imageUrl) item.image = post.imageUrl;
  return item;
}

/** Builds the whole JSON Feed 1.1 document, capped to the newest `limit` posts. */
export function buildJsonFeed(posts: readonly FeedPost[], meta: JsonFeedMeta, limit: number = FEED_LIMIT): JsonFeed {
  return {
    version: JSON_FEED_VERSION,
    title: meta.title,
    home_page_url: meta.homePageUrl,
    feed_url: meta.feedUrl,
    description: meta.description,
    language: meta.language ?? 'en-us',
    items: takeNewest(posts, limit).map(toJsonFeedItem),
  };
}

/** Escapes the brackets that would otherwise close a Markdown link label early. */
function escapeMarkdownLinkText(text: string): string {
  return text.replace(/[[\]]/g, (bracket) => `\\${bracket}`);
}

/** One `llms.txt` "Latest" line: `- [title](url): description (No. 0012, Habitat)`. */
export function llmsTxtLatestLine(post: FeedPost): string {
  const label =
    post.specimen !== undefined
      ? `No. ${formatSpecimen(post.specimen)}, ${post.habitatLabel}`
      : post.habitatLabel;
  return `- [${escapeMarkdownLinkText(post.title)}](${post.url}): ${post.description} (${label})`;
}

/** The whole "Latest" section body (one line per post, newline-joined), capped to `limit`. */
export function llmsTxtLatestSection(posts: readonly FeedPost[], limit: number = FEED_LIMIT): string {
  return takeNewest(posts, limit).map(llmsTxtLatestLine).join('\n');
}
