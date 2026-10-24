// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { isHomeFeedBatchPath } from './src/lib/home-feed-discovery.ts';
import { sitemapIncludes } from './src/lib/habitats.ts';
import { isLegacyWriterAliasPath } from './src/lib/writer-pages.ts';
import { loadSitemapData, postSlugOf } from './scripts/sitemap-data.mjs';
import { topicLastmods } from './src/lib/topics.ts';
import { HERO_REMOTE_PATTERNS } from './src/lib/responsive-hero.ts';
import { plainBodyMarkdown } from './src/lib/plain-body-markdown.ts';

// Two publishes of one static build:
// - Cloudflare (aitamer.news) uses the defaults: site root, no path prefix.
// - GitHub Pages is a project site, so that workflow sets ASTRO_SITE and ASTRO_BASE.
const site = process.env.ASTRO_SITE ?? 'https://aitamer.news';
const base = process.env.ASTRO_BASE ?? '/';

const postData = loadSitemapData();
// Topic pages: `lastmod` is the newest change among the topic's stories (src/lib/topics.ts).
const topicDates = topicLastmods(
  [...postData].filter(([, entry]) => entry.listed).map(([id, entry]) => ({ id, tags: entry.tags, lastmod: entry.lastmod })),
);

/** `lastmod` for `/topics/` and `/topics/<slug>/` (page 1); later pages of a topic carry none. */
function topicPageLastmod(url) {
  const path = new URL(url).pathname.slice(base.length - 1);
  if (path === '/topics/') return topicDates.newest;
  const match = /^\/topics\/([^/]+)\/$/.exec(path);
  return match ? topicDates.bySlug.get(match[1]) : undefined;
}

export default defineConfig({
  site,
  base,
  output: 'static',
  // Local image preparation must never warm the ordinary deployment HTML cache.
  cacheDir: process.env.HERO_PREPARE_LOCAL === '1' ? './node_modules/.astro/image-preparation' : './node_modules/.astro',
  image: { remotePatterns: [...HERO_REMOTE_PATTERNS] },
  markdown: { processor: plainBodyMarkdown() },
  // Reuse HTML for unchanged getStaticPaths pages. Build concurrency must stay
  // at its default of 1, or Astro disables this cache.
  experimental: {
    incrementalBuild: true,
  },
  // Sitemap: no retired-section redirect pages, no withdrawn or scheduled posts, and each
  // post's lastmod is its newest publish, update or correction date (scripts/sitemap-data.mjs).
  integrations: [
    mdx(),
    sitemap({
      // The search page is noindex, so it stays out too.
      filter: (page) => !isHomeFeedBatchPath(new URL(page).pathname, base) && !/\/search\/$/.test(new URL(page).pathname) && !isLegacyWriterAliasPath(new URL(page).pathname, base) && sitemapIncludes(page) && (postData.get(postSlugOf(page) ?? '')?.listed ?? true),
      serialize: (item) => {
        const lastmod = postData.get(postSlugOf(item.url) ?? '')?.lastmod ?? topicPageLastmod(item.url);
        return lastmod ? { ...item, lastmod: lastmod.toISOString() } : item;
      },
    }),
  ],
});
