import { getPublishedPosts } from './site';
import { buildTopics, parseTopicDetails, topicKey, type Topic, type TopicDetails } from './topics.ts';

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

/** The topic slug for each of a story's tags that has a page, in tag order, without repeats. */
export function topicSlugsForTags(index: TopicIndex, tags: readonly string[]): { tag: string; slug: string }[] {
  const seen = new Set<string>();
  const out: { tag: string; slug: string }[] = [];
  for (const tag of tags) {
    const slug = index.slugByKey.get(topicKey(tag));
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      out.push({ tag, slug });
    }
  }
  return out;
}
