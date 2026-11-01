import { root } from 'astro:config/server';
import { getCollection } from 'astro:content';
import { HOME_FEED_SETTINGS } from '../config/home-feed.ts';
import { BUILD_TIME, entryStamp, getPublishedPosts } from './site';
import { partitionHomeFeed } from './home-feed.ts';
import { fingerprintHomeFeedSources, homeFeedSnapshot } from './home-feed-snapshot.ts';
import { droppedPinWarnings, splitPinned } from './home-pins.ts';
import { parsePinsFile } from './pins.ts';
import pinsFile from '../data/pins.json' with { type: 'json' };

/** Pins expire on the same clock that decides which posts are live (`site.ts`). */
let warned = false;

export async function getHomeFeed() {
  const posts = await getPublishedPosts();
  const authors = await getCollection('authors');
  const authorById = new Map(authors.map((author) => [author.id, author]));
  const authorOf = (post: (typeof posts)[number]) => {
    const author = authorById.get(post.data.author.id);
    if (!author) throw new Error(`Missing author for post ${post.id}`);
    return author;
  };
  // A broken pins file fails the build (it only gets in through a pin PR whose own check failed);
  // a pin naming a post that is not live is left out with a warning, so it never blocks a ship.
  const { pinned, feedPosts } = splitPinnedOnce(posts);
  const partition = partitionHomeFeed(feedPosts, HOME_FEED_SETTINGS);
  const consumedAuthors = new Map(feedPosts.slice(0, partition.plannedCount).map((post) => {
    const author = authorOf(post);
    return [author.id, entryStamp(author)];
  }));
  const snapshot = homeFeedSnapshot({
    settings: HOME_FEED_SETTINGS, postStamps: feedPosts.map(entryStamp),
    authorStamps: [...consumedAuthors.values()], renderingSource: await fingerprintHomeFeedSources(root),
    renderContext: { base: import.meta.env.BASE_URL, mediaBase: import.meta.env.PUBLIC_MEDIA_BASE?.trim() ?? '' },
  });
  return { ...partition, posts, feedPosts, pinned, authors, authorOf, snapshot, settings: HOME_FEED_SETTINGS };
}

function splitPinnedOnce<T extends { id: string }>(posts: readonly T[]) {
  const split = splitPinned(posts, parsePinsFile(pinsFile), BUILD_TIME);
  if (!warned) {
    warned = true;
    for (const line of droppedPinWarnings(split.dropped)) console.warn(line);
  }
  return split;
}
