/**
 * The exact allowlist a bot post's RENDERED body must pass (ADR 0009). Pure: no filesystem, no
 * Astro, only `parse5`. `./check-rendered-body.mjs` renders a post through the site's own
 * pipeline and hands the HTML to `checkRenderedHtml` here.
 *
 * Why the output and not the Markdown: the posts tool's Rust pre-filter parses with
 * pulldown-cmark, the site renders with satteri (a fork of it, under Astro 7), and review after
 * review found bodies the two read differently, where a `<script>` or a `javascript:` link
 * reached readers. Judging the HTML the site actually ships closes that class: whatever the parser
 * did, only these shapes get through.
 *
 * How it reads the HTML: with parse5, a WHATWG-conformant parser, as a fragment whose context is a
 * `<div>` — exactly where the post page puts it (`<div class="article__body"><Content /></div>` in
 * `src/pages/posts/[slug].astro`), so the tree judged here is the tree a browser builds. Never a
 * regex over HTML.
 *
 * The rule: **unknown means refused.** Every element, every attribute and every attribute value
 * must match one of the shapes below; a comment node, a foreign (SVG or MathML) element, an
 * element or attribute nobody listed, a style the site's Shiki theme does not write — each is a
 * finding. Text nodes need no rule: parse5 hands them over decoded, and the page re-escapes them.
 * When satteri, Shiki or Astro change what they emit, this fails closed and a human widens it here,
 * deliberately, with a test.
 */
import { defaultTreeAdapter, html as parse5Html, parseFragment } from 'parse5';

const HTML_NS = parse5Html.NS.HTML;

/** Images in a bot post come from the site's media bucket and nowhere else. */
export const MEDIA_ORIGIN = 'https://media.aitamer.news';
/** The prefix every image `src` must start with, byte for byte. */
export const MEDIA_PREFIX = `${MEDIA_ORIGIN}/`;

/**
 * The Shiki theme the allowlist was written against: `astro.config.mjs` sets none, and Astro 7's
 * default is `github-dark`. The `<pre>` class carries the theme's name, so a theme change makes
 * every highlighted block a finding until someone reviews the new theme's output and moves this.
 * `./check-rendered-body.mjs` also refuses to start when the resolved config names another theme.
 */
export const SHIKI_THEME = 'github-dark';

/** Schemes a link may use. Relative `/…` paths and `#fragment`s are allowed separately. */
export const LINK_SCHEMES = Object.freeze(['http', 'https', 'mailto']);

/**
 * The marker Astro's image pipeline puts on an `<img>` it will replace at render time (a local
 * import, or a remote host listed in `image.domains`). A bot post never carries one: the site's
 * page code rewrites such markers with a regex over the whole body, and the post would ship an
 * image nobody checked.
 */
export const ASTRO_IMAGE_MARKER = '__ASTRO_IMAGE_';

/**
 * Ids that the story page, its layout, and the components and scripts on it define or look up.
 * A heading id equal to one of these would clobber it: a second element with the same id, so
 * `getElementById` or a `#fragment` finds the post's heading instead of the page's own element
 * (DOM clobbering). `scripts/check-rendered-body.test.mjs` greps the page, the layout and every
 * component they import, and fails when one of them uses an id this list does not cover.
 */
export const PROTECTED_IDS = Object.freeze(
  new Set([
    // src/layouts/BaseLayout.astro
    'main',
    'station-clock',
    'site-search',
    'footer-habitats',
    'footer-guide',
    'footer-station',
    'footer-legal',
    // src/pages/posts/[slug].astro
    'withdrawn-title',
    'corrections-title',
    'sunset-title',
    'sources-title',
    // src/components/Comments.astro and CommentForm.astro (`COMMENT_HELD_ANCHOR` is `comment-held`)
    'comments',
    'comments-title',
    'comment-held',
    'comment-form',
    'comment-status',
    'comment-error',
    'comment-name',
    'comment-text',
    'comment-extra',
    // The footnotes heading satteri writes, which every footnote reference points at.
    'footnote-label',
    // Globals the page's scripts read through `window` (analytics, Turnstile callbacks). A named
    // element would shadow them if they were ever read before being assigned. The heading-id shape
    // (lower case only) already excludes these; they are listed so the rule does not rest on that.
    'dataLayer',
    'gtag',
    'turnstile',
    'aitamerCommentTurnstileReady',
    'aitamerCommentTurnstileExpired',
    'aitamerCommentTurnstileError',
  ]),
);

/**
 * Families of ids the page builds from data, as patterns. A heading id matching one is refused.
 * - `c-<ULID>` and `c-<ULID>-name`: each baked comment (`commentAnchor` in `src/lib/comment-text.ts`);
 *   ULIDs are upper case and heading ids lower case, and the pattern ignores case anyway.
 * - `reactions-panel-<slug>`: the reactions menu (`src/components/Reactions.astro`).
 * - `user-content-…`: satteri's footnote namespace; a heading there could hijack a footnote link.
 */
export const PROTECTED_ID_PATTERNS = Object.freeze([
  /^c-[0-9a-z]{26}(?:-name)?$/i,
  /^reactions-panel-/,
  /^user-content-/,
]);

/** Whether a heading id would collide with an id the page defines or looks up. */
export function isProtectedId(id) {
  return PROTECTED_IDS.has(id) || PROTECTED_ID_PATTERNS.some((pattern) => pattern.test(id));
}

/**
 * The shape of an id `github-slugger` writes (satteri's heading-ids plugin): letters (any script,
 * never ASCII upper case), marks, digits, `_` and `-`. It can be empty (a heading with no text).
 */
const HEADING_ID = /^[\p{L}\p{M}\p{N}_-]*$/u;
const ASCII_UPPER = /[A-Z]/;

/**
 * A footnote label as satteri writes it into an id: the label lower-cased and percent-encoded
 * (`encodeURIComponent`'s safe set, and `%XX` escapes), with `-N` for a repeated reference.
 */
const FOOTNOTE_LABEL = String.raw`(?:[a-z0-9\-_.!~*'()]|%[0-9A-F]{2})+`;
const FOOTNOTE_TARGET_HREF = new RegExp(`^#user-content-fn-(${FOOTNOTE_LABEL})$`);
const FOOTNOTE_REF_ID = new RegExp(`^user-content-fnref-(${FOOTNOTE_LABEL})$`);
const FOOTNOTE_BACKREF_HREF = new RegExp(`^#user-content-fnref-(${FOOTNOTE_LABEL})$`);
const FOOTNOTE_ITEM_ID = new RegExp(`^user-content-fn-(${FOOTNOTE_LABEL})$`);
const FOOTNOTE_BACKREF_LABEL = /^Back to reference [1-9][0-9]*(?:-[1-9][0-9]*)?$/;

const HEX_COLOR = String.raw`#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?`;
/** Shiki's `<pre>` style for a single theme with `wrap: false`, exactly as Astro writes it. */
const SHIKI_PRE_STYLE = new RegExp(`^background-color:${HEX_COLOR};color:${HEX_COLOR}; overflow-x: auto;$`);
/**
 * Shiki's token `<span>` style: `key:value` pairs joined by `;`, in the order Shiki's
 * `getTokenStyleObject` writes them, each at most once.
 */
const SHIKI_TOKEN_STYLE_PARTS = Object.freeze([
  ['color', new RegExp(`^${HEX_COLOR}$`)],
  ['background-color', new RegExp(`^${HEX_COLOR}$`)],
  ['font-style', /^italic$/],
  ['font-weight', /^bold$/],
  ['text-decoration', /^(?:underline|line-through|underline line-through)$/],
]);
/** The language name Shiki puts in `data-language` (it falls back to `plaintext` for unknown ones). */
const CODE_LANGUAGE = /^[A-Za-z0-9][A-Za-z0-9_+#.-]{0,39}$/;
const TABLE_ALIGN = /^text-align: (?:left|center|right)$/;
const OL_START = /^(?:0|[1-9][0-9]{0,8})$/;
/** C0 controls and space: what a browser strips from both ends of a URL, and what we refuse there. */
const URL_EDGE = /^[\u0000- ]|[\u0000- ]$/;
/** Tab, line feed, carriage return: what a browser deletes from anywhere in a URL before reading it. */
const URL_INVISIBLE = /[\t\n\r]/;
const SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):/;

/**
 * Why an `href` is not allowed, or `null`. `value` is the attribute after the HTML parser decoded
 * its character references, which is what the browser's URL parser sees. Anything a browser
 * would silently strip or delete (edge whitespace and controls, tabs and newlines inside) is
 * refused rather than normalised: Markdown never writes it, and it is how `java&#9;script:` hides.
 * @param {string} value @returns {string | null}
 */
export function hrefProblem(value) {
  if (value === '') return 'empty link target';
  if (URL_EDGE.test(value) || URL_INVISIBLE.test(value)) return 'link target contains whitespace or control characters a browser would strip';
  if (value.startsWith('#')) return null;
  if (value.startsWith('/')) {
    // `//host` and `/\host` are protocol-relative for a browser: another site, not a path here.
    if (value[1] === '/' || value[1] === '\\') return 'protocol-relative link (another host)';
    return null;
  }
  const scheme = SCHEME.exec(value)?.[1].toLowerCase();
  if (!scheme) return 'relative link that is not a /path or a #fragment';
  if (!LINK_SCHEMES.includes(scheme)) return `link scheme "${scheme}:" is not allowed (only ${LINK_SCHEMES.join(', ')})`;
  if (scheme === 'mailto') return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return 'link is not a valid URL';
  }
  if (!url.hostname) return 'link has no host';
  if (url.username || url.password) return 'link carries a user name or password (the text can show one host and go to another)';
  return null;
}

/**
 * Why an image `src` is not allowed, or `null`: `https://media.aitamer.news/…`, a valid URL on
 * exactly that host with no credentials or port, and valid for `decodeURI` (satteri's image
 * plugins call it, and a malformed escape fails the build).
 * @param {string} value @returns {string | null}
 */
export function imageSrcProblem(value) {
  if (URL_EDGE.test(value) || URL_INVISIBLE.test(value)) return 'image source contains whitespace or control characters';
  if (!value.startsWith(MEDIA_PREFIX)) return `image source must start with ${MEDIA_PREFIX}`;
  let url;
  try {
    url = new URL(value);
  } catch {
    return 'image source is not a valid URL';
  }
  if (url.origin !== MEDIA_ORIGIN || url.username || url.password) return `image source must be on ${MEDIA_ORIGIN} itself`;
  try {
    decodeURI(value);
  } catch {
    return 'image source is not valid for decodeURI (a malformed % escape)';
  }
  return null;
}

/** @param {string} style @returns {boolean} */
function isShikiTokenStyle(style) {
  const parts = style.split(';');
  let next = 0;
  for (const part of parts) {
    const colon = part.indexOf(':');
    if (colon < 1) return false;
    const key = part.slice(0, colon);
    const value = part.slice(colon + 1);
    const index = SHIKI_TOKEN_STYLE_PARTS.findIndex(([name]) => name === key);
    if (index < next || !SHIKI_TOKEN_STYLE_PARTS[index][1].test(value)) return false;
    next = index + 1;
  }
  return true;
}

/**
 * @typedef {object} Finding
 * @property {string} path where in the rendered body, e.g. `p[2] > a[1]`; `''` for the whole post
 * @property {string} element the element's tag name, or `#comment`, `#post` for the whole post
 * @property {string} [attribute] the attribute's name, when the finding is about one
 * @property {string} problem what is wrong, in words
 */

/**
 * @typedef {object} Context
 * @property {any} node the parse5 element
 * @property {any[]} ancestors elements from the outermost down to the parent (never the context div)
 * @property {Record<string, string>} attrs the element's attributes by name
 */

const parentOf = (/** @type {Context} */ ctx) => ctx.ancestors.at(-1);
const hasClass = (node, value) => node?.attrs?.some((a) => a.name === 'class' && a.value === value);
const attrOf = (node, name) => node?.attrs?.find((a) => a.name === name)?.value;
/** Inside a Shiki block: `pre.astro-code > code`. */
const inShikiCode = (/** @type {Context} */ ctx) => {
  const code = ctx.ancestors.findLast((a) => a.tagName === 'code');
  const pre = code && ctx.ancestors[ctx.ancestors.indexOf(code) - 1];
  return Boolean(pre && pre.tagName === 'pre' && hasClass(pre, `astro-code ${SHIKI_THEME}`));
};
const inFootnotes = (/** @type {Context} */ ctx) =>
  ctx.ancestors.some((a) => a.tagName === 'section' && hasClass(a, 'footnotes') && attrOf(a, 'data-footnotes') === '');

/**
 * An attribute rule: a value check returning a problem or `null`. `(value, ctx) => string | null`.
 * @typedef {(value: string, ctx: Context) => string | null} AttributeRule
 */
const exactly = (expected) => (value) => (value === expected ? null : `must be "${expected}"`);
const matching = (pattern, what) => (value) => (pattern.test(value) ? null : `must be ${what}`);
const anyText = () => null;

const headingId = (value) => {
  if (!HEADING_ID.test(value) || ASCII_UPPER.test(value)) return 'heading id is not in the slugger shape (lower-case letters, digits, _ and -)';
  if (isProtectedId(value)) return `heading id "${value}" collides with an id the story page uses`;
  return null;
};

/**
 * @typedef {object} ElementRule
 * @property {Record<string, AttributeRule>} [attrs] the attributes allowed, with their value rules
 * @property {string[]} [required] attributes that must be present
 * @property {(ctx: Context) => string | null} [where] a structural rule: where the element may appear
 * @property {(ctx: Context) => Finding[] | null} [custom] replaces `attrs` for elements with several exact forms
 */

const heading = () => ({ attrs: { id: headingId }, required: ['id'] });
const tableCell = () => ({ attrs: { style: matching(TABLE_ALIGN, '"text-align: left|center|right"') } });

/** Every element a bot body may contain, and exactly the attributes each may carry. */
/** @type {Record<string, ElementRule>} */
export const ELEMENT_RULES = Object.freeze({
  p: {},
  br: {},
  hr: {},
  em: {},
  strong: {},
  del: {},
  blockquote: {},
  h1: heading(),
  h2: {
    ...heading(),
    // The footnotes heading is the one h2 with a class and a fixed, protected id.
    custom: (ctx) => {
      if (inFootnotes(ctx) && parentOf(ctx)?.tagName === 'section') {
        return exactForm(ctx, { class: 'sr-only', id: 'footnote-label' }, 'the footnotes heading');
      }
      return null;
    },
  },
  h3: heading(),
  h4: heading(),
  h5: heading(),
  h6: heading(),
  ul: { attrs: { class: exactly('contains-task-list') } },
  ol: {
    attrs: { start: matching(OL_START, 'a whole number'), class: exactly('contains-task-list') },
  },
  li: {
    attrs: {
      class: exactly('task-list-item'),
      id: (value, ctx) =>
        inFootnotes(ctx) && FOOTNOTE_ITEM_ID.test(value) ? null : 'a list item id is allowed only on a footnote, as user-content-fn-<label>',
    },
  },
  input: {
    attrs: { type: exactly('checkbox'), disabled: exactly(''), checked: exactly('') },
    required: ['type', 'disabled'],
    where: (ctx) => (parentOf(ctx)?.tagName === 'li' && hasClass(parentOf(ctx), 'task-list-item') ? null : 'a checkbox is allowed only as a task-list marker'),
  },
  table: {},
  thead: {},
  tbody: {},
  tr: {},
  th: tableCell(),
  td: tableCell(),
  a: { custom: linkFindings },
  img: {
    attrs: { src: imageSrcProblem, alt: anyText, title: anyText },
    required: ['src'],
  },
  code: {
    attrs: {
      // Only a fenced block Shiki skips (the `math` language) keeps a language class.
      class: (value, ctx) =>
        parentOf(ctx)?.tagName === 'pre' && !parentOf(ctx).attrs.length && /^language-[A-Za-z0-9_+#.-]{1,40}$/.test(value)
          ? null
          : 'a code class is allowed only as language-<name> on a plain fenced block',
    },
  },
  pre: { custom: preFindings },
  span: {
    attrs: {
      class: exactly('line'),
      style: (value) => (isShikiTokenStyle(value) ? null : `style is not a ${SHIKI_THEME} token style (color, font-style, font-weight, text-decoration)`),
    },
    where: (ctx) => (inShikiCode(ctx) ? null : 'a span is allowed only inside a highlighted code block'),
  },
  sup: {},
  section: {
    custom: (ctx) => exactForm(ctx, { 'data-footnotes': '', class: 'footnotes' }, 'the footnotes section'),
  },
});

/**
 * An element that must carry exactly these attributes with exactly these values.
 * @param {Context} ctx @param {Record<string, string>} form @param {string} what @returns {Finding[]}
 */
function exactForm(ctx, form, what) {
  const findings = [];
  for (const [name, value] of Object.entries(ctx.attrs)) {
    if (!Object.hasOwn(form, name)) findings.push(finding(ctx, `unknown attribute on ${what}`, name));
    else if (form[name] !== value) findings.push(finding(ctx, `${what} must have ${name}="${form[name]}"`, name));
  }
  for (const name of Object.keys(form)) {
    if (!(name in ctx.attrs)) findings.push(finding(ctx, `${what} is missing ${name}`, name));
  }
  return findings;
}

/**
 * `<pre>`: Shiki's exact form (`class="astro-code github-dark"`, its style, `tabindex="0"`,
 * `data-language`), or a bare `<pre>` (a fenced block in a language Shiki skips, `math`).
 * @param {Context} ctx @returns {Finding[]}
 */
function preFindings(ctx) {
  if (Object.keys(ctx.attrs).length === 0) return [];
  const findings = [];
  const expected = ['class', 'style', 'tabindex', 'data-language'];
  for (const name of Object.keys(ctx.attrs)) {
    if (!expected.includes(name)) findings.push(finding(ctx, 'unknown attribute on a code block', name));
  }
  const check = (name, ok, problem) => {
    if (!(name in ctx.attrs)) findings.push(finding(ctx, `a highlighted code block is missing ${name}`, name));
    else if (!ok(ctx.attrs[name])) findings.push(finding(ctx, problem, name));
  };
  check('class', (v) => v === `astro-code ${SHIKI_THEME}`, `class must be "astro-code ${SHIKI_THEME}" (another Shiki theme or option needs a review of this allowlist)`);
  check('style', (v) => SHIKI_PRE_STYLE.test(v), 'style is not the Shiki block style (background-color, color, overflow-x)');
  check('tabindex', (v) => v === '0', 'tabindex must be "0"');
  check('data-language', (v) => CODE_LANGUAGE.test(v), 'data-language is not a language name');
  return findings;
}

/**
 * `<a>`, in one of three exact forms:
 * - a link: `href` (see `hrefProblem`) and optionally `title`;
 * - a footnote reference: inside `<sup>`, `href="#user-content-fn-L"`, `id="user-content-fnref-L"`,
 *   `data-footnote-ref=""`, `aria-describedby="footnote-label"`;
 * - a footnote back-reference: inside the footnotes section, `href="#user-content-fnref-L"`,
 *   `data-footnote-backref=""`, `aria-label="Back to reference N"`, `class="data-footnote-backref"`.
 * @param {Context} ctx @returns {Finding[]}
 */
function linkFindings(ctx) {
  const { attrs } = ctx;
  if ('data-footnote-ref' in attrs) {
    const findings = exactKeys(ctx, ['href', 'id', 'data-footnote-ref', 'aria-describedby'], 'a footnote reference');
    const target = FOOTNOTE_TARGET_HREF.exec(attrs.href ?? '');
    const self = FOOTNOTE_REF_ID.exec(attrs.id ?? '');
    if (!target) findings.push(finding(ctx, 'a footnote reference must link to #user-content-fn-<label>', 'href'));
    if (!self) findings.push(finding(ctx, 'a footnote reference id must be user-content-fnref-<label>', 'id'));
    if (attrs['data-footnote-ref'] !== '') findings.push(finding(ctx, 'data-footnote-ref must be empty', 'data-footnote-ref'));
    if (attrs['aria-describedby'] !== 'footnote-label') findings.push(finding(ctx, 'aria-describedby must be "footnote-label"', 'aria-describedby'));
    if (parentOf(ctx)?.tagName !== 'sup') findings.push(finding(ctx, 'a footnote reference must sit in <sup>'));
    return findings;
  }
  if ('data-footnote-backref' in attrs) {
    const findings = exactKeys(ctx, ['href', 'data-footnote-backref', 'aria-label', 'class'], 'a footnote back-reference');
    if (!FOOTNOTE_BACKREF_HREF.test(attrs.href ?? '')) findings.push(finding(ctx, 'a footnote back-reference must link to #user-content-fnref-<label>', 'href'));
    if (attrs['data-footnote-backref'] !== '') findings.push(finding(ctx, 'data-footnote-backref must be empty', 'data-footnote-backref'));
    if (!FOOTNOTE_BACKREF_LABEL.test(attrs['aria-label'] ?? '')) findings.push(finding(ctx, 'aria-label must be "Back to reference N"', 'aria-label'));
    if (attrs.class !== 'data-footnote-backref') findings.push(finding(ctx, 'class must be "data-footnote-backref"', 'class'));
    if (!inFootnotes(ctx)) findings.push(finding(ctx, 'a footnote back-reference must sit in the footnotes section'));
    return findings;
  }
  const findings = [];
  for (const name of Object.keys(attrs)) {
    if (name !== 'href' && name !== 'title') findings.push(finding(ctx, 'attribute not allowed on a link', name));
  }
  if (!('href' in attrs)) findings.push(finding(ctx, 'a link without href', 'href'));
  else {
    const problem = hrefProblem(attrs.href);
    if (problem) findings.push(finding(ctx, problem, 'href'));
  }
  return findings;
}

/** Attributes outside `allowed`, and any of `allowed` that is missing. */
function exactKeys(ctx, allowed, what) {
  const findings = [];
  for (const name of Object.keys(ctx.attrs)) {
    if (!allowed.includes(name)) findings.push(finding(ctx, `attribute not allowed on ${what}`, name));
  }
  for (const name of allowed) {
    if (!(name in ctx.attrs)) findings.push(finding(ctx, `${what} is missing ${name}`, name));
  }
  return findings;
}

/** @returns {Finding} */
function finding(ctx, problem, attribute) {
  const result = { path: ctx.path, element: ctx.node.tagName, problem };
  if (attribute !== undefined) result.attribute = attribute;
  return result;
}

/** @param {Context} ctx @returns {Finding[]} */
function elementFindings(ctx) {
  const rule = ELEMENT_RULES[ctx.node.tagName];
  if (!Object.hasOwn(ELEMENT_RULES, ctx.node.tagName) || !rule) return [finding(ctx, `element <${ctx.node.tagName}> is not allowed`)];
  const findings = [];
  if (rule.where) {
    const problem = rule.where(ctx);
    if (problem) findings.push(finding(ctx, problem));
  }
  const custom = rule.custom?.(ctx);
  if (custom) return findings.concat(custom);
  const allowed = rule.attrs ?? {};
  for (const [name, value] of Object.entries(ctx.attrs)) {
    const check = Object.hasOwn(allowed, name) ? allowed[name] : undefined;
    if (!check) {
      const problem = name.toLowerCase() === ASTRO_IMAGE_MARKER.toLowerCase()
        ? 'image goes through Astro\'s image pipeline (a local import or a listed remote host); bot images must be plain media.aitamer.news URLs'
        : `attribute not allowed on <${ctx.node.tagName}>`;
      findings.push(finding(ctx, problem, name));
      continue;
    }
    const problem = check(value, ctx);
    if (problem) findings.push(finding(ctx, problem, name));
  }
  for (const name of rule.required ?? []) {
    if (!(name in ctx.attrs)) findings.push(finding(ctx, `<${ctx.node.tagName}> is missing ${name}`, name));
  }
  return findings;
}

/**
 * Check a rendered body against the allowlist.
 * @param {string} html the HTML the site's Markdown pipeline produced for one post body
 * @returns {Finding[]} empty when every node is allowed
 */
export function checkRenderedHtml(html) {
  /** @type {Finding[]} */
  const findings = [];
  // Astro's page code rewrites `__ASTRO_IMAGE_="…"` anywhere in the body with a regex, text
  // included, whenever the post has a pipeline image. None may appear, in any node.
  if (html.includes(ASTRO_IMAGE_MARKER)) {
    findings.push({ path: '', element: '#post', problem: `the rendered body contains Astro's image marker ${ASTRO_IMAGE_MARKER}` });
  }
  const context = defaultTreeAdapter.createElement('div', HTML_NS, []);
  const fragment = parseFragment(context, html);
  const ids = new Map();
  const walk = (parent, ancestors, parentPath) => {
    const counts = new Map();
    for (const node of parent.childNodes ?? []) {
      if (node.nodeName === '#text') continue;
      const label = node.tagName ?? node.nodeName;
      const index = (counts.get(label) ?? 0) + 1;
      counts.set(label, index);
      const path = parentPath ? `${parentPath} > ${label}[${index}]` : `${label}[${index}]`;
      if (!node.tagName) {
        findings.push({ path, element: node.nodeName, problem: `${node.nodeName} nodes are not allowed` });
        continue;
      }
      if (node.namespaceURI !== HTML_NS) {
        findings.push({ path, element: node.tagName, problem: 'foreign (SVG or MathML) content is not allowed' });
        continue;
      }
      /** @type {Record<string, string>} */
      const attrs = Object.create(null);
      for (const attr of node.attrs) {
        if (attr.namespace || attr.prefix) {
          findings.push({ path, element: node.tagName, attribute: attr.name, problem: 'namespaced attribute is not allowed' });
          continue;
        }
        attrs[attr.name] = attr.value;
      }
      const ctx = { node, ancestors, attrs, path };
      findings.push(...elementFindings(ctx));
      if ('id' in attrs) {
        if (ids.has(attrs.id)) findings.push(finding(ctx, `id "${attrs.id}" is used twice in the body (first at ${ids.get(attrs.id)})`, 'id'));
        else ids.set(attrs.id, path);
      }
      // A <template>'s children live in its content fragment; it is refused above either way.
      walk(node, [...ancestors, node], path);
    }
  };
  walk(fragment, [], '');
  return findings;
}
