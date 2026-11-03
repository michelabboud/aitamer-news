/** Execute the actual route cache-key builders with content fixtures; no Astro build cache mocks. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
const sourceRoot = process.env.SERIES_CACHE_SOURCE_ROOT ?? process.cwd();
const now = new Date('2026-11-03T00:00:00Z');
const entry = (id: string, extra: Record<string, unknown> = {}) => ({
  id, digest: `${id}-v1`, data: {
    title: id, description: `${id} description`, pubDate: new Date('2026-10-01T00:00:00Z'),
    draft: false, section: 'models', author: { id: 'one' }, tags: [], ...extra,
  },
});
const author = (id: string) => ({ id, digest: `${id}-v1`, data: { name: id, kind: 'bot' } });
function fixture() {
  return {
    now,
    posts: [
      entry('listed', { series: 'grok-bot', series_order: 1 }),
      // A sibling from another month, author and habitat, pinned out of the home feed.
      entry('sibling', { series: 'grok-bot', series_order: 2, pubDate: new Date('2026-09-01T00:00:00Z'), author: { id: 'two' }, section: 'tools' }),
      entry('unrelated', { author: { id: 'two' }, section: 'general', pubDate: new Date('2026-08-01T00:00:00Z') }),
    ],
    authors: [author('one'), author('two')],
    pins: new Set(['sibling']),
    catalog: [{ slug: 'grok-bot', title: 'Grok tutorial', description: 'Read in order.', heroImage: 'https://example.com/series.jpg', heroAlt: 'Series cover' }],
  };
}
type Fixture = ReturnType<typeof fixture>;
let current: Fixture;
// Bundles use a namespaced fixture accessor instead of retaining content from an earlier build.
(globalThis as any).__seriesCacheFixture = () => current;
let bundleId = 0;
const sources = new Map<string, string>();
function readSource(path: string) {
  if (!sources.has(path)) sources.set(path, readFileSync(join(sourceRoot, relative(process.cwd(), path)), 'utf8'));
  return sources.get(path)!;
}

async function loadKeyBuilder(path: string) {
  const isHomeFeed = path.endsWith('home-feed-server.ts');
  const result = await build({
    entryPoints: [path], bundle: true, platform: 'node', format: 'esm', write: false,
    define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/' }) },
    plugins: [{ name: 'series-cache-content-fixtures', setup(builder: any) {
      const fixtureModules: Record<string, string> = {
        site: `const f=()=>globalThis.__seriesCacheFixture();
          export const BUILD_TIME=new Date('${now.toISOString()}');
          export const entryStamp=e=>e.id+'@'+(e.digest??'no-digest');
          export const getPublishedPosts=async()=>f().posts.filter(p=>!p.data.draft&&!p.data.withdrawn&&p.data.pubDate<=BUILD_TIME);
          export const getPostPages=async()=>f().posts.filter(p=>!p.data.draft&&p.data.pubDate<=BUILD_TIME);
          export const getArchiveMonths=async()=>{const groups=new Map();for(const p of await getPublishedPosts()){const key=p.data.pubDate.toISOString().slice(0,7);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)}return [...groups].sort(([a],[b])=>b.localeCompare(a)).map(([key,posts])=>({year:key.slice(0,4),month:key.slice(5,7),posts}));};
          export const resolveAuthor=async p=>f().authors.find(a=>a.id===p.data.author.id);
          export const getCommentThreads=async()=>new Map(); export const getReactionThreads=async()=>new Map();
          export const ALL_SECTIONS=['models','tools','general']; export const REACTIONS_SOURCE='r2';`,
        content: `export const getCollection=async name=>{const f=globalThis.__seriesCacheFixture();return name==='posts'?f.posts:f.authors;};`,
        pins: `export async function loadHomepagePins(){const f=globalThis.__seriesCacheFixture();const posts=f.posts.filter(p=>!p.data.draft&&!p.data.withdrawn&&p.data.pubDate<=f.now);return {posts,pinned:posts.filter(p=>f.pins.has(p.id)),feedPosts:posts.filter(p=>!f.pins.has(p.id)),ids:f.pins};}`,
        catalog: `export const SERIES=globalThis.__seriesCacheFixture().catalog;`,
        'pins-file': `export default {mode:'approve',pins:[...globalThis.__seriesCacheFixture().pins].map(slug=>({slug,source:'manual',state:'active',pinnedBy:'fixture',pinnedAt:'2026-10-31T00:00:00Z',until:'2026-11-04T00:00:00Z'}))};`,
        topics: `export const getTopicIndex=async()=>({slugByKey:new Map()});`,
        config: `export const root=new URL(${JSON.stringify(pathToFileURL(process.cwd() + '/').href)});`,
      };
      builder.onResolve({ filter: /(?:^|\/)site(?:\.ts)?$/ }, () => ({ path: 'site', namespace: 'series-fixture' }));
      builder.onResolve({ filter: /^astro:content$/ }, () => ({ path: 'content', namespace: 'series-fixture' }));
      builder.onResolve({ filter: /^astro:config\/server$/ }, () => ({ path: 'config', namespace: 'series-fixture' }));
      builder.onResolve({ filter: /data\/pins\.json$/ }, () => ({ path: 'pins-file', namespace: 'series-fixture' }));
      builder.onResolve({ filter: /shown-pins\.ts$/ }, () => ({ path: 'pins', namespace: 'series-fixture' }));
      builder.onResolve({ filter: /data\/series\.ts$/ }, () => ({ path: 'catalog', namespace: 'series-fixture' }));
      builder.onResolve({ filter: /structured-data\.ts$/ }, () => ({ path: 'render-only', namespace: 'series-fixture' }));
      builder.onResolve({ filter: /topics-data\.ts$/ }, () => ({ path: 'topics', namespace: 'series-fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'series-fixture' }, ({ path }: { path: string }) => ({ contents: fixtureModules[path] ?? '', loader: 'js' }));
      builder.onLoad({ filter: /\.astro$/ }, ({ path: resolved }: { path: string }) => {
        if (resolved !== join(process.cwd(), path)) return { contents: 'export default undefined;', loader: 'js' };
        const frontmatter = readSource(resolved).split('---')[1];
        // Everything after the exported builder is request rendering, which is tested separately.
        const stop = frontmatter.search(/\nconst (?:\{ (?:year|author|post|view)|raw =)/);
        assert.ok(stop > 0, `route frontmatter boundary: ${path}`);
        return { contents: frontmatter.slice(0, stop), loader: 'ts', resolveDir: dirname(resolved) };
      });
      builder.onLoad({ filter: /(?:series(?:-live)?|home-feed-server|home-feed-snapshot)\.ts$/ }, ({ path: resolved }: { path: string }) => ({ contents: readSource(resolved), loader: 'ts', resolveDir: dirname(resolved) }));
    } }],
  });
  const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}#${bundleId++}`);
  return isHomeFeed ? module.getHomeFeed : module.getStaticPaths;
}

const routes = [
  ['archive', 'src/pages/archive/[year]/[month].astro', (row: any) => row.params.year === '2026' && row.params.month === '10'],
  ['author', 'src/pages/authors/[id].astro', (row: any) => row.params.id === 'one'],
  ['habitat', 'src/pages/section/[section].astro', (row: any) => row.params.section === 'models'],
  ['post', 'src/pages/posts/[slug].astro', (row: any) => row.params.slug === 'listed'],
  ['series', 'src/pages/series/[slug].astro', (row: any) => row.params.slug === 'grok-bot'],
] as const;

for (const [name, path, matches] of routes) {
  test(`${name} cache invalidates when a live sibling outside the listing changes`, async () => {
    current = fixture();
    const buildPaths = await loadKeyBuilder(path);
    const key = async () => (await buildPaths()).find(matches).cacheKey;
    const before = await key();
    current.posts[1].data.title = 'Changed sibling';
    current.posts[1].digest = 'sibling-v2';
    assert.notEqual(await key(), before);
    // A scheduled publication changes the part count without editing the listed post.
    current.posts.push(entry('scheduled', { series: 'grok-bot', series_order: 3, author: { id: 'two' }, section: 'tools', pubDate: new Date('2026-11-02T00:00:00Z') }));
    const three = await key();
    current.posts[3].data.draft = true;
    assert.notEqual(await key(), three);
  });
  test(`${name} cache invalidates series catalog edits, but ignores unrelated content edits`, async () => {
    current = fixture();
    const buildPaths = await loadKeyBuilder(path);
    const key = async () => (await buildPaths()).find(matches).cacheKey;
    const before = await key();
    current.posts[2].digest = 'unrelated-v2';
    assert.equal(await key(), before);
    const previous = await key();
    current.catalog[0].title = 'Renamed series';
    assert.notEqual(await key(), previous);
    const renamed = await key();
    current.catalog[0].heroAlt = 'Updated cover description';
    assert.notEqual(await key(), renamed);
  });
}

test('home feed snapshot changes when a pinned sibling changes the rendered series label', async () => {
  current = fixture();
  const getHomeFeed = await loadKeyBuilder('src/lib/home-feed-server.ts');
  const before = await getHomeFeed();
  assert.equal(before.seriesById.get('listed').label, 'Grok tutorial · Part 1 of 2');
  current.posts[1].data.draft = true;
  const after = await getHomeFeed();
  assert.deepEqual(after.feedPosts.map((post: any) => post.id), before.feedPosts.map((post: any) => post.id));
  assert.equal(after.seriesById.get('listed').label, 'Grok tutorial · Part 1 of 1');
  assert.notEqual(after.snapshot, before.snapshot);
});
