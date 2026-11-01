/** Render the real self-hosted video component, without building or touching shared dist output. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

// Use the exact compiler and bundler installed for Astro, as scripts/post-narration.test.mjs does.
const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
const compiled = await build({
  entryPoints: ['src/components/SelfHostedVideo.astro'],
  bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'render-video-test', setup(builder) {
    builder.onLoad({ filter: /\.astro$/ }, ({ path }) => {
      const result = transform(readFileSync(path, 'utf8'), {
        filename: path, internalURL: 'astro/compiler-runtime', resultScopedSlot: true,
        resolvePath: (specifier) => specifier,
      });
      const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
      if (errors.length) throw new Error(errors.map((error) => error.text).join('\n'));
      return { contents: result.code, loader: 'ts', resolveDir: dirname(path) };
    });
  } }],
});
const { default: SelfHostedVideo } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();
const video = {
  key: 'leann-explainer', stem: 'leann-explainer-v2', title: 'LEANN explained', description: 'How LEANN recomputes embeddings.',
  durationSeconds: 152, uploadDate: new Date('2026-10-29T00:00:00Z'), disclosure: 'AI use: narration is a synthetic voice (Kokoro-82M).',
};
const render = (origin) => container.renderToString(SelfHostedVideo, { props: { video, origin } });

test('a bot\'s post plays its video from the bot bucket, captions through the unprefixed proxy path', async () => {
  const html = await render('https://bots.aitamer.news');
  assert.match(html, /<source src="https:\/\/bots\.aitamer\.news\/videos\/leann-explainer\/leann-explainer-v2-720p\.mp4"/);
  assert.match(html, /<source src="https:\/\/bots\.aitamer\.news\/videos\/leann-explainer\/leann-explainer-v2-1080p\.mp4"/);
  assert.match(html, /poster="https:\/\/bots\.aitamer\.news\/videos\/leann-explainer\/leann-explainer-poster\.webp"/);
  assert.match(html, /<track kind="captions" srclang="en" label="English" src="\/videos\/leann-explainer\/leann-explainer-v2\.en\.vtt" default>/);
  assert.doesNotMatch(html, /media\.aitamer\.news/);
});

test('a desk writer\'s post plays its video from the media bucket, captions through /videos/media/', async () => {
  const html = await render('https://media.aitamer.news');
  assert.match(html, /<source src="https:\/\/media\.aitamer\.news\/videos\/leann-explainer\/leann-explainer-v2-1080p\.mp4"/);
  assert.match(html, /poster="https:\/\/media\.aitamer\.news\/videos\/leann-explainer\/leann-explainer-poster\.webp"/);
  assert.match(html, /src="\/videos\/media\/leann-explainer\/leann-explainer-v2\.en\.vtt"/);
  assert.match(html, /"contentUrl":"https:\/\/media\.aitamer\.news\/videos\/leann-explainer\/leann-explainer-v2-1080p\.mp4"/);
  assert.doesNotMatch(html, /bots\.aitamer\.news/);
});

test('the post page passes the hero\'s bucket to both players', () => {
  const page = readFileSync('src/pages/posts/[slug].astro', 'utf8');
  assert.match(page, /<SelfHostedVideo video=\{data\.selfHostedVideo\} origin=\{postFilesOrigin\(data\.heroImage\)\} \/>/);
  assert.equal((page.match(/postFilesOrigin\(/g) ?? []).length, 2);
});
