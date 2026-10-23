/** Exercise the configured real Sätteri renderer alongside hero's global remote-image rules. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { satteri } from '@astrojs/markdown-satteri';
import { validateConfig } from 'astro/config';
import siteConfig from '../astro.config.mjs';
import { checkRenderedHtml } from './check-rendered-body.mjs';
import { plainBodyMarkdown } from '../src/lib/plain-body-markdown.ts';

const processor = siteConfig.markdown?.processor ?? satteri();
const shared = { image: siteConfig.image, syntaxHighlight: 'shiki', shikiConfig: { theme: 'github-dark' } };
const body = '# Heading\n\n![A hero](https://media.aitamer.news/heroes/x.jpg "Title") ![Spaced](https://media.aitamer.news/a%20b.png)\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n\nText[^source].\n\n[^source]: A source.\n\n```js\nconst x = "<&";\n```\n\n"Quotes" &amp; punctuation.';

test('configured Markdown keeps remote body images plain while global hero optimization stays enabled', async () => {
  const originalConfig = structuredClone(siteConfig.image);
  const renderer = await processor.createRenderer(shared);
  const reference = await satteri().createRenderer({ ...shared, image: { domains: [], remotePatterns: [] } });
  const rendered = await renderer.render(body);
  assert.deepEqual(rendered, await reference.render(body), 'GFM, highlighting, escaping, headings and images retain the original body contract');
  assert.match(rendered.code, /<img src="https:\/\/media\.aitamer\.news\/heroes\/x.jpg" alt="A hero" title="Title"/);
  assert.doesNotMatch(rendered.code, /__ASTRO_IMAGE_/);
  assert.deepEqual(rendered.metadata.remoteImagePaths, []);
  assert.deepEqual(checkRenderedHtml(rendered.code), []);
  assert.deepEqual(siteConfig.image, originalConfig);
  assert.ok(siteConfig.image.remotePatterns.length > 0);
});

test('local image markers and unowned remote images still fail the existing body guard', async () => {
  const renderer = await processor.createRenderer(shared);
  const local = await renderer.render('![Local](./image.png)');
  assert.deepEqual(local.metadata.localImagePaths, ['./image.png']);
  assert.match(local.code, /__ASTRO_IMAGE_/);
  assert.ok(checkRenderedHtml(local.code).some(({ problem }) => /image pipeline|image marker/.test(problem)));
  for (const url of ['https://elsewhere.example/a.png', 'https://media.aitamer.news.evil.example/a.png', 'http://media.aitamer.news/a.png']) {
    const remote = await renderer.render(`![Unowned](${url})`);
    assert.ok(checkRenderedHtml(remote.code).length > 0, url);
  }
});

test('MDX still delegates to the public Sätteri renderer without changing shared image settings', async () => {
  const originalConfig = structuredClone(siteConfig.image);
  const mdxOptions = { optimize: false };
  const renderer = await processor.createMdxRenderer(shared, mdxOptions);
  const reference = await satteri().createMdxRenderer(shared, mdxOptions);
  const content = '# Heading\n\n![Remote](https://media.aitamer.news/heroes/x.jpg)\n\n<div>Explicit JSX</div>';
  assert.deepEqual(await renderer.process(content, '/tmp/body.mdx', {}), await reference.process(content, '/tmp/body.mdx', {}));
  assert.deepEqual(siteConfig.image, originalConfig);
});

test('integration changes to public processor options still control the real Sätteri renderer', async () => {
  const adapter = plainBodyMarkdown();
  adapter.options.features.gfm = false;
  const renderer = await adapter.createRenderer(shared);
  const result = await renderer.render('- [x] task\n\n![A hero](https://media.aitamer.news/heroes/x.jpg)');
  assert.doesNotMatch(result.code, /type="checkbox"|contains-task-list/);
  assert.match(result.code, /\[x\] task/);
  assert.match(result.code, /<img src="https:\/\/media\.aitamer\.news\/heroes\/x.jpg"/);
});

test('the body image policy changes Astro content and incremental cache fingerprints', async () => {
  const config = await validateConfig(siteConfig, process.cwd(), 'build');
  const { computeConfigHash } = await import('../node_modules/astro/dist/core/build/config-hash/index.js');
  const { safeStringify } = await import('../node_modules/astro/dist/content/utils.js');
  const oldConfig = { ...config, markdown: { ...config.markdown, processor: satteri() } };
  assert.notEqual(safeStringify(config.markdown), safeStringify(oldConfig.markdown), 'content store must invalidate the old image-marker policy');
  assert.notEqual(await computeConfigHash(config), await computeConfigHash(oldConfig), 'incremental HTML must invalidate the old image-marker policy');
});
