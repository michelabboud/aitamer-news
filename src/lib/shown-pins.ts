/**
 * One pin-card resolution per build, shared by the homepage card and the Pinned badge
 * (`resolvePinCard` in `home-pins.ts`). Pins expire on the same clock that decides which posts
 * are live (`BUILD_TIME` in `site.ts`). A broken pins file fails the build; a pin whose post is
 * not live warns once and is left out.
 */
import { BUILD_TIME, getPublishedPosts } from './site.ts';
import { droppedPinWarnings, resolvePinCard } from './home-pins.ts';
import { parsePinsFile } from './pins.ts';
import pinsFile from '../data/pins.json' with { type: 'json' };

type Published = Awaited<ReturnType<typeof getPublishedPosts>>[number];

export interface HomepagePins {
  posts: readonly Published[];
  pinned: readonly Published[];
  feedPosts: readonly Published[];
  /** The posts the card is showing. The badge renders only for these ids. */
  ids: ReadonlySet<string>;
}

let cached: Promise<HomepagePins> | undefined;

export function loadHomepagePins(): Promise<HomepagePins> {
  if (!cached) {
    cached = (async () => {
      const posts = await getPublishedPosts();
      const resolved = resolvePinCard(posts, parsePinsFile(pinsFile), BUILD_TIME);
      for (const line of droppedPinWarnings(resolved.dropped)) console.warn(line);
      return { posts, pinned: resolved.pinned, feedPosts: resolved.feedPosts, ids: resolved.ids };
    })();
  }
  return cached;
}
