import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FEED_LIMIT,
  JSON_FEED_VERSION,
  buildJsonFeed,
  llmsTxtLatestLine,
  llmsTxtLatestSection,
  takeNewest,
  toJsonFeedItem,
  type FeedPost,
} from './feeds.ts';

function post(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    url: 'https://aitamer.news/posts/grok-4-7/',
    title: 'Grok 4.7 keeps $2/$6 rates',
    description: 'One sentence that states the news.',
    pubDate: new Date('2026-09-25T09:15:12Z'),
    habitat: 'models',
    habitatLabel: 'Models',
    tags: ['grok-4-7', 'api-pricing'],
    ...overrides,
  };
}

test('FEED_LIMIT is the named cap every feed uses by default', () => {
  assert.equal(FEED_LIMIT, 50);
});

test('takeNewest slices to the limit and keeps order', () => {
  const posts = Array.from({ length: 5 }, (_, i) => post({ url: `https://aitamer.news/posts/p${i}/` }));
  const sliced = takeNewest(posts, 3);
  assert.deepEqual(
    sliced.map((p) => p.url),
    posts.slice(0, 3).map((p) => p.url),
  );
});

test('takeNewest defaults to FEED_LIMIT and never grows the array', () => {
  const posts = Array.from({ length: 3 }, () => post());
  assert.equal(takeNewest(posts).length, 3);
});

test('toJsonFeedItem covers the minimal required fields', () => {
  const item = toJsonFeedItem(post());
  assert.equal(item.id, 'https://aitamer.news/posts/grok-4-7/');
  assert.equal(item.url, 'https://aitamer.news/posts/grok-4-7/');
  assert.equal(item.title, 'Grok 4.7 keeps $2/$6 rates');
  assert.equal(item.summary, 'One sentence that states the news.');
  assert.equal(item.content_text, 'One sentence that states the news.');
  assert.equal(item.date_published, '2026-09-25T09:15:12.000Z');
  assert.equal(item.date_modified, undefined);
  assert.equal(item.authors, undefined);
  assert.equal(item.image, undefined);
  assert.deepEqual(item.tags, ['grok-4-7', 'api-pricing']);
  assert.deepEqual(item._aitamer, { habitat: 'models' });
});

test('toJsonFeedItem omits tags entirely when there are none', () => {
  const item = toJsonFeedItem(post({ tags: [] }));
  assert.equal(item.tags, undefined);
});

test('toJsonFeedItem carries updatedDate, author, image and the full _aitamer extension', () => {
  const item = toJsonFeedItem(
    post({
      updatedDate: new Date('2026-09-26T00:00:00Z'),
      authorName: 'Desk Bot',
      imageUrl: 'https://aitamer.news/heroes/grok-4-7-pricing.jpg',
      specimen: 12,
      wildness: { rating: 2, verified: "Rates on xAI's pricing page", claimed: "Benchmark jump is xAI's own number" },
      verdict: 'Same price, better agent scores: worth a rerun of your evals.',
      sunset: { date: new Date('2026-10-23T00:00:00Z'), what: 'grok-3 API', replacement: 'grok-4-7' },
    }),
  );
  assert.equal(item.date_modified, '2026-09-26T00:00:00.000Z');
  assert.deepEqual(item.authors, [{ name: 'Desk Bot' }]);
  assert.equal(item.image, 'https://aitamer.news/heroes/grok-4-7-pricing.jpg');
  assert.deepEqual(item._aitamer, {
    habitat: 'models',
    specimen: 12,
    wildness: { rating: 2, verified: "Rates on xAI's pricing page", claimed: "Benchmark jump is xAI's own number" },
    verdict: 'Same price, better agent scores: worth a rerun of your evals.',
    sunset: { date: '2026-10-23T00:00:00.000Z', what: 'grok-3 API', replacement: 'grok-4-7' },
  });
});

test('toJsonFeedItem drops a sunset replacement that was never set', () => {
  const item = toJsonFeedItem(post({ sunset: { date: new Date('2026-10-23T00:00:00Z'), what: 'grok-3 API' } }));
  assert.deepEqual(item._aitamer.sunset, { date: '2026-10-23T00:00:00.000Z', what: 'grok-3 API' });
  assert.ok(!('replacement' in item._aitamer.sunset!));
});

test('buildJsonFeed sets the JSON Feed 1.1 envelope and caps items', () => {
  const posts = Array.from({ length: 3 }, (_, i) => post({ url: `https://aitamer.news/posts/p${i}/` }));
  const feed = buildJsonFeed(posts, {
    title: 'AI Tamer',
    homePageUrl: 'https://aitamer.news',
    feedUrl: 'https://aitamer.news/feed.json',
    description: 'Short, sourced briefs.',
  }, 2);
  assert.equal(feed.version, JSON_FEED_VERSION);
  assert.equal(feed.title, 'AI Tamer');
  assert.equal(feed.home_page_url, 'https://aitamer.news');
  assert.equal(feed.feed_url, 'https://aitamer.news/feed.json');
  assert.equal(feed.language, 'en-us');
  assert.equal(feed.items.length, 2);
});

test('buildJsonFeed honours a custom language', () => {
  const feed = buildJsonFeed([post()], {
    title: 'AI Tamer',
    homePageUrl: 'https://aitamer.news',
    feedUrl: 'https://aitamer.news/feed.json',
    description: 'Short, sourced briefs.',
    language: 'fr',
  });
  assert.equal(feed.language, 'fr');
});

test('llmsTxtLatestLine formats a stamped post with its specimen number and habitat', () => {
  const line = llmsTxtLatestLine(post({ specimen: 12 }));
  assert.equal(
    line,
    '- [Grok 4.7 keeps $2/$6 rates](https://aitamer.news/posts/grok-4-7/): One sentence that states the news. (No. 0012, Models)',
  );
});

test('llmsTxtLatestLine falls back to the habitat alone when there is no specimen number', () => {
  const line = llmsTxtLatestLine(post());
  assert.equal(
    line,
    '- [Grok 4.7 keeps $2/$6 rates](https://aitamer.news/posts/grok-4-7/): One sentence that states the news. (Models)',
  );
});

test('llmsTxtLatestLine escapes literal brackets so the Markdown link stays valid', () => {
  const line = llmsTxtLatestLine(post({ title: 'GPT-5 [preview] ships', specimen: 3 }));
  assert.ok(line.startsWith('- [GPT-5 \\[preview\\] ships]('));
});

test('llmsTxtLatestSection joins one line per post, newest first, capped to limit', () => {
  const posts = [
    post({ url: 'https://aitamer.news/posts/a/', title: 'A', specimen: 1 }),
    post({ url: 'https://aitamer.news/posts/b/', title: 'B', specimen: 2 }),
    post({ url: 'https://aitamer.news/posts/c/', title: 'C', specimen: 3 }),
  ];
  const section = llmsTxtLatestSection(posts, 2);
  assert.equal(section, [llmsTxtLatestLine(posts[0]), llmsTxtLatestLine(posts[1])].join('\n'));
});
