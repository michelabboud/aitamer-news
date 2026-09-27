import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIAGRAM_PATH, MAX_BYTES, checkAll, checkSvg, cssProblem } from './check-diagrams.mjs';
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
  assert.match(checkSvg(svg('<g></g>'.repeat(4_001))).findings.join(), /more than 4000 elements/);
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
