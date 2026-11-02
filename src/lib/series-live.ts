/**
 * Series views for pages. The rules live in `series.ts`; this file is the only one that reads
 * the posts collection.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { SERIES } from '../data/series.ts';
import { BUILD_TIME, entryStamp } from './site.ts';
import { seriesPlacements, seriesProblems, type SeriesPlacement, type SeriesPost } from './series.ts';

export function seriesPostOf(post: CollectionEntry<'posts'>): SeriesPost {
  return {
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    draft: post.data.draft,
    withdrawn: Boolean(post.data.withdrawn),
    series: post.data.series,
    seriesOrder: post.data.series_order,
    stamp: entryStamp(post),
  };
}

export function placementsFor(posts: readonly CollectionEntry<'posts'>[], now = BUILD_TIME): Map<string, SeriesPlacement> {
  return seriesPlacements(posts.map(seriesPostOf), SERIES, now);
}

/** Fail the build when a series slug is unknown or two posts share an order. */
export async function assertSeriesCollection(): Promise<void> {
  const posts = await getCollection('posts');
  const problems = seriesProblems(posts.map(seriesPostOf), SERIES);
  if (problems.length) throw new Error(problems.join('\n'));
}
