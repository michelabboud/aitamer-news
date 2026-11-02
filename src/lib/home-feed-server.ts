import { root } from 'astro:config/server';
import { getCollection } from 'astro:content';
import { HOME_FEED_SETTINGS } from '../config/home-feed.ts';
import { entryStamp } from './site';
import { partitionHomeFeed } from './home-feed.ts';
import { fingerprintHomeFeedSources, homeFeedSnapshot } from './home-feed-snapshot.ts';
import { loadHomepagePins } from './shown-pins.ts';

export async function getHomeFeed() {
  // The card and the Pinned badge share this one resolution (`shown-pins.ts`).
  const { posts, pinned, feedPosts } = await loadHomepagePins();
  const authors = await getCollection('authors');
  const authorById = new Map(authors.map((author) => [author.id, author]));
  const authorOf = (post: (typeof posts)[number]) => {
    const author = authorById.get(post.data.author.id);
    if (!author) throw new Error(`Missing author for post ${post.id}`);
    return author;
  };
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
