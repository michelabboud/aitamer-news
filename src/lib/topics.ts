/**
 * Topic pages (`/topics/<slug>/`, ADR 0046): one page per tag that at least `TOPIC_MIN_STORIES`
 * published stories carry, gathering them in one place for readers, search engines and answer
 * engines. Pure, so `node:test` covers it; `topics-data.ts` does the loading.
 *
 * Tags are free text from writers, so a topic is a tag after normalising (case, accents, and spaces, underscores and hyphens).
 * Addresses must never change when other stories change: a tag that is already written in slug form
 * (`openai`, `grok-4-7`, which is every tag the site's writers use today) owns that plain address
 * for good, and any other tag always carries a hash of itself, so neither a new tag nor a withdrawn
 * story can move a topic.
 */
import { createHash } from 'node:crypto';

/** Stories a tag needs before it gets a page: below this a page is a thin list of two or three links. */
export const TOPIC_MIN_STORIES = 5;

/** Longest summary a maintainer may attach to a topic, in characters. */
export const TOPIC_SUMMARY_MAX = 400;

/** The longest slug before any collision suffix. */
const SLUG_MAX = 60;

/** The part of a published story that topics need. */
export interface TopicPost {
  id: string;
  tags: readonly string[];
}

export interface Topic {
  /** The normalised tag, shared by every spelling of it. */
  key: string;
  /** URL segment under `/topics/`. */
  slug: string;
  /** How readers see it: the commonest spelling among the stories, ties broken alphabetically. */
  label: string;
  /** The stories, in the order the caller gave them (newest first when called with `getPublishedPosts`). */
  postIds: string[];
}

/**
 * A tag as one comparable string: accents folded, lower case, and every run of spaces, underscores
 * and hyphens one hyphen, so `open weights`, `Open_Weights` and `open-weights` are one topic.
 */
export function topicKey(tag: string): string {
  return tag.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Code-point order: the same on every machine, unlike a locale's collation. */
const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const fullHash = (key: string) => createHash('sha256').update(key).digest('hex');

/** The readable part of a slug: ascii letters and digits joined by single hyphens. */
function slugBase(key: string): string {
  return key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, SLUG_MAX).replace(/-+$/, '');
}

/**
 * Topics for a set of published stories. Every distinct tag gets its slug first (see the file
 * header), then only tags at or above `min` stories are returned.
 */
export function buildTopics(posts: readonly TopicPost[], min: number = TOPIC_MIN_STORIES): Topic[] {
  const stories = new Map<string, { postIds: string[]; spellings: Map<string, number> }>();
  for (const post of posts) {
    const seen = new Set<string>();
    for (const tag of post.tags) {
      const key = topicKey(tag);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const entry = stories.get(key) ?? { postIds: [], spellings: new Map() };
      entry.postIds.push(post.id);
      const spelling = tag.trim().replace(/\s+/g, ' ');
      entry.spellings.set(spelling, (entry.spellings.get(spelling) ?? 0) + 1);
      stories.set(key, entry);
    }
  }

  // A tag that already is its own slug takes it; every other tag gets `<readable>-<hash of the tag>`.
  // The hash grows only if that address is somehow taken, so the result never depends on story order.
  const slugs = new Map<string, string>();
  const taken = new Set<string>();
  const keys = [...stories.keys()].sort(byCodePoint);
  for (const key of keys) {
    if (key === slugBase(key)) {
      slugs.set(key, key);
      taken.add(key);
    }
  }
  for (const key of keys) {
    if (slugs.has(key)) continue;
    const readable = slugBase(key) || 'topic';
    const digest = fullHash(key);
    let length = 8;
    while (taken.has(`${readable}-${digest.slice(0, length)}`)) length += 8;
    const slug = `${readable}-${digest.slice(0, length)}`;
    slugs.set(key, slug);
    taken.add(slug);
  }

  return [...stories]
    .filter(([, entry]) => entry.postIds.length >= min)
    .map(([key, entry]): Topic => {
      const [label] = [...entry.spellings].sort((a, b) => b[1] - a[1] || byCodePoint(a[0], b[0]))[0];
      return { key, slug: slugs.get(key) as string, label, postIds: entry.postIds };
    })
    .sort((a, b) => b.postIds.length - a.postIds.length || byCodePoint(a.label, b.label));
}

/** What a maintainer may say about a topic. Everything is optional; a missing entry is a plain listing. */
export interface TopicDetails {
  summary?: string;
  /** Wikipedia or Wikidata pages for the same subject. Only ones a person has checked belong here. */
  sameAs: string[];
}

const WIKIPEDIA = /^https:\/\/[a-z]{2,3}\.wikipedia\.org\/wiki\/[^\s?#]+$/;
const WIKIDATA = /^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `src/data/topics.json` as a map from topic slug to details; throws naming the slug that is wrong. */
export function parseTopicDetails(raw: unknown): Map<string, TopicDetails> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('topics.json must be an object keyed by topic slug');
  }
  const out = new Map<string, TopicDetails>();
  for (const [slug, entry] of Object.entries(raw)) {
    const fail = (why: string): never => {
      throw new Error(`topics.json "${slug}": ${why}`);
    };
    if (!SLUG.test(slug)) fail('the key must be a topic slug (lower case letters, digits and hyphens)');
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) fail('must be an object');
    const { summary, sameAs, ...rest } = entry as Record<string, unknown>;
    if (Object.keys(rest).length) fail(`unknown field ${Object.keys(rest).join(', ')}`);
    if (summary !== undefined) {
      if (typeof summary !== 'string' || !summary.trim()) fail('summary must be non-empty text');
      if ((summary as string).length > TOPIC_SUMMARY_MAX) fail(`summary is longer than ${TOPIC_SUMMARY_MAX} characters`);
      // eslint-disable-next-line no-control-regex
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(summary as string)) fail('summary has a control character');
    }
    if (sameAs !== undefined) {
      if (!Array.isArray(sameAs)) fail('sameAs must be a list');
      for (const url of sameAs as unknown[]) {
        if (typeof url !== 'string' || !(WIKIPEDIA.test(url) || WIKIDATA.test(url))) {
          fail(`sameAs must be a Wikipedia or Wikidata https page, got ${JSON.stringify(url)}`);
        }
      }
    }
    out.set(slug, { summary: summary as string | undefined, sameAs: (sameAs as string[] | undefined) ?? [] });
  }
  return out;
}

/** The meta description and lede of a topic page: the maintainer's summary, else a plain count. */
export function topicDescription(label: string, count: number, summary: string | undefined): string {
  return summary ?? `${count} ${count === 1 ? 'story' : 'stories'} tagged ${label} on AI Tamer, newest first.`;
}

/** The topic slug for each of a story's tags that has a page, in tag order, one link per topic. */
export function topicSlugsForTags(slugByKey: ReadonlyMap<string, string>, tags: readonly string[]): { tag: string; slug: string }[] {
  const seen = new Set<string>();
  const out: { tag: string; slug: string }[] = [];
  for (const tag of tags) {
    const slug = slugByKey.get(topicKey(tag));
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      out.push({ tag, slug });
    }
  }
  return out;
}

/**
 * When each topic page last changed, for the sitemap: the newest last-change date among the topic's
 * stories (a new story, an update or a correction all move it), and the newest of those for the
 * `/topics/` index. Run at config time over the sitemap's own view of the posts, with the same
 * floor and the same grouping as the pages, so the two cannot disagree about what a topic is.
 * Stories without a usable date are skipped; a topic with none gets no entry.
 */
export function topicLastmods(
  stories: readonly { id: string; tags: readonly string[]; lastmod: Date | null }[],
  min: number = TOPIC_MIN_STORIES,
): { bySlug: Map<string, Date>; newest: Date | undefined } {
  const dates = new Map(stories.map((story) => [story.id, story.lastmod]));
  const bySlug = new Map<string, Date>();
  let newest: Date | undefined;
  for (const topic of buildTopics(stories, min)) {
    const moments = topic.postIds.map((id) => dates.get(id)?.valueOf()).filter((v): v is number => v !== undefined);
    if (!moments.length) continue;
    const latest = new Date(Math.max(...moments));
    bySlug.set(topic.slug, latest);
    if (!newest || latest > newest) newest = latest;
  }
  return { bySlug, newest };
}

/** How many topics `llms.txt` lists by name; the rest are one link away on `/topics/`. */
export const LLMS_TOPIC_LIMIT = 30;

/** The "Topics" lines of `llms.txt`: the biggest topics, each with its story count, and a pointer to the full list. */
export function llmsTxtTopicsSection(
  topics: readonly Pick<Topic, 'slug' | 'label' | 'postIds'>[],
  url: (path: string) => string,
  limit: number = LLMS_TOPIC_LIMIT,
): string {
  const lines = topics
    .slice(0, limit)
    .map((t) => `- [${t.label}](${url(`/topics/${t.slug}/`)}): ${t.postIds.length} ${t.postIds.length === 1 ? 'story' : 'stories'}, newest first.`);
  const more = topics.length > limit ? `\n- [All ${topics.length} topics](${url('/topics/')}): every tag that ${TOPIC_MIN_STORIES} or more stories carry.` : '';
  return lines.join('\n') + more;
}
