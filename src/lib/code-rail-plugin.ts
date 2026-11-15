/**
 * Read rails from the Markdown AST the renderer is about to highlight.
 * Sidecar fences are removed. A `rail=<id>` token is removed from the info string.
 * Every other code node, including indented code and a fence inside a blockquote, is
 * recorded in visit order so the page can wrap the matching `<pre>`.
 * A post with no rail is not mutated, so the rendered-body gate sees the same HTML as before.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { defineMdastPlugin, type PluginFactoryContext } from 'satteri';
import { parseRailDocument, railIdFromMeta, stripRailMeta, type CodeRailPlan, CodeRailError } from './code-rail.ts';

export const codeRailPlans = new AsyncLocalStorage<CodeRailPlan>();

const plugin = defineMdastPlugin({
  name: 'aitamer-code-rail',
  code(node, context) {
    const plan = codeRailPlans.getStore();
    if (node.lang === 'rail') {
      const rail = parseRailDocument(node.value, 'a rail sidecar');
      if (plan?.rails.some((item) => item.id === rail.id)) throw new CodeRailError(`rail id "${rail.id}" is used twice`);
      plan?.rails.push(rail);
      context.removeNode(node);
      return;
    }
    const railId = railIdFromMeta(node.meta);
    if (railId) {
      const meta = stripRailMeta(node.meta ?? '');
      context.setProperty(node, 'meta', meta.length ? meta : null);
    }
    plan?.blocks.push({
      lang: node.lang ?? '',
      code: node.value.replace(/\n$/, ''),
      ...(railId ? { railId } : {}),
    });
  },
  after(_root, _context) {
    const plan = codeRailPlans.getStore();
    if (!plan) return;
    const known = new Set<string>();
    for (const rail of plan.rails) {
      if (known.has(rail.id)) throw new CodeRailError(`rail id "${rail.id}" is used twice`);
      known.add(rail.id);
    }
    const used = new Set<string>();
    for (const block of plan.blocks) {
      if (!block.railId) continue;
      if (!known.has(block.railId)) throw new CodeRailError(`code fence rail=${block.railId} has no rail sidecar`);
      used.add(block.railId);
    }
    for (const rail of plan.rails) {
      if (!used.has(rail.id)) throw new CodeRailError(`rail sidecar "${rail.id}" is not referenced by a code fence`);
    }
  },
});

export function codeRailPlugin(_ctx: PluginFactoryContext) {
  return plugin;
}
