/**
 * How the site writes dates and times, always in UTC so a page reads the same everywhere it is
 * built and every reader sees the same stamp. Pure (no `astro:*` import), so the browser's comment
 * renderer and the comments loader use the very functions the server pages use, and the two
 * renderers cannot drift (task S3 of docs/plans/2026-10-24-comments-on-r2.md). `site.ts`
 * re-exports them for everyone else.
 */

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Publish date and time for the article byline, in UTC, e.g. "Sep 24, 2026, 09:15 UTC". */
export function formatDateTime(date: Date): string {
  const stamp = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  });
  return `${stamp} UTC`;
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  });
}

/** "SEP 23", in UTC. */
export function formatShortDate(date: Date): string {
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    .toUpperCase();
}
