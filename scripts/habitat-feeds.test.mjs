/**
 * The per-Habitat RSS feeds share /rss.xml's posts, filter and item builder, and every habitat page
 * advertises its feed. The routes need the content collection, so they are checked at the source;
 * the pure helpers are tested in src/lib/feeds.test.ts.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const routes = {
  site: read('src/pages/rss.xml.ts'),
  habitat: read('src/pages/rss/[section].xml.ts'),
  subsection: read('src/pages/rss/[section]/[subsection].xml.ts'),
};

test('every RSS route builds through the one shared rssFeed builder, from the published posts', () => {
  for (const [name, source] of Object.entries(routes)) {
    assert.match(source, /rssFeed\(\{/, `${name} uses rssFeed`);
    assert.doesNotMatch(source, /@astrojs\/rss|customData|categories:/, `${name} has no item builder of its own`);
    assert.doesNotMatch(source, /getCollection\(/, `${name} reads posts only through site.ts`);
  }
  assert.match(routes.site, /posts: await getPublishedPosts\(\)/);
  assert.match(routes.habitat, /await getPostsBySection\(section\)/);
  assert.match(routes.subsection, /inSubsection\(await getPublishedPosts\(\), section, subsection\)/);
});

test('the shared builder caps every feed at FEED_LIMIT', () => {
  const builder = read('src/lib/rss-feed.ts');
  assert.match(builder, /takeNewest\(posts, FEED_LIMIT\)/);
  assert.match(builder, /from '@astrojs\/rss'/);
});

test('getPostsBySection uses the same published filter as /rss.xml (no future or withdrawn posts)', () => {
  const site = read('src/lib/site.ts');
  assert.match(site, /export async function getPostsBySection[\s\S]*?const posts = await getPublishedPosts\(\);/);
  assert.match(site, /getCollection\('posts', \(post\) => isPublished\(post\) && !post\.data\.withdrawn\)/);
});

test('the habitat feed covers every habitat; subsection feeds come from published posts only', () => {
  assert.match(routes.habitat, /ALL_SECTIONS\.map\(\(section\) => \(\{ params: \{ section \} \}\)\)/);
  assert.match(routes.subsection, /const posts = await getPublishedPosts\(\);\s*const feeds = subsectionFeeds\(/);
});

test('each habitat page advertises its feed in the head and links it, and /feeds/', () => {
  const page = read('src/pages/section/[section].astro');
  assert.match(page, /const feedHref = withBase\(habitatFeedPath\(section\)\);/);
  assert.match(page, /<link slot="head" rel="alternate" type="application\/rss\+xml" title=\{`\$\{habitat\.name\} RSS`\} href=\{feedHref\} \/>/);
  assert.match(page, /<a href=\{feedHref\}>RSS for \{habitat\.name\}<\/a>/);
  assert.match(page, /<a href=\{withBase\('\/feeds\/'\)\}>All feeds<\/a>/);
});

test('/feeds/ lists the site-wide feeds, every habitat feed and every subsection feed', () => {
  const page = read('src/pages/feeds.astro');
  for (const path of ["'/rss.xml'", "'/feed.json'", "'/llms.txt'"]) assert.ok(page.includes(`withBase(${path})`), path);
  assert.match(page, /HABITAT_LIST\.map/);
  assert.match(page, /withBase\(habitatFeedPath\(habitat\.slug\)\)/);
  assert.match(page, /withBase\(subsectionFeedPath\(feed\.section, feed\.subsection\)\)/);
  assert.match(page, /subsectionFeeds\(posts\.map\(\(post\) => post\.data\), ALL_SECTIONS\)/);
  assert.match(read('src/layouts/BaseLayout.astro'), /<a href=\{withBase\('\/feeds\/'\)\}[^>]*>All feeds<\/a>/);
});
