import { satteri } from '@astrojs/markdown-satteri';
import { codeRailPlans, codeRailPlugin } from './code-rail-plugin.ts';
import type { CodeRailPlan } from './code-rail.ts';

type Processor = ReturnType<typeof satteri>;
type SharedOptions = Parameters<Processor['createRenderer']>[0];

/** Preserve plain body media independently of the global rules needed by HeroImage's getImage. */
function bodyImageSettings(shared: SharedOptions): SharedOptions {
  return { ...shared, image: { ...shared.image, domains: [], remotePatterns: [] } };
}

/** Public processor adapter: keep genuine Sätteri rendering, plugins, features and local-image checks. */
export function plainBodyMarkdown(options: Parameters<typeof satteri>[0] = {}): Processor {
  const engine = satteri({
    ...options,
    mdastPlugins: [...(options.mdastPlugins ?? []), codeRailPlugin],
  });
  const createMdxRenderer = engine.createMdxRenderer;
  if (!createMdxRenderer) throw new Error('The installed Sätteri processor does not support MDX');
  // Astro serializes options into both content and incremental cache digests; function bodies vanish.
  Object.assign(engine.options, { aitamerRemoteImagePolicy: 'passthrough-v1', aitamerCodeRail: 'ast-plan-v1' });
  const withPlan = async <T extends { metadata?: Record<string, unknown> }>(render: () => Promise<T>): Promise<T> => {
    const plan: CodeRailPlan = { blocks: [], rails: [] };
    const result = await codeRailPlans.run(plan, render);
    if (plan.blocks.some((block) => block.railId) || plan.rails.length) {
      result.metadata = { ...result.metadata, codeRailPlan: plan };
    }
    return result;
  };
  return {
    name: engine.name,
    options: engine.options,
    createRenderer: async (shared) => {
      const renderer = await engine.createRenderer(bodyImageSettings(shared));
      return { ...renderer, render: (content, opts) => withPlan(() => renderer.render(content, opts)) };
    },
    createMdxRenderer: async (shared, mdx) => {
      const renderer = await createMdxRenderer.call(engine, bodyImageSettings(shared), mdx);
      return { ...renderer, render: (content, opts) => withPlan(() => renderer.render(content, opts)) };
    },
  };
}
