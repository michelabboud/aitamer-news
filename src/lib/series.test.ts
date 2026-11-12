import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERIES } from '../data/series.ts';
import { postFrontmatterJsonSchema, postSchema } from '../content/post-schema.ts';
import { readFrontmatter } from '../../scripts/frontmatter.mjs';
import {
  seriesHero,
  seriesLabel,
  seriesPartKicker,
  seriesPlacements,
  seriesProblems,
  seriesSitemapDates,
  seriesViews,
  seriesViewCacheMark,
  seriesCacheMark,
  type SeriesArc,
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

const K8S_ARCS: readonly SeriesArc[] = [
  { name: 'Foundations', start: 1, end: 12 },
  { name: 'Workloads & Troubleshooting', start: 13, end: 26 },
  { name: 'Under the Hood', start: 27, end: 38 },
  { name: 'AKS', start: 39, end: 44 },
  { name: 'EKS', start: 45, end: 50 },
  { name: 'GKE & Edge', start: 51, end: 54 },
  { name: 'Helm', start: 55, end: 60 },
  { name: 'Networking', start: 61, end: 68 },
  { name: 'Security', start: 69, end: 76 },
  { name: 'Ecosystem', start: 77, end: 86 },
  { name: 'Production Ops', start: 87, end: 97 },
  { name: 'AI & GPU', start: 98, end: 103 },
  { name: 'Certification', start: 104 },
];

test('an arc plan labels the lesson and the place inside the arc, and an open arc has no total', () => {
  const label = (lesson: number) => seriesLabel('Kubernetes from Zero', 1, 1, K8S_ARCS, lesson);
  assert.equal(label(1), 'Kubernetes from Zero · Foundations 1 of 12 · Lesson 1');
  assert.equal(label(12), 'Kubernetes from Zero · Foundations 12 of 12 · Lesson 12');
  assert.equal(label(13), 'Kubernetes from Zero · Workloads & Troubleshooting 1 of 14 · Lesson 13');
  assert.equal(label(46), 'Kubernetes from Zero · EKS 2 of 6 · Lesson 46');
  assert.equal(label(104), 'Kubernetes from Zero · Certification · Lesson 104');
  assert.equal(label(120), 'Kubernetes from Zero · Certification · Lesson 120');
  assert.equal(seriesLabel('Grok Bot tutorial', 3, 7), 'Grok Bot tutorial · Part 3 of 7');
});

test('a series with arcs keeps the fixed label when later parts are not live', () => {
  const catalog = [{ slug: 'k8s-from-zero', title: 'Kubernetes from Zero', description: 'A path.', arcs: K8S_ARCS }];
  const only = seriesPlacements([post('eks', { series: 'k8s-from-zero', seriesOrder: 46, title: 'EKS networking' })], catalog, now);
  const place = only.get('eks')!;
  assert.equal(place.label, 'Kubernetes from Zero · EKS 2 of 6 · Lesson 46');
  assert.equal(place.index, 1);
  assert.equal(place.total, 1);
  assert.equal(place.order, 46);
  assert.equal(seriesPartKicker(place.view.title, place.index, place.order, place.view.arcs), place.label);
  const withDraft = seriesPlacements([
    post('one', { series: 'k8s-from-zero', seriesOrder: 1, title: 'What Kubernetes is' }),
    post('two', { series: 'k8s-from-zero', seriesOrder: 2, draft: true, title: 'Architecture' }),
    post('eks', { series: 'k8s-from-zero', seriesOrder: 46, title: 'EKS networking' }),
  ], catalog, now);
  assert.equal(withDraft.get('one')!.label, 'Kubernetes from Zero · Foundations 1 of 12 · Lesson 1');
  assert.equal(withDraft.get('one')!.index, 1);
  assert.equal(withDraft.get('one')!.total, 2);
  assert.equal(withDraft.get('eks')!.label, 'Kubernetes from Zero · EKS 2 of 6 · Lesson 46');
  assert.equal(seriesPartKicker('Grok Bot tutorial', 2, 4), 'Part 2');
});

test('a lesson outside a fixed arc plan is reported, and a series without arcs is not', () => {
  const planned = { slug: 'planned', title: 'Planned', description: 'Closed.', arcs: [{ name: 'Foundations', start: 1, end: 2 }] };
  const problems = seriesProblems([
    post('inside', { series: 'planned', seriesOrder: 2 }),
    post('beyond', { series: 'planned', seriesOrder: 3 }),
    post('open', { series: 'grok-bot', seriesOrder: 99 }),
  ], [planned, ...SERIES]);
  assert.deepEqual(problems, ['beyond: series_order 3 is outside the arc plan for "planned"']);
});

test('the committed Kubernetes from Zero plan matches the arc map, and other series do not opt in', () => {
  const k8s = SERIES.find((meta) => meta.slug === 'k8s-from-zero');
  assert.ok(k8s);
  assert.deepEqual(k8s?.arcs, K8S_ARCS);
  for (const meta of SERIES) {
    if (meta.slug !== 'k8s-from-zero') assert.equal(meta.arcs, undefined, meta.slug);
  }
  const label = (lesson: number) => seriesLabel(k8s!.title, 1, 1, k8s!.arcs, lesson);
  assert.equal(label(1), 'Kubernetes from Zero · Foundations 1 of 12 · Lesson 1');
  assert.equal(label(12), 'Kubernetes from Zero · Foundations 12 of 12 · Lesson 12');
  assert.equal(label(13), 'Kubernetes from Zero · Workloads & Troubleshooting 1 of 14 · Lesson 13');
  assert.equal(label(46), 'Kubernetes from Zero · EKS 2 of 6 · Lesson 46');
  assert.equal(label(104), 'Kubernetes from Zero · Certification · Lesson 104');
});

test('arc edits change the series cache mark, and a series without arcs keeps the mark free of an arcs field', () => {
  const plain = seriesPlacements([post('first', { series: 'grok-bot', seriesOrder: 1 })], SERIES, now).get('first')!;
  assert.equal(Object.hasOwn(JSON.parse(seriesViewCacheMark(plain.view)), 'arcs'), false);
  const catalog = [{ slug: 'planned', title: 'Kubernetes from Zero', description: 'A path.', arcs: [{ name: 'Foundations', start: 1, end: 12 }] }];
  const before = seriesPlacements([post('one', { series: 'planned', seriesOrder: 1 })], catalog, now);
  const mark = seriesCacheMark(['one'], before);
  assert.match(mark, /Foundations/);
  const renamed = seriesPlacements([post('one', { series: 'planned', seriesOrder: 1 })], [{ ...catalog[0], arcs: [{ name: 'Basics', start: 1, end: 12 }] }], now);
  assert.notEqual(seriesCacheMark(['one'], renamed), mark);
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
  // The index lists catalog series in catalog order. A series may be in the catalog before any
  // part is live (the row lands first, ADR 0054), so the views are the catalog minus those.
  const catalogOrder = SERIES.map((meta) => meta.slug);
  const viewed = views.map((view) => view.slug);
  assert.deepEqual(viewed, catalogOrder.filter((slug) => viewed.includes(slug)));
  for (const slug of Object.keys(EXPECTED)) assert.ok(viewed.includes(slug), `${slug} still has its live parts`);
  for (const view of views) {
    // Episodes already published keep their numbers; new ones may follow them. A series this
    // list does not name yet is held to the generic rules below.
    if (EXPECTED[view.slug]) assert.deepEqual(view.parts.slice(0, EXPECTED[view.slug].length).map((part) => part.id), EXPECTED[view.slug]);
    view.parts.forEach((part, i) => {
      const place = placements.get(part.id)!;
      assert.equal(part.order, i + 1);
      assert.equal(place.label, seriesLabel(view.title, i + 1, view.parts.length, view.arcs, part.order));
      assert.equal(place.prev?.id, view.parts[i - 1]?.id);
      assert.equal(place.next?.id, view.parts[i + 1]?.id);
    });
  }
  const member = new Set(Object.values(EXPECTED).flat());
  for (const post of posts) {
    if (member.has(post.id)) assert.equal(post.seriesOrder, EXPECTED[String(post.series)].indexOf(post.id) + 1, post.id);
    else if (post.series !== undefined && EXPECTED[String(post.series)]) {
      assert.ok(Number(post.seriesOrder) > EXPECTED[String(post.series)].length, `${post.id} takes a published episode's number`);
    } else if (post.series !== undefined) assert.ok(catalogOrder.includes(String(post.series)), post.id);
  }
});

test('a series hero is omitted until it is an https URL, and a missing alt uses the title', () => {
  assert.equal(seriesHero({ title: 'Grok Bot tutorial' }), null);
  assert.equal(seriesHero({ title: 'Grok Bot tutorial', heroImage: '  ', heroAlt: 'A laptop.' }), null);
  assert.equal(seriesHero({ title: 'Grok Bot tutorial', heroImage: '/heroes/grok.jpg', heroAlt: 'A laptop.' }), null);
  const named = seriesHero({
    title: 'Grok Bot tutorial',
    heroImage: 'https://bots.aitamer.news/heroes/grok-bot-series.jpg',
    heroAlt: 'A cream laptop facing a slate computer.',
  });
  assert.deepEqual(named, {
    src: 'https://bots.aitamer.news/heroes/grok-bot-series.jpg',
    alt: 'A cream laptop facing a slate computer.',
  });
  const untitled = seriesHero({
    title: 'Grok Bot tutorial',
    heroImage: 'https://bots.aitamer.news/heroes/grok-bot-series.jpg',
  });
  assert.equal(untitled?.alt, 'Grok Bot tutorial');
  // A hero is optional (a new series may ship before its picture is on the media host); one that
  // is set is a hashed JPEG named for its own series, with its own alt text (series-catalog.ts).
  for (const series of SERIES.filter((meta) => meta.heroImage !== undefined)) {
    assert.match(String(series.heroImage), new RegExp(`^https://bots\\.aitamer\\.news/heroes/series-${series.slug}-[0-9a-f]{8}\\.jpg$`), series.slug);
    assert.ok(series.heroAlt && series.heroAlt.trim(), series.slug);
    assert.deepEqual(seriesHero(series), { src: series.heroImage, alt: series.heroAlt }, series.slug);
  }
});

test('each series has a monochrome inline icon, its own or the default, and the badge hides it from the name', () => {
  const dir = 'src/assets/series-icons';
  const files = new Set(readdirSync(dir));
  const component = readFileSync('src/components/SeriesIcon.astro', 'utf8');
  // A series a bot added has no icon of its own until a person draws one; it shows the default.
  assert.match(component, /import fallback from '\.\.\/assets\/series-icons\/default\.svg\?raw'/);
  assert.match(component, /Object\.hasOwn\(ICONS, Astro\.props\.slug\) \? ICONS\[Astro\.props\.slug\] : fallback/);
  for (const name of new Set([...SERIES.map((series) => `${series.slug}.svg`), 'default.svg'])) {
    const own = files.has(name) ? name : 'default.svg';
    if (own === name && name !== 'default.svg') assert.match(component, new RegExp(`series-icons/${name.replace('.', '\\.')}\\?raw`), `${name} is on disk but SeriesIcon.astro does not import it`);
    const svg = readFileSync(join(dir, own), 'utf8');
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /currentColor/);
    assert.doesNotMatch(svg, /<script/i);
    assert.doesNotMatch(svg, /<text[\s>]/i);
    assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}/);
  }
  const badge = readFileSync('src/components/SeriesBadge.astro', 'utf8');
  const icon = readFileSync('src/components/SeriesIcon.astro', 'utf8');
  assert.match(icon, /aria-hidden="true"/);
  assert.match(badge, /<SeriesIcon/);
  assert.match(badge, /<span>\{label\}<\/span>/);
  const page = readFileSync('src/pages/series/[slug].astro', 'utf8');
  assert.match(page, /const hero = seriesHero\(view\)/);
  assert.match(page, /\{hero && \(/);
  assert.doesNotMatch(page, /<img[^>]+src="" /);
});

test('the published JSON Schema requires the paired series fields exactly as the build does', () => {
  const schema = JSON.parse(JSON.stringify(postFrontmatterJsonSchema()));
  // Evaluate the published standard dependentRequired keyword, independently of the zod
  // refinement. Missing converter metadata must not silently accept an orphan series field.
  const acceptsDependencies = (value: Record<string, unknown>) =>
    Object.entries(schema.dependentRequired ?? {}).every(([key, required]) =>
      !(key in value) || (required as string[]).every((dependency) => dependency in value));
  for (const [fields, expected] of [
    [{}, true],
    [{ series: 'grok-bot', series_order: 1 }, true],
    [{ series: 'grok-bot' }, false],
    [{ series_order: 1 }, false],
  ] as const) {
    const input = { ...validPost, ...fields };
    assert.equal(postSchema.safeParse(input).success, expected, JSON.stringify(fields));
    assert.equal(acceptsDependencies(input), expected, `published schema: ${JSON.stringify(fields)}`);
  }
});


test('series parts retain each article hero and its alt, and hero edits invalidate the view cache', () => {
  const inputs = [
    post('first', { series: 'grok-bot', seriesOrder: 1, heroImage: 'https://media.aitamer.news/heroes/first.jpg', heroAlt: 'First cover', stamp: 'first@unchanged' }),
    post('second', { series: 'grok-bot', seriesOrder: 2, heroImage: 'https://media.aitamer.news/heroes/second.jpg', heroAlt: 'Second cover' }),
    post('no-cover', { series: 'grok-bot', seriesOrder: 3 }),
  ];
  const view = seriesPlacements(inputs, SERIES, now).get('first')!.view;
  assert.deepEqual(view.parts.map(({ id, heroImage, heroAlt }) => ({ id, heroImage, heroAlt })), [
    { id: 'first', heroImage: inputs[0].heroImage, heroAlt: 'First cover' },
    { id: 'second', heroImage: inputs[1].heroImage, heroAlt: 'Second cover' },
    { id: 'no-cover', heroImage: undefined, heroAlt: undefined },
  ]);
  const before = seriesViewCacheMark(view);
  view.parts[0].heroImage = 'https://media.aitamer.news/heroes/revised.jpg';
  assert.notEqual(seriesViewCacheMark(view), before);
  const revised = seriesViewCacheMark(view);
  view.parts[0].heroAlt = 'Revised cover';
  assert.notEqual(seriesViewCacheMark(view), revised);
});
