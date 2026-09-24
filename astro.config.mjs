// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Two publishes of one static build:
// - Cloudflare (aitamer.news) uses the defaults: site root, no path prefix.
// - GitHub Pages is a project site, so that workflow sets ASTRO_SITE and ASTRO_BASE.
const site = process.env.ASTRO_SITE ?? 'https://aitamer.news';
const base = process.env.ASTRO_BASE ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [mdx(), sitemap()],
});
