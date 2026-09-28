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
 * Animation is CSS, and a file that animates must provably stop for readers who ask for reduced
 * motion (`motionProblem`). Its structure (rules, blocks, declarations, media queries) comes from a
 * one-pass parse, so a media query inside a string is a string; the parse is what the motion proof
 * reads. A file's markup is pre-scanned in one pass for its tag count and depth before parse5 sees it.
 *
 * **Nowhere else.** Every mode also walks the rest of `public/` (or the build): any other SVG must be
 * one of the site's own, pinned by hash in SITE_SVGS, and no symbolic link may exist. An SVG in any
 * other folder would miss both this check and the `/diagrams/*` lockdown.
 *
 * **The parse, and why the rewrite ships.** parse5 (already the CSP and rendered-body gates' parser)
 * reads the file as HTML foreign content, which is not how a browser reads an `.svg` file: that is
 * XML. The two can disagree (an HTML element inside `<svg>` ends it for parse5 and does not for an XML
 * parser), so anything outside one root `<svg>`, or any element not in the SVG namespace, is refused,
 * and the file that ships is never the writer's bytes: it is written from the checked tree by this
 * script, with every name and value escaped, so what a browser parses is what was checked.
 */
import { createHash } from 'node:crypto';
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
/**
 * All diagrams together, and how many, per run: each file's limit bounds one file, and these bound
 * what a flood of them can cost the check and the deploy. Room for about a hundred dense diagrams.
 */
export const MAX_TOTAL_BYTES = 20_000_000;
/** Deepest nesting of elements: a diagram's groups go a few levels deep, never dozens. */
export const MAX_DEPTH = 64;
export const MAX_DIAGRAMS = 2_000;
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
/**
 * A character XML 1.0 does not allow in a document (a C0 control, U+FFFE, U+FFFF, a lone surrogate).
 * The rewrite would write it out as it is, and an XML parser refuses the whole file.
 */
const NOT_XML_CHAR = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u;
/**
 * CSS functions that can name something outside the file, or compute a value this check cannot
 * see. `src()` and the url form of `image()` are in the specifications and not yet in browsers;
 * they are refused now so that a browser update cannot open a hole.
 */
const CSS_FUNCTIONS_REFUSED = /image-set|\bimage\s*\(|\bsrc\s*\(|element\s*\(|cross-fade|paint\s*\(|attr\s*\(|var\s*\(|env\s*\(/i;
const CSS_AT_RULES = new Set(['keyframes', 'media']);
/**
 * The media queries that mean "this reader asked for less motion": `(prefers-reduced-motion: reduce)`
 * and the bare `(prefers-reduced-motion)`, which is true for every value but no-preference. Matched
 * as tokens: removing spaces first would accept `re duce`, which a browser reads as false.
 */
const REDUCED_MOTION_PRELUDE = /^\(\s*prefers-reduced-motion(?:\s*:\s*reduce)?\s*\)$/i;
/** The one that means "this reader did not": animation may live inside it with no override. */
const MOTION_OK_PRELUDE = /^\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)$/i;
/** What a rule's `media` holds: which of the two it sits in, or another media query. */
const REDUCED_MOTION_QUERY = 'reduce';
const MOTION_OK_QUERY = 'no-preference';
const OTHER_QUERY = 'other';
const REDUCED_MOTION_TEXT = '@media (prefers-reduced-motion: reduce)';
/**
 * A property name as a diagram may write one: no vendor prefix. A prefixed property is one this
 * check would have to know by name (`-webkit-animation` animates in every engine), so none pass.
 */
const CSS_PROPERTY = /^[a-z][a-z0-9-]*$/;
/** A keyframe selector: `from`, `to`, or percentages, comma-separated. */
const KEYFRAME_SELECTOR = /^(?:from|to|\d{1,3}(?:\.\d+)?%)(?:\s*,\s*(?:from|to|\d{1,3}(?:\.\d+)?%))*$/i;

/**
 * Every `url(…)` in a text must be `url(#id)`. One pass: each `url(` is matched to the first `)`
 * after it, so a malformed or unclosed one is refused where it stands instead of being searched
 * for again from every later position (the quadratic case the review measured).
 * @param {string} text @param {string} label @returns {string | null}
 */
function urlProblem(text, label) {
  const open = /url\s*\(/gi;
  for (let m = open.exec(text); m; m = open.exec(text)) {
    const close = text.indexOf(')', open.lastIndex);
    if (close < 0) return `${label} has a url( with no closing )`;
    let inside = text.slice(open.lastIndex, close).trim();
    if (/^(['"]).*\1$/s.test(inside)) inside = inside.slice(1, -1).trim();
    if (!FRAGMENT.test(inside)) return `${label} has url(${inside}); only url(#id), a reference inside the file, is allowed`;
    open.lastIndex = close + 1;
  }
  return null;
}

/** @param {string} text @returns {string | null} why a CSS text is refused, or null */
export function cssProblem(text) {
  if (DANGEROUS_VALUE.test(text)) return 'CSS contains an escape, markup, an ampersand, or a script or import form';
  if (/\/\*/.test(text)) return 'CSS comments are not allowed (they can hide what a rule says)';
  const url = urlProblem(text, 'CSS');
  if (url) return url;
  for (const [, name] of text.matchAll(/@([A-Za-z-]+)/g)) {
    if (!CSS_AT_RULES.has(name.toLowerCase())) return `CSS @${name} is not allowed (only @keyframes and @media)`;
  }
  if (CSS_FUNCTIONS_REFUSED.test(text)) return 'CSS uses a function that can reach outside plain drawing';
  return null;
}

/**
 * Declarations, split on `;` outside quotes and parentheses.
 * @param {string} text @returns {{ decls: { property: string, value: string, important: boolean }[], problem: string | null }}
 */
export function parseDeclarations(text) {
  const decls = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  const take = (end) => {
    const part = text.slice(start, end).trim();
    start = end + 1;
    if (!part) return null;
    const colon = part.indexOf(':');
    if (colon < 1) return `CSS declaration "${part}" is not property: value`;
    const property = part.slice(0, colon).trim().toLowerCase();
    if (!CSS_PROPERTY.test(property)) return `CSS property "${property}" is not a property name`;
    let value = part.slice(colon + 1).trim();
    const important = /!\s*important$/i.test(value);
    if (important) value = value.replace(/!\s*important$/i, '').trim();
    if (value.includes('!')) return `CSS value "${value}" has a stray !`;
    decls.push({ property, value, important });
    return null;
  };
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth += 1;
    else if (c === ')') depth -= 1;
    else if (c === ';' && depth === 0) {
      const problem = take(i);
      if (problem) return { decls, problem };
    }
    if (depth < 0) return { decls, problem: 'CSS has a ) with no (' };
  }
  if (quote) return { decls, problem: 'CSS has a string with no closing quote' };
  if (depth !== 0) return { decls, problem: 'CSS has a ( with no )' };
  const problem = take(text.length);
  return { decls, problem };
}

/**
 * A diagram's stylesheet, read into the small grammar it may use: plain rules, `@keyframes` and
 * `@media` holding plain rules. One pass over the text, quotes respected, so a media query written
 * inside a string is a string, not a media query. `index` is each rule's place in source order.
 * @param {string} text
 * @returns {{ rules: { selector: string, media: string | null, decls: ReturnType<typeof parseDeclarations>['decls'], index: number }[], problem: string | null }}
 */
export function parseStylesheet(text) {
  const rules = [];
  let i = 0;
  const n = text.length;
  const fail = (problem) => ({ rules, problem });
  const skipSpace = () => {
    while (i < n && /\s/.test(text[i])) i += 1;
  };
  /** Up to (not including) the first of `stops` outside quotes; null when the text ends first. */
  const readUntil = (stops) => {
    const from = i;
    let quote = '';
    for (; i < n; i += 1) {
      const c = text[i];
      if (quote) {
        if (c === quote) quote = '';
      } else if (c === '"' || c === "'") quote = c;
      else if (stops.includes(c)) return text.slice(from, i);
    }
    return null;
  };
  /** `selector { declarations }` at i; the selector must not be empty. */
  const readRule = (media, selectorCheck) => {
    const selector = readUntil('{};');
    if (selector === null || text[i] !== '{') return 'CSS rule has no { … } block';
    const clean = selector.trim().replace(/\s+/g, ' ');
    if (!clean) return 'CSS rule has an empty selector';
    if (selectorCheck && !selectorCheck.test(clean)) return `CSS keyframe selector "${clean}" is not from, to or a percentage`;
    i += 1;
    const body = readUntil('{}');
    if (body === null || text[i] !== '}') return `CSS rule "${clean}" does not close, or holds a block inside`;
    i += 1;
    const { decls, problem } = parseDeclarations(body);
    if (problem) return problem;
    rules.push({ selector: clean, media, decls, index: rules.length, keyframe: Boolean(selectorCheck) });
    return null;
  };
  /** Plain rules until the `}` that closes an at-rule's block. */
  const readBlockOfRules = (media, selectorCheck) => {
    for (;;) {
      skipSpace();
      if (i >= n) return 'CSS @ block does not close';
      if (text[i] === '}') {
        i += 1;
        return null;
      }
      if (text[i] === '@') return 'CSS at-rules may not be nested';
      const problem = readRule(media, selectorCheck);
      if (problem) return problem;
    }
  };
  for (;;) {
    skipSpace();
    if (i >= n) return { rules, problem: null };
    if (text[i] === '@') {
      const name = /^@([A-Za-z-]+)/.exec(text.slice(i, i + 32))?.[1]?.toLowerCase();
      if (!name || !CSS_AT_RULES.has(name)) return fail(`CSS @${name ?? ''} is not allowed (only @keyframes and @media)`);
      i += name.length + 1;
      const prelude = readUntil('{};');
      if (prelude === null || text[i] !== '{') return fail(`CSS @${name} has no { … } block`);
      i += 1;
      const problem = name === 'media'
        ? readBlockOfRules(mediaKind(prelude.trim()), null)
        : readBlockOfRules(null, KEYFRAME_SELECTOR);
      if (problem) return fail(problem);
    } else {
      const problem = readRule(null, null);
      if (problem) return fail(problem);
    }
  }
}

/** @param {string} prelude @returns {string} */
const mediaKind = (prelude) => (REDUCED_MOTION_PRELUDE.test(prelude) ? REDUCED_MOTION_QUERY : MOTION_OK_PRELUDE.test(prelude) ? MOTION_OK_QUERY : OTHER_QUERY);

const isNone = (value) => value.toLowerCase() === 'none';
/** @returns {boolean} whether a declaration starts an animation */
const animates = (d) => (d.property === 'animation' || d.property === 'animation-name') && !isNone(d.value);
/** @returns {boolean} whether a declaration removes every animation from what it matches */
const stopsAnimation = (d) => (d.property === 'animation' || d.property === 'animation-name') && isNone(d.value);

/**
 * A diagram that animates must provably stop for a reader who asked for reduced motion
 * (ADR 0016). Proof is one of two shapes, and nothing weaker:
 *
 *   - the animation is declared inside `@media (prefers-reduced-motion: no-preference)`, so it
 *     never applies to that reader; or
 *   - `@media (prefers-reduced-motion: reduce)` holds, later in the source, a rule with the same
 *     selector setting `animation: none` (or `animation-name: none`): same selector, same
 *     specificity, later wins; or it holds `* { animation: none !important }`, which wins over
 *     every declaration, because `!important` is refused everywhere else.
 *
 * Transitions are refused outright: a diagram shown as an image is never hovered, so a transition
 * does nothing there but move on the file's own page.
 * @param {ReturnType<typeof parseStylesheet>['rules']} rules @returns {string | null}
 */
export function motionProblem(rules) {
  const style = rules.filter((r) => !r.keyframe);
  for (const r of style) {
    for (const d of r.decls) {
      if (d.property.startsWith('transition')) return `CSS ${d.property} is not allowed; animate with @keyframes`;
      if (d.important && r.media !== REDUCED_MOTION_QUERY) return `CSS !important is allowed only inside ${REDUCED_MOTION_TEXT}`;
      if (animates(d) && r.media === REDUCED_MOTION_QUERY) return `"${r.selector}" animates inside ${REDUCED_MOTION_TEXT}, the block that must stop it`;
    }
  }
  /** Selector → the source position of its last reduced-motion stop: one lookup per rule, not a scan. */
  const lastStop = new Map();
  let universal = false;
  for (const r of style) {
    if (r.media !== REDUCED_MOTION_QUERY || !r.decls.some(stopsAnimation)) continue;
    lastStop.set(r.selector, r.index);
    if (r.selector === '*' && r.decls.some((d) => stopsAnimation(d) && d.important)) universal = true;
  }
  for (const r of style) {
    if (r.media === MOTION_OK_QUERY || !r.decls.some(animates) || universal) continue;
    if (!(lastStop.get(r.selector) > r.index)) {
      return `"${r.selector}" animates, and no later rule for "${r.selector}" in @media (prefers-reduced-motion: reduce) sets animation: none`;
    }
  }
  return null;
}

/** @param {string} name @param {string} value @param {string} element @returns {string | null} */
export function attributeProblem(name, value, element) {
  // A browser ignores a sheet whose type is not CSS, and this check would still count its rules.
  if (element === 'style' && name === 'type') return value.trim().toLowerCase() === 'text/css' ? null : '<style type> must be text/css (or left out)';
  if (name === 'xmlns:xlink') return value === XLINK_NS ? null : `xmlns:xlink must be ${XLINK_NS}`;
  if (name === 'href' || name === 'xlink:href') {
    if (!HREF_ELEMENTS.has(element)) return `${name} is allowed only on gradients and patterns`;
    return FRAGMENT.test(value) ? null : `${name}="${value}" must be #id, a reference inside the file`;
  }
  if (!ATTRIBUTES.has(name)) return `attribute ${name} is not allowed`;
  if (name === 'xmlns') return value === SVG_NS ? null : `xmlns must be ${SVG_NS}`;
  if (name === 'id') return ID.test(value) ? null : `id "${value}" must start with a letter and use letters, digits, _ . -`;
  if (NOT_XML_CHAR.test(value) || /\u007f/.test(value)) return `${name} holds a control character`;
  if (name === 'style') return styleAttributeProblem(value);
  if (DANGEROUS_VALUE.test(value)) return `${name} holds an escape, markup or a script form`;
  return urlProblem(value, name);
}

/** A `style` attribute: plain declarations, and never motion, which only a stylesheet can stop. */
function styleAttributeProblem(value) {
  const problem = cssProblem(value);
  if (problem) return problem;
  const { decls, problem: parsed } = parseDeclarations(value);
  if (parsed) return parsed;
  for (const d of decls) {
    if (d.property.startsWith('animation') || d.property.startsWith('transition')) {
      return `style="${d.property}: …" is not allowed; animate in <style>, where reduced motion can stop it`;
    }
  }
  return null;
}

const attrName = (a) => (a.prefix ? `${a.prefix}:${a.name}` : a.name);

/**
 * Check one SVG file's text; on success, also return the rewrite that ships.
 * @param {string} text
 * @returns {{ findings: string[], output: string | null }}
 */
export function checkSvg(text, { verifyRewrite = true } = {}) {
  const findings = [];
  const fail = (f) => ({ findings: [...findings, f], output: null });
  // The limit is on the writer's file. The rewrite spells out every close tag and escape, so it can
  // be larger; when checking it again (verifyRewrite false) its size is already bounded by the input.
  if (verifyRewrite && Buffer.byteLength(text, 'utf8') > MAX_BYTES) return fail(`larger than ${MAX_BYTES} bytes`);
  // What an XML parser would act on and parse5 would not see the same way: refuse before parsing.
  if (/<!DOCTYPE|<!ENTITY|<!\[CDATA\[/i.test(text)) return fail('DOCTYPE, ENTITY and CDATA sections are not allowed');
  const body = text.replace(/^﻿?\s*<\?xml\s[^?]*\?>/, '');
  if (/<\?/.test(body)) return fail('processing instructions are not allowed');
  if (/<\/?[A-Za-z][\w.-]*:/.test(body)) return fail('prefixed element names (svg:, html: and the like) are not allowed');
  const shape = markupShapeProblem(body);
  if (shape) return fail(shape);

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
  /** Every <style> text, in document order: together they are one cascade. */
  const sheets = [];
  /** @returns {string} the checked element, serialized */
  const visit = (node, path) => {
    elements += 1;
    const name = node.tagName;
    const where = `${path}/${name}`;
    if (node.namespaceURI !== SVG_NS) findings.push(`${where}: not an SVG element`);
    else if (!ELEMENTS.has(name)) findings.push(`${where}: element <${name}> is not allowed`);
    const attrs = [];
    const names = new Set(node.attrs.map(attrName));
    // xlink:href ships as href, so both on one element would ship as the same attribute twice.
    if (names.has('href') && names.has('xlink:href')) findings.push(`${where}: href and xlink:href together; use one`);
    for (const a of node.attrs) {
      const n = attrName(a);
      const problem = attributeProblem(n, a.value, name);
      if (problem) findings.push(`${where}: ${problem}`);
      // Namespace declarations are the rewrite's to write; xlink:href ships as SVG 2's plain href.
      else if (n !== 'xmlns' && n !== 'xmlns:xlink') attrs.push(`${n === 'xlink:href' ? 'href' : n}="${escapeAttr(a.value)}"`);
    }
    let inner = '';
    let styleText = '';
    for (const child of node.childNodes) {
      // In SVG, <style> is parsed as markup, so a comment or element inside it splits the CSS into
      // pieces that are checked apart and ship joined (`ur<!---->l(` ships as `url(`): text only.
      if (name === 'style' && child.nodeName !== '#text') {
        findings.push(`${where}: <style> may hold only CSS text, no comments or elements`);
        continue;
      }
      if (child.nodeName === '#comment') continue;
      if (child.nodeName === '#text') {
        if (!TEXT_ELEMENTS.has(name)) {
          if (child.value.trim()) findings.push(`${where}: text is allowed only in title, desc, text, tspan and style`);
          continue;
        }
        if (NOT_XML_CHAR.test(child.value)) findings.push(`${where}: text holds a character XML does not allow (a control character, U+FFFE or U+FFFF)`);
        if (name === 'style') styleText += child.value;
        inner += escapeText(child.value);
        continue;
      }
      if (!child.tagName) {
        findings.push(`${where}: a node this check does not know (${child.nodeName})`);
        continue;
      }
      inner += visit(child, where);
    }
    if (name === 'style') {
      // The whole sheet, exactly as it ships, is what is checked.
      const problem = cssProblem(styleText);
      if (problem) findings.push(`${where}: ${problem}`);
      else sheets.push(styleText);
    }
    if (name === 'svg' && path === '' && !node.attrs.some((a) => a.name === 'viewBox')) findings.push('/svg: needs a viewBox, so it scales with the page');
    if (name === 'svg' && path !== '') findings.push(`${where}: a nested <svg> is not allowed`);
    const open = [name, ...(path === '' ? [`xmlns="${SVG_NS}"`] : []), ...attrs].join(' ');
    return `<${open}>${inner}</${name}>`;
  };
  const output = visit(roots[0], '');
  if (elements > MAX_ELEMENTS) findings.push(`more than ${MAX_ELEMENTS} elements`);
  const { rules, problem: sheetProblem } = parseStylesheet(sheets.join('\n'));
  const motion = sheetProblem ?? motionProblem(rules);
  if (motion) findings.push(`/svg/style: ${motion}`);
  if (findings.length) return { findings, output: null };
  const shipped = `${output}\n`;
  // The rewrite is what browsers read, so it must pass this check itself and come back unchanged:
  // any gap between what was checked and what ships shows up here as a difference.
  if (verifyRewrite) {
    const again = checkSvg(shipped, { verifyRewrite: false });
    if (again.findings.length || again.output !== shipped) {
      return { findings: [`the rewrite does not check the same as the file (${again.findings[0] ?? 'it changes when rewritten again'})`], output: null };
    }
  }
  return { findings, output: shipped };
}

/**
 * One pass over the markup before parse5 sees it: parse5's tree building is slow on floods of
 * tags and deep nesting (9.9 s for 39,000 stray tags in 199 kB, measured), and the walk that
 * follows recurses once per level. So more start or end tags than MAX_ELEMENTS, or nesting deeper
 * than MAX_DEPTH, is refused here. A tag is `<` up to the next `<` or `>`, so an unclosed one
 * cannot make the scan look far ahead.
 * @param {string} body @returns {string | null}
 */
export function markupShapeProblem(body) {
  let starts = 0;
  let ends = 0;
  let depth = 0;
  for (const [, slash, rest, close] of body.matchAll(/<(\/?)([A-Za-z][^<>]*)(>?)/g)) {
    if (slash) {
      ends += 1;
      depth -= 1;
    } else {
      starts += 1;
      if (!(close && rest.endsWith('/'))) depth += 1;
    }
    if (starts > MAX_ELEMENTS || ends > MAX_ELEMENTS) return `more than ${MAX_ELEMENTS} tags`;
    if (depth > MAX_DEPTH) return `elements nested more than ${MAX_DEPTH} deep`;
  }
  return null;
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
 * The SVG files the site itself ships outside `diagrams/`, pinned by content. An SVG opened on its
 * own is a document that can run script, and only `/diagrams/*` gets the enforced lockdown policy,
 * so this is the one other way an SVG may reach the site: named here, byte for byte. A cover that is
 * redrawn (`scripts/generate-covers.py`) gets its new hash here in the same change, by the maintainer.
 */
export const SITE_SVGS = new Map([
  ['favicon.svg', '467e6918602a794c76e4c60406b2b228775605fa387ad947575c21d5750e1ce6'],
  ['covers/creative.svg', 'c8820fb32ca753ae872c2725d49e5a6bafea3e47683724d292438a6b9690ce5d'],
  ['covers/dev.svg', '3761f938d5a994f5eb80f402e136c58fe5e816bd6c37b54479bc31c22e3a8bc6'],
  ['covers/infra.svg', 'b4feafc3c35fd3f685b29ec21491a1716748c8c9ac44beaac9ac99fbda980ccc'],
  ['covers/models.svg', 'e7c6cb4606b5f1cef32558ce2c0f2799cb721a0dde291ec18dfdba37ad78f8a4'],
  ['covers/opinion.svg', '7314fc25e4f709a98acc836adaf46be46edc2d5051c7f6b0d6c750f04192f484'],
  ['covers/policy.svg', '7e711efd085e46ac714cf74ef1caf54749b674fe4cf042ad9bc9ae233d3dda06'],
  ['covers/rust.svg', 'f0bb92cd4832ddb4aa2c184bed9f210ddc87ea2edc6188a4e17fe9aefe45851b'],
  ['covers/tools.svg', '2ee6a9b44d6e990ae70a4cb8e98fafbbc7ebcf86974fd09e5b3b066e40038351'],
]);
export const PUBLIC_DIR = 'public';
/** Names a browser may treat as SVG, whatever the case. */
const SVG_NAME = /\.svgz?$/i;
/**
 * In `public/`, also every other name a browser may open as a document that runs script. The build
 * makes its own `.html` and `.xml` (pages, feeds, sitemaps), so this stricter rule is for the
 * source folder, where writers' files arrive.
 */
const DOCUMENT_NAME = /\.(?:svgz?|html?|xhtml?|xht|xml|xslt?)$/i;

/**
 * Outside `diagrams/`, under `root` (public/ or the build): every SVG must be one of SITE_SVGS with
 * its pinned hash, and no symbolic link may exist at all (it can make a checked name serve
 * unchecked bytes, or pull a whole folder past this walk).
 * @param {string} root @returns {string[]}
 */
export function strayProblems(root, { source = root === PUBLIC_DIR } = {}) {
  const suspect = source ? DOCUMENT_NAME : SVG_NAME;
  if (!existsSync(root)) return [];
  const problems = [];
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name);
      const rel = relative(root, full).split(sep).join('/');
      if (entry.isSymbolicLink()) problems.push(`${root}/${rel}: symbolic links are not allowed here`);
      else if (entry.isDirectory()) {
        if (rel !== 'diagrams') walk(full);
      } else if (suspect.test(entry.name)) {
        const pinned = SITE_SVGS.get(rel);
        if (!pinned) problems.push(`${root}/${rel}: a document a browser could run (SVG, HTML or XML) outside diagrams/; a diagram lives in diagrams/<post-slug>/, where it is checked (ADR 0016)`);
        else if (createHash('sha256').update(readFileSync(full)).digest('hex') !== pinned) problems.push(`${root}/${rel}: is not the pinned site file; a redrawn cover needs its new hash in SITE_SVGS`);
      }
    }
  };
  walk(root);
  return problems;
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
  const files = filesUnder(sourceDir);
  // Bound the run by what it is asked to read, before reading any of it.
  if (files.length > MAX_DIAGRAMS) return { findings: [`${files.length} files under ${sourceDir}; at most ${MAX_DIAGRAMS}`], diagrams };
  const total = files.reduce((sum, f) => sum + statSync(join(sourceDir, f)).size, 0);
  if (total > MAX_TOTAL_BYTES) return { findings: [`${total} bytes under ${sourceDir}; at most ${MAX_TOTAL_BYTES}`], diagrams };
  for (const file of files) {
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
  findings.push(...strayProblems(mode ? dist : PUBLIC_DIR));
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
