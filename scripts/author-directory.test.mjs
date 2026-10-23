/** Render the real directory cards without writing shared Astro build output. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
const compiled = await build({
  entryPoints: ['src/components/AuthorCard.astro'],
  bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'render-directory-test', setup(builder) {
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
const { default: AuthorCard } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();
const author = (kind, extra = {}) => ({
  id: kind === 'human' ? 'wiz-cat' : 'fixture',
  data: { name: 'Test Author', kind, bio: 'An existing biography.', ...extra },
});
const render = (profile, extra = {}) => container.renderToString(AuthorCard, {
  props: { author: profile, count: 0, href: '/authors/fixture/', ...extra },
});

/** Fixture only the content source and outer shell; publication and URL helpers remain real. */
async function renderPage(authors, posts = []) {
  const page = await build({
    entryPoints: ['src/pages/authors/index.astro'],
    bundle: true, platform: 'node', format: 'esm', write: false,
    define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/preview/' }) },
    plugins: [{ name: 'render-directory-page', setup(builder) {
      builder.onResolve({ filter: /^astro:content$/ }, () => ({ path: 'content', namespace: 'directory-fixture' }));
      builder.onResolve({ filter: /^astro:config\/server$/ }, () => ({ path: 'config', namespace: 'directory-fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'directory-fixture' }, ({ path }) => ({
        contents: path === 'config' ? 'export const root = new URL("file:///unused-directory-test/");' : `
          const authors = ${JSON.stringify(authors)};
          const posts = ${JSON.stringify(posts)};
          for (const post of posts) post.data.pubDate = new Date(post.data.pubDate);
          export async function getCollection(name, filter) {
            const entries = name === 'authors' ? authors : name === 'posts' ? posts : [];
            return filter ? entries.filter(filter) : entries;
          }
          export async function getEntry() { throw new Error('Directory must use actual author entries'); }
        `,
        loader: 'js',
      }));
      builder.onLoad({ filter: /\.astro$/ }, ({ path }) => {
        const source = path.endsWith('/layouts/BaseLayout.astro')
          ? '---\nconst { canonical } = Astro.props;\n---\n<main data-canonical={canonical}><slot /></main>'
          : readFileSync(path, 'utf8');
        const result = transform(source, {
          filename: path, internalURL: 'astro/compiler-runtime', resultScopedSlot: true,
          resolvePath: (specifier) => specifier,
        });
        const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
        if (errors.length) throw new Error(errors.map((error) => error.text).join('\n'));
        return { contents: result.code, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const { default: Page } = await import(`data:text/javascript;base64,${Buffer.from(page.outputFiles[0].text).toString('base64')}`);
  return container.renderToString(Page);
}

test('directory cards identify every kind and retain zero-post authors', async () => {
  for (const [kind, label] of [['human', 'Human'], ['ai', 'AI writer'], ['bot', 'Bot']]) {
    const html = await render(author(kind));
    assert.match(html, new RegExp(`tag--${kind}[^>]*>${label}`));
    assert.match(html, /<h2[^>]*>[\s\S]*Test Author[\s\S]*<\/h2>/);
    assert.match(html, /An existing biography\./);
    assert.match(html, /0 posts published/);
    assert.match(html, /href="\/authors\/fixture\/"/);
    assert.doesNotMatch(html, /<img|author-card[" ]/);
  }
});

test('small avatars are lazy decorative images with explicit dimensions beside the name', async () => {
  const html = await render(author('human'), {
    href: '/preview/authors/michel/', imageSrc: '/preview/authors/michel-avatar.webp', count: 1,
  });
  assert.match(html, /src="\/preview\/authors\/michel-avatar.webp" alt="" width="52" height="52" loading="lazy" decoding="async"/);
  assert.match(html, /href="\/preview\/authors\/michel\/"/);
  assert.match(html, /1 post published/);
  assert.doesNotMatch(html, /width="768"|portrait|fetchpriority/);
});

test('cards escape the existing biography and identity, preserve disclosures, and fall back to initials', async () => {
  const html = await render(author('human', {
    name: 'Editor <One>', bio: '<script>alert("bio")</script> & facts', personalOpinion: true,
  }), { href: '/authors/michel/?first=1&second=2', count: 2 });
  assert.match(html, /Editor &lt;One&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&quot;bio&quot;\)&lt;\/script&gt; &amp; facts/);
  assert.match(html, /aria-hidden="true"[^>]*>E&lt;/);
  assert.match(html, /Personal opinion/);
  assert.match(html, /href="\/authors\/michel\/\?first=1&amp;second=2"/);
  assert.match(html, /2 posts published/);
  assert.doesNotMatch(html, /<script>|<One>|<img/);
});

test('directory page counts only published posts and maps the stored Michel ID to the canonical profile', async () => {
  const michel = { ...author('human', { name: 'Michel', avatar: '/authors/michel-avatar.webp' }) };
  const bot = { ...author('bot', { name: 'Desk Bot' }), id: 'desk-bot' };
  const post = (id, extra = {}) => ({
    id, data: { author: { id: 'wiz-cat' }, pubDate: '1970-01-01T00:00:00Z', draft: false, ...extra },
  });
  const html = await renderPage([bot, michel], [
    post('published'), post('draft', { draft: true }), post('future', { pubDate: '2999-01-01T00:00:00Z' }),
    post('withdrawn', { withdrawn: { date: '2026-01-01', reason: 'Withdrawn' } }),
  ]);
  assert.match(html, /data-canonical="https:\/\/aitamer.news\/authors\/"/);
  assert.match(html, /href="\/preview\/authors\/michel\/"/);
  assert.doesNotMatch(html, /href="[^"]*wiz-cat|[234] posts published/);
  assert.equal((html.match(/1 post published/g) ?? []).length, 1);
  assert.equal((html.match(/0 posts published/g) ?? []).length, 1);
  assert.ok(html.indexOf('>Michel<') < html.indexOf('>Desk Bot<'));
  assert.match(html, /src="\/preview\/authors\/michel-avatar.webp"/);
});

test('directory page renders sparse and empty collections without adding absent authors', async () => {
  const sparse = await renderPage([{ ...author('ai', { name: 'Ari' }), id: 'ari' },
    { ...author('bot', { name: 'Desk Bot' }), id: 'desk-bot' }]);
  assert.equal((sparse.match(/<article /g) ?? []).length, 2);
  assert.doesNotMatch(sparse, /Michel|wiz-cat/);
  assert.match(sparse, /<h1[^>]*>Authors<\/h1>/);
  const empty = await renderPage([]);
  assert.match(empty, /No author profiles are available yet\./);
  assert.doesNotMatch(empty, /<article |<ul/);
});
