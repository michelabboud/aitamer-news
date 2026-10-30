/** Render the real narration component, without building or touching shared dist output. */
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
  entryPoints: ['src/components/PostNarration.astro'],
  bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'render-narration-test', setup(builder) {
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
const { default: PostNarration } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const container = await AstroContainer.create();
const DISCLOSURE = 'AI use: this narration is a synthetic voice (Kokoro-82M). The text was written and checked by the aitamer.news desk.';
const render = (extra = {}) => container.renderToString(PostNarration, {
  props: { narration: { key: 'grok-4-7-pricing', file: 'grok-4-7-pricing-v1', durationSeconds: 245, voice: 'Kokoro-82M af_heart', disclosure: DISCLOSURE, ...extra } },
});

test('renders a native, labelled, no-autoplay audio player from the bot bucket', async () => {
  const html = await render();
  assert.match(html, /<audio class="narration__player" controls preload="none" aria-labelledby="narration-label">/);
  assert.match(html, /<p class="narration__label" id="narration-label">Listen to this article \(4:05\)<\/p>/);
  assert.match(html, /<source src="https:\/\/bots\.aitamer\.news\/audio\/grok-4-7-pricing\/grok-4-7-pricing-v1\.mp3" type="audio\/mpeg">/);
  assert.match(html, /<figcaption class="narration__disclosure">AI use: this narration is a synthetic voice \(Kokoro-82M\)\./);
  assert.match(html, /data-pagefind-ignore/);
  assert.doesNotMatch(html, /autoplay|<script|<iframe/i);
});

test('without JS a browser that cannot play it still gets a download link', async () => {
  const html = await render();
  assert.match(html, /<a href="https:\/\/bots\.aitamer\.news\/audio\/grok-4-7-pricing\/grok-4-7-pricing-v1\.mp3">Download the narration \(MP3, 4:05\)<\/a>/);
});

test('the disclosure is escaped text, never HTML', async () => {
  const html = await render({ disclosure: '<b>bold</b>' });
  assert.match(html, /&lt;b&gt;bold&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>bold/);
});

test('long narrations show hours in the label', async () => {
  assert.match(await render({ durationSeconds: 3725 }), /Listen to this article \(1:02:05\)/);
});

// The post page itself needs the content collection, so its wiring is checked at the source:
// the player and the JSON-LD `audio` appear only when `narration` is set, and never on a withdrawn post.
const page = readFileSync('src/pages/posts/[slug].astro', 'utf8');

test('the post page renders the player only when narration is present, after the header and above the body', () => {
  const uses = page.match(/<PostNarration\b[^>]*>/g) ?? [];
  assert.equal(uses.length, 1);
  assert.match(page, /\{data\.narration && <PostNarration narration=\{data\.narration\} \/>\}/);
  const header = page.indexOf('</header>');
  const withdrawnBranch = page.indexOf(') : (', header);
  const player = page.indexOf('<PostNarration');
  const body = page.indexOf('<div class="article__body">');
  assert.ok(header < withdrawnBranch && withdrawnBranch < player && player < body, 'player sits in the not-withdrawn branch, above the body');
});

test('the article JSON-LD carries audio only through narrationAudioObject (undefined without narration)', () => {
  assert.match(page, /audio: narrationAudioObject\(data\.narration\),/);
  assert.equal((page.match(/narrationAudioObject\(/g) ?? []).length, 1);
});

test('the CSP already lets the bot bucket serve media', () => {
  const csp = readFileSync('scripts/csp-headers.mjs', 'utf8');
  assert.match(csp, /botMedia: 'https:\/\/bots\.aitamer\.news'/);
  assert.match(csp, /\['media-src', \["'self'", ORIGINS\.botMedia\]\]/);
});
