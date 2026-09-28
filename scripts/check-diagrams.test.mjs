import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIAGRAM_PATH, MAX_BYTES, MAX_DEPTH, PUBLIC_DIR, checkAll, checkSvg, cssProblem, strayProblems } from './check-diagrams.mjs';
import { tempDir } from './test-support.mjs';
import { DIAGRAM_SRC, imageSrcProblem } from './rendered-body-allowlist.mjs';

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const svg = (inner, attrs = '') => `<svg ${NS} viewBox="0 0 100 100"${attrs ? ` ${attrs}` : ''}>${inner}</svg>`;

/** A realistic animated diagram: what a writer is expected to send. */
const GOOD = `<?xml version="1.0" encoding="UTF-8"?>
<!-- two jobs of a router -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 320 120" role="img" aria-labelledby="t d">
  <title id="t">Selection and failover</title>
  <desc id="d">A request goes to a model; when it fails, it moves to the next.</desc>
  <style>
    .hop { animation: hop 3s ease-in-out infinite; transform-origin: center; }
    @keyframes hop { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .hop { animation: none; opacity: 1; } }
  </style>
  <defs>
    <linearGradient id="g"><stop offset="0" stop-color="#8fb3d9"/><stop offset="1" stop-color="#e8806b"/></linearGradient>
    <linearGradient id="g2" xlink:href="#g" gradientTransform="rotate(90)"/>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#5d6f8a"/></marker>
    <filter id="soft"><feGaussianBlur stdDeviation="1.5"/></filter>
  </defs>
  <rect x="10" y="40" width="80" height="40" rx="6" fill="url(#g)" filter="url(#soft)"/>
  <line x1="90" y1="60" x2="150" y2="60" stroke="#5d6f8a" stroke-width="2" marker-end="url(#arrow)"/>
  <circle class="hop" cx="190" cy="60" r="20" fill="url(#g2)"/>
  <text x="50" y="100" text-anchor="middle" font-size="12">Model A</text>
</svg>
`;

test('a realistic animated diagram passes, ships as a clean rewrite, and the rewrite is stable', () => {
  const { findings, output } = checkSvg(GOOD);
  assert.deepEqual(findings, []);
  assert.ok(output.startsWith(`<svg ${NS} viewBox="0 0 320 120"`), output.slice(0, 80));
  assert.ok(!output.includes('xlink'), 'xlink:href ships as href, with no xlink namespace');
  assert.match(output, /<linearGradient id="g2" href="#g"/);
  assert.ok(!output.includes('<!--'), 'comments are not shipped');
  assert.ok(!output.includes('<?xml'), 'the declaration is not shipped');
  assert.equal(checkSvg(output).output, output, 'checking the rewrite gives the rewrite');
});

test('every known way to run code, load something, or hide either is refused', () => {
  const attacks = {
    script: svg('<script>alert(1)</script>'),
    'uppercase script': svg('<SCRIPT>alert(1)</SCRIPT>'),
    'namespaced script': svg('<svg:script>alert(1)</svg:script>'),
    'event handler': svg('<rect width="10" height="10" onload="alert(1)"/>'),
    'handler on root': `<svg ${NS} viewBox="0 0 1 1" onload="alert(1)"></svg>`,
    foreignObject: svg('<foreignObject><iframe src="https://evil.example"></iframe></foreignObject>'),
    link: svg('<a href="javascript:alert(1)"><text>x</text></a>'),
    'use external': svg('<use href="https://evil.example/x.svg#a"/>'),
    'use local': svg('<use href="#a"/>'),
    image: svg('<image href="https://evil.example/pixel.png" width="1" height="1"/>'),
    'data image': svg('<image href="data:image/svg+xml;base64,PHN2Zz4="/>'),
    'smil href': svg('<a><animate attributeName="href" values="javascript:alert(1)"/></a>'),
    set: svg('<set attributeName="fill" to="red"/>'),
    animateTransform: svg('<g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s"/></g>'),
    'href on rect': svg('<rect href="#x"/>'),
    'gradient href outside': svg('<linearGradient id="a" href="https://evil.example/g.svg#x"/>'),
    'xlink href javascript': svg('<linearGradient id="a" xlink:href="javascript:alert(1)"/>', 'xmlns:xlink="http://www.w3.org/1999/xlink"'),
    'fill url outside': svg('<rect fill="url(https://evil.example/p.svg#x)"/>'),
    'style import': svg('<style>@import url(https://evil.example/x.css);</style>'),
    'style url outside': svg('<style>rect { fill: url("https://evil.example/x.svg#p"); }</style>'),
    'style escape': svg('<style>rect { background: \\75 rl(https://evil.example); }</style>'),
    'style comment hiding': svg('<style>rect { fill: u/**/rl(x) }</style>'),
    'style font-face': svg('<style>@font-face { font-family: x; src: local(x); }</style>'),
    'style attr url': svg('<rect style="fill: url(//evil.example/x)"/>'),
    'style attr expression': svg('<rect style="width: expression(alert(1))"/>'),
    'style var()': svg('<style>rect { fill: var(--x); }</style>'),
    doctype: `<!DOCTYPE svg [<!ENTITY x "boom">]>${svg('<text>&x;</text>')}`,
    cdata: svg('<style><![CDATA[rect{fill:red}]]></style>'),
    'processing instruction': `<?xml-stylesheet href="https://evil.example/x.css"?>${svg('')}`,
    'html breakout': svg('<p>html</p><circle r="1"/>'),
    'content after root': `${svg('')}<script>alert(1)</script>`,
    'two roots': `${svg('')}${svg('')}`,
    'nested svg': svg('<svg viewBox="0 0 1 1"></svg>'),
    'text outside text': svg('<g>hello</g>'),
    'no viewBox': `<svg ${NS}></svg>`,
    'wrong xmlns': '<svg xmlns="http://www.w3.org/1999/xhtml" viewBox="0 0 1 1"></svg>',
    'bad id': svg('<rect id="1bad"/>'),
    'javascript in attribute': svg('<rect class="javascript:alert(1)"/>'),
    'entity-hidden javascript': svg('<rect class="jav&#x61;script:alert(1)"/>'),
    'control character': svg('<rect class="a\u0001b"/>'),
    'unknown attribute': svg('<rect data-x="1"/>'),
    'animation without reduced motion': svg('<style>.a { animation: spin 1s infinite; } @keyframes spin { to { opacity: 0; } }</style><rect class="a"/>'),
    'inline animation without reduced motion': svg('<rect style="animation: spin 1s infinite"/>'),
  };
  for (const [name, text] of Object.entries(attacks)) {
    const { findings, output } = checkSvg(text);
    assert.ok(findings.length > 0, `${name} passed: ${output}`);
    assert.equal(output, null, `${name}: nothing ships when anything is refused`);
  }
});

test('size and element limits hold', () => {
  assert.match(checkSvg(svg(`<desc>${'x'.repeat(MAX_BYTES)}</desc>`)).findings.join(), /larger than/);
  assert.match(checkSvg(svg('<g></g>'.repeat(4_001))).findings.join(), /more than 4000 (elements|tags)/);
});

test('text is escaped on the way out, whatever entities the source used', () => {
  const { output } = checkSvg(svg('<title>A &lt;b&gt; &amp; "c"</title><text x="1" y="2">1 &lt; 2</text>'));
  assert.match(output, /<title>A &lt;b&gt; &amp; "c"<\/title>/);
  assert.match(output, /<text x="1" y="2">1 &lt; 2<\/text>/);
});

test('CSS: plain rules, @keyframes and @media pass; everything else is refused', () => {
  assert.equal(cssProblem('.a { fill: #fff; stroke-dasharray: 4 2; } @keyframes k { from { opacity: 0 } } @media (prefers-reduced-motion: reduce) { .a { animation: none } }'), null);
  assert.equal(cssProblem('rect { fill: url(#g) }'), null);
  assert.match(cssProblem('rect { fill: url(g.svg) }'), /only url\(#id\)/);
  assert.match(cssProblem('@supports (x: y) {}'), /@supports is not allowed/);
  assert.match(cssProblem('a > b {}'), /markup/);
});

test('the folder: one post per folder, lowercase names, only .svg, and every file checked', () => {
  const root = tempDir('diagrams-');
  const posts = join(root, 'posts');
  const diagrams = join(root, 'diagrams');
  mkdirSync(posts);
  writeFileSync(join(posts, 'routing-is-two-systems.md'), '---\n---\n');
  const put = (path, text) => {
    mkdirSync(join(diagrams, path, '..'), { recursive: true });
    writeFileSync(join(diagrams, path), text);
  };
  put('routing-is-two-systems/two-jobs.svg', GOOD);
  assert.deepEqual(checkAll(diagrams, posts).findings, []);
  assert.equal(checkAll(diagrams, posts).diagrams.length, 1);
  put('no-such-post/x.svg', GOOD);
  put('routing-is-two-systems/Bad_Name.svg', GOOD);
  put('routing-is-two-systems/picture.png', 'png');
  put('routing-is-two-systems/evil.svg', svg('<script>alert(1)</script>'));
  const findings = checkAll(diagrams, posts).findings.join('\n');
  assert.match(findings, /no-such-post\/x\.svg: no post is named no-such-post/);
  assert.match(findings, /Bad_Name\.svg: must be diagrams\/<post-slug>\/<name>\.svg/);
  assert.match(findings, /picture\.png: must be/);
  assert.match(findings, /evil\.svg: .*script/);
});

test('the public path pattern admits one post folder and one lowercase name', () => {
  assert.ok(DIAGRAM_PATH.test('/diagrams/routing-is-two-systems/two-jobs.svg'));
  for (const bad of ['/diagrams/a/b.SVG', '/diagrams/a/b/c.svg', '/diagrams/../x.svg', '/diagrams/a/b.svg?x', '/diagrams/a-/b.svg']) {
    assert.ok(!DIAGRAM_PATH.test(bad), bad);
  }
});

test('the body gate admits exactly the diagram paths this check owns', () => {
  assert.equal(DIAGRAM_SRC.source, DIAGRAM_PATH.source, 'the two patterns must stay equal');
  assert.equal(imageSrcProblem('/diagrams/routing-is-two-systems/two-jobs.svg'), null);
  for (const bad of ['/diagrams/a/b.png', '/diagrams/../secret.svg', '/diagrams/a/b.svg?x=1', '/other/a.svg', 'diagrams/a/b.svg']) {
    assert.notEqual(imageSrcProblem(bad), null, bad);
  }
  assert.equal(imageSrcProblem('https://media.aitamer.news/x.jpg'), null, 'media images still pass');
});

// Deep review of 72d4e94 (docs/reviews/2026-09-28-diagrams-deep-review.md): one test per finding.

const motion = (css, body = '<rect class="a" width="1" height="1"/>') => checkSvg(svg(`<style>${css}</style>${body}`)).findings;
const SPIN = '@keyframes spin { to { opacity: 0; } }';

test('reduced motion: the two proofs that stop an animation pass', () => {
  assert.deepEqual(motion(`.a { animation: spin 1s infinite; } ${SPIN} @media (prefers-reduced-motion: reduce) { .a { animation: none; } }`), []);
  assert.deepEqual(motion(`.a { animation-name: spin; animation-duration: 1s; } ${SPIN} @media (prefers-reduced-motion: reduce) { .a { animation-name: none; } }`), []);
  assert.deepEqual(motion(`@media (prefers-reduced-motion: reduce) { * { animation: none !important; } } .a { animation: spin 1s; } ${SPIN}`), [], 'the universal !important stop wins from anywhere');
  assert.deepEqual(motion(`${SPIN} @media (prefers-reduced-motion: no-preference) { .a { animation: spin 1s infinite; } }`), [], 'animation only for readers who did not ask for less');
  assert.deepEqual(motion(`.a { fill: red; } ${SPIN}`), [], 'keyframes nobody uses are not motion');
});

test('reduced motion: a media query that does not stop the animation is refused', () => {
  const refused = {
    'the review\'s probe: the block changes only fill': `.a{animation:spin 1ms infinite}${SPIN}@media (prefers-reduced-motion: reduce){.a{fill:red}}`,
    'the media query hidden in a string': `.a { animation: spin 1s; font-family: "@media (prefers-reduced-motion: reduce) { .a { animation: none } }"; } ${SPIN}`,
    'the stop comes before the animation': `@media (prefers-reduced-motion: reduce) { .a { animation: none; } } .a { animation: spin 1s; } ${SPIN}`,
    'the stop names another selector': `.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion: reduce) { .b { animation: none; } }`,
    'a universal stop without !important': `.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion: reduce) { * { animation: none; } }`,
    '!important outside the reduced-motion block': `.a { animation: spin 1s !important; } ${SPIN} @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`,
    'animation inside the reduced-motion block': `${SPIN} @media (prefers-reduced-motion: reduce) { .a { animation: spin 1s; } }`,
    'a second animated rule after the stop': `.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion: reduce) { .a { animation: none; } } .a { animation: spin 2s; }`,
    'a transition': `.a { transition: opacity 1s; }`,
    'nested at-rules': `@media (min-width: 1px) { @media (prefers-reduced-motion: reduce) { .a { animation: none } } }`,
    'a keyframe block with a plain selector': `@keyframes spin { .a { opacity: 0; } }`,
    'an unclosed rule': `.a { animation: spin 1s;`,
  };
  for (const [name, css] of Object.entries(refused)) assert.ok(motion(css).length > 0, name);
  for (const style of ['animation: spin 1s', 'animation-name: spin', 'transition: fill 1s']) {
    assert.match(checkSvg(svg(`<rect style="${style}"/>`)).findings.join(), /not allowed; animate in <style>/, style);
  }
});

test('an unclosed url( is refused in linear time, far inside the per-file limit', () => {
  const text = svg(`<style>${'url('.repeat(16_000)}</style>`);
  assert.ok(Buffer.byteLength(text) < MAX_BYTES);
  const started = performance.now();
  const { findings } = checkSvg(text);
  const took = performance.now() - started;
  assert.match(findings.join(), /url\( with no closing \)/);
  // Before the fix this took 3.6 s to 9.4 s; linear work is a few tens of milliseconds.
  assert.ok(took < 1_000, `took ${Math.round(took)} ms`);
  const attr = svg(`<rect fill="${'url('.repeat(16_000)}"/>`);
  const again = performance.now();
  assert.ok(checkSvg(attr).findings.length > 0);
  assert.ok(performance.now() - again < 1_000);
});

test('the rewrite is always well-formed XML: no repeated href, no character XML refuses', () => {
  const xlink = 'xmlns:xlink="http://www.w3.org/1999/xlink"';
  assert.match(checkSvg(svg(`<linearGradient ${xlink} href="#a" xlink:href="#b"/>`)).findings.join(), /href and xlink:href together/);
  for (const ch of ['&#x1;', '\u0001', '\uFFFE', '\uFFFF']) {
    assert.equal(checkSvg(svg(`<title>x${ch}y</title>`)).output, null, JSON.stringify(ch));
  }
  assert.equal(checkSvg(svg('<rect class="a\uFFFEb"/>')).output, null, 'in attribute values too');
  assert.notEqual(checkSvg(svg('<title>A &amp; B — ✓ 𝑥</title>')).output, null, 'ordinary and astral characters still pass');
});

test('CSS functions that can name a resource are refused before any browser ships them', () => {
  for (const css of ['svg{background-image:src("https://attacker.example/pixel")}', 'svg{background-image:image("https://attacker.example/pixel")}', 'svg{width:env(safe-area-inset-top)}']) {
    assert.match(cssProblem(css), /function that can reach outside/, css);
  }
  assert.equal(cssProblem('.a { fill: rgb(1, 2, 3); transform: rotate(45deg) translate(1px, 2px); }'), null);
});

test('outside diagrams/, the only SVGs are the site\'s own, pinned by hash; no symbolic links', () => {
  assert.deepEqual(strayProblems(PUBLIC_DIR), [], 'the real public/ folder is clean');
  const root = tempDir('strays-');
  const put = (path, text) => {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  put('favicon.svg', readFileSync(join(PUBLIC_DIR, 'favicon.svg')));
  put('diagrams/some-post/x.svg', '<svg onload="alert(1)"/>');
  assert.deepEqual(strayProblems(root), [], 'the pinned favicon passes; diagrams/ is the diagram check\'s');
  put('covers/payload.svg', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)"></svg>');
  put('covers/policy.svg', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
  put('heroes/x.SVGZ', 'x');
  symlinkSync(join(root, 'favicon.svg'), join(root, 'linked'));
  const found = strayProblems(root).join('\n');
  assert.match(found, /covers\/payload\.svg: a document a browser could run/);
  assert.match(found, /covers\/policy\.svg: is not the pinned site file/);
  assert.match(found, /heroes\/x\.SVGZ: a document a browser could run/);
  assert.match(found, /linked: symbolic links are not allowed/);
});

test('the GitHub Pages workflow refuses a build with diagrams, before it uploads anything', () => {
  const workflow = readFileSync('.github/workflows/deploy-github-pages.yml', 'utf8');
  const refuse = workflow.indexOf('Refuse to publish diagrams on a host that ignores _headers');
  const upload = workflow.indexOf('Upload Pages artifact');
  assert.ok(refuse > 0 && upload > refuse, 'the refusal runs before the upload');
  assert.match(workflow.slice(refuse, upload), /find dist\/diagrams -mindepth 1[\s\S]*exit 1/);
});

// The Opus re-check of 246551b (same review record): one test per finding.

test('a <style> holds only text: a comment or element inside it cannot split the CSS', () => {
  for (const inner of ['rect{fill:ur<!---->l(https://attacker.example/px)}', 'svg{background:ima<!---->ge("https://attacker.example/px")}', '.<!---->a{fill:red}', 'rect{fill:red}<g></g>']) {
    const { findings, output } = checkSvg(svg(`<style>${inner}</style>`));
    assert.equal(output, null, inner);
    assert.match(findings.join(), /may hold only CSS text/, inner);
  }
  assert.ok(checkSvg(svg('<!-- a note --><style>rect{fill:red}</style>')).output, 'comments outside <style> are still just dropped');
});

test('vendor-prefixed properties are refused, so no prefixed animation escapes the motion check', () => {
  assert.ok(motion(`.a { -webkit-animation: spin 1s infinite; } ${SPIN}`).length > 0);
  assert.ok(checkSvg(svg('<rect style="-webkit-animation: spin 1s"/>')).findings.length > 0);
  assert.ok(checkSvg(svg('<rect style="-webkit-transition: fill 1s"/>')).findings.length > 0);
});

test('a <style> whose type a browser ignores is refused; text/css is fine', () => {
  const stopInPlain = `<style>.a { animation: spin 1s; } ${SPIN}</style><style type="text/plain">@media (prefers-reduced-motion: reduce) { .a { animation: none; } }</style><rect class="a"/>`;
  assert.match(checkSvg(svg(stopInPlain)).findings.join(), /<style type> must be exactly text\/css/);
  assert.ok(checkSvg(svg('<style type="text/css">rect{fill:red}</style>')).output);
  assert.ok(checkSvg(svg('<filter id="f"><feColorMatrix type="saturate" values="0"/></filter>')).output, 'type on other elements is untouched');
});

test('the reduced-motion query is matched as tokens, as a browser reads it', () => {
  assert.ok(motion(`.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion: re duce) { .a { animation: none; } }`).length > 0);
  assert.ok(motion(`.a { animation: spin 1s; } ${SPIN} @media (prefers-reducedmotion: reduce) { .a { animation: none; } }`).length > 0);
  assert.deepEqual(motion(`.a { animation: spin 1s; } ${SPIN} @media (PREFERS-REDUCED-MOTION:REDUCE) { .a { animation: none; } }`), [], 'case and spacing around tokens are fine');
  assert.deepEqual(motion(`.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion) { .a { animation: none; } }`), [], 'the bare query means reduce');
});

test('floods of tags and deep nesting are refused before parsing, in linear time', () => {
  const cases = {
    'stray tags after the root': `${svg('')}${'<div>'.repeat(39_000)}`,
    'deep nesting': svg(`${'<g>'.repeat(3_600)}${'</g>'.repeat(3_600)}`),
    'unclosed tags': svg('<g'.repeat(60_000)),
    'stray end tags': svg('</g>'.repeat(40_000)),
  };
  for (const [name, text] of Object.entries(cases)) {
    assert.ok(Buffer.byteLength(text) <= MAX_BYTES, name);
    const started = performance.now();
    const { findings } = checkSvg(text);
    assert.ok(findings.length > 0, name);
    assert.ok(performance.now() - started < 1_000, `${name}: ${Math.round(performance.now() - started)} ms`);
  }
  assert.ok(checkSvg(svg(`${'<g>'.repeat(MAX_DEPTH - 1)}${'</g>'.repeat(MAX_DEPTH - 1)}`)).output, 'honest nesting passes');
});

test('the rewrite passes the check itself and comes back unchanged', () => {
  const dense = svg('<rect x="1" y="2" width="3" height="4" fill="#123456"/>'.repeat(3_600));
  assert.ok(Buffer.byteLength(dense) < MAX_BYTES);
  assert.ok(checkSvg(dense).output, 'a dense honest file whose rewrite outgrows the limit still passes');
  const { output } = checkSvg(GOOD);
  assert.equal(checkSvg(output, { verifyRewrite: false }).output, output);
});

test('in public/, HTML and XML documents are refused outside diagrams/ too; the build keeps its own pages', () => {
  const root = tempDir('docs-');
  mkdirSync(join(root, 'covers'));
  writeFileSync(join(root, 'covers', 'x.xml'), '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
  writeFileSync(join(root, 'page.html'), '<script>alert(1)</script>');
  assert.equal(strayProblems(root, { source: true }).length, 2);
  assert.deepEqual(strayProblems(root, { source: false }), [], 'a build is full of its own .html and .xml');
});

// The second Opus re-check of d7dd25f (same review record).

test('CSS outside strings is ASCII, so the check and a browser agree on every name', () => {
  for (const ch of [0xa0, 0x3000, 0xfeff, 0x2028, 0x0b]) {
    const c = String.fromCodePoint(ch);
    const forms = [
      `.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion:${c}reduce) { .a { animation: none; } }`,
      `.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion: reduce) { *${c}{ animation: none !important; } }`,
      `.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion: reduce) { .a { animation${c}: none; } }`,
      `.a { animation: spin 1s; } ${SPIN} @media (prefers-reduced-motion: reduce) { ${c}.a { animation: none; } }`,
    ];
    for (const css of forms) assert.ok(motion(css).length > 0, `U+${ch.toString(16)}: ${css}`);
  }
  assert.deepEqual(motion(`.a { font-family: "Noto${String.fromCharCode(0xa0)}Sans", 'Ω'; }`), [], 'any character inside a quoted string');
});

test('<style type> is compared exactly, as a browser does', () => {
  for (const type of [' text/css ', 'text/css ', 'text/css;x', 'text/plain']) {
    assert.match(checkSvg(svg(`<style type="${type}">rect{fill:red}</style>`)).findings.join(), /must be exactly text\/css/, JSON.stringify(type));
  }
  assert.ok(checkSvg(svg('<style type="TEXT/CSS">rect{fill:red}</style>')).output, 'the type is case-insensitive in browsers too');
});

test('the walk bounds its own depth, whatever the pre-scan counted', () => {
  const text = svg('<g fill=a/>'.repeat(3_999));
  const { findings } = checkSvg(text);
  assert.match(findings.join('\n'), /nested more than 64 deep/);
});

// The third Opus re-check of 4b76e32 (same review record).

test('a line break inside a CSS string is refused, so no declaration hides behind one', () => {
  for (const [q, br] of [['"', '\n'], ["'", '\n'], ['"', '\r'], ["'", '\r\n']]) {
    const css = `.a{x:${q}${br};animation:spin 1s infinite;y:${q}}${SPIN}`;
    assert.ok(motion(css).length > 0, JSON.stringify(q + br));
  }
  assert.ok(checkSvg(svg(`<style>.a{x:"\n;-webkit-transition:fill 1s;y:"}</style>`)).findings.length > 0);
  assert.deepEqual(motion('.a { font-family: "Noto Sans", \'Serif\'; }\n.b { fill: red; }'), [], 'strings on one line are fine');
});
