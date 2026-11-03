/** The Pinned label: real markup, and the story/listings/homepage wired to one card resolution. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { PREPARED_HERO_POLICY_SHA256 } from '../src/lib/prepared-heroes.ts';

const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);

const emptyCatalog = {
  schemaVersion: 1,
  recipe: { widths: [480, 720], quality: 84, minSsim: 0.95 },
  qualification: { policySha256: PREPARED_HERO_POLICY_SHA256, receiptSha256: 'f'.repeat(64) },
  pairs: [],
};

function astroPlugin() {
  return {
    name: 'pin-badge-render',
    setup(builder) {
      builder.onResolve({ filter: /\.svg\?raw$/ }, (args) => ({
        path: join(args.resolveDir, args.path), namespace: 'svg-raw',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'svg-raw' }, ({ path }) => ({
        contents: `export default ${JSON.stringify(readFileSync(path.replace(/\?raw$/, ''), 'utf8'))};`,
        loader: 'js',
      }));
      builder.onResolve({ filter: /^astro:content$/ }, () => ({ path: 'content', namespace: 'pin-badge-stub' }));
      builder.onResolve({ filter: /^astro:config\/server$/ }, () => ({ path: 'config', namespace: 'pin-badge-stub' }));
      builder.onResolve({ filter: /^astro:assets$/ }, () => ({ path: 'assets', namespace: 'pin-badge-stub' }));
      builder.onResolve({ filter: /^astro\/assets\/utils$/ }, () => ({ path: 'metadata', namespace: 'pin-badge-stub' }));
      builder.onResolve({ filter: /prepared-hero-catalog$/ }, () => ({ path: 'catalog', namespace: 'pin-badge-stub' }));
      builder.onLoad({ filter: /.*/, namespace: 'pin-badge-stub' }, ({ path }) => ({
        contents: {
          content: 'export async function getCollection(){ throw new Error("unexpected content lookup"); } export async function getEntry(){ throw new Error("unexpected entry lookup"); }',
          config: 'export const root = new URL("file:///unused-pin-badge-test/");',
          assets: 'export async function getImage(){ throw new Error("routine cards must not transform images"); }',
          metadata: 'export async function inferRemoteSize(){ throw new Error("routine cards must not probe images"); }',
          catalog: `export default ${JSON.stringify(emptyCatalog)};`,
        }[path],
        loader: 'js',
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
    },
  };
}

async function compile(entry) {
  const compiled = await build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false,
    define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/' }) },
    plugins: [astroPlugin()],
  });
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
}

const { default: PinBadge } = await compile('src/components/PinBadge.astro');
const { default: PostCard } = await compile('src/components/PostCard.astro');
const container = await AstroContainer.create();

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
}

function textOf(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(textOf).join('');
}

function attr(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function elements(html, tag) {
  const found = [];
  walk(parse(html), (node) => { if (node.tagName === tag) found.push(node); });
  return found;
}

const post = {
  id: 'fixture-pin',
  body: '',
  data: {
    title: 'A sighting with a pin',
    description: 'Render fixture only.',
    section: 'models',
    pubDate: new Date('2026-10-01T00:00:00Z'),
    author: { id: 'desk-bot' },
  },
};
const author = { id: 'desk-bot', data: { name: 'Desk Bot', kind: 'bot' } };
const renderCard = (props) => container.renderToString(PostCard, { props: { post, author, ...props } });

test('the badge is a decorative pin icon and the word Pinned', async () => {
  const html = await container.renderToString(PinBadge);
  const [badge] = elements(html, 'span').filter((node) => attr(node, 'class') === 'pin-badge');
  assert.ok(badge, html);
  assert.equal(attr(badge, 'data-pagefind-ignore'), '');
  assert.equal(textOf(badge).trim(), 'Pinned');
  const [icon] = elements(html, 'svg');
  assert.equal(elements(html, 'svg').length, 1);
  assert.equal(attr(icon, 'aria-hidden'), 'true');
  assert.equal(attr(icon, 'focusable'), 'false');
  assert.equal(elements(html, 'title').length, 0);
  for (const painted of [...elements(html, 'path'), ...elements(html, 'circle')]) {
    const paint = attr(painted, 'stroke') ?? attr(painted, 'fill');
    assert.equal(paint, 'currentColor');
  }
  assert.doesNotMatch(html, /#[0-9a-f]{3,8}/i);
});

test('a listing card shows the badge only when that post is in the pin card', async () => {
  const pinned = await renderCard({ pinned: true, context: 'listing' });
  assert.match(pinned, /class="pin-badge"/);
  assert.match(pinned, /class="card__place"/);
  assert.match(pinned, />Pinned</);
  const plain = await renderCard({ context: 'listing' });
  assert.doesNotMatch(plain, /pin-badge/);
  assert.doesNotMatch(plain, />Pinned</);
  const home = await renderCard({ pinned: true, context: 'home-card' });
  assert.doesNotMatch(home, /pin-badge/);
});

test('the story, the listings and the homepage card share one pin resolution', () => {
  const story = readFileSync('src/pages/posts/[slug].astro', 'utf8');
  assert.match(story, /loadHomepagePins\(\)/);
  assert.match(story, /pinCacheMark\(\[post\.id\], pinCard\.ids\)/);
  assert.match(story, /<PinBadge \/>/);
  const card = readFileSync('src/components/PostCard.astro', 'utf8');
  assert.match(card, /const showPin = pinned && context !== 'home-card'/);
  assert.match(card, /<PinBadge \/>/);
  const listing = readFileSync('src/components/PostListing.astro', 'utf8');
  assert.match(listing, /pinned=\{pinCard\.ids\.has\(post\.id\)\}/);
  for (const file of [
    'src/pages/section/[section].astro',
    'src/pages/authors/[id].astro',
    'src/pages/archive/[year]/[month].astro',
  ]) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /pinCacheMark\(/, file);
    assert.match(source, /pinned=\{pinCard\.ids\.has\(post\.id\)\}/, file);
  }
  assert.match(readFileSync('src/lib/home-feed-server.ts', 'utf8'), /loadHomepagePins\(\)/);
  assert.doesNotMatch(readFileSync('src/lib/home-feed-server.ts', 'utf8'), /splitPinned\(/);
  assert.match(readFileSync('src/lib/shown-pins.ts', 'utf8'), /resolvePinCard\(/);
});
