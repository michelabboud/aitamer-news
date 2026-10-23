import { satteri } from '@astrojs/markdown-satteri';

type Processor = ReturnType<typeof satteri>;
type SharedOptions = Parameters<Processor['createRenderer']>[0];

/** Preserve plain body media independently of the global rules needed by HeroImage's getImage. */
function bodyImageSettings(shared: SharedOptions): SharedOptions {
  return { ...shared, image: { ...shared.image, domains: [], remotePatterns: [] } };
}

/** Public processor adapter: keep genuine Sätteri rendering, plugins, features and local-image checks. */
export function plainBodyMarkdown(options: Parameters<typeof satteri>[0] = {}): Processor {
  const engine = satteri(options);
  const createMdxRenderer = engine.createMdxRenderer;
  if (!createMdxRenderer) throw new Error('The installed Sätteri processor does not support MDX');
  // Astro serializes options into both content and incremental cache digests; function bodies vanish.
  Object.assign(engine.options, { aitamerRemoteImagePolicy: 'passthrough-v1' });
  return {
    name: engine.name,
    options: engine.options,
    createRenderer: (shared) => engine.createRenderer(bodyImageSettings(shared)),
    createMdxRenderer: (shared, mdx) => createMdxRenderer.call(engine, bodyImageSettings(shared), mdx),
  };
}
