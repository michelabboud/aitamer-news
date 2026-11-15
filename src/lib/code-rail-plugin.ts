/**
 * Drop `rail` sidecar fences and the `rail=<id>` info token before highlighting.
 * A post with neither is left untouched, so the rendered-body gate sees the same HTML as before.
 */
import { defineMdastPlugin, type PluginFactoryContext } from 'satteri';
import { railIdFromMeta, sourceHasCodeRail, stripRailMeta } from './code-rail.ts';

const plugin = defineMdastPlugin({
  name: 'aitamer-code-rail',
  code(node, context) {
    if (node.lang === 'rail') {
      context.removeNode(node);
      return;
    }
    if (!railIdFromMeta(node.meta)) return;
    const meta = stripRailMeta(node.meta ?? '');
    context.setProperty(node, 'meta', meta.length ? meta : null);
  },
});

export function codeRailPlugin(ctx: PluginFactoryContext) {
  if (!sourceHasCodeRail(ctx.source)) return false;
  return plugin;
}
