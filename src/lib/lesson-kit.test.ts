import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lessonKitLinks } from './lesson-kit.ts';
import { withUtm } from '../../scripts/lessonkit/utm.mjs';

test('withUtm stamps source, medium, campaign and content', () => {
  const url = withUtm('https://aitamer.news/posts/k8s-from-zero-02-architecture-tour/', {
    campaign: 'k8s-02',
    content: 'cheatsheet',
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('utm_source'), 'lessonkit');
  assert.equal(parsed.searchParams.get('utm_medium'), 'pdf');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'k8s-02');
  assert.equal(parsed.searchParams.get('utm_content'), 'cheatsheet');
  assert.equal(parsed.pathname, '/posts/k8s-from-zero-02-architecture-tour/');
});

test('withUtm rejects a value that is not a URL', () => {
  assert.throws(() => withUtm('not a url', { campaign: 'k8s-02' }), TypeError);
});

test('a lesson kit lists only the files that exist, and an empty directory lists nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lesson-kit-'));
  try {
    assert.deepEqual(lessonKitLinks('k8s-02', dir), []);
    writeFileSync(join(dir, 'aitamer-k8s-02-cheatsheet.pdf'), 'preview');
    writeFileSync(join(dir, 'aitamer-k8s-02-lab.zip'), 'zip');
    assert.deepEqual(lessonKitLinks('k8s-02', dir).map((file) => file.filename), [
      'aitamer-k8s-02-cheatsheet.pdf',
      'aitamer-k8s-02-lab.zip',
    ]);
    assert.equal(lessonKitLinks('k8s-02', dir)[0].href, '/lessonkits/aitamer-k8s-02-cheatsheet.pdf');
    assert.equal(lessonKitLinks('k8s-02', dir).some((file) => file.key === 'homework'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Run the actual post route builder with fixed content; lesson-kit disk reads stay real. */
async function postPaths(root: string) {
  const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
  const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
  const route = new URL('../pages/posts/[slug].astro', import.meta.url);
  const frontmatter = readFileSync(route, 'utf8').split('---')[1];
  const stop = frontmatter.indexOf('\nconst { post,');
  assert.ok(stop > 0, 'post route builder boundary');
  const modules: Record<string, string> = {
    site: `const posts=[{id:'lesson',digest:'unchanged',data:{lessonKit:{id:'k8s-02'},tags:[]}},{id:'ordinary',digest:'unchanged',data:{tags:[]}}];
      export const getPostPages=async()=>posts; export const getPublishedPosts=async()=>posts;
      export const resolveAuthor=async()=>({id:'writer',digest:'unchanged'});
      export const entryStamp=e=>e.id+'@'+e.digest;
      export const getCommentThreads=async()=>new Map(); export const getReactionThreads=async()=>new Map();
      export const REACTIONS_SOURCE='r2';`,
    config: `export const root=new URL(${JSON.stringify(pathToFileURL(root + '/').href)});`,
    topics: 'export const getTopicIndex=async()=>({slugByKey:new Map()});',
    'topic-slugs': 'export const topicSlugsForTags=()=>[];',
    pins: 'export const loadHomepagePins=async()=>({ids:new Set()});',
    'pin-mark': 'export const pinCacheMark=()=>"no-pins";',
    series: 'export const seriesCacheMark=()=>"no-series";',
    'series-live': 'export const assertSeriesCollection=async()=>{}; export const placementsFor=()=>new Map();',
  };
  const result = await build({
    stdin: { contents: frontmatter.slice(0, stop), loader: 'ts', resolveDir: dirname(fileURLToPath(route)) },
    bundle: true, platform: 'node', format: 'esm', write: false,
    plugins: [{ name: 'post-content-fixture', setup(builder: any) {
      builder.onResolve({ filter: /.*/ }, ({ path }: { path: string }) => {
        if (path.startsWith('node:') || path.endsWith('lesson-kit.ts')) return;
        const key = path === 'astro:config/server' ? 'config'
          : path.endsWith('/site') ? 'site'
          : path.endsWith('/topics-data.ts') ? 'topics'
          : path.endsWith('/topics.ts') ? 'topic-slugs'
          : path.endsWith('/shown-pins.ts') ? 'pins'
          : path.endsWith('/home-pins.ts') ? 'pin-mark'
          : path.endsWith('/series.ts') ? 'series'
          : path.endsWith('/series-live.ts') ? 'series-live' : 'render-only';
        return { path: key, namespace: 'post-fixture' };
      });
      builder.onLoad({ filter: /.*/, namespace: 'post-fixture' }, ({ path }: { path: string }) => ({ contents: modules[path] ?? '', loader: 'js' }));
    } }],
  });
  return (await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)).getStaticPaths;
}

test('post cache keys and rendered props follow PDF and optional lab additions and removals', async () => {
  const root = mkdtempSync(join(tmpdir(), 'lesson-kit-route-'));
  const dir = join(root, 'public/lessonkits');
  mkdirSync(dir, { recursive: true });
  try {
    const paths = await postPaths(root);
    const snapshot = async () => {
      const rows = await paths();
      return { lesson: rows.find((row: any) => row.params.slug === 'lesson'), ordinary: rows.find((row: any) => row.params.slug === 'ordinary') };
    };
    const empty = await snapshot();
    writeFileSync(join(dir, 'aitamer-k8s-02-cheatsheet.pdf'), 'pdf');
    const pdf = await snapshot();
    assert.notEqual(pdf.lesson.cacheKey, empty.lesson.cacheKey, 'adding a PDF must invalidate cached HTML');
    assert.deepEqual(pdf.lesson.props.lessonKitLinks.map((link: any) => link.filename), ['aitamer-k8s-02-cheatsheet.pdf']);
    assert.equal(pdf.ordinary.cacheKey, empty.ordinary.cacheKey, 'an unrelated post keeps its cached HTML');
    writeFileSync(join(dir, 'aitamer-k8s-02-lab.zip'), 'zip');
    const lab = await snapshot();
    assert.notEqual(lab.lesson.cacheKey, pdf.lesson.cacheKey, 'adding the optional lab must invalidate cached HTML');
    assert.deepEqual(lab.lesson.props.lessonKitLinks.map((link: any) => link.key), ['cheatsheet', 'lab']);
    unlinkSync(join(dir, 'aitamer-k8s-02-cheatsheet.pdf'));
    const onlyLab = await snapshot();
    assert.notEqual(onlyLab.lesson.cacheKey, lab.lesson.cacheKey, 'removing a PDF must invalidate cached HTML');
    assert.deepEqual(onlyLab.lesson.props.lessonKitLinks.map((link: any) => link.key), ['lab']);
    unlinkSync(join(dir, 'aitamer-k8s-02-lab.zip'));
    const removed = await snapshot();
    assert.notEqual(removed.lesson.cacheKey, onlyLab.lesson.cacheKey, 'removing the final file must invalidate cached HTML');
    assert.deepEqual(removed.lesson.props.lessonKitLinks, []);
    assert.equal(removed.ordinary.cacheKey, empty.ordinary.cacheKey);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
