// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { sitemapIncludes } from './src/lib/habitats.ts';
import { loadSitemapData, postSlugOf } from './scripts/sitemap-data.mjs';

// Two publishes of one static build:
// - Cloudflare (aitamer.news) uses the defaults: site root, no path prefix.
// - GitHub Pages is a project site, so that workflow sets ASTRO_SITE and ASTRO_BASE.
const site = process.env.ASTRO_SITE ?? 'https://aitamer.news';
const base = process.env.ASTRO_BASE ?? '/';

const postData = loadSitemapData();

export default defineConfig({
  site,
  base,
  output: 'static',
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
      filter: (page) => !/\/search\/$/.test(new URL(page).pathname) && sitemapIncludes(page) && (postData.get(postSlugOf(page) ?? '')?.listed ?? true),
      serialize: (item) => {
        const lastmod = postData.get(postSlugOf(item.url) ?? '')?.lastmod;
        return lastmod ? { ...item, lastmod: lastmod.toISOString() } : item;
      },
    }),
  ],
});
