/**
 * The rendered-body gate for bot posts (ADR 0009): the allowlist on hand-written HTML, the known
 * bypass bodies through the site's real renderer, the child process's timeout and memory cap,
 * the bot-only gate, the post-build comparison, and the ids the page protects.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  GRANDFATHERED_POSTS,
  MEDIA_PREFIX,
  PAGE_STAND_IN,
  PROTECTED_IDS,
  SHIKI_THEME,
  SITE_ROOT,
  applyGrandfather,
  botAuthorIds,
  botSetProblems,
  builtPageProblems,
  checkAgainstBuild,
  checkPostFiles,
  checkPostSources,
  checkRenderedHtml,
  createPostChecker,
  gatedPostFiles,
  hrefProblem,
  imageSrcProblem,
  isGated,
  isProtectedId,
  mergeResults,
  postFiles,
  staleGrandfatherEntries,
  storedAuthorIsBot,
} from './check-rendered-body.mjs';
import { tempDir } from './test-support.mjs';

const post = (body, author = 'desk-bot') => `---\ntitle: "A test"\nauthor: ${author}\n---\n\n${body}\n`;
const problems = (findings) => findings.map((f) => `${f.path}${f.attribute ? `@${f.attribute}` : ''}: ${f.problem}`);

// ---------------------------------------------------------------------------------------------
// The known bypasses: bodies the Rust pre-filter and satteri read differently. Each must be refused
// through the site's real render, whatever the pre-filter thought of it.
// ---------------------------------------------------------------------------------------------

const BYPASSES = [
  ['a front-matter-like leading block', '---\n```\n---\n<script>alert(1)</script>', /element <script> is not allowed/],
  ['a tab before >', 'Intro.\n\n> Quote\n\t> ```<script>alert(1)</script>', /element <script> is not allowed/],
  ['a task-marker-only list item', '- [ ]\n\n  ```\n<img src=x onerror=alert(1)>', /@onerror: attribute not allowed/],
  ['a footnote reference glued to a link', 'a[^1][x](javascript:alert(1))\n\n[x]: https://a.b/\n\n[^1]: n', /@href: link scheme "javascript:" is not allowed/],
  ['a malformed escape in an image URL', '![a](https://media.aitamer.news/%ZZ.png)', /renderer failed on this post: URI malformed/],
];

test('the five known bypass bodies are refused through the real render', async () => {
  const results = await checkPostSources(BYPASSES.map(([, body], i) => ({ name: `bypass-${i}.md`, contents: post(body) })));
  results.forEach(({ findings }, i) => {
    const [what, , expected] = BYPASSES[i];
    assert.ok(findings.length > 0, `${what}: no finding`);
    assert.ok(problems(findings).some((p) => expected.test(p)), `${what}: ${problems(findings).join(' | ')}`);
  });
});

test('G1: a trailing unterminated tag is refused through the real render (the browser would complete it)', async () => {
  const bodies = [
    'Hi.\n\n<details open ontoggle=alert(document.domain) ',
    'Hi.\n\n<script src=https://evil.example/x.js ',
    'Hi.\n\n<iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;" ',
  ];
  const results = await checkPostSources(bodies.map((body, i) => ({ name: `eof-${i}.md`, contents: post(body) })));
  // Parsed inside the page stand-in (G2), the open tag swallows what follows it, as on the page:
  // parse errors either way, and the page structure breaks.
  results.forEach(({ findings }, i) => assert.match(problems(findings).join(), /parse error \(/, bodies[i]));
});

test('G1: any parse error in the rendered HTML is a finding', () => {
  refusedBy('<p>x</p><img src="https://media.aitamer.news/a.png" alt="a" ', /parse error \(/);
  refusedBy('<p>x</p><p a="1" a="2">y</p>', /parse error \(duplicate-attribute\)/);
});

test('G2: a body that leaves an element open or closes one it did not open is refused', async () => {
  const bodies = {
    'an unclosed link': 'Read more <a href="https://evil.example/">here',
    'an unclosed table': '<table><tr><td>x',
    'a stray </div>': 'a\n\n</div>\n\nb',
    'an unclosed <em>': 'x <em>open',
  };
  const names = Object.keys(bodies);
  const results = await checkPostSources(names.map((name, i) => ({ name: `open-${i}.md`, contents: post(bodies[name]) })));
  results.forEach(({ findings }, i) => assert.match(problems(findings).join(), /does not close cleanly/, names[i]));
  refusedBy('<p>x</p></div><p>outside</p>', /does not close cleanly/);
  refusedBy('<p><a href="https://a.b/">open</p>', /does not close cleanly/);
  // An unclosed list is closed by the page's own `</div>` exactly as here: nothing leaks, no finding.
  assert.deepEqual(problems(checkRenderedHtml('<ul><li>x')), []);
  assert.deepEqual(problems(checkRenderedHtml('<p>closed <a href="https://a.b/">link</a></p>\n')), []);
});

test("H1: tags that reach the page's <html>, <head> or <body> are refused through the real render", async () => {
  const bodies = {
    '<body onload>': 'x\n\n<body onload=alert(document.domain)>',
    '<body onpageshow>': 'x\n\n<body onpageshow=alert(1) class=pwned>',
    '<body> alone': 'x\n\n<body>',
    '<html style>': 'x\n\n<html style="filter:invert(1)">',
    '<head>': 'x\n\n<head>',
    '<frameset>': '<frameset onload=alert(1)>',
    '<base>': '<base href="https://evil.example/">',
    '<meta>': '<meta http-equiv="refresh" content="0;url=https://evil.example/">',
    '<link>': '<link rel="stylesheet" href="https://evil.example/x.css">',
  };
  const names = Object.keys(bodies);
  const results = await checkPostSources(names.map((name, i) => ({ name: `doc-${i}.md`, contents: post(bodies[name]) })));
  results.forEach(({ findings }, i) => {
    assert.ok(findings.length > 0, `${names[i]}: no finding`);
    assert.match(problems(findings).join(), /breaks out of its place|start tag that the parser drops or merges|element <(base|meta|link)> is not allowed/, names[i]);
  });
  assert.match(problems(results[0].findings).join(), /page's <body>/);
  assert.match(problems(results[3].findings).join(), /page's <html>|<html> start tag/);
});

test("H2: end tags for the page's own elements are refused through the real render", async () => {
  const bodies = ['x\n\n</article>\n\ny', 'x\n\n</main>\n\ny', 'x\n\n</article></main><a href="https://evil.example/">z</a>', 'x\n\n</body>\n\ny', 'x\n\n</html><p>y</p>'];
  const results = await checkPostSources(bodies.map((body, i) => ({ name: `end-${i}.md`, contents: post(body) })));
  results.forEach(({ findings }, i) => assert.match(problems(findings).join(), /end tag that closes nothing the body opened/, bodies[i]));
  // The first three also move content out of the story, which the page-shape check sees.
  results.slice(0, 3).forEach(({ findings }, i) => assert.match(problems(findings).join(), /breaks out of its place/, bodies[i]));
});

test('should-fix 1b: an end tag that closes nothing the body opened is refused, allowed element or not', async () => {
  const bodies = ['<p>a</p></section>', 'x\n\n</blockquote>\n\ny', 'x\n\n</li>\n\ny', 'x\n\n</table>\n\ny', 'x\n\n</p>\n\ny', '<p>a</span></p>', '<p>a</a></p>'];
  const results = await checkPostSources(bodies.map((body, i) => ({ name: `unmatched-${i}.md`, contents: post(body) })));
  results.forEach(({ findings }, i) => assert.match(problems(findings).join(), /end tag that closes nothing the body opened/, bodies[i]));
  // Balanced bodies, nested and repeated, still pass.
  assert.deepEqual(problems(checkRenderedHtml('<blockquote><blockquote><p>a <em>b</em></p></blockquote></blockquote><ul><li>x</li><li>y</li></ul>')), []);
});

test("H1: the page stand-in mirrors the story page's real ancestor chain", () => {
  const layout = readFileSync(join(SITE_ROOT, 'src/layouts/BaseLayout.astro'), 'utf8');
  const page = readFileSync(join(SITE_ROOT, 'src/pages/posts/[slug].astro'), 'utf8');
  // What the stand-in says, element by element.
  assert.match(PAGE_STAND_IN.before, /^<!doctype html><html><head><\/head><body><main id="main" class="site-shell site-main"><article class="article" data-pagefind-body><div class="article__body">$/);
  // What the page says: body > main#main (site-shell site-main on a story page) > slot;
  // article.article[data-pagefind-body] > … > div.article__body > <Content />.
  assert.match(layout, /\n  <body>\n/);
  assert.match(layout, /<main id="main" class:list=\{\['site-shell', 'site-main', \{ 'site-main--home': home \}\]\}>\s*<slot \/>\s*<\/main>/);
  assert.match(page, /<article class="article" data-pagefind-body=\{withdrawn \? undefined : ''\}>/);
  assert.match(page, /<div class="article__body">\s*<Content \/>\s*<\/div>/);
});

// ---------------------------------------------------------------------------------------------
// Legitimate bodies pass.
// ---------------------------------------------------------------------------------------------

const LEGITIMATE = {
  headings: '# One\n\n## Two *em* `code`\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six\n\n## Two',
  lists: '- a\n  - nested\n- b\n\n3. three\n4. four\n\n1. one',
  table: '| left | centre | right | none |\n|:--|:-:|--:|---|\n| 1 | 2 | 3 | 4 |',
  footnotes: 'A claim[^src] and again[^src], and another[^Other-2].\n\n[^src]: The source.\n[^Other-2]: Another, with a [link](https://example.com/).',
  tasks: '- [x] done\n- [ ] to do',
  code: '```js\nconst x = 1; // note\n```\n\n```rust\nfn main() {}\n```\n\n```\nplain\n```\n\n```md\n**bold** _italic_ ~~gone~~\n```\n\n```nosuchlanguage\nx\n```\n\n```math\nx^2\n```',
  images: `![A hero](${MEDIA_PREFIX}heroes/x.jpg "Title") ![Spaced](${MEDIA_PREFIX}a%20b.png)`,
  links:
    '[https](https://example.com/a?b=1&c=2#d) [http](http://example.com) [mail](mailto:desk@aitamer.news) ' +
    '[path](/posts/grok-4-7/) [fragment](#one) [titled](https://example.com "A title") <https://auto.example/x> ' +
    'desk@aitamer.news www.example.com [ref][r]\n\n[r]: https://example.com/ref',
  punctuation: '"Quotes" and \'single\' -- dashes --- and... ellipses. &amp; &copy; &#x1F600; \\<not a tag\\> `<code>`',
  blocks: '> A quote\n>\n> > nested\n\n---\n\n~~struck~~ **strong** _em_\n\nline  \nbreak',
};

test('legitimate bodies pass: headings, lists, tables, footnotes, tasks, Shiki code, media images, links, punctuation', async () => {
  const names = Object.keys(LEGITIMATE);
  const results = await checkPostSources(names.map((name) => ({ name: `${name}.md`, contents: post(LEGITIMATE[name]) })));
  results.forEach(({ findings, html }, i) => {
    assert.deepEqual(problems(findings), [], `${names[i]} was refused`);
    assert.ok(html && html.length > 0, `${names[i]} rendered nothing`);
  });
  // The Shiki shapes the allowlist pins really are in the output, so the test exercises them.
  const code = results[names.indexOf('code')].html;
  assert.match(code, new RegExp(`<pre class="astro-code ${SHIKI_THEME}" style="background-color:#[0-9a-f]{6};color:#[0-9a-f]{6}; overflow-x: auto;" tabindex="0" data-language="js">`));
  assert.match(code, /font-weight:bold/);
  assert.match(code, /<pre><code class="language-math">/);
  assert.match(results[names.indexOf('footnotes')].html, /data-footnote-backref/);
  assert.match(results[names.indexOf('table')].html, /style="text-align: center"/);
});

// ---------------------------------------------------------------------------------------------
// Every allowlist rule on its failure path, on hand-written HTML (the allowlist is pure).
// ---------------------------------------------------------------------------------------------

const refusedBy = (html, pattern) => {
  const found = problems(checkRenderedHtml(html));
  assert.ok(found.some((p) => pattern.test(p)), `${html} → ${found.join(' | ') || 'no finding'}`);
};

test('unknown elements, comments and foreign content are refused', () => {
  refusedBy('<p>ok</p><iframe src="https://example.com"></iframe>', /iframe\[1\]: element <iframe> is not allowed/);
  refusedBy('<div>x</div>', /element <div> is not allowed/);
  refusedBy('<p><b>raw</b></p>', /element <b> is not allowed/);
  refusedBy('<!-- note -->', /#comment nodes are not allowed/);
  refusedBy('<svg><a href="https://a.b">x</a></svg>', /foreign \(SVG or MathML\) content/);
  refusedBy('<template><script>x</script></template>', /element <template> is not allowed/);
  refusedBy('<form><input type="checkbox" disabled></form>', /element <form> is not allowed/);
  refusedBy('<span>outside code</span>', /span is allowed only inside a highlighted code block/);
  refusedBy('<p><input type="checkbox" disabled></p>', /checkbox is allowed only as a task-list marker/);
});

test('unknown attributes are refused', () => {
  refusedBy('<p class="x">a</p>', /@class: attribute not allowed on <p>/);
  refusedBy('<p onclick="x()">a</p>', /@onclick: attribute not allowed/);
  refusedBy('<a href="https://a.b" target="_blank">x</a>', /@target: attribute not allowed on a link/);
  refusedBy(`<img src="${MEDIA_PREFIX}a.png" width="10">`, /@width: attribute not allowed on <img>/);
  refusedBy('<img __ASTRO_IMAGE_="{}">', /Astro's image pipeline|image marker/);
  refusedBy('<p>__ASTRO_IMAGE_="{&quot;src&quot;:&quot;x&quot;}"</p>', /contains Astro's image marker/);
  refusedBy('<ul class="other"><li>x</li></ul>', /@class: must be "contains-task-list"/);
  refusedBy('<li id="x">a</li>', /list item id is allowed only on a footnote/);
  refusedBy('<ol start="1e3"><li>x</li></ol>', /@start: must be a whole number/);
  refusedBy('<ul class="contains-task-list"><li class="task-list-item"><input type="text" disabled></li></ul>', /@type: must be "checkbox"/);
  refusedBy('<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox"></li></ul>', /missing disabled/);
});

test('style values outside the exact shapes are refused', () => {
  refusedBy('<table><tr><td style="text-align: left; color: red">x</td></tr></table>', /@style: must be "text-align/);
  refusedBy('<p style="text-align: left">x</p>', /@style: attribute not allowed on <p>/);
  const shiki = (preAttrs, span) => `<pre ${preAttrs}><code><span class="line">${span}</span></code></pre>`;
  const pre = `class="astro-code ${SHIKI_THEME}" style="background-color:#24292e;color:#e1e4e8; overflow-x: auto;" tabindex="0" data-language="js"`;
  assert.deepEqual(problems(checkRenderedHtml(shiki(pre, '<span style="color:#F97583;font-style:italic">x</span>'))), []);
  refusedBy(shiki(pre, '<span style="color:red">x</span>'), /style is not a github-dark token style/);
  refusedBy(shiki(pre, '<span style="font-style:italic;color:#F97583">x</span>'), /token style/);
  refusedBy(shiki(pre, '<span style="color:#F97583;background:url(https://a.b/x)">x</span>'), /token style/);
  refusedBy(shiki(pre.replace(SHIKI_THEME, 'nord'), 'x'), /class must be "astro-code github-dark"/);
  refusedBy(shiki(pre.replace(' overflow-x: auto;', ' overflow-x: auto;white-space: pre-wrap;'), 'x'), /not the Shiki block style/);
  refusedBy(shiki(`${pre} onmouseover="x()"`, 'x'), /@onmouseover: unknown attribute on a code block/);
  refusedBy(shiki(pre.replace('data-language="js"', 'data-language="a b"'), 'x'), /data-language is not a language name/);
  refusedBy('<pre><code class="nope">x</code></pre>', /code class is allowed only as language-<name>/);
});

test('link targets: only http, https, mailto, /path and #fragment, judged after entity decoding', () => {
  for (const ok of ['https://a.b/', 'HTTP://A.B', 'mailto:x@y.z', '/posts/a/', '#x', '#']) assert.equal(hrefProblem(ok), null, ok);
  refusedBy('<a href="java&#115;cript:alert(1)">x</a>', /link scheme "javascript:" is not allowed/);
  refusedBy('<a href="java&#x09;script:alert(1)">x</a>', /whitespace or control characters/);
  refusedBy('<a href="&#x20;javascript:alert(1)">x</a>', /whitespace or control characters/);
  refusedBy('<a href="JaVaScRiPt:alert(1)">x</a>', /"javascript:" is not allowed/);
  refusedBy('<a href="data:text/html,x">x</a>', /"data:" is not allowed/);
  refusedBy('<a href="vbscript:x">x</a>', /"vbscript:" is not allowed/);
  refusedBy('<a href="//evil.example/">x</a>', /protocol-relative/);
  refusedBy('<a href="/\\evil.example/">x</a>', /protocol-relative/);
  refusedBy('<a href="relative/path">x</a>', /relative link that is not a \/path/);
  refusedBy('<a href="https://trusted.example@evil.example/">x</a>', /user name or password/);
  refusedBy('<a href="">x</a>', /empty link target/);
  refusedBy('<a>x</a>', /a link without href/);
});

test('images: only media.aitamer.news, valid for decodeURI, never a local import', () => {
  assert.equal(imageSrcProblem(`${MEDIA_PREFIX}heroes/a.jpg`), null);
  refusedBy('<img src="https://evil.example/a.png">', /must start with https:\/\/media\.aitamer\.news\//);
  refusedBy('<img src="https://media.aitamer.news.evil.example/a.png">', /must start with/);
  refusedBy('<img src="https://media.aitamer.news:8443/a.png">', /must start with/);
  refusedBy('<img src="/heroes/a.jpg">', /must start with/);
  refusedBy(`<img src="${MEDIA_PREFIX}%ZZ.png">`, /decodeURI/);
  refusedBy('<img alt="x">', /<img> is missing src/);
});

test('heading ids: slugger shape only, never an id the page uses', () => {
  assert.deepEqual(problems(checkRenderedHtml('<h2 id="a-heading_1">x</h2><h3 id="ünïcödé">y</h3><h4 id="-1">z</h4>')), []);
  refusedBy('<h2 id="comments">x</h2>', /collides with an id the story page uses/);
  refusedBy('<h2 id="footnote-label">x</h2>', /collides/);
  refusedBy('<h2 id="user-content-fn-1">x</h2>', /collides/);
  refusedBy('<h2 id="reactions-panel-grok-4-7">x</h2>', /collides/);
  refusedBy('<h2 id="c-01k63m4q3zj8w3y8n5v2r7t9ab">x</h2>', /collides/);
  refusedBy('<h2 id="Main">x</h2>', /slugger shape/);
  refusedBy('<h2 id="a b">x</h2>', /slugger shape/);
  refusedBy('<h2>no id</h2>', /<h2> is missing id/);
  refusedBy('<h2 id="x">a</h2><h3 id="x">b</h3>', /used twice/);
});

test('footnotes: only their exact forms', () => {
  refusedBy('<p><a href="#user-content-fn-1" id="x" data-footnote-ref="" aria-describedby="footnote-label">1</a></p>', /id must be user-content-fnref/);
  refusedBy('<p><sup><a href="https://a.b" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>', /must link to #user-content-fn-/);
  refusedBy('<p><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></p>', /must sit in <sup>/);
  refusedBy('<p><a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>', /must sit in the footnotes section/);
  refusedBy('<section class="footnotes">x</section>', /footnotes section is missing data-footnotes/);
  refusedBy('<section data-footnotes="" class="footnotes"><h2 class="sr-only" id="footnote-label" hidden>F</h2></section>', /@hidden: unknown attribute on the footnotes heading/);
});

// ---------------------------------------------------------------------------------------------
// The child process: timeout, memory cap, a renderer that cannot start.
// ---------------------------------------------------------------------------------------------

/** A stand-in worker speaking the real protocol: hangs on HANG, bloats on BLOAT, else passes. */
const FAKE_WORKER = `
import { createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
const out = createWriteStream('', { fd: 3 });
const send = (m) => out.write(JSON.stringify(m) + '\\n');
if (process.env.FAKE_WORKER_FAIL_START) { send({ ready: false, error: 'config exploded' }); out.end(); }
else {
send({ ready: true });
for await (const line of createInterface({ input: process.stdin })) {
  const { id, contents } = JSON.parse(line);
  if (contents === 'HANG') await new Promise(() => setInterval(() => {}, 1000));
  if (contents === 'BLOAT') { const keep = []; for (;;) keep.push(new Array(1e6).fill(Math.random())); }
  send({ id, findings: [], html: '<p>' + contents + '</p>' });
}
}
`;

function fakeWorker() {
  const dir = tempDir('fake-worker-');
  const path = join(dir, 'worker.mjs');
  writeFileSync(path, FAKE_WORKER);
  return path;
}

test('a render that does not finish in time is a finding, and the next post gets a fresh worker', async () => {
  const workerScript = fakeWorker();
  const results = await checkPostSources(
    [{ name: 'a.md', contents: 'HANG' }, { name: 'b.md', contents: 'fine' }],
    { workerScript, timeoutMs: 300 },
  );
  assert.match(problems(results[0].findings).join(), /did not finish within 300 ms/);
  assert.deepEqual(results[1], { findings: [], html: '<p>fine</p>' });
});

test('a render that exhausts the memory cap is a finding, not a crash of the caller', async () => {
  const results = await checkPostSources(
    [{ name: 'a.md', contents: 'BLOAT' }, { name: 'b.md', contents: 'fine' }],
    { workerScript: fakeWorker(), maxOldSpaceMb: 32, timeoutMs: 30_000 },
  );
  assert.match(problems(results[0].findings).join(), /ran out of memory \(cap 32 MiB\)|renderer exited/);
  assert.deepEqual(results[1].findings, []);
});

test('a renderer that cannot start fails every post closed', async () => {
  process.env.FAKE_WORKER_FAIL_START = '1';
  try {
    const results = await checkPostSources([{ name: 'a.md', contents: 'x' }, { name: 'b.md', contents: 'y' }], { workerScript: fakeWorker() });
    for (const r of results) assert.match(problems(r.findings).join(), /could not start the site's renderer: config exploded/);
  } finally {
    delete process.env.FAKE_WORKER_FAIL_START;
  }
});

test('the real renderer starts against this checkout: satteri, Shiki, and the theme the allowlist pins', async () => {
  // Drift in astro.config.mjs (another theme, wrap, transformers, another processor) throws here.
  const check = await createPostChecker();
  assert.deepEqual((await check(post('ok'), 'x.md')).findings, []);
  assert.match(problems((await check(post('ok'), 'x.mdx')).findings).join(), /must be a \.md file/);
  assert.match(problems((await check(post('x'.repeat(600 * 1024)), 'x.md')).findings).join(), /larger than/);
});

// ---------------------------------------------------------------------------------------------
// The bot-only gate.
// ---------------------------------------------------------------------------------------------

test('the bot ids come from the authors marked kind: bot, which today is desk-bot alone', () => {
  assert.deepEqual([...botAuthorIds()], ['desk-bot']);
});

test('G3: with no author marked kind: bot the gate fails instead of checking nothing', async () => {
  assert.deepEqual(botSetProblems(), [], 'desk-bot is marked a bot on main');
  const root = tempDir('no-bots-');
  mkdirSync(join(root, 'src/content/authors'), { recursive: true });
  writeFileSync(join(root, 'src/content/authors/desk-bot.md'), '---\nname: Desk Bot\nkind: human\nbio: b\n---\n');
  assert.match(problems(botSetProblems(root).flatMap((r) => r.findings)).join(), /no author is marked kind: bot/);
  assert.match(problems(botSetProblems(tempDir('no-authors-')).flatMap((r) => r.findings)).join(), /cannot read the authors/);
  // The post-build check refuses the same way, before looking at any post.
  mkdirSync(join(root, 'node_modules/.astro'), { recursive: true });
  for (const dep of ['astro', 'devalue']) symlinkSync(join(SITE_ROOT, 'node_modules', dep), join(root, 'node_modules', dep), 'dir');
  const devalue = await import(pathToFileURL(join(SITE_ROOT, 'node_modules/devalue/index.js')).href);
  writeFileSync(join(root, 'node_modules/.astro/data-store.json'), devalue.stringify(new Map([['posts', new Map()]])));
  assert.match(problems((await checkAgainstBuild({ root })).flatMap((r) => r.findings)).join(), /no author is marked kind: bot/);
});

test('only bot-authored posts are gated; a post whose author cannot be read is gated too', () => {
  const bots = new Set(['desk-bot']);
  assert.equal(isGated(post('x', 'desk-bot'), bots), true);
  assert.equal(isGated(post('x', 'wiz-cat'), bots), false);
  assert.equal(isGated('no front matter', bots), true);
  assert.equal(isGated('---\ntitle: [unclosed\n---\n', bots), true);
  assert.equal(isGated('---\nauthor: { id: wiz-cat }\n---\n', bots), true);
});

test('the gate checks a bot fixture post and skips a human one with the same body', async () => {
  const root = tempDir('rendered-gate-');
  mkdirSync(join(root, 'src/content/authors'), { recursive: true });
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  writeFileSync(join(root, 'src/content/authors/desk-bot.md'), '---\nname: Desk Bot\nkind: bot\nbio: b\n---\n');
  writeFileSync(join(root, 'src/content/authors/wiz-cat.md'), '---\nname: Wiz Cat\nkind: human\nbio: b\n---\n');
  const bad = '<script>alert(1)</script>';
  writeFileSync(join(root, 'src/content/posts/by-bot.md'), post(bad, 'desk-bot'));
  writeFileSync(join(root, 'src/content/posts/by-human.md'), post(bad, 'wiz-cat'));
  const gated = gatedPostFiles(root);
  assert.deepEqual(gated.map((f) => relative(root, f)), ['src/content/posts/by-bot.md']);
  const [result] = await checkPostFiles(gated);
  assert.match(problems(result.findings).join(), /element <script> is not allowed/);
});

test('a grandfathered post is excused only for its listed findings, and only while unchanged', () => {
  const name = 'src/content/posts/made-on-youtube-2026-gemini-ask-studio.md';
  const contents = readFileSync(join(SITE_ROOT, name), 'utf8');
  assert.equal(createHash('sha256').update(contents).digest('hex'), GRANDFATHERED_POSTS[name].sha256, 'the pinned hash no longer matches the file');
  const known = [...GRANDFATHERED_POSTS[name].findings];
  const extra = { path: 'script[1]', element: 'script', problem: 'element <script> is not allowed' };
  assert.deepEqual(applyGrandfather(name, contents, known), { failing: [], excused: known });
  assert.deepEqual(applyGrandfather(name, contents, [...known, extra]).failing, [extra]);
  const edited = applyGrandfather(name, `${contents}\n`, known);
  assert.deepEqual(edited.excused, [], 'an edited file is gated in full');
  assert.deepEqual(edited.failing.slice(0, 2), known);
  assert.match(problems(edited.failing).join(), /changed since it was grandfathered, so its exemption is void/);
  // An edit that removed the iframes still fails: the entry must not outlive it.
  assert.match(problems(applyGrandfather(name, `${contents}\n`, []).failing).join(), /exemption is void/);
  // Same bytes, but a finding the entry lists has gone (a renderer change): the entry is stale.
  assert.match(problems(applyGrandfather(name, contents, known.slice(0, 1)).failing).join(), /lists findings this file no longer has/);
  assert.deepEqual(applyGrandfather('another.md', contents, known).failing, known);
  // G7: matched on the path from the site root, never on the base name.
  assert.deepEqual(applyGrandfather('made-on-youtube-2026-gemini-ask-studio.md', contents, known).failing, known);
  assert.deepEqual(applyGrandfather('src/content/posts/old/made-on-youtube-2026-gemini-ask-studio.md', contents, known).failing, known);
});

test('G7: the grandfather list is exactly its one entry (adding one must be a reviewed change here)', () => {
  assert.deepEqual(Object.keys(GRANDFATHERED_POSTS), ['src/content/posts/made-on-youtube-2026-gemini-ask-studio.md']);
  assert.ok(Object.isFrozen(GRANDFATHERED_POSTS));
});

test('G7: a byte-identical copy of the grandfathered post elsewhere is checked in full', async () => {
  const name = 'made-on-youtube-2026-gemini-ask-studio.md';
  const dir = tempDir('grandfather-copy-');
  const copy = join(dir, name);
  writeFileSync(copy, readFileSync(join(SITE_ROOT, 'src/content/posts', name)));
  const [result] = await checkPostFiles([copy]);
  assert.deepEqual(result.excused, []);
  assert.match(problems(result.findings).join(), /element <iframe> is not allowed/);
});

test('a grandfather entry that matches no file as it stands fails the gate', () => {
  assert.deepEqual(staleGrandfatherEntries(), [], 'the entries match main today');
  const name = basename(Object.keys(GRANDFATHERED_POSTS)[0]);
  const original = readFileSync(join(SITE_ROOT, 'src/content/posts', name), 'utf8');
  const fixture = (contents, kind = 'bot') => {
    const root = tempDir('grandfather-');
    mkdirSync(join(root, 'src/content/authors'), { recursive: true });
    mkdirSync(join(root, 'src/content/posts'), { recursive: true });
    writeFileSync(join(root, 'src/content/authors/desk-bot.md'), `---\nname: Desk Bot\nkind: ${kind}\nbio: b\n---\n`);
    if (contents !== null) writeFileSync(join(root, 'src/content/posts', name), contents);
    return problems(staleGrandfatherEntries(root).flatMap((r) => r.findings)).join();
  };
  assert.equal(fixture(original), '');
  assert.match(fixture(null), /the file is gone/);
  assert.match(fixture(original.replace('<iframe', '<p')), /exemption is void/);
  // G8: reachable behind the hash: the post's bytes are unchanged, its author's file changed.
  assert.match(fixture(original, 'human'), /its author is no longer marked kind: bot in src\/content\/authors/);
});

test('merged results keep each finding once per file', () => {
  const f = { path: '', element: '#post', problem: 'x' };
  const merged = mergeResults([{ file: 'a', findings: [f], excused: [] }], [{ file: 'a', findings: [f, { ...f, problem: 'y' }], excused: [] }]);
  assert.deepEqual(problems(merged[0].findings), [': x', ': y']);
});

test('every post on main: the bot posts pass the gate; what it would say about the human posts is reported', async (t) => {
  const files = postFiles();
  const results = await checkPostFiles(files);
  const bots = botAuthorIds();
  const humanWouldFail = [];
  for (const { file, findings } of results) {
    const gated = isGated(readFileSync(file, 'utf8'), bots);
    if (gated) assert.deepEqual(problems(findings), [], `${relative(SITE_ROOT, file)} is bot-authored and fails the gate`);
    else if (findings.length) humanWouldFail.push(`${relative(SITE_ROOT, file)}: ${problems(findings).join('; ')}`);
  }
  // Information for the editor, not a failure: human posts are trusted writers' (SECURITY.md).
  t.diagnostic(`human posts the gate would refuse: ${humanWouldFail.length ? humanWouldFail.join(' | ') : 'none'}`);
});

// ---------------------------------------------------------------------------------------------
// After the build: the checker renders exactly what the build stored.
// ---------------------------------------------------------------------------------------------

/** A built story page shaped like the real one (dist/posts/grok-4-7/index.html), with its chain adjustable. */
function builtPage(body, { main = '<main id="main" class="site-shell site-main">', article = '<article class="article" data-pagefind-body>', wrap = ['', ''] } = {}) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title></head><body><a class="skip-link" href="#main">Skip</a>${main}${article}<header><h1>T</h1></header>${wrap[0]}<div class="article__body">${body}</div>${wrap[1]}<aside class="verdict"><p>v</p></aside></article></main><footer>f</footer></body></html>`;
}

function writeBuiltPage(root, id, html) {
  mkdirSync(join(root, 'dist/posts', id), { recursive: true });
  writeFileSync(join(root, 'dist/posts', id, 'index.html'), html);
}

test('should-fix 1a: a built page whose body sits in another chain than the stand-in fails the gate', () => {
  assert.deepEqual(builtPageProblems(builtPage('<p>x</p>')), []);
  const wrapped = builtPageProblems(builtPage('<p>x</p>', { wrap: ['<section class="prose">', '</section>'] }));
  assert.match(wrapped.join(), /ancestors on the built page are .*<section class="prose">.*not the chain the gate models/);
  assert.match(builtPageProblems(builtPage('<p>x</p>', { main: '<main id="main" class="site-shell site-main site-main--wide">' })).join(), /not the chain the gate models/);
  assert.match(builtPageProblems(builtPage('<p>x</p>', { article: '<article class="article">' })).join(), /not the chain the gate models/, 'data-pagefind-body is required on a live story');
  assert.match(builtPageProblems(builtPage('<p>x</p>').replace('<body>', '<body class="x">')).join(), /not the chain the gate models/);
  assert.match(builtPageProblems(builtPage('<p a="1" a="2">x</p>')).join(), /the built page has a parse error \(duplicate-attribute\)/);
  assert.match(builtPageProblems(builtPage('x').replace('<div class="article__body">x</div>', '')).join(), /no <div class="article__body">/);
});

test('should-fix 1a: --against-build fails on a doctored built page, and on a build with no story page at all', async () => {
  const [{ html }] = await checkPostSources([{ name: 'a.md', contents: post('Hello *there*.') }]);
  const root = tempDir('rendered-1a-');
  mkdirSync(join(root, 'node_modules/.astro'), { recursive: true });
  mkdirSync(join(root, 'src/content/authors'), { recursive: true });
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  for (const dep of ['astro', 'devalue']) symlinkSync(join(SITE_ROOT, 'node_modules', dep), join(root, 'node_modules', dep), 'dir');
  writeFileSync(join(root, 'src/content/authors/desk-bot.md'), '---\nname: Desk Bot\nkind: bot\nbio: b\n---\n');
  writeFileSync(join(root, 'src/content/posts/a.md'), post('Hello *there*.'));
  const devalue = await import(pathToFileURL(join(SITE_ROOT, 'node_modules/devalue/index.js')).href);
  const entry = { id: 'a', data: { author: { collection: 'authors', id: 'desk-bot' } }, filePath: 'src/content/posts/a.md', digest: '0', rendered: { html, metadata: {} } };
  writeFileSync(join(root, 'node_modules/.astro/data-store.json'), devalue.stringify(new Map([['posts', new Map([['a', entry]])]])));
  const findings = async () => problems((await checkAgainstBuild({ root })).flatMap((r) => r.findings)).join(' | ');
  assert.match(await findings(), /no built story page under dist\/posts\//);
  writeBuiltPage(root, 'a', builtPage(html));
  assert.equal(await findings(), '');
  writeBuiltPage(root, 'a', builtPage(html, { wrap: ['<section>', '</section>'] }));
  assert.match(await findings(), /dist\/posts\/a\/index\.html: the story body's ancestors .*<section>/);
});

test('after the build: a store that matches the checker passes; a different render or a bad shipped body fails', async () => {
  const [{ html }] = await checkPostSources([{ name: 'a.md', contents: post('Hello *there*.') }]);
  // A repo-shaped temp root with its own build store; Astro's modules come from this checkout.
  const run = async (storedHtml) => {
    const root = tempDir('rendered-build-');
    mkdirSync(join(root, 'node_modules/.astro'), { recursive: true });
    mkdirSync(join(root, 'src/content/authors'), { recursive: true });
    mkdirSync(join(root, 'src/content/posts'), { recursive: true });
    // The data store module is loaded from the checkout's node_modules; link just astro and its deps.
    for (const dep of ['astro', 'devalue']) {
      mkdirSync(dirname(join(root, 'node_modules', dep)), { recursive: true });
      symlinkSync(join(SITE_ROOT, 'node_modules', dep), join(root, 'node_modules', dep), 'dir');
    }
    writeFileSync(join(root, 'src/content/authors/desk-bot.md'), '---\nname: Desk Bot\nkind: bot\nbio: b\n---\n');
    writeFileSync(join(root, 'src/content/posts/a.md'), post('Hello *there*.'));
    const devalue = await import(pathToFileURL(join(SITE_ROOT, 'node_modules/devalue/index.js')).href);
    const entry = { id: 'a', data: {}, filePath: 'src/content/posts/a.md', digest: '0', rendered: { html: storedHtml, metadata: {} } };
    writeFileSync(join(root, 'node_modules/.astro/data-store.json'), devalue.stringify(new Map([['posts', new Map([['a', entry]])]])));
    writeBuiltPage(root, 'a', builtPage(storedHtml));
    return checkAgainstBuild({ root });
  };
  assert.deepEqual((await run(html)).flatMap((r) => r.findings), []);
  assert.match(problems((await run(`${html}\n`)).flatMap((r) => r.findings)).join(), /render differs from the build's \(first difference at character/);
  assert.match(problems((await run('<script>x</script>')).flatMap((r) => r.findings)).join(), /element <script> is not allowed/);
});

test('G3b: after the build, a post is gated when either our front-matter reading or the author Astro stored names a bot', async () => {
  const bots = new Set(['desk-bot']);
  assert.equal(storedAuthorIsBot({ data: { author: { collection: 'authors', id: 'desk-bot' } } }, bots), true);
  assert.equal(storedAuthorIsBot({ data: { author: 'desk-bot' } }, bots), true);
  assert.equal(storedAuthorIsBot({ data: { author: { collection: 'authors', id: 'wiz-cat' } } }, bots), false);
  assert.equal(storedAuthorIsBot({ data: {} }, bots), true, 'an author the gate cannot read counts as a bot');
  // The file on disk says wiz-cat, the build stored desk-bot: the stored HTML is checked anyway.
  const root = tempDir('rendered-g3b-');
  mkdirSync(join(root, 'node_modules/.astro'), { recursive: true });
  mkdirSync(join(root, 'src/content/authors'), { recursive: true });
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  for (const dep of ['astro', 'devalue']) symlinkSync(join(SITE_ROOT, 'node_modules', dep), join(root, 'node_modules', dep), 'dir');
  writeFileSync(join(root, 'src/content/authors/desk-bot.md'), '---\nname: Desk Bot\nkind: bot\nbio: b\n---\n');
  writeFileSync(join(root, 'src/content/posts/a.md'), post('Hello.', 'wiz-cat'));
  const devalue = await import(pathToFileURL(join(SITE_ROOT, 'node_modules/devalue/index.js')).href);
  const entry = { id: 'a', data: { author: { collection: 'authors', id: 'desk-bot' } }, filePath: 'src/content/posts/a.md', digest: '0', rendered: { html: '<script>x</script>', metadata: {} } };
  writeFileSync(join(root, 'node_modules/.astro/data-store.json'), devalue.stringify(new Map([['posts', new Map([['a', entry]])]])));
  assert.match(problems((await checkAgainstBuild({ root })).flatMap((r) => r.findings)).join(), /element <script> is not allowed/);
});

test('after the build: no data store is a finding, never a pass', async () => {
  const root = tempDir('rendered-nobuild-');
  const [result] = await checkAgainstBuild({ root });
  assert.match(problems(result.findings).join(), /cannot read the build's data store/);
});

// ---------------------------------------------------------------------------------------------
// The ids the story page uses stay covered by PROTECTED_IDS.
// ---------------------------------------------------------------------------------------------

/**
 * `id={…}` expressions in the page's sources, with a sample value each must protect; `null` for a
 * component prop that is called `id` but is not an element id.
 */
const DYNAMIC_IDS = {
  'post.id': null, // <CommentCount id={post.id}>: the post's slug, used in a link, never as an element id
  panelId: 'reactions-panel-grok-4-7',
  'comment.anchor': 'c-01K63M4Q3ZJ8W3Y8N5V2R7T9AB',
  'comment.nameId': 'c-01K63M4Q3ZJ8W3Y8N5V2R7T9AB-name',
  COMMENT_HELD_ANCHOR: 'comment-held',
};

/**
 * Id lookups that are not literals, reviewed by hand: `file: expression` → why it cannot collide.
 * Empty today; a new one fails the test until someone reviews it and lists it here.
 */
const REVIEWED_DYNAMIC_LOOKUPS = {};

const SOURCE_EXTENSIONS = ['', '.ts', '.js', '.mjs', '.astro', '/index.ts', '/index.js'];

/**
 * The files a page pulls in, transitively: `from '…'` and `from "…"` imports, side-effect
 * `import '…'`, dynamic `import('…')`, and local `<script src="/…">` (served from `public/`).
 * Package imports and other hosts are not followed; their globals are PROTECTED_IDS' third-party list.
 * @param {string} root @param {string[]} entries
 */
function pageSources(root, entries) {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const text = readFileSync(file, 'utf8');
    const specs = [
      ...[...text.matchAll(/\b(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)].map(([, spec]) => join(dirname(file), spec)),
      ...[...text.matchAll(/<script\b[^>]*\bsrc=["'](\/[^"'#?]+)["']/g)].map(([, src]) => join(root, 'public', src)),
    ];
    for (const target of specs) {
      const found = SOURCE_EXTENSIONS.map((ext) => target + ext).find((candidate) => {
        try {
          return statSync(candidate).isFile();
        } catch {
          return false;
        }
      });
      if (found) visit(found);
    }
  };
  entries.forEach((entry) => visit(join(root, entry)));
  return [...seen];
}

/**
 * Every id one source file defines or looks up: literal ones, `id={…}` expressions, and lookups
 * that need a human (a variable passed to `getElementById`, an interpolated selector, a computed
 * `.id =` or `setAttribute('id', …)`).
 * @param {string} text
 */
function idUses(text) {
  const literal = [];
  const dynamic = [];
  const review = [];
  const q = `['"\`]`;
  for (const [, ids] of text.matchAll(/\b(?:id|for|aria-labelledby|aria-describedby|aria-controls|popovertarget)="([^"{}]+)"/g)) literal.push(...ids.split(/\s+/));
  for (const [, expr] of text.matchAll(/\bid=\{([^}]+)\}/g)) dynamic.push(expr.trim());
  for (const [, arg] of text.matchAll(/getElementById\(\s*([^)]*?)\s*\)/g)) {
    const m = new RegExp(`^${q}([^'"\`$]+)${q}$`).exec(arg);
    if (m) literal.push(m[1]);
    else review.push(`getElementById(${arg})`);
  }
  for (const [, arg] of text.matchAll(/querySelector(?:All)?(?:<[^>]*>)?\(\s*(['"`][^'"`]*['"`]|[^)]*)\s*\)/g)) {
    if (!/^['"`]/.test(arg)) review.push(`querySelector(${arg})`);
    else if (arg.includes('${')) review.push(`querySelector(${arg})`);
    else for (const [, id] of arg.matchAll(/#([A-Za-z][\w-]*)/g)) literal.push(id);
  }
  for (const [, value] of text.matchAll(/\.id\s*=(?!=)\s*([^;\n]+)/g)) {
    const m = new RegExp(`^${q}([^'"\`$]+)${q}$`).exec(value.trim());
    if (m) literal.push(m[1]);
    else review.push(`.id = ${value.trim()}`);
  }
  for (const [, value] of text.matchAll(/setAttribute\(\s*['"]id['"]\s*,\s*([^)]+)\)/g)) {
    const m = new RegExp(`^${q}([^'"\`$]+)${q}$`).exec(value.trim());
    if (m) literal.push(m[1]);
    else review.push(`setAttribute('id', ${value.trim()})`);
  }
  // Same-page fragments in any file: `href="#main"`, `'#comments'`, or a template ending
  // `…}#comments`. A path before the `#` (`/about/#contact`) is another page's id, and a hex
  // colour (`'#c9d27a'`) is not an id.
  for (const [, id] of text.matchAll(/(?<=["'`}])#([A-Za-z][\w-]*)(?=["'`])/g)) if (!/^[0-9a-f]{3,8}$/i.test(id)) literal.push(id);
  return { literal, dynamic, review };
}

test('G5: the id scan follows every kind of import and flags lookups it cannot read', () => {
  const root = tempDir('id-scan-');
  mkdirSync(join(root, 'src/lib'), { recursive: true });
  mkdirSync(join(root, 'public'), { recursive: true });
  writeFileSync(join(root, 'src/page.astro'), '---\nimport { a } from "./lib/a";\nimport \'./lib/b.js\';\n---\n<script src="/c.js"></script>\n<script>const d = import(\'./lib/d.mjs\');</script>\n');
  writeFileSync(join(root, 'src/lib/a.ts'), "export const a = document.getElementById('from-double-quoted-import');");
  writeFileSync(join(root, 'src/lib/b.js'), "el.id = 'from-side-effect-import'; el.id = someVariable;");
  writeFileSync(join(root, 'public/c.js'), "document.querySelector(`#from-script-src`); document.querySelector(`#${x}`); location.hash = '#from-a-fragment';");
  writeFileSync(join(root, 'src/lib/d.mjs'), "document.getElementById(name); el.setAttribute('id', 'from-set-attribute');");
  const files = pageSources(root, ['src/page.astro']).map((f) => relative(root, f)).sort();
  assert.deepEqual(files, ['public/c.js', 'src/lib/a.ts', 'src/lib/b.js', 'src/lib/d.mjs', 'src/page.astro']);
  const uses = files.map((f) => idUses(readFileSync(join(root, f), 'utf8')));
  assert.deepEqual([...new Set(uses.flatMap((u) => u.literal))].sort(), ['from-a-fragment', 'from-double-quoted-import', 'from-script-src', 'from-set-attribute', 'from-side-effect-import']);
  assert.deepEqual(uses.flatMap((u) => u.review).sort(), ['.id = someVariable', 'getElementById(name)', 'querySelector(`#${x}`)']);
});

test('every id the story page, its layout, components and scripts define or look up is protected', () => {
  const files = pageSources(SITE_ROOT, ['src/pages/posts/[slug].astro', 'src/layouts/BaseLayout.astro']);
  assert.ok(files.some((f) => f.endsWith('Reactions.astro')) && files.some((f) => f.endsWith('CommentForm.astro')), 'the import walk missed the components');
  const literal = new Map();
  for (const file of files) {
    const where = relative(SITE_ROOT, file);
    const { literal: ids, dynamic, review } = idUses(readFileSync(file, 'utf8'));
    for (const id of ids) literal.set(id, where);
    for (const expr of dynamic) {
      assert.ok(Object.hasOwn(DYNAMIC_IDS, expr), `${where} builds an id from {${expr}}: add it to DYNAMIC_IDS and cover it in PROTECTED_ID_PATTERNS`);
      if (DYNAMIC_IDS[expr] !== null) assert.ok(isProtectedId(DYNAMIC_IDS[expr]), `{${expr}} → "${DYNAMIC_IDS[expr]}" is not protected`);
    }
    for (const lookup of review) {
      assert.ok(Object.hasOwn(REVIEWED_DYNAMIC_LOOKUPS, `${where}: ${lookup}`), `${where} looks up an id it computes (${lookup}): review it, protect what it can reach, and list it in REVIEWED_DYNAMIC_LOOKUPS`);
    }
  }
  for (const [id, where] of literal) assert.ok(isProtectedId(id), `${where} uses id "${id}", which PROTECTED_IDS does not cover`);
  // Nothing protected has gone stale without a reason: every id of the site's own is still in use.
  // Exempt: the footnote heading (satteri writes it), `comment-held` (reached through a constant,
  // DYNAMIC_IDS), and the window globals, which scripts read rather than define.
  const notInPage = new Set(['footnote-label', 'comment-held', 'dataLayer', 'gtag', 'ga', 'GoogleAnalyticsObject', 'gaGlobal', 'gaplugins', '_gaUserPrefs', '_gaz', 'google_tag_data', 'google_tag_manager', 'google_tag_manager_external', 'google_image_requests', 'google_tags_first_party', 'turnstile', 'grecaptcha', 'onloadTurnstileCallback', 'onloadturnstilecallback']);
  for (const id of PROTECTED_IDS) {
    if (notInPage.has(id) || id.startsWith('aitamerCommentTurnstile')) continue;
    assert.ok(literal.has(id), `PROTECTED_IDS lists "${id}", which the story page no longer uses`);
  }
});

test('G5: the lower-case third-party globals and empty ids are refused as heading ids', () => {
  for (const id of ['ga', 'google_tag_data', 'google_tag_manager', 'google_image_requests', 'google_tags_first_party', '_gaz', 'turnstile', 'grecaptcha', 'onloadturnstilecallback', 'gtag']) {
    refusedBy(`<h2 id="${id}">x</h2>`, /collides with an id the story page uses/);
  }
  for (const level of [1, 2, 3, 4, 5, 6]) refusedBy(`<h${level} id="">x</h${level}>`, /empty id/);
});

test('the CLI: exit 1 with JSON findings on a bad body, 0 on a good one, 2 on a usage error', () => {
  const run = (args, input) => {
    try {
      return { status: 0, stdout: execFileSync(process.execPath, ['scripts/check-rendered-body.mjs', ...args], { cwd: SITE_ROOT, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }) };
    } catch (error) {
      return { status: error.status, stdout: error.stdout, stderr: error.stderr };
    }
  };
  const bad = run(['--stdin', '--json', '--name', 'x.md'], post('[x](javascript:alert(1))'));
  assert.equal(bad.status, 1);
  const parsed = JSON.parse(bad.stdout);
  assert.equal(parsed.ok, false);
  assert.deepEqual(Object.keys(parsed.results[0].findings[0]).sort(), ['attribute', 'element', 'path', 'problem']);
  assert.equal(run(['--stdin', '--name', 'x.md'], post('Fine.')).status, 0);
  assert.equal(run(['--stdin', '--all']).status, 2);
  assert.equal(run(['--bogus']).status, 2);
  assert.equal(run(['--stdin', '--name', '../x.md'], '').status, 2);
});

test('G4: every workflow that builds the site gates bot posts before the build and after it, before any upload', () => {
  const dir = join(SITE_ROOT, '.github/workflows');
  const builders = [];
  for (const name of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n))) {
    const text = readFileSync(join(dir, name), 'utf8');
    const at = (pattern) => text.search(pattern);
    const build = at(/npm run build\b/);
    if (build < 0) continue;
    builders.push(name);
    const posts = at(/npm run check:posts\b/);
    const after = at(/npm run check:bodies:build\b/);
    const ship = at(/upload-pages-artifact|wrangler-action|pages deploy/);
    assert.ok(posts >= 0 && posts < build, `${name}: check:posts must run before the build`);
    assert.ok(after > build, `${name}: check:bodies:build must run after the build`);
    if (ship >= 0) assert.ok(after < ship, `${name}: check:bodies:build must run before the upload`);
  }
  assert.deepEqual(builders.sort(), ['check-posts.yml', 'deploy-github-pages.yml', 'deploy-pages.yml']);
});

test('G6: the parse5 vetting report names the licence each installed package declares', () => {
  const report = readFileSync(join(SITE_ROOT, 'docs/reports/2026-09-26-parse5-vetting.md'), 'utf8');
  const line = report.split('\n').find((l) => l.startsWith('- **License:**'));
  for (const name of ['parse5', 'entities']) {
    const { license } = JSON.parse(readFileSync(join(SITE_ROOT, 'node_modules', name, 'package.json'), 'utf8'));
    assert.match(line, new RegExp(`\`${name}\` is ${license.replace(/[.-]/g, '\\$&')}`), `${name} is ${license}`);
  }
});

test('G4b: every action in every workflow is pinned to a commit, with its tag in a comment', () => {
  const dir = join(SITE_ROOT, '.github/workflows');
  for (const name of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n))) {
    for (const [line] of readFileSync(join(dir, name), 'utf8').matchAll(/^\s*(?:-\s*)?uses:.*$/gm)) {
      assert.match(line, /uses: [\w.-]+\/[\w./-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/, `${name}: ${line.trim()}`);
    }
  }
});

test('G4b: the post-build body check runs with the same environment as the build it checks', () => {
  const dir = join(SITE_ROOT, '.github/workflows');
  const stepEnv = (text, run) => {
    const at = text.indexOf(`run: ${run}`);
    const start = text.lastIndexOf('- name:', at);
    const env = /\n\s+env:\n((?:\s{10,}[A-Z_]+:.*\n)+)/.exec(text.slice(start, at));
    return env ? env[1].split('\n').map((l) => l.trim()).filter(Boolean).sort() : [];
  };
  for (const name of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n))) {
    const text = readFileSync(join(dir, name), 'utf8');
    if (!text.includes('run: npm run check:bodies:build')) continue;
    assert.deepEqual(stepEnv(text, 'npm run check:bodies:build'), stepEnv(text, 'npm run build'), name);
  }
});
