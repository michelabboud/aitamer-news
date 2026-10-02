/**
 * The decisions the open-page notices make, kept apart from the DOM so they are unit-tested
 * (`src/lib/freshness.test.ts`). The script in `src/components/Freshness.astro` only fetches and shows.
 */
import type { LatestEntry, RevDocument } from './freshness.ts';

/** An open story asks whether it changed this often while its tab is visible (never in a hidden tab). */
export const POST_CHECK_MS = 5 * 60 * 1000;
/** The front page and the section pages ask for new stories this often while visible. */
export const STORIES_CHECK_MS = 2 * 60 * 1000;

export type NoticeKind = 'updated' | 'corrected' | 'withdrawn';

/** What the page was built with, read back from its own markup. */
export interface PageState {
  rev: string;
  corrections: number;
  withdrawn: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** @returns true when `value` is a well-formed `/rev/<slug>.json`; anything else is ignored, never shown. */
export function isRevDocument(value: unknown): value is RevDocument {
  return (
    isObject(value) &&
    typeof value.rev === 'string' &&
    value.rev !== '' &&
    typeof value.corrections === 'number' &&
    typeof value.withdrawn === 'boolean'
  );
}

/** @returns true when `value` is a well-formed `/latest.json`. */
export function isLatestFeed(value: unknown): value is { entries: LatestEntry[] } {
  return (
    isObject(value) &&
    Array.isArray(value.entries) &&
    value.entries.every(
      (e) => isObject(e) && typeof e.slug === 'string' && typeof e.section === 'string' && typeof e.pubDate === 'string',
    )
  );
}

/**
 * @returns which notice an open story should show, or null when it is current. A withdrawal beats a
 * correction, a correction beats a plain edit; a `rev` that differs with nothing else changed is "updated".
 */
export function noticeFor(page: PageState, live: RevDocument): NoticeKind | null {
  if (live.withdrawn && !page.withdrawn) return 'withdrawn';
  if (live.corrections > page.corrections) return 'corrected';
  if (live.rev !== page.rev) return 'updated';
  return null;
}

/** The notice's sentence. */
export function noticeText(kind: NoticeKind): string {
  if (kind === 'withdrawn') return 'This story has been withdrawn.';
  if (kind === 'corrected') return 'This story has been corrected.';
  return 'This story has been updated.';
}

/**
 * @returns how many stories are newer than the newest one the page shows, counting only `section`'s
 * when the page is a section page. `latest.json` lists a fixed number of stories, so a result equal to
 * its length means "at least that many".
 */
export function newStories(entries: readonly LatestEntry[], newestRendered: string, section?: string): number {
  const newest = Date.parse(newestRendered);
  if (Number.isNaN(newest)) return 0;
  return entries.filter((e) => (!section || e.section === section) && Date.parse(e.pubDate) > newest).length;
}

/** @returns the bar's sentence for `count` new stories (empty for none). */
export function storiesText(count: number): string {
  if (count <= 0) return '';
  return count === 1 ? '1 new story.' : `${count} new stories.`;
}
