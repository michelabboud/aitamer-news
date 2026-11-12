/** Render both real series routes through the shared production HeroImage component. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse } from 'parse5';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { SERIES } from '../data/series.ts';

// The first series that has a hero (a hero is optional, ADR 0054).
const HERO_SERIES = SERIES.find((meta) => meta.heroImage !== undefined)!;
import { PREPARED_HERO_POLICY_SHA256 } from './prepared-heroes.ts';

const sourceRoot = process.env.SERIES_HERO_SOURCE_ROOT ?? process.cwd();
const view = {
  ...HERO_SERIES, href: `/series/${HERO_SERIES.slug}/`,
  parts: [{ id: 'fixture', title: 'Fixture part', description: 'A series part.', pubDate: new Date('2026-10-01T00:00:00Z'), order: 1, stamp: 'fixture@v1' }],
};
const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
const compiled = await build({
  stdin: { contents: `export { default as Index } from './src/pages/series/index.astro'; export { default as Detail } from './src/pages/series/[slug].astro';`, loader: 'ts', resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/preview/' }) },
  plugins: [{ name: 'series-hero-render-fixtures', setup(builder: any) {
    const modules: Record<string, string> = {
      site: `export const SITE={title:'AI Tamer',url:'https://aitamer.news'};export const withBase=p=>p.startsWith('/')?'/preview'+p:p;export const canonicalUrlFor=p=>'https://aitamer.news'+p;export const formatDate=d=>d.toISOString().slice(0,10);export const getPublishedPosts=async()=>[];`,
      series: `export const assertSeriesCollection=async()=>{}; export const placementsFor=()=>new Map([['fixture',{view:globalThis.__seriesHeroRenderView}]]);`,
      structured: `export const SITE_LANGUAGE='en';`,
      assets: `export const getImage=async()=>{throw new Error('Routine series rendering must not transform images');};`,
      metadata: `export const inferRemoteSize=async()=>{throw new Error('Routine series rendering must not probe images');};`,
      catalog: `export default ${JSON.stringify({ schemaVersion: 1, recipe: { widths: [480, 720], quality: 84, minSsim: .95 }, qualification: { policySha256: PREPARED_HERO_POLICY_SHA256, receiptSha256: 'f'.repeat(64) }, pairs: [] })};`,
    };
    builder.onResolve({ filter: /(?:^|\/)site(?:\.ts)?$/ }, () => ({ path: 'site', namespace: 'series-hero-fixture' }));
    builder.onResolve({ filter: /series-live\.ts$/ }, () => ({ path: 'series', namespace: 'series-hero-fixture' }));
    builder.onResolve({ filter: /structured-data\.ts$/ }, () => ({ path: 'structured', namespace: 'series-hero-fixture' }));
    builder.onResolve({ filter: /^astro:assets$/ }, () => ({ path: 'assets', namespace: 'series-hero-fixture' }));
    builder.onResolve({ filter: /^astro\/assets\/utils$/ }, () => ({ path: 'metadata', namespace: 'series-hero-fixture' }));
    builder.onResolve({ filter: /prepared-hero-catalog$/ }, () => ({ path: 'catalog', namespace: 'series-hero-fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'series-hero-fixture' }, ({ path }: { path: string }) => ({ contents: modules[path], loader: 'js' }));
    builder.onResolve({ filter: /\.svg\?raw$/ }, (args: { path: string; resolveDir: string }) => ({ path: join(args.resolveDir, args.path), namespace: 'svg-raw' }));
    builder.onLoad({ filter: /.*/, namespace: 'svg-raw' }, ({ path }: { path: string }) => ({ contents: `export default ${JSON.stringify(readFileSync(path.replace(/\?raw$/, ''), 'utf8'))};`, loader: 'js' }));
    builder.onLoad({ filter: /\.astro$/ }, ({ path }: { path: string }) => {
      const source = path.endsWith('/layouts/BaseLayout.astro')
        ? '<main><slot /><slot name="head" /></main>'
        : readFileSync(path.includes('/src/pages/series/') ? join(sourceRoot, relative(process.cwd(), path)) : path, 'utf8');
      const result = transform(source, { filename: path, internalURL: 'astro/compiler-runtime', resultScopedSlot: true, resolvePath: (specifier: string) => specifier });
      const errors = result.diagnostics.filter((diagnostic: any) => diagnostic.severity === 'error');
      assert.equal(errors.length, 0, JSON.stringify(errors));
      return { contents: result.code, loader: 'ts', resolveDir: dirname(path) };
    });
  } }],
});
const { Index, Detail } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();

for (const [name, Page] of [['index', Index], ['detail', Detail]] as const) {
  test(`the series ${name} renders WebP first with its JPEG fallback and existing image attributes`, async () => {
    (globalThis as any).__seriesHeroRenderView = view;
    const html = await container.renderToString(Page, { props: { view } });
    assert.match(html, /<picture[\s>]/);
    assert.match(html, /<source[^>]+type="image\/webp"/);
    assert.ok(html.includes(`srcset="${view.heroImage!.replace(/\.jpg$/, '.webp')}"`));
    assert.ok(html.includes(`src="${view.heroImage}"`));
    assert.match(html, /width="1600" height="900"/);
    assert.match(html, /decoding="async"/);
    if (name === 'index') {
      assert.match(html, /loading="lazy"/);
      assert.match(html, /<img[^>]* alt(?:=""|(?=\s|>))/);
      assert.match(html, /class="series-index__photo"/);
    } else {
      assert.ok(html.includes(`alt="${view.heroAlt}"`));
      assert.match(html, /class="series-hero"/);
    }
  });
  test(`the series ${name} keeps an absent hero out of the page`, async () => {
    const withoutHero = { ...view, heroImage: undefined, parts: view.parts.map((part) => ({ ...part, heroImage: undefined })) };
    (globalThis as any).__seriesHeroRenderView = withoutHero;
    const html = await container.renderToString(Page, { props: { view: withoutHero } });
    assert.doesNotMatch(html, /<picture[\s>]|<img[\s>]/);
    assert.match(html, /Fixture part|Grok Bot tutorial/);
  });
}


test('series part thumbnails use the matching article, WebP and lazy JPEG, with one accessible title link', async () => {
  const withThumbnails = { ...view, parts: [
    { ...view.parts[0], id: 'first', title: 'First article', heroImage: 'https://media.aitamer.news/heroes/first.jpg', heroAlt: 'First cover' },
    { ...view.parts[0], id: 'second', title: 'Second article', order: 2, heroImage: 'https://bots.aitamer.news/heroes/second-0123abcd.jpg', heroAlt: 'Second cover' },
    { ...view.parts[0], id: 'no-cover', title: 'Article without a cover', order: 3, heroImage: undefined },
  ] };
  const html = await container.renderToString(Detail, { props: { view: withThumbnails } });
  const nodes: any[] = [];
  function visit(node: any) { nodes.push(node); for (const child of node.childNodes ?? []) visit(child); }
  visit(parse(html));
  const attribute = (node: any, name: string) => node.attrs?.find((attr: any) => attr.name === name)?.value;
  const articles = nodes.filter((node) => node.tagName === 'article' && attribute(node, 'class') === 'series-part');
  assert.equal(articles.length, 3);
  for (const [index, article] of articles.entries()) {
    const descendants: any[] = [];
    function collect(node: any) { descendants.push(node); for (const child of node.childNodes ?? []) collect(child); }
    collect(article);
    const part = withThumbnails.parts[index];
    const anchors = descendants.filter((node) => node.tagName === 'a');
    const thumb = anchors.find((node) => attribute(node, 'class') === 'series-part__photo');
    const titleLink = anchors.find((node) => node !== thumb);
    assert.ok(titleLink, 'each article keeps its linked title');
    assert.equal(attribute(titleLink, 'href'), `/preview/posts/${part.id}/`);
    assert.equal(attribute(titleLink, 'tabindex'), undefined);
    assert.equal(attribute(titleLink, 'aria-hidden'), undefined);
    if (!part.heroImage) {
      assert.equal(thumb, undefined);
      assert.equal(anchors.length, 1);
      assert.equal(descendants.filter((node) => node.tagName === 'img').length, 0);
      continue;
    }
    assert.ok(thumb, `${part.id} thumbnail`);
    assert.equal(attribute(thumb, 'href'), `/preview/posts/${part.id}/`);
    assert.equal(attribute(thumb, 'tabindex'), '-1');
    assert.equal(attribute(thumb, 'aria-hidden'), 'true');
    const image = descendants.find((node) => node.tagName === 'img');
    assert.equal(attribute(image, 'src'), part.heroImage);
    assert.equal(attribute(image, 'alt'), '');
    assert.equal(attribute(image, 'loading'), 'lazy');
    assert.equal(attribute(image, 'width'), '1600');
    assert.equal(attribute(image, 'height'), '900');
    const source = descendants.find((node) => node.tagName === 'source');
    assert.equal(attribute(source, 'type'), 'image/webp');
    assert.equal(attribute(source, 'srcset'), part.heroImage.replace(/\.jpg$/, '.webp'));
  }
});
