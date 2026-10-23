/** Render the actual partial/PostCard/HeroImage stack; only content lookup and image I/O are fixtures. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { validateBatchTree, type FeedTree } from './home-feed-protocol.ts';
import { PREPARED_HERO_POLICY_SHA256 } from './prepared-heroes.ts';

const fixtureCatalog={schemaVersion:1,recipe:{widths:[480,720],quality:84,minSsim:.95},qualification:{policySha256:PREPARED_HERO_POLICY_SHA256,receiptSha256:'f'.repeat(64)},pairs:[1,2,3,4,5].map(i=>({
  jpeg:{url:`https://media.aitamer.news/heroes/fixture-${i}.jpg`,sha256:'a'.repeat(64),bytes:100000,width:1600,height:900},
  webp:{url:`https://media.aitamer.news/heroes/fixture-${i}.webp`,sha256:'b'.repeat(64),bytes:70000,width:1600,height:900},
  variants:[480,720].map((width,j)=>({url:`https://media.aitamer.news/heroes/responsive-${(j?'d':'c').repeat(64)}.webp`,sha256:(j?'d':'c').repeat(64),bytes:17000+j*10000,width,height:width*9/16,ssim:.97}))
}))};

const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
const compiled = await build({
  entryPoints: ['src/pages/home-feed/[batch].astro'], bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/preview/' }) },
  plugins: [{ name: 'home-feed-render-fixtures', setup(builder: any) {
    builder.onResolve({ filter: /home-feed-server\.ts$/ }, () => ({ path: 'server', namespace: 'home-feed-fixture' }));
    builder.onResolve({ filter: /^astro:content$/ }, () => ({ path: 'content', namespace: 'home-feed-fixture' }));
    builder.onResolve({ filter: /^astro:config\/server$/ }, () => ({ path: 'config', namespace: 'home-feed-fixture' }));
    builder.onResolve({ filter: /^astro:assets$/ }, () => ({ path: 'assets', namespace: 'home-feed-fixture' }));
    builder.onResolve({ filter: /^astro\/assets\/utils$/ }, () => ({ path: 'metadata', namespace: 'home-feed-fixture' }));
    builder.onResolve({ filter: /prepared-hero-catalog$/ }, () => ({path:'catalog',namespace:'home-feed-fixture'}));
    builder.onLoad({ filter: /.*/, namespace: 'home-feed-fixture' }, ({ path }: { path: string }) => ({ contents: ({
      server: 'export function getHomeFeed(){ throw new Error("This render test supplies real route props directly"); }',
      content: 'export async function getCollection(){ throw new Error("Unexpected content lookup"); } export async function getEntry(){ throw new Error("Unexpected author lookup"); }',
      config: 'export const root = new URL("file:///unused-feed-render-test/");',
      assets: 'export async function getImage(){ throw new Error("Routine feed must not transform images"); }',
      metadata: 'export async function inferRemoteSize(){ throw new Error("Routine feed must not probe metadata"); }',
      catalog: `export default ${JSON.stringify(fixtureCatalog)};`,
    } as Record<string, string>)[path], loader: 'js' }));
    builder.onLoad({ filter: /\.astro$/ }, ({ path }: { path: string }) => {
      const result = transform(readFileSync(path, 'utf8'), { filename: path, internalURL: 'astro/compiler-runtime', resultScopedSlot: true, resolvePath: (specifier: string) => specifier });
      const errors = result.diagnostics.filter((diagnostic: any) => diagnostic.severity === 'error');
      if (errors.length) throw new Error(errors.map((error: any) => error.text).join('\n'));
      return { contents: result.code, loader: 'ts', resolveDir: dirname(path) };
    });
  } }],
});
const { default: BatchPage } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();

test('the real partial is inert and validates all meter levels, responsive home sizes, lazy JPEG fallbacks and exact metadata', async () => {
  const items = [1, 2, 3, 4, 5].map((rating) => ({
    post: { id: `fixture-${rating}`, body: '', data: {
      title: `Sighting ${rating}`, description: 'Render fixture only.', section: 'models', pubDate: new Date('2026-10-01T00:00:00Z'),
      author: { id: 'desk-bot' }, heroImage: `https://media.aitamer.news/heroes/fixture-${rating}.jpg`, specimen: rating,
      wildness: { rating, verified: 'Fixture evidence', claimed: 'Fixture claim' },
    } },
    author: { id: 'desk-bot', data: { name: 'Desk Bot', kind: 'bot' } },
  }));
  const snapshot = 'a'.repeat(64);
  const html = await container.renderToString(BatchPage, { props: { snapshot, index: 1, offset: 12, items }, partial: true });
  function tree(node: any): FeedTree {
    return { tag: node.tagName ?? '', namespace: node.namespaceURI, text: node.nodeName === '#text' ? node.value : '', attrs: node.attrs ?? [], children: (node.content?.childNodes ?? node.childNodes ?? []).map(tree) };
  }
  assert.deepEqual(validateBatchTree(tree(parse(html)), { snapshot, index: 1, offset: 12, count: 5, seenIds: new Set(), pageUrl: 'https://example.com/preview/' }), items.map(({ post }) => post.id));
  assert.doesNotMatch(html, /<(?:script|style|html|head|body)\b/i);
  assert.equal((html.match(/<template\b/g) ?? []).length, 1);
  assert.equal((html.match(/<h3\b/g) ?? []).length, 5);
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 5);
  assert.equal((html.match(/max-width: 591\.98px/g) ?? []).length, 5);
  assert.equal((html.match(/<img[^>]+src="https:\/\/media\.aitamer\.news\/heroes\/fixture-\d\.jpg"/g) ?? []).length, 5);
  assert.match(html, /data-pagefind-ignore/);
});
