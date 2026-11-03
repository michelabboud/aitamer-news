/**
 * The homepage's pin card, decided once per build (plan docs/plans/2026-10-31-top-nav-and-pinning.md).
 * Pure, so `npm test` runs it; `shown-pins.ts` feeds it the published posts and the pins file, and
 * the homepage card and the Pinned badge both read that one result.
 *
 * - The lead story is the newest post, pinned or not. A pinned post that is already the lead is not
 *   repeated in the card, and it carries no Pinned badge.
 * - A post in the card is not repeated in the feed below it, nor in the Field log, nor in the
 *   batches the browser loads later; it stays in every other list (its habitat, News, the archive),
 *   where the badge marks it.
 */
import { selectPinned, type DroppedPin, type PinsFile } from './pins.ts';

export function splitPinned<T extends { id: string }>(posts: readonly T[], file: PinsFile, now: Date) {
  const lead = posts[0];
  const byId = new Map(posts.map((post) => [post.id, post]));
  // The lead is left out before the slots are filled, so a pinned lead never costs the card a slot.
  const candidates = { ...file, pins: file.pins.filter((pin) => pin.slug !== lead?.id) };
  const { shown, dropped } = selectPinned(candidates, new Set(byId.keys()), now);
  const pinned = shown.map((pin) => byId.get(pin.slug)!);
  const pinnedIds = new Set(pinned.map((post) => post.id));
  return { pinned, feedPosts: posts.filter((post) => !pinnedIds.has(post.id)), dropped };
}

/** One line per pin the build had to drop because its post is not live: worth a person's look. */
export function droppedPinWarnings(dropped: readonly DroppedPin[]): string[] {
  return dropped
    .filter((pin) => pin.reason === 'unpublished')
    .map((pin) => `pins: "${pin.slug}" is pinned but is not a published post; the homepage leaves it out. Unpin it with npm run unpin -- ${pin.slug}`);
}

/**
 * The card and the set the Pinned badge tests. `pinned` is the card, in card order. `ids` is those
 * same posts. Membership follows {@link splitPinned}: active pins only, `until` included, two slots,
 * manual before auto, and a pinned lead left out.
 */
export function resolvePinCard<T extends { id: string }>(posts: readonly T[], file: PinsFile, now: Date) {
  const split = splitPinned(posts, file, now);
  return { ...split, ids: new Set(split.pinned.map((post) => post.id)) };
}

/** Ids of the posts the homepage pin card is showing. The badge is on exactly these. */
export function pinCardIdSet<T extends { id: string }>(posts: readonly T[], file: PinsFile, now: Date): ReadonlySet<string> {
  return resolvePinCard(posts, file, now).ids;
}

/**
 * Incremental-build fragment for a page that draws the badge. Names only the ids on this page that
 * the card is showing, in slug order, so a pin change re-renders the pages whose label changes.
 */
export function pinCacheMark(ids: readonly string[], shown: ReadonlySet<string>): string {
  return `pin-card:${ids.filter((id) => shown.has(id)).sort().join(',')}`;
}
