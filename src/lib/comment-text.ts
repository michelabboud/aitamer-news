/**
 * Reader comments as HTML and as JSON-LD (plan §6.2, §6.5; ADR 0006). Pure: no Astro import, so
 * `src/lib/comment-text.test.ts` runs it under plain `node:test`.
 *
 * Comments are plain text, never Markdown and never HTML (post bodies allow raw HTML by design;
 * comments must not). The comment schema already refuses markup, control characters and invisible
 * characters, and the desk strips them before it publishes. This module does not rely on either:
 * it strips the invisible characters again and escapes every character that means something in
 * HTML, so a file that slipped past both layers still renders as inert text.
 *
 * The only markup it produces is `<p>`, `<br>` and `<a>` for `http(s)` URLs. Nothing a reader
 * typed ever becomes an attribute other than an `href` that `new URL()` parsed as `http:` or
 * `https:`, escaped for the attribute.
 */

/**
 * Bidirectional embeddings and overrides (U+202A–U+202E), bidirectional isolates (U+2066–U+2069),
 * the zero-width space (U+200B) and the byte-order mark (U+FEFF): characters that reorder or hide
 * text. U+200C and U+200D (the zero-width non-joiner and joiner) are kept: real scripts and emoji
 * sequences need them.
 */
const INVISIBLE = /[\u202A-\u202E\u2066-\u2069\u200B\uFEFF]/g;

/** The five characters that mean something in HTML text or in a quoted attribute. */
const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const HTML_SPECIAL = /[&<>"']/g;

/** What every comment link carries: no ranking credit, marked as user content, no opener access. */
export const COMMENT_LINK_REL = 'nofollow ugc noopener noreferrer';
/** Comment links open in a new tab, so a reader does not lose their place in the thread. */
export const COMMENT_LINK_TARGET = '_blank';
/** A link's visible text is cut to this many characters (Unicode code points), ellipsis included. */
export const COMMENT_LINK_TEXT_MAX = 80;
/** What stands in for the cut part of a long link's visible text. */
const ELLIPSIS = '\u2026';

/**
 * A URL candidate: `http://` or `https://` at a word boundary, then a bounded run of characters
 * that are not whitespace, not quotes, not angle brackets and not a backtick. One quantifier over
 * one character class, so matching is linear; the bound is above the comment text cap anyway.
 * Only these two schemes are ever candidates: `javascript:`, `data:`, `mailto:`, `//host` and
 * every other form stays text. `new URL()` then decides whether the candidate is a real URL.
 */
const URL_CANDIDATE = /\bhttps?:\/\/[^\s<>"'`\/\\][^\s<>"'`]{0,2047}/gi;
/** Characters that end a sentence rather than a URL: they stay outside the link. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]}]$/;
const LINKABLE_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);

/** One or more blank lines (empty, or only spaces and tabs) separate paragraphs. */
const PARAGRAPH_BREAK = /\n(?:[ \t]*\n)+/;
const CARRIAGE_RETURN = /\r\n?/g;

/** How many comments the post page's JSON-LD carries, newest first. `commentCount` counts all. */
export const COMMENT_JSON_LD_MAX = 50;

/** The part of a published comment this module reads. */
export interface CommentLike {
  id: string;
  name: string;
  text: string;
  /** ISO-8601 UTC instant. */
  at: string;
}

/** @returns `value` without bidirectional-control, zero-width-space or byte-order-mark characters. */
export function stripInvisible(value: string): string {
  return value.replace(INVISIBLE, '');
}

/** @returns `value` with `& < > " '` escaped, safe as HTML text and inside a quoted attribute. */
export function escapeHtml(value: string): string {
  return value.replace(HTML_SPECIAL, (character) => HTML_ESCAPES[character]);
}

/** Count of `(` minus count of `)`, so a URL like `…/Foo_(bar)` keeps its own closing parenthesis. */
function parenBalance(value: string): number {
  let balance = 0;
  for (const character of value) {
    if (character === '(') balance++;
    else if (character === ')') balance--;
  }
  return balance;
}

/**
 * Splits trailing sentence punctuation off a URL candidate. A `)` stays in the URL only while the
 * URL has an unmatched `(` of its own.
 * @returns the URL part and the punctuation that follows it
 */
function splitTrailing(candidate: string): { url: string; rest: string } {
  let url = candidate;
  let rest = '';
  while (url.length > 0 && TRAILING_PUNCTUATION.test(url)) {
    const last = url.at(-1);
    if (last === ')' && parenBalance(url.slice(0, -1)) > 0) break;
    rest = last + rest;
    url = url.slice(0, -1);
  }
  return { url, rest };
}

/** @returns the parsed URL when `value` is an absolute `http(s)` URL with a host, else `null`. */
function parseLinkable(value: string): URL | null {
  if (!URL.canParse(value)) return null;
  const url = new URL(value);
  if (!LINKABLE_PROTOCOLS.has(url.protocol) || url.hostname === '') return null;
  return url;
}

/** @returns `value` cut to {@link COMMENT_LINK_TEXT_MAX} code points, ending in an ellipsis when cut. */
export function truncateLinkText(value: string): string {
  const points = Array.from(value);
  if (points.length <= COMMENT_LINK_TEXT_MAX) return value;
  return points.slice(0, COMMENT_LINK_TEXT_MAX - ELLIPSIS.length).join('') + ELLIPSIS;
}

function linkHtml(href: string, text: string): string {
  return (
    `<a href="${escapeHtml(href)}" rel="${COMMENT_LINK_REL}" target="${COMMENT_LINK_TARGET}">` +
    `${escapeHtml(truncateLinkText(text))}</a>`
  );
}

/** One line of plain text as escaped HTML, with its `http(s)` URLs as links. */
function lineHtml(line: string): string {
  let html = '';
  let cursor = 0;
  for (const match of line.matchAll(URL_CANDIDATE)) {
    const start = match.index;
    const { url, rest } = splitTrailing(match[0]);
    const parsed = parseLinkable(url);
    if (!parsed) continue;
    html += escapeHtml(line.slice(cursor, start));
    // The href is the WHATWG serialisation (percent-encoded, normalised host); the visible text is
    // what the reader wrote, so it reads the same as the comment.
    html += linkHtml(parsed.href, url);
    html += escapeHtml(rest);
    cursor = start + match[0].length;
  }
  return html + escapeHtml(line.slice(cursor));
}

/**
 * A comment's plain text as HTML: paragraphs on blank lines, `<br>` on single newlines, every
 * `& < > " '` escaped, `http(s)` URLs linked with {@link COMMENT_LINK_REL} and
 * {@link COMMENT_LINK_TARGET}, sentence punctuation after a URL kept outside the link, a link's
 * visible text cut at {@link COMMENT_LINK_TEXT_MAX} characters, and bidirectional-control and
 * zero-width characters stripped first.
 * @returns HTML for `set:html`; the empty string when the text has nothing visible
 */
export function renderCommentHtml(text: string): string {
  const clean = stripInvisible(text).replace(CARRIAGE_RETURN, '\n');
  return clean
    .split(PARAGRAPH_BREAK)
    .map((paragraph) => paragraph.replace(/^\n+|\n+$/g, ''))
    .filter((paragraph) => paragraph.trim() !== '')
    .map((paragraph) => `<p>${paragraph.split('\n').map(lineHtml).join('<br>')}</p>`)
    .join('');
}

/** @returns "No comments", "1 comment" or "N comments". */
export function commentCountLabel(count: number): string {
  if (count === 0) return 'No comments';
  return count === 1 ? '1 comment' : `${count} comments`;
}

/** The fragment id of one comment on its post page. ULIDs are already safe in an id and a URL. */
export function commentAnchor(id: string): string {
  return `c-${id}`;
}

/**
 * The comment half of a post's `NewsArticle` JSON-LD: `commentCount` is every approved comment;
 * `comment` holds the {@link COMMENT_JSON_LD_MAX} newest, newest first, and is absent when there
 * are none. Text and names are stripped of invisible characters; escaping for the `<script>`
 * block is `toJsonLd`'s job, and every caller must go through it.
 * @param comments the thread as the data file holds it, oldest first
 */
export function commentsJsonLd(comments: readonly CommentLike[]): {
  commentCount: number;
  comment?: Array<{
    '@type': 'Comment';
    text: string;
    dateCreated: string;
    author: { '@type': 'Person'; name: string };
  }>;
} {
  if (comments.length === 0) return { commentCount: 0 };
  const newest = comments.slice(-COMMENT_JSON_LD_MAX).reverse();
  return {
    commentCount: comments.length,
    comment: newest.map((comment) => ({
      '@type': 'Comment',
      text: stripInvisible(comment.text),
      dateCreated: comment.at,
      author: { '@type': 'Person', name: stripInvisible(comment.name) },
    })),
  };
}
