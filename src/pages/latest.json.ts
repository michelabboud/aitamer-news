import { latestEntries } from '../lib/freshness';
import { getPublishedPosts } from '../lib/site';

/**
 * The newest stories, for the "new stories" bar. Built from the same published list as every page, so a
 * scheduled story appears here exactly when it appears on a page. Not `/feed.json`: that carries every body.
 */
export async function GET() {
  return Response.json({ entries: latestEntries(await getPublishedPosts()) });
}
