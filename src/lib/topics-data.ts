import { getPublishedPosts } from './site';
import { buildTopics, parseTopicDetails, type Topic, type TopicDetails } from './topics.ts';

/** `src/data/topics.json`, if present: a missing file is a site with no topic details, not an error. */
const detailFiles = import.meta.glob('../data/topics.json', { eager: true, import: 'default' });

export interface TopicIndex {
  topics: Topic[];
  bySlug: Map<string, Topic>;
  /** Normalised tag → topic slug, for linking a story's tags. */
  slugByKey: Map<string, string>;
  details: Map<string, TopicDetails>;
}

let cached: Promise<TopicIndex> | undefined;

async function load(): Promise<TopicIndex> {
  const posts = await getPublishedPosts();
  const topics = buildTopics(posts.map((post) => ({ id: post.id, tags: post.data.tags })));
  const bySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  const details = parseTopicDetails(Object.values(detailFiles)[0] ?? {});
  for (const slug of details.keys()) {
    if (!bySlug.has(slug)) console.warn(`topics.json: "${slug}" is not a topic yet (fewer than five stories carry it); entry ignored`);
  }
  return { topics, bySlug, slugByKey: new Map(topics.map((topic) => [topic.key, topic.slug])), details };
}

/** The topics of the whole library, built once per build. */
export function getTopicIndex(): Promise<TopicIndex> {
  cached ??= load();
  return cached;
}
