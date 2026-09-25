/**
 * `/comments/threads.json` (phase 2 plan §5.3): which posts may take a comment right now. The
 * comments Worker fetches this one file so it can refuse an unknown or closed slug without ever
 * reading the repository (plan D7). Regenerated on every build.
 *
 * Pure, with no `astro:content` import, so `src/lib/comment-threads.test.ts` runs it under plain
 * `node:test`; `src/pages/comments/threads.json.ts` feeds it the posts collection and the build
 * time. The same `isLive` rule that decides which posts get a page decides which appear here,
 * so the file and the site never disagree about what exists.
 */
import { isLive, type ScheduleInput } from './schedule.ts';

/** The file's format version. Bump it rather than changing a field's meaning (ADR 0004's rule). */
export const THREADS_VERSION = 1;

export type ThreadState = 'open' | 'closed';

/** The frontmatter fields the thread state depends on. A `CollectionEntry<'posts'>` satisfies this. */
export interface ThreadPost {
  id: string;
  data: ScheduleInput & {
    withdrawn?: object;
    comments?: { closed: boolean };
  };
}

export interface ThreadsFile {
  version: typeof THREADS_VERSION;
  /** When this file was generated: the build time, UTC. */
  generatedAt: string;
  /** Every live post by slug. A slug absent here has no page, so it takes no comment either. */
  threads: Record<string, ThreadState>;
}

/** Withdrawn posts are closed (plan D7); so is a post whose frontmatter says `comments: { closed: true }`. */
export function threadState(data: ThreadPost['data']): ThreadState {
  return data.withdrawn || data.comments?.closed ? 'closed' : 'open';
}

/**
 * The thread state of every live post, keyed by slug and sorted by slug so the file's bytes
 * depend only on the content. Drafts and scheduled (future) posts are absent: they have no page.
 */
export function threadStates(posts: readonly ThreadPost[], now: Date): Record<string, ThreadState> {
  const live = posts.filter((post) => isLive(post.data, now)).sort((a, b) => a.id.localeCompare(b.id));
  return Object.fromEntries(live.map((post) => [post.id, threadState(post.data)]));
}

export function buildThreadsFile(posts: readonly ThreadPost[], now: Date): ThreadsFile {
  return {
    version: THREADS_VERSION,
    generatedAt: now.toISOString(),
    threads: threadStates(posts, now),
  };
}
