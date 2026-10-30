/**
 * Machine-readable feeds: shared shapes and pure builders for `/rss.xml`, the per-Habitat feeds
 * under `/rss/` (`src/pages/rss/`), `/feed.json` and `/llms.txt`. No Astro imports, so `npm test` can run this directly against plain objects;
 * the pages under `src/pages/*.ts` do the Astro-side work (resolving authors, canonical URLs,
 * absolute image URLs) and hand the result to these functions.
 *
 * Every feed is capped to the newest `FEED_LIMIT` posts: at a 10,000-post scale, an uncapped
 * feed or a page per post would blow past Cloudflare Pages' 20,000-files-per-deploy limit on
 * the free plan, and nobody reads post 9,000 of an RSS feed anyway.
 */
import { formatSpecimen } from './specimen.ts';

/**
 * Newest posts kept in every feed (the site-wide RSS, each per-Habitat RSS feed, JSON Feed and
 * llms.txt's "Latest" list). Raised from 50 to 100 on 2026-10-28, when the per-Habitat feeds were
 * added: about a week of posts at the current pace.
 */
export const FEED_LIMIT = 100;

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
  /** When the story last changed: its update date or newest correction (`article-dates.ts`). */
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

/** RSS 2.0 has no modified date of its own; Dublin Core Terms' `modified` is the usual namespaced one. */
export const RSS_MODIFIED_NAMESPACE = { dcterms: 'http://purl.org/dc/terms/' } as const;

/** An RSS item's `<dcterms:modified>` (W3CDTF, UTC), or nothing for a story that never changed. */
export function rssModifiedData(changed: Date | undefined): string | undefined {
  return changed ? `<dcterms:modified>${changed.toISOString()}</dcterms:modified>` : undefined;
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

/** One `llms.txt` "Latest" line: `- [title](url): description (No. 0012, Habitat; by Name, a bot)`. */
export function llmsTxtLatestLine(post: FeedPost): string {
  const label =
    post.specimen !== undefined
      ? `No. ${formatSpecimen(post.specimen)}, ${post.habitatLabel}`
      : post.habitatLabel;
  // The byline, with the author's kind spelled out: the site's promise is that a reader, human or
  // machine, always knows whether a person, an AI writer or a bot wrote the story.
  const byline = post.authorName ? `; by ${post.authorName}` : '';
  return `- [${escapeMarkdownLinkText(post.title)}](${post.url}): ${post.description} (${label}${byline})`;
}

/** The whole "Latest" section body (one line per post, newline-joined), capped to `limit`. */
export function llmsTxtLatestSection(posts: readonly FeedPost[], limit: number = FEED_LIMIT): string {
  return takeNewest(posts, limit).map(llmsTxtLatestLine).join('\n');
}

/**
 * Per-Habitat RSS feeds: `/rss/<section>.xml` for every habitat and `/rss/<section>/<subsection>.xml`
 * for every subsection a published post uses. `subsection` is free text in frontmatter, so only a
 * lowercase slug (after trimming and lower-casing) gets a feed; anything else stays only in its
 * habitat's feed and the site-wide one.
 */
const FEED_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A frontmatter `subsection` as its feed slug, or undefined when it cannot name a feed path. */
export function subsectionFeedSlug(subsection: string | undefined): string | undefined {
  const slug = subsection?.trim().toLowerCase();
  return slug && slug.length <= 60 && FEED_SLUG.test(slug) ? slug : undefined;
}

/** Site-relative path of a habitat's feed (callers add the base path). */
export function habitatFeedPath(section: string): string {
  return `/rss/${section}.xml`;
}

/** Site-relative path of a subsection's feed (callers add the base path). */
export function subsectionFeedPath(section: string, subsection: string): string {
  return `/rss/${section}/${subsection}.xml`;
}

export interface SubsectionFeed {
  section: string;
  subsection: string;
  /** Published posts in it (the feed itself is still capped at `FEED_LIMIT`). */
  count: number;
}

/**
 * Every (habitat, subsection) pair that gets a feed, from posts already filtered to published.
 * Sorted by habitat in `sectionOrder`, then subsection name, so pages and tests see a stable list.
 */
export function subsectionFeeds(
  posts: readonly { section: string; subsection?: string }[],
  sectionOrder: readonly string[],
): SubsectionFeed[] {
  const counts = new Map<string, SubsectionFeed>();
  for (const post of posts) {
    const subsection = subsectionFeedSlug(post.subsection);
    if (!subsection) continue;
    const key = `${post.section}/${subsection}`;
    const feed = counts.get(key) ?? { section: post.section, subsection, count: 0 };
    feed.count += 1;
    counts.set(key, feed);
  }
  const rank = (section: string) => {
    const index = sectionOrder.indexOf(section);
    return index === -1 ? sectionOrder.length : index;
  };
  return [...counts.values()].sort(
    (a, b) => rank(a.section) - rank(b.section) || a.section.localeCompare(b.section) || a.subsection.localeCompare(b.subsection),
  );
}

/** Posts that belong in one subsection's feed. `posts` keeps its newest-first order. */
export function inSubsection<T extends { data: { section: string; subsection?: string } }>(
  posts: readonly T[],
  section: string,
  subsection: string,
): T[] {
  return posts.filter((post) => post.data.section === section && subsectionFeedSlug(post.data.subsection) === subsection);
}
