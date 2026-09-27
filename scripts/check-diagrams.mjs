#!/usr/bin/env node
/**
 * Diagrams: SVG files any writer may add, bots and AI writers included, with no person in the loop
 * (docs/adr/0016-diagrams-are-checked-svg-files.md). Safety comes from three layers, and this script
 * is two of them:
 *
 *   node scripts/check-diagrams.mjs                 check every file under public/diagrams/
 *                                                   (part of `npm run check:posts`)
 *   node scripts/check-diagrams.mjs --write dist    after the build: replace every dist/diagrams/
 *                                                   file with this script's own rewrite of it
 *   node scripts/check-diagrams.mjs --check-dist dist   the deploy guard: every shipped diagram is
 *                                                   byte for byte that rewrite
 *
 * Exit 0 clean, 1 on a finding, 2 on a usage error.
 *
 * **Why a file, shown as an image.** A post shows a diagram with a Markdown image,
 * `![What it shows](/diagrams/<post-slug>/<name>.svg)`. A browser runs no script and loads nothing
 * inside an SVG shown through `<img>`, while its CSS animations still play. The third layer covers the
 * file opened on its own: `dist/_headers` gives `/diagrams/*` an enforced policy that runs nothing
 * and loads nothing (`scripts/csp-headers.mjs`), and the deploy's smoke test checks it.
 *
 * **Refuse what is unknown.** Elements, attributes and CSS are checked against exact allowlists
 * that start from DOMPurify's SVG profile and are stricter: no links (`a`), no `use`, no `image`, no
 * `foreignObject`, no `script`, no SMIL animation at all (`animate` and `set` can turn a link
 * into `javascript:`, and SMIL ignores the reader's reduced-motion setting), `href` only as `#id`,
 * CSS only as plain declarations, `@keyframes` and `@media`, with `url()` only as `url(#id)`.
 * Animation is CSS, and a file that animates must stop for readers who ask for reduced motion.
 *
 * **The parse, and why the rewrite ships.** parse5 (already the CSP and rendered-body gates' parser)
 * reads the file as HTML foreign content, which is not how a browser reads an `.svg` file: that is
 * XML. The two can disagree (an HTML element inside `<svg>` ends it for parse5 and does not for an XML
 * parser), so anything outside one root `<svg>`, or any element not in the SVG namespace, is refused,
 * and the file that ships is never the writer's bytes: it is written from the checked tree by this
 * script, with every name and value escaped, so what a browser parses is what was checked.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

export const SOURCE_DIR = 'public/diagrams';
export const POSTS_DIR = 'src/content/posts';
/** Largest diagram accepted. A diagram is drawing, not data: this is room for a dense one. */
export const MAX_BYTES = 200_000;
/** Most elements in one diagram, so no file can make the build or a reader's browser crawl. */
export const MAX_ELEMENTS = 4_000;
/** The public path of a diagram: one post's folder, one lowercase name. */
export const DIAGRAM_PATH = /^\/diagrams\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.svg$/;
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/** The elements a diagram may use, by their SVG names. */
export const ELEMENTS = new Set([
  'svg', 'g', 'defs', 'title', 'desc', 'style',
  'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan',
  'linearGradient', 'radialGradient', 'stop', 'marker', 'clipPath', 'mask', 'pattern',
  'filter', 'feGaussianBlur', 'feOffset', 'feBlend', 'feDropShadow', 'feFlood', 'feMerge', 'feMergeNode', 'feComposite', 'feColorMatrix',
]);
/** Elements whose text is kept; any other element may hold only whitespace. */
const TEXT_ELEMENTS = new Set(['title', 'desc', 'text', 'tspan', 'style']);

/** Presentation, geometry and filter attributes: DOMPurify's SVG list, minus anything that can name a resource. */
export const ATTRIBUTES = new Set([
  'accent-height', 'alignment-baseline', 'baseline-shift', 'class', 'clip-path', 'clip-rule', 'clipPathUnits',
  'color', 'color-interpolation', 'color-interpolation-filters', 'cx', 'cy', 'd', 'direction', 'display', 'dominant-baseline',
  'dx', 'dy', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterUnits', 'flood-color', 'flood-opacity', 'font-family',
  'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'gradientTransform',
  'gradientUnits', 'height', 'id', 'in', 'in2', 'k1', 'k2', 'k3', 'k4', 'lengthAdjust', 'letter-spacing', 'marker-end',
  'marker-mid', 'marker-start', 'markerHeight', 'markerUnits', 'markerWidth', 'mask', 'maskContentUnits', 'maskUnits', 'mode',
  'offset', 'opacity', 'operator', 'orient', 'overflow', 'paint-order', 'pathLength', 'patternContentUnits', 'patternTransform',
  'patternUnits', 'points', 'preserveAspectRatio', 'primitiveUnits', 'r', 'refX', 'refY', 'result', 'rotate', 'rx', 'ry',
  'shape-rendering', 'spreadMethod', 'startOffset', 'stdDeviation', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'style',
  'text-anchor', 'text-decoration', 'text-rendering', 'textLength', 'transform', 'transform-origin', 'type', 'values',
  'vector-effect', 'viewBox', 'visibility', 'width', 'word-spacing', 'writing-mode', 'x', 'x1', 'x2', 'y', 'y1', 'y2',
  'role', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 'lang', 'version', 'xmlns',
]);
/** Where `href` is allowed (gradient and pattern inheritance), and then only as `#id`. */
const HREF_ELEMENTS = new Set(['linearGradient', 'radialGradient', 'pattern']);
const FRAGMENT = /^#[A-Za-z][\w.-]{0,63}$/;
const ID = /^[A-Za-z][\w.-]{0,63}$/;
/** Anything a value might use to reach outside the file, or to hide that it does. */
const DANGEROUS_VALUE = /javascript:|vbscript:|data:|\\|&|<|>|expression\s*\(|@import|behavior\s*:|-moz-binding/i;
/** The only `url(…)` a value may hold: a reference to something inside this file. */
const URL_CALL = /url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi;
const CSS_AT_RULES = new Set(['keyframes', 'media']);
const REDUCED_MOTION = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i;

/** @param {string} text @returns {string | null} why a CSS text is refused, or null */
export function cssProblem(text) {
  if (DANGEROUS_VALUE.test(text)) return 'CSS contains an escape, markup, an ampersand, or a script or import form';
  if (/\/\*/.test(text)) return 'CSS comments are not allowed (they can hide what a rule says)';
  for (const [, , inside] of text.matchAll(URL_CALL)) if (!FRAGMENT.test(inside.trim())) return `CSS url(${inside}) points outside the file; only url(#id) is allowed`;
  if (/url\s*\(/i.test(text.replace(URL_CALL, ''))) return 'CSS has a url( this check cannot read';
  for (const [, name] of text.matchAll(/@([A-Za-z-]+)/g)) {
    if (!CSS_AT_RULES.has(name.toLowerCase())) return `CSS @${name} is not allowed (only @keyframes and @media)`;
  }
  if (/image-set|element\s*\(|cross-fade|paint\s*\(|attr\s*\(|var\s*\(/i.test(text)) return 'CSS uses a function that can reach outside plain drawing';
  return null;
}

/** @param {string} name @param {string} value @param {string} element @returns {string | null} */
export function attributeProblem(name, value, element) {
  if (name === 'xmlns:xlink') return value === XLINK_NS ? null : `xmlns:xlink must be ${XLINK_NS}`;
  if (name === 'href' || name === 'xlink:href') {
    if (!HREF_ELEMENTS.has(element)) return `${name} is allowed only on gradients and patterns`;
    return FRAGMENT.test(value) ? null : `${name}="${value}" must be #id, a reference inside the file`;
  }
  if (!ATTRIBUTES.has(name)) return `attribute ${name} is not allowed`;
  if (name === 'xmlns') return value === SVG_NS ? null : `xmlns must be ${SVG_NS}`;
  if (name === 'id') return ID.test(value) ? null : `id "${value}" must start with a letter and use letters, digits, _ . -`;
  if (name === 'style') return cssProblem(value);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return `${name} holds a control character`;
  if (DANGEROUS_VALUE.test(value)) return `${name} holds an escape, markup or a script form`;
  for (const [, , inside] of value.matchAll(URL_CALL)) if (!FRAGMENT.test(inside.trim())) return `${name} has url(${inside}); only url(#id) is allowed`;
  if (/url\s*\(/i.test(value.replace(URL_CALL, ''))) return `${name} has a url( this check cannot read`;
  return null;
}

const attrName = (a) => (a.prefix ? `${a.prefix}:${a.name}` : a.name);

/**
 * Check one SVG file's text; on success, also return the rewrite that ships.
 * @param {string} text
 * @returns {{ findings: string[], output: string | null }}
 */
export function checkSvg(text) {
  const findings = [];
  const fail = (f) => ({ findings: [...findings, f], output: null });
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) return fail(`larger than ${MAX_BYTES} bytes`);
  // What an XML parser would act on and parse5 would not see the same way: refuse before parsing.
  if (/<!DOCTYPE|<!ENTITY|<!\[CDATA\[/i.test(text)) return fail('DOCTYPE, ENTITY and CDATA sections are not allowed');
  const body = text.replace(/^﻿?\s*<\?xml\s[^?]*\?>/, '');
  if (/<\?/.test(body)) return fail('processing instructions are not allowed');
  if (/<\/?[A-Za-z][\w.-]*:/.test(body)) return fail('prefixed element names (svg:, html: and the like) are not allowed');

  const doc = parse(`<!doctype html><html><head></head><body>${body}</body></html>`);
  const html = doc.childNodes.find((n) => n.nodeName === 'html');
  const head = html.childNodes.find((n) => n.nodeName === 'head');
  const bodyNode = html.childNodes.find((n) => n.nodeName === 'body');
  if (head.childNodes.length > 0) return fail('content the parser moved out of the diagram (an HTML element?)');
  const roots = bodyNode.childNodes.filter((n) => n.nodeName !== '#comment' && !(n.nodeName === '#text' && !n.value.trim()));
  if (roots.length !== 1 || roots[0].tagName !== 'svg' || roots[0].namespaceURI !== SVG_NS) {
    return fail('the file must be exactly one <svg> element, with nothing after it (an HTML element inside ends it)');
  }

  let elements = 0;
  let hasKeyframes = false;
  let hasReducedMotion = false;
  /** @returns {string} the checked element, serialized */
  const visit = (node, path) => {
    elements += 1;
    const name = node.tagName;
    const where = `${path}/${name}`;
    if (node.namespaceURI !== SVG_NS) findings.push(`${where}: not an SVG element`);
    else if (!ELEMENTS.has(name)) findings.push(`${where}: element <${name}> is not allowed`);
    const attrs = [];
    for (const a of node.attrs) {
      const n = attrName(a);
      const problem = attributeProblem(n, a.value, name);
      if (problem) findings.push(`${where}: ${problem}`);
      // Namespace declarations are the rewrite's to write; xlink:href ships as SVG 2's plain href.
      else if (n !== 'xmlns' && n !== 'xmlns:xlink') attrs.push(`${n === 'xlink:href' ? 'href' : n}="${escapeAttr(a.value)}"`);
    }
    if (/animation/i.test(node.attrs.find((a) => a.name === 'style')?.value ?? '')) hasKeyframes = true;
    let inner = '';
    for (const child of node.childNodes) {
      if (child.nodeName === '#comment') continue;
      if (child.nodeName === '#text') {
        if (!TEXT_ELEMENTS.has(name)) {
          if (child.value.trim()) findings.push(`${where}: text is allowed only in title, desc, text, tspan and style`);
          continue;
        }
        if (name === 'style') {
          const problem = cssProblem(child.value);
          if (problem) findings.push(`${where}: ${problem}`);
          if (/@keyframes/i.test(child.value) || /\banimation\s*:/i.test(child.value)) hasKeyframes = true;
          if (REDUCED_MOTION.test(child.value)) hasReducedMotion = true;
        }
        inner += escapeText(child.value);
        continue;
      }
      if (!child.tagName) {
        findings.push(`${where}: a node this check does not know (${child.nodeName})`);
        continue;
      }
      inner += visit(child, where);
    }
    if (name === 'svg' && path === '' && !node.attrs.some((a) => a.name === 'viewBox')) findings.push('/svg: needs a viewBox, so it scales with the page');
    if (name === 'svg' && path !== '') findings.push(`${where}: a nested <svg> is not allowed`);
    const open = [name, ...(path === '' ? [`xmlns="${SVG_NS}"`] : []), ...attrs].join(' ');
    return `<${open}>${inner}</${name}>`;
  };
  const output = visit(roots[0], '');
  if (elements > MAX_ELEMENTS) findings.push(`more than ${MAX_ELEMENTS} elements`);
  if (hasKeyframes && !hasReducedMotion) {
    findings.push('it animates, so its <style> must stop the animation in @media (prefers-reduced-motion: reduce)');
  }
  return findings.length ? { findings, output: null } : { findings, output: `${output}\n` };
}

const escapeAttr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeText = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** @param {string} dir @returns {string[]} every file under dir, as paths relative to it with `/` */
function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(relative(dir, full).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * Every diagram under `sourceDir`: its path, the post it belongs to, and the checked rewrite.
 * @param {string} sourceDir @param {string} postsDir
 * @returns {{ findings: string[], diagrams: { file: string, output: string }[] }}
 */
export function checkAll(sourceDir = SOURCE_DIR, postsDir = POSTS_DIR) {
  const findings = [];
  const diagrams = [];
  const posts = new Set(existsSync(postsDir) ? readdirSync(postsDir).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, '')) : []);
  for (const file of filesUnder(sourceDir)) {
    const match = DIAGRAM_PATH.exec(`/diagrams/${file}`);
    if (!match) {
      findings.push(`${file}: must be diagrams/<post-slug>/<name>.svg, lowercase words joined by -`);
      continue;
    }
    if (!posts.has(match[1])) findings.push(`${file}: no post is named ${match[1]}; a diagram lives in its post's folder`);
    const { findings: problems, output } = checkSvg(readFileSync(join(sourceDir, file), 'utf8'));
    for (const p of problems) findings.push(`${file}: ${p}`);
    if (output) diagrams.push({ file, output });
  }
  return { findings, diagrams };
}

function main(args) {
  const [mode, dist] = args;
  if (mode !== undefined && !['--write', '--check-dist'].includes(mode)) return usage();
  if (mode && !dist) return usage();
  const { findings, diagrams } = checkAll();
  if (findings.length) {
    for (const f of findings) console.error(`check:diagrams: ${f}`);
    console.error(`check:diagrams: ${findings.length} finding(s); docs/adr/0016-diagrams-are-checked-svg-files.md`);
    return 1;
  }
  if (mode === '--write') {
    for (const { file, output } of diagrams) {
      const target = join(dist, 'diagrams', ...file.split('/'));
      mkdirSync(join(target, '..'), { recursive: true });
      writeFileSync(target, output);
    }
    console.log(`check:diagrams: wrote ${diagrams.length} checked diagram(s) into ${dist}/diagrams`);
    return 0;
  }
  if (mode === '--check-dist') {
    const shipped = filesUnder(join(dist, 'diagrams'));
    const expected = new Map(diagrams.map((d) => [d.file, d.output]));
    const problems = [];
    for (const file of shipped) {
      if (!expected.has(file)) problems.push(`${dist}/diagrams/${file}: ships, but no checked source makes it`);
      else if (readFileSync(join(dist, 'diagrams', ...file.split('/')), 'utf8') !== expected.get(file)) problems.push(`${dist}/diagrams/${file}: is not this check's rewrite of its source`);
    }
    for (const file of expected.keys()) if (!shipped.includes(file)) problems.push(`${dist}/diagrams/${file}: missing from the build`);
    for (const p of problems) console.error(`check:diagrams: ${p}`);
    if (problems.length) return 1;
    console.log(`check:diagrams: every shipped diagram (${shipped.length}) is its checked rewrite`);
    return 0;
  }
  console.log(`check:diagrams: ${diagrams.length} diagram(s), all allowed`);
  return 0;
}

function usage() {
  console.error('usage: node scripts/check-diagrams.mjs [--write <dist> | --check-dist <dist>]');
  return 2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
