import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERIES } from '../data/series.ts';
import { postFrontmatterJsonSchema, postSchema } from '../content/post-schema.ts';
import { readFrontmatter } from '../../scripts/frontmatter.mjs';
import {
  seriesLabel,
  seriesPlacements,
  seriesProblems,
  seriesSitemapDates,
  seriesViews,
  type SeriesPost,
} from './series.ts';

const now = new Date('2026-11-02T12:00:00Z');

const post = (id: string, extra: Partial<SeriesPost> = {}): SeriesPost => ({
  id,
  title: id,
  description: `${id} description`,
  pubDate: new Date('2026-10-01T00:00:00Z'),
  draft: false,
  withdrawn: false,
  ...extra,
});

const validPost = {
  title: 'Grok 4.7 keeps $2/$6 rates',
  description: 'One sentence that states the news.',
  pubDate: '2026-09-25',
  section: 'models',
  author: 'desk-bot',
} as const;

test('series without series_order is rejected, and so is series_order without series', () => {
  const missing = postSchema.safeParse({ ...validPost, series: 'grok-bot' });
  assert.equal(missing.success, false);
  assert.ok(missing.success === false && missing.error.issues.some((issue) => issue.path.join('.') === 'series_order' && /required/.test(issue.message)));
  const orphan = postSchema.safeParse({ ...validPost, series_order: 2 });
  assert.equal(orphan.success, false);
  assert.ok(orphan.success === false && orphan.error.issues.some((issue) => issue.path.join('.') === 'series'));
});

test('series_order must be a positive integer and series must be a lowercase slug', () => {
  for (const series_order of [0, -1, 1.5, '2']) {
    assert.equal(postSchema.safeParse({ ...validPost, series: 'grok-bot', series_order }).success, false, String(series_order));
  }
  for (const series of ['Grok Bot', 'grok_bot', 'grok--bot', '-grok']) {
    assert.equal(postSchema.safeParse({ ...validPost, series, series_order: 1 }).success, false, series);
  }
  const ok = postSchema.safeParse({ ...validPost, series: 'grok-bot', series_order: 3 });
  assert.equal(ok.success, true);
  assert.equal(ok.success && ok.data.series_order, 3);
});

test('a post with neither series field still passes, and the published schema leaves both optional', () => {
  assert.equal(postSchema.safeParse(validPost).success, true);
  const schema = postFrontmatterJsonSchema() as { properties: Record<string, unknown>; required: string[] };
  assert.ok(schema.properties.series);
  assert.ok(schema.properties.series_order);
  assert.equal(schema.required.includes('series'), false);
  assert.equal(schema.required.includes('series_order'), false);
});

test('duplicate order in one series fails, and the same order in another series does not', () => {
  const posts = [
    post('a', { series: 'grok-bot', seriesOrder: 1 }),
    post('b', { series: 'grok-bot', seriesOrder: 1 }),
    post('c', { series: 'vectors-plainly', seriesOrder: 1 }),
  ];
  const problems = seriesProblems(posts, SERIES);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /grok-bot/);
  assert.match(problems[0], /order 1/);
  assert.match(problems[0], /a, b/);
});

test('an unknown slug, a gap, and a non-integer are reported on their own', () => {
  const problems = seriesProblems(
    [
      post('a', { series: 'not-a-series', seriesOrder: 1 }),
      post('b', { series: 'grok-bot', seriesOrder: 1 }),
      post('c', { series: 'grok-bot', seriesOrder: 4 }),
      post('d', { series: 'grok-bot', seriesOrder: 1.5 }),
      post('e', { series: 'grok-bot' }),
    ],
    SERIES,
  );
  assert.ok(problems.some((line) => line.startsWith('a:') && /not in the series catalog/.test(line)));
  assert.ok(problems.some((line) => line.startsWith('d:') && /positive integer/.test(line)));
  assert.ok(problems.some((line) => line.startsWith('e:') && /series_order is required/.test(line)));
  assert.equal(problems.some((line) => /order 4/.test(line) && /used by/.test(line)), false);
});

test('live parts follow series_order, skip what is not live, and renumber the badge', () => {
  const posts = [
    post('third', { series: 'grok-bot', seriesOrder: 3, pubDate: new Date('2026-10-03T00:00:00Z'), title: 'Third' }),
    post('draft', { series: 'grok-bot', seriesOrder: 2, draft: true, title: 'Draft' }),
    post('future', { series: 'grok-bot', seriesOrder: 4, pubDate: new Date('2026-12-01T00:00:00Z'), title: 'Future' }),
    post('gone', { series: 'grok-bot', seriesOrder: 5, withdrawn: true, title: 'Gone' }),
    post('first', { series: 'grok-bot', seriesOrder: 1, pubDate: new Date('2026-10-09T00:00:00Z'), title: 'First' }),
  ];
  const placements = seriesPlacements(posts, SERIES, now);
  assert.deepEqual([...placements.keys()], ['first', 'third']);
  const first = placements.get('first')!;
  const third = placements.get('third')!;
  assert.equal(first.label, 'Grok Bot tutorial · Part 1 of 2');
  assert.equal(third.label, seriesLabel('Grok Bot tutorial', 2, 2));
  assert.equal(first.next?.id, 'third');
  assert.equal(third.prev?.id, 'first');
  assert.equal(first.prev, undefined);
  assert.equal(third.next, undefined);
  assert.equal(first.order, 1);
  assert.equal(third.order, 3);
  assert.deepEqual(seriesViews(placements).map((view) => view.slug), ['grok-bot']);
});

test('a series with no live part is left off the index, and sitemap dates use listed parts only', () => {
  const placements = seriesPlacements(
    [post('soon', { series: 'ai-voice-models', seriesOrder: 1, pubDate: new Date('2026-12-01T00:00:00Z') })],
    SERIES,
    now,
  );
  assert.equal(placements.size, 0);
  const published = new Date('2026-10-02T00:00:00Z');
  const later = new Date('2026-10-20T00:00:00Z');
  const dates = seriesSitemapDates([
    { listed: true, lastmod: published, series: 'grok-bot' },
    { listed: true, lastmod: later, series: 'grok-bot' },
    { listed: false, lastmod: new Date('2026-11-01T00:00:00Z'), series: 'grok-bot' },
    { listed: true, lastmod: published, series: null },
  ]);
  assert.equal(dates.bySlug.get('grok-bot')?.toISOString(), later.toISOString());
  assert.equal(dates.newest?.toISOString(), later.toISOString());
});

function loadPosts(): SeriesPost[] {
  const dir = 'src/content/posts';
  return readdirSync(dir).flatMap((name) => {
    if (!/\.mdx?$/.test(name)) return [];
    const fm = readFrontmatter(readFileSync(join(dir, name), 'utf8'));
    if (fm === null) throw new Error(`${name} has no frontmatter`);
    const data = fm.data as Record<string, unknown>;
    const pubDate = data.pubDate instanceof Date ? data.pubDate : new Date(String(data.pubDate));
    return [{
      id: name.replace(/\.mdx?$/, ''),
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      pubDate,
      draft: data.draft === true,
      withdrawn: Boolean(data.withdrawn),
      series: data.series,
      seriesOrder: data.series_order,
    }];
  });
}

const EXPECTED: Record<string, readonly string[]> = {
  'grok-bot': [
    'what-is-grok-bot',
    'grok-bot-computer-the-box',
    'grok-bot-routines-scheduler',
    'grok-bot-connectors-channels',
    'grok-bot-groups-teammates',
    'grok-bot-plans-pricing-usage',
    'grok-bot-cowork-with-cursor',
    'grok-bot-personal-use-cases',
    'grok-bot-for-business',
    'grok-bot-project-gallery',
    'grok-bot-gmail-and-sending',
    'grok-bot-privacy-security',
    'grok-bot-getting-started',
    'grok-bot-skills-and-memory',
    'grok-bot-computer-recovery',
    'grok-bot-files-and-voice',
    'grok-bot-tag-on-x',
    'grok-bot-pages',
    'grok-bot-vault-and-1password',
    'grok-bot-images-and-video',
    'grok-bot-x-chat',
    'grok-bot-on-your-phone',
  ],
  'ai-image-models': [
    'ai-image-models-flux',
    'ai-image-models-nano-banana-vs-gpt-image',
    'ai-image-models-grok-imagine',
    'ai-image-models-midjourney-vs-ideogram',
  ],
  'ai-movie-models': [
    'ai-movie-models-kling',
    'ai-movie-models-gemini-omni-vs-utopai-x',
    'ai-movie-models-grok-imagine',
    'ai-movie-models-runway-vs-luma',
  ],
  'ai-voice-models': [
    'ai-voice-models-elevenlabs',
    'ai-voice-models-openai-vs-gemini-tts',
    'ai-voice-models-grok-voice',
  ],
  'vectors-plainly': [
    'vectors-plainly-1-what-a-vector-database-is',
    'vectors-plainly-2-inside-the-index',
    'vectors-plainly-3-multi-tenancy',
    'vectors-plainly-4-retrieval-quality',
    'vectors-plainly-5-rag-and-graphrag',
    'vectors-plainly-6-production',
  ],
};

test('published posts use known series, unique orders, and the episode order the posts already name', () => {
  const posts = loadPosts();
  assert.deepEqual(seriesProblems(posts, SERIES), []);
  const placements = seriesPlacements(posts, SERIES, now);
  const views = seriesViews(placements);
  assert.deepEqual(views.map((view) => view.slug), SERIES.map((meta) => meta.slug));
  for (const view of views) {
    assert.deepEqual(view.parts.map((part) => part.id), EXPECTED[view.slug]);
    view.parts.forEach((part, i) => {
      const place = placements.get(part.id)!;
      assert.equal(part.order, i + 1);
      assert.equal(place.label, seriesLabel(view.title, i + 1, view.parts.length));
      assert.equal(place.prev?.id, view.parts[i - 1]?.id);
      assert.equal(place.next?.id, view.parts[i + 1]?.id);
    });
  }
  const member = new Set(Object.values(EXPECTED).flat());
  for (const post of posts) {
    if (member.has(post.id)) assert.equal(post.seriesOrder, EXPECTED[String(post.series)].indexOf(post.id) + 1, post.id);
    else assert.equal(post.series, undefined, post.id);
  }
});
