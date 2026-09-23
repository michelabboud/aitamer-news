// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Static site for Cloudflare Pages (free tier). No adapter required.
// https://docs.astro.build/en/guides/deploy/cloudflare/
export default defineConfig({
  site: 'https://aitamer.news',
  output: 'static',
  integrations: [mdx(), sitemap()],
});
