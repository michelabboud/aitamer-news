/** Pure partitioning. Publication filtering and deterministic date/ID sorting belong to getPublishedPosts. */
export const HOME_FEED_SCHEMA = 1;
export const HOME_FIELD_LOG_SIZE = 8;
export interface HomeFeedSettings {
  initialPostCount: number;
  nextBatchSize: number;
  maxAutoBatches: number;
}
export interface HomeFeedBatch<T> { index: number; offset: number; posts: T[] }

export function validateHomeFeedSettings(settings: HomeFeedSettings): HomeFeedSettings {
  const { initialPostCount, nextBatchSize, maxAutoBatches } = settings;
  if (![initialPostCount, nextBatchSize].every((n) => Number.isSafeInteger(n) && n >= 1 && n <= 60)
    || !Number.isSafeInteger(maxAutoBatches) || maxAutoBatches < 0 || maxAutoBatches > 10) {
    throw new Error('Invalid homepage feed settings: initial/batch must be integers 1–60; cap must be 0–10');
  }
  return settings;
}

export function partitionHomeFeed<T extends { id: string; data: { pubDate: Date } }>(posts: readonly T[], settings: HomeFeedSettings) {
  validateHomeFeedSettings(settings);
  const ids = new Set<string>();
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post.id || ids.has(post.id)) throw new Error('Homepage feed contains an empty or duplicate post ID');
    ids.add(post.id);
    if (!Number.isFinite(post.data.pubDate.valueOf()) || (i > 0 && post.data.pubDate > posts[i - 1].data.pubDate)) {
      throw new Error('Homepage feed posts must be sorted newest first with valid dates');
    }
  }
  const initial = posts.slice(0, settings.initialPostCount);
  const plannedCount = Math.min(posts.length, settings.initialPostCount + settings.nextBatchSize * settings.maxAutoBatches);
  const batches: HomeFeedBatch<T>[] = [];
  for (let offset = initial.length; offset < plannedCount; offset += settings.nextBatchSize) {
    batches.push({ index: batches.length + 1, offset, posts: posts.slice(offset, Math.min(offset + settings.nextBatchSize, plannedCount)) });
  }
  return {
    lead: initial[0], initialCards: initial.slice(1), initialCount: initial.length,
    plannedCount, batches, log: posts.slice(plannedCount, plannedCount + HOME_FIELD_LOG_SIZE),
  };
}
