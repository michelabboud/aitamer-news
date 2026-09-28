/**
 * Site identity, kept apart from `site.ts` because it has to stay pure: no `astro:content`
 * import, so a module that only needs `SITE.url` or `SITE.domain` — such as the post contract's
 * schema file, and that file's own tests — can import this directly without pulling in the Astro
 * runtime. `site.ts` re-exports `SITE` from here for everyone else.
 */
export const SITE = {
  title: 'AI Tamer',
  domain: 'aitamer.news',
  /** The name a share preview or a browser tab shows for the home page. */
  homeTitle: 'AI Tamer News · A field guide to the machines',
  description:
    'Sourced AI news for builders: models, dev tools, DevOps and Rust, each story rated from hype to verified and signed by its human, AI or bot writer.',
  url: 'https://aitamer.news',
} as const;
