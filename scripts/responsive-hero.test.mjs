/** Render the real HeroImage template with deterministic metadata/image-service I/O. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
const compiled = await build({
  entryPoints: ['src/components/HeroImage.astro'],
  bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'render-responsive-hero', setup(builder) {
    builder.onResolve({ filter: /^(?:astro:assets|astro\/assets\/utils)$/ }, () => ({ path: 'assets', namespace: 'hero-test' }));
    builder.onResolve({ filter: /^\.\.\/lib\/site$/ }, () => ({ path: 'site', namespace: 'hero-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'hero-test' }, ({ path }) => ({
      contents: path === 'site' ? 'export const withBase = value => value;' : `
        export const inferRemoteSize = async (url, config) => {
          globalThis.__heroRenderTest.probes.push({url, config});
          if (url.includes('unavailable')) throw new Error('test remote unavailable');
          return url.endsWith('.jpg') ? {width:1600,height:900,format:'jpg'} : {width:960,height:540,format:'webp'};
        };
        export const getImage = async (options) => {
          globalThis.__heroRenderTest.transforms.push(options);
          return {src:'/_astro/render-' + options.width + '.webp'};
        };
      `,
    }));
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
globalThis.__heroRenderTest = { probes: [], transforms: [] };
const { default: HeroImage } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();
const JPEG = 'https://media.aitamer.news/heroes/render.jpg';
const render = (props = {}) => container.renderToString(HeroImage, {
  props: { src: JPEG, alt: 'A hero', width: '1600', height: '900', ...props },
});
function attributes(html, tag) {
  const walk = (node) => node.tagName === tag ? node : (node.childNodes ?? []).map(walk).find(Boolean);
  const node = walk(parse(html));
  return node ? Object.fromEntries(node.attrs.map(({ name, value }) => [name, value])) : undefined;
}

test('rendered picture puts truthful srcset and sizes only on WebP; JPEG and priorities survive', async () => {
  const html = await render({ context: 'lead', fetchpriority: 'high', decoding: 'async' });
  const image = attributes(html, 'img');
  const source = attributes(html, 'source');
  assert.equal(attributes(html, 'picture')['data-responsive-hero'], '');
  assert.equal(image.src, JPEG);
  assert.equal(image.alt, 'A hero');
  assert.equal(image.width, '1600');
  assert.equal(image.height, '900');
  assert.equal(image.fetchpriority, 'high');
  assert.equal(image.decoding, 'async');
  assert.equal(image.loading, undefined);
  assert.equal(image.srcset, undefined);
  assert.equal(image.sizes, undefined);
  assert.equal(source.type, 'image/webp');
  assert.equal(source.srcset, '/_astro/render-480.webp 480w, /_astro/render-720.webp 720w, https://media.aitamer.news/heroes/render.webp 960w');
  assert.equal(source.sizes, '(max-width: 900px) calc(100vw - 32px), (max-width: 1232px) calc(100vw - 420px), 812px');
  assert.ok(globalThis.__heroRenderTest.probes.every(({ config }) => config.remotePatterns.length === 2 && config.remotePatterns.every(({ protocol, pathname }) => protocol === 'https' && pathname === '/heroes/*')));
});

test('lazy cards and article contexts keep loading behavior while each render registers assets', async () => {
  const before = globalThis.__heroRenderTest.transforms.length;
  const card = await render({ context: 'home-card', loading: 'lazy' });
  const article = await render({ context: 'article', fetchpriority: 'high' });
  assert.equal(attributes(card, 'img').loading, 'lazy');
  assert.match(attributes(card, 'source').sizes, /591\.98px/);
  assert.equal(attributes(article, 'source').sizes, '(max-width: 812px) calc(100vw - 32px), 780px');
  assert.equal(attributes(article, 'img').fetchpriority, 'high');
  assert.equal(globalThis.__heroRenderTest.transforms.length - before, 4);
  assert.equal(globalThis.__heroRenderTest.probes.filter(({ url }) => url === JPEG).length, 1);
});

test('failed remote metadata keeps existing single WebP source and original JPEG fallback', async () => {
  const src = JPEG.replace('render.jpg', 'unavailable.jpg');
  const html = await render({ src, loading: 'eager' });
  assert.equal(attributes(html, 'img').src, src);
  assert.equal(attributes(html, 'img').loading, 'eager');
  assert.equal(attributes(html, 'source').srcset, src.replace('.jpg', '.webp'));
  assert.equal(attributes(html, 'source').sizes, undefined);
  assert.equal(attributes(html, 'picture')['data-responsive-hero'], undefined);
});

test('generated SVG cover renders an ordinary image without remote probes or responsive descriptors', async () => {
  const before = globalThis.__heroRenderTest.probes.length;
  const html = await render({ src: '/covers/models.svg', loading: 'lazy' });
  assert.equal(attributes(html, 'source'), undefined);
  assert.equal(attributes(html, 'img').src, '/covers/models.svg');
  assert.equal(attributes(html, 'img').loading, 'lazy');
  assert.equal(globalThis.__heroRenderTest.probes.length, before);
});
