/**
 * Renders the real SeriesBadge component (icon inlined, name in the text).
 * `.astro` is not a Node module, so the test compiles it the way the home-feed render test does.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);

const compiled = await build({
  entryPoints: ['src/components/SeriesBadge.astro'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  plugins: [{
    name: 'series-badge',
    setup(builder: { onResolve: Function; onLoad: Function }) {
      builder.onResolve({ filter: /\.svg\?raw$/ }, (args: { path: string; resolveDir: string }) => ({
        path: join(args.resolveDir, args.path),
        namespace: 'svg-raw',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'svg-raw' }, ({ path }: { path: string }) => ({
        contents: `export default ${JSON.stringify(readFileSync(path.replace(/\?raw$/, ''), 'utf8'))};`,
        loader: 'js',
      }));
      builder.onLoad({ filter: /\.astro$/ }, ({ path }: { path: string }) => {
        const result = transform(readFileSync(path, 'utf8'), {
          filename: path,
          internalURL: 'astro/compiler-runtime',
          resultScopedSlot: true,
          resolvePath: (specifier: string) => specifier,
        });
        const errors = result.diagnostics.filter((diagnostic: { severity: number }) => diagnostic.severity === 1);
        if (errors.length) throw new Error(errors.map((error: { text: string }) => error.text).join('\n'));
        return { contents: result.code, loader: 'ts', resolveDir: dirname(path) };
      });
    },
  }],
});

const { default: SeriesBadge } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();

test('the series badge shows the icon as decoration and keeps the series name in the text', async () => {
  const html = await container.renderToString(SeriesBadge, {
    props: { href: '/series/grok-bot/', label: 'Grok Bot tutorial · Part 1 of 22', slug: 'grok-bot' },
  });
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<svg[\s>]/);
  assert.match(html, /currentColor/);
  assert.match(html, /Grok Bot tutorial · Part 1 of 22/);
  assert.match(html, /href="\/series\/grok-bot\/"/);
  assert.doesNotMatch(html, /<script/i);
});

test('a series without its own icon renders the name with the default icon, hidden from assistive tech (ADR 0054)', async () => {
  const fallback = readFileSync('src/assets/series-icons/default.svg', 'utf8');
  for (const slug of ['missing', 'constructor', '__proto__']) {
    const html = await container.renderToString(SeriesBadge, {
      props: { href: `/series/${slug}/`, label: 'Missing series · Part 1 of 1', slug },
    });
    assert.equal(html.match(/<svg[\s>]/g)?.length, 1, slug);
    assert.match(html, /<span class="series-icon" aria-hidden="true"><svg/, slug);
    assert.ok(html.includes(fallback.match(/<path d="([^"]+)"/)![1]), `${slug}: the default icon's own path`);
    assert.match(html, /Missing series · Part 1 of 1/);
  }
});
