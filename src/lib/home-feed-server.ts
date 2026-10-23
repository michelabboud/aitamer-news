import { root } from 'astro:config/server';
import { getCollection } from 'astro:content';
import { HOME_FEED_SETTINGS } from '../config/home-feed.ts';
import { entryStamp, getPublishedPosts } from './site';
import { partitionHomeFeed } from './home-feed.ts';
import { fingerprintHomeFeedSources, homeFeedSnapshot } from './home-feed-snapshot.ts';

export async function getHomeFeed() {
  const posts = await getPublishedPosts();
  const authors = await getCollection('authors');
  const authorById = new Map(authors.map((author) => [author.id, author]));
  const authorOf = (post: (typeof posts)[number]) => {
    const author = authorById.get(post.data.author.id);
    if (!author) throw new Error(`Missing author for post ${post.id}`);
    return author;
  };
  const partition = partitionHomeFeed(posts, HOME_FEED_SETTINGS);
  const consumedAuthors = new Map(posts.slice(0, partition.plannedCount).map((post) => {
    const author = authorOf(post);
    return [author.id, entryStamp(author)];
  }));
  const snapshot = homeFeedSnapshot({
    settings: HOME_FEED_SETTINGS, postStamps: posts.map(entryStamp),
    authorStamps: [...consumedAuthors.values()], renderingSource: await fingerprintHomeFeedSources(root),
    renderContext: { base: import.meta.env.BASE_URL, mediaBase: import.meta.env.PUBLIC_MEDIA_BASE?.trim() ?? '' },
  });
  return { ...partition, posts, authors, authorOf, snapshot, settings: HOME_FEED_SETTINGS };
}
