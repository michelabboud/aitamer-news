/**
 * The homepage's pin card, decided once per build (plan docs/plans/2026-10-31-top-nav-and-pinning.md).
 * Pure, so `npm test` runs it; `home-feed-server.ts` feeds it the published posts and the pins file.
 *
 * - The lead story is the newest post, pinned or not. A pinned post that is already the lead is not
 *   repeated in the card.
 * - A post in the card is not repeated in the feed below it, nor in the Field log, nor in the
 *   batches the browser loads later; it stays in every other list (its habitat, News, the archive).
 */
import { selectPinned, type DroppedPin, type PinsFile } from './pins.ts';

export function splitPinned<T extends { id: string }>(posts: readonly T[], file: PinsFile, now: Date) {
  const lead = posts[0];
  const byId = new Map(posts.map((post) => [post.id, post]));
  const { shown, dropped } = selectPinned(file, new Set(byId.keys()), now);
  const pinned = shown.filter((pin) => pin.slug !== lead?.id).map((pin) => byId.get(pin.slug)!);
  const pinnedIds = new Set(pinned.map((post) => post.id));
  return { pinned, feedPosts: posts.filter((post) => !pinnedIds.has(post.id)), dropped };
}

/** One line per pin the build had to drop because its post is not live: worth a person's look. */
export function droppedPinWarnings(dropped: readonly DroppedPin[]): string[] {
  return dropped
    .filter((pin) => pin.reason === 'unpublished')
    .map((pin) => `pins: "${pin.slug}" is pinned but is not a published post; the homepage leaves it out. Unpin it with npm run unpin -- ${pin.slug}`);
}
