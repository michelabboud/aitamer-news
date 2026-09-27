/**
 * Which posts the front page shows, and where. Pure, so it runs under `node:test`.
 *
 * Every new post belongs on the front page as a full card: a reader's first question is "what's
 * new?", and a thin row in a list does not answer it. "New" is measured from the newest post, not
 * from the clock: the site is static and rebuilds only when something publishes, so a clock-based
 * window would silently go stale between builds, while this one always shows the latest batch.
 */

/** The front page features every post from this many days before the newest one. */
export const FRONT_WINDOW_DAYS = 7;
/** On a quiet week, older posts fill the front page up to this many (lead included). */
export const FRONT_MINIMUM = 7;
/** The right panel's Field log lists this many posts after the featured ones. */
export const FRONT_LOG_SIZE = 8;

const DAY_MS = 86_400_000;

export interface Dated {
  data: { pubDate: Date };
}

export interface FrontPage<T> {
  lead: T | undefined;
  /** The rest of the window (or the minimum fill), newest first, shown as cards. */
  featured: T[];
  /** The next posts after the featured ones, for the Field log. */
  log: T[];
}

/**
 * Split posts, already sorted newest first, into the lead, the featured cards and the Field log.
 * A post is in the window when it is less than `windowDays` older than the newest post.
 */
export function frontPage<T extends Dated>(
  posts: readonly T[],
  {
    windowDays = FRONT_WINDOW_DAYS,
    minimum = FRONT_MINIMUM,
    logSize = FRONT_LOG_SIZE,
  }: { windowDays?: number; minimum?: number; logSize?: number } = {},
): FrontPage<T> {
  if (!(windowDays > 0) || !Number.isInteger(minimum) || minimum < 1 || !Number.isInteger(logSize) || logSize < 0) {
    throw new Error(`frontPage: invalid options (windowDays ${windowDays}, minimum ${minimum}, logSize ${logSize})`);
  }
  for (let i = 1; i < posts.length; i++) {
    if (posts[i].data.pubDate.valueOf() > posts[i - 1].data.pubDate.valueOf()) {
      throw new Error('frontPage: posts must be sorted newest first');
    }
  }
  const [lead, ...rest] = posts;
  if (!lead) return { lead: undefined, featured: [], log: [] };

  const windowStart = lead.data.pubDate.valueOf() - windowDays * DAY_MS;
  const inWindow = rest.filter((post) => post.data.pubDate.valueOf() > windowStart).length;
  const featuredCount = Math.max(inWindow, minimum - 1);
  const featured = rest.slice(0, featuredCount);
  return { lead, featured, log: rest.slice(featured.length, featured.length + logSize) };
}
