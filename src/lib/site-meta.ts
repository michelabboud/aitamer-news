/**
 * Site identity, kept apart from `site.ts` because it has to stay pure: no `astro:content`
 * import, so a module that only needs `SITE.url` or `SITE.domain` — such as the post contract's
 * schema file, and that file's own tests — can import this directly without pulling in the Astro
 * runtime. `site.ts` re-exports `SITE` from here for everyone else.
 */
export const SITE = {
  title: 'AI Tamer',
  domain: 'aitamer.news',
  description:
    'Short, sourced briefs on models, dev, tools, DevOps and Rust. Every story names a human, an AI writer or a bot.',
  url: 'https://aitamer.news',
} as const;
