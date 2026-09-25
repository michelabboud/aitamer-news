import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { buildThreadsFile } from '../../lib/comment-threads';
import { BUILD_TIME } from '../../lib/site';

/**
 * `/comments/threads.json` (phase 2 plan §5.3): every live post's slug with its thread state,
 * `open` or `closed`. The comments Worker reads this file (with a short edge cache) to refuse a
 * comment for a slug that has no page or whose thread is closed, so it never needs to read the
 * repository; when it cannot fetch the file it refuses every comment (fails closed).
 *
 * The rule is `src/lib/comment-threads.ts`; this route only feeds it the posts collection and the
 * build time `src/lib/site.ts` captured, so the file lists exactly the posts that got a page.
 */
export async function GET(_context: APIContext) {
  const posts = await getCollection('posts');
  return new Response(JSON.stringify(buildThreadsFile(posts, BUILD_TIME), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
