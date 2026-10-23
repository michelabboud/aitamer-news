/** Render the real profile component, without building or touching shared dist output. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

// Use the exact compiler and bundler installed for Astro, as the site's frontmatter reader does.
const requireAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(requireAstro.resolve('@astrojs/compiler-rs')).href);
const { build } = await import(pathToFileURL(requireAstro.resolve('esbuild')).href);
const compiled = await build({
  entryPoints: ['src/components/WriterProfile.astro'],
  bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'render-profile-test', setup(builder) {
    builder.onLoad({ filter: /\.astro$/ }, ({ path }) => {
      const result = transform(readFileSync(path, 'utf8'), {
        filename: path, internalURL: 'astro/compiler-runtime', resultScopedSlot: true,
        // Match Astro's production compilation, which resolves component imports at build time.
        resolvePath: (specifier) => specifier,
      });
      const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
      if (errors.length) throw new Error(errors.map((error) => error.text).join('\n'));
      return { contents: result.code, loader: 'ts', resolveDir: dirname(path) };
    });
  } }],
});
const { default: WriterProfile } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();
const fixture = (kind, extra = {}) => ({
  id: 'fixture', body: 'First paragraph.\nSecond line.\n\n<script>alert("intro")</script>',
  data: { name: 'Test Author', kind, bio: 'Short biography', beats: ['Tools', '<b>Safety</b>'], ...extra },
});
const render = (author, extra = {}, slots = {}) => container.renderToString(WriterProfile, {
  props: { author, count: 0, ...extra }, slots,
});

test('featured human keeps portrait, explanatory caption, escaped intro, website, beats and empty state', async () => {
  const html = await render(fixture('human', {
    featured: true, portrait: '/authors/human.jpg', portraitAlt: 'A paper portrait.', website: 'https://example.com/',
  }), { imageSrc: '/preview/authors/human.jpg' });
  assert.match(html, /src="\/preview\/authors\/human.jpg" alt="A paper portrait\."/);
  assert.match(html, /tag--human[^>]*>Human/);
  assert.match(html, /Test Author is a human writer\. This portrait is a paper collage illustration\./);
  assert.match(html, /Human writer · 0 pieces published/);
  assert.match(html, /First paragraph\. Second line\./);
  assert.match(html, /&lt;script&gt;alert\(&quot;intro&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|<b>Safety/);
  assert.match(html, /href="https:\/\/example.com\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /What Test Author covers/);
  assert.match(html, /&lt;b&gt;Safety&lt;\/b&gt;/);
  assert.match(html, /Test Author’s first piece is on its way\./);
  assert.doesNotMatch(html, /writer-poems/);
});

test('featured AI retains nonhuman badge and chosen portrait explanation', async () => {
  const html = await render(fixture('ai', { portrait: '/authors/ai.jpg', portraitAlt: 'Chosen portrait' }), { imageSrc: '/authors/ai.jpg' });
  assert.match(html, /tag--ai[^>]*>AI writer/);
  assert.match(html, /Test Author is an AI, not a person\. This portrait is the one Test Author chose\./);
  assert.match(html, /Featured writer · 0 pieces published/);
  assert.doesNotMatch(html, /is a human/);
});

test('missing intro and portrait fall back to escaped biography and initials', async () => {
  const author = fixture('ai', { bio: '<em>Bio</em>', beats: [] });
  author.body = undefined;
  const html = await render(author);
  assert.match(html, /writer__initials[^>]*>TA/);
  assert.match(html, /&lt;em&gt;Bio&lt;\/em&gt;/);
  assert.doesNotMatch(html, /<img|writer__beats|website/);
});

test('ordinary human and bot retain profile, identity badge, biography, and sightings empty state', async () => {
  for (const [kind, role] of [['human', 'Human editor'], ['bot', 'News bot']]) {
    const html = await render(fixture(kind, { featured: kind === 'bot', avatar: '/authors/avatar.jpg' }), { imageSrc: '/preview/authors/avatar.jpg' });
    assert.match(html, new RegExp(`tag--${kind}`));
    assert.ok(html.includes(role));
    assert.match(html, /The Tamers · 0 sightings filed/);
    assert.match(html, /src="\/preview\/authors\/avatar.jpg" alt="" width="52" height="52"/);
    assert.match(html, /No published sightings yet\./);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /writer__portrait|writer-poems|writer-pieces|own page|class="more"/);
  }
});

test('ordinary human exposes the public website with safe external-link attributes and escaped identity', async () => {
  const html = await render(fixture('human', {
    name: 'Editor <One>', website: 'https://example.com/?first=1&second=2',
  }));
  assert.match(html, /href="https:\/\/example.com\/\?first=1&amp;second=2" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /Editor &lt;One&gt;’s website/);
  assert.match(html, /\(opens in a new tab\)/);
  assert.match(html, /Human editor/);
  assert.doesNotMatch(html, /<One>|writer__portrait/);
});

test('poems and pieces retain separate sections and never falsely show an empty collection', async () => {
  const author = fixture('ai');
  const html = await render(author, { count: 2, poemCount: 1, pieceCount: 1 }, { poems: '<p>A poem card</p>', pieces: '<p>A piece card</p>' });
  assert.match(html, /id="writer-poems"/);
  assert.match(html, /id="writer-pieces"/);
  assert.match(html, /A poem card/);
  assert.match(html, /A piece card/);
  assert.ok(html.indexOf('writer-poems') < html.indexOf('writer-pieces'));
  assert.doesNotMatch(html, /first piece is on its way/);
  const poemsOnly = await render(author, { count: 1, poemCount: 1 }, { poems: '<p>A poem card</p>' });
  assert.match(poemsOnly, /A poem card/);
  assert.match(poemsOnly, /first piece is on its way/);
  const ordinary = await render(fixture('human'), { count: 1 }, { sightings: '<p>A sighting card</p>' });
  assert.match(ordinary, /1 sighting filed/);
  assert.match(ordinary, /A sighting card/);
  assert.doesNotMatch(ordinary, /No published sightings yet/);
});
