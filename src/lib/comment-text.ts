/**
 * Reader comments as HTML and as JSON-LD (plan §6.2, §6.5; ADR 0006). Pure: no `astro:*` import
 * (the comment schema it takes its character list from imports only `astro/zod`), so
 * `src/lib/comment-text.test.ts` runs it under plain `node:test`.
 *
 * Comments are plain text, never Markdown and never HTML (post bodies allow raw HTML by design;
 * comments must not). The comment schema already refuses markup, control characters and invisible
 * characters, and the desk strips them before it publishes. This module does not rely on either:
 * it strips the schema's forbidden characters again and escapes every character that means
 * something in HTML, so a file that slipped past both layers still renders as inert text.
 *
 * The only markup it produces is `<p>`, `<br>` and `<a>` for `http(s)` URLs. Nothing a reader
 * typed ever becomes an attribute other than an `href` that `new URL()` parsed as `http:` or
 * `https:`, escaped for the attribute. A link's visible text is built from that same parsed URL,
 * never copied from what was typed, so the text and the href always name the same host.
 */
import { FORBIDDEN_CHARACTERS } from '../content/comment-schema.ts';

/**
 * Every character the comment schema refuses (`FORBIDDEN_CHARACTERS`, the one list), except the
 * newline, which separates lines and paragraphs, and the joiners U+200C and U+200D, which real
 * scripts and emoji sequences need between two other characters. Control characters,
 * bidirectional overrides and isolates, zero-width and other invisible characters, private-use
 * and noncharacters all go. With the `u` flag, so code points above U+FFFF match exactly and a
 * lone surrogate matches on its own.
 */
const STRIPPED = new RegExp(`(?!\\n|${FORBIDDEN_CHARACTERS.joinerClass})${FORBIDDEN_CHARACTERS.unicodeClass}`, 'gu');
/** One forbidden character, joiners included: a decoded link path holding one is shown encoded. */
const FORBIDDEN_ONE = new RegExp(FORBIDDEN_CHARACTERS.unicodeClass, 'u');

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
/**
 * A URL reads left to right whatever the comment's direction: `dir="ltr"` isolates the link, so
 * right-to-left text around it or in its path cannot visually reorder the host.
 */
export const COMMENT_LINK_DIR = 'ltr';
/**
 * A link's visible text is cut to this many user-perceived characters (grapheme clusters),
 * ellipsis included — but only after the host: `scheme://host` is always shown whole, however
 * long, so the cut can never hide which site the link goes to.
 */
export const COMMENT_LINK_TEXT_MAX = 80;
/** What stands in for the cut part of a long link's visible text. */
const ELLIPSIS = '…';
/** Splits text into grapheme clusters, so a cut never separates a letter from its accent or an emoji sequence. */
const GRAPHEMES = new Intl.Segmenter('en', { granularity: 'grapheme' });

/**
 * A URL candidate: `http://` or `https://` at a word boundary, then a bounded run of characters
 * that are not whitespace, not quotes, not angle brackets, not a backtick and not the ideographic
 * full stop or comma (`。，、`: Chinese and Japanese put no space after a URL, and these never
 * appear unencoded in a real one, so they end it). One quantifier over one character class, so
 * matching is linear; the bound is above the comment text cap anyway.
 * Only these two schemes are ever candidates: `javascript:`, `data:`, `mailto:`, `//host` and
 * every other form stays text. `new URL()` then decides whether the candidate is a real URL.
 */
const URL_CANDIDATE = /\bhttps?:\/\/[^\s<>"'`\/\\。，、][^\s<>"'`。，、]{0,2047}/gi;
/**
 * Characters that end a sentence rather than a URL: they stay outside the link. ASCII sentence
 * punctuation and closing brackets, and the common CJK and fullwidth closers (a Chinese or
 * Japanese sentence puts `。` or `）` straight after a URL, with no space). All are single UTF-16
 * units, which `splitTrailing` relies on.
 */
const TRAILING_PUNCTUATION: ReadonlySet<string> = new Set('.,;:!?)]}。，、）」』】！？；：');
/**
 * Closers that stay in a URL while the URL has an unmatched opener of its own, so
 * `…/Tamer_(film)` keeps its parenthesis. Keyed by closer, valued by its opener.
 */
const PAIRED_CLOSERS: ReadonlyMap<string, string> = new Map([
  [')', '('],
  ['）', '（'],
]);
const CLOSER_OF_OPENER: ReadonlyMap<string, string> = new Map([...PAIRED_CLOSERS].map(([closer, opener]) => [opener, closer]));
const LINKABLE_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);
/**
 * An IPv4 host as the WHATWG parser serialises it: every numeric form (`3232235777`, `0x7f.1`,
 * `127.1`) comes out as a dotted quad. IPv6 hosts come out in brackets.
 */
const IPV4_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const IPV6_HOST_PREFIX = '[';

/** One or more blank lines (empty, or only spaces and tabs) separate paragraphs. */
const PARAGRAPH_BREAK = /\n(?:[ \t]*\n)+/;
const CARRIAGE_RETURN = /\r\n?/g;
const EDGE_NEWLINES = /^\n+|\n+$/g;
const WHITESPACE = /\s/;

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

/**
 * @returns `value` without the characters the comment schema forbids (`FORBIDDEN_CHARACTERS`),
 * keeping newlines and the two joiners
 */
export function stripInvisible(value: string): string {
  return value.replace(STRIPPED, '');
}

/** @returns `value` with `& < > " '` escaped, safe as HTML text and inside a quoted attribute. */
export function escapeHtml(value: string): string {
  return value.replace(HTML_SPECIAL, (character) => HTML_ESCAPES[character]);
}

/**
 * Splits trailing sentence punctuation off a URL candidate. A paired closer (`)`, `）`) stays in
 * the URL only while the URL has an unmatched opener of its own. Linear: the bracket balances are
 * counted once, then updated as closers come off the end.
 * @returns the URL part and the punctuation that follows it
 */
function splitTrailing(candidate: string): { url: string; rest: string } {
  // Per paired closer: openers minus closers in the whole candidate.
  const balance = new Map<string, number>();
  for (const character of candidate) {
    const closer = PAIRED_CLOSERS.has(character) ? character : CLOSER_OF_OPENER.get(character);
    if (closer !== undefined) balance.set(closer, (balance.get(closer) ?? 0) + (closer === character ? -1 : 1));
  }
  let end = candidate.length;
  while (end > 0) {
    const last = candidate[end - 1];
    if (!TRAILING_PUNCTUATION.has(last)) break;
    if (PAIRED_CLOSERS.has(last)) {
      // The balance of the URL without this closer: one more opener left unmatched.
      const without = (balance.get(last) ?? 0) + 1;
      if (without > 0) break;
      balance.set(last, without);
    }
    end--;
  }
  return { url: candidate.slice(0, end), rest: candidate.slice(end) };
}

/**
 * @returns the parsed URL when `value` is an absolute `http(s)` URL that is safe to show as a
 * link, else `null`. Refused: any other scheme; no host; a user name or password (`user@host`
 * is the classic way to make a URL read as one site and go to another); a host that is an IP
 * address, in any of its forms (a comment has no business linking a reader to a bare address,
 * least of all a private one).
 */
function parseLinkable(value: string): URL | null {
  if (!URL.canParse(value)) return null;
  const url = new URL(value);
  if (!LINKABLE_PROTOCOLS.has(url.protocol) || url.hostname === '') return null;
  if (url.username !== '' || url.password !== '') return null;
  if (url.hostname.startsWith(IPV6_HOST_PREFIX) || IPV4_HOST.test(url.hostname)) return null;
  return url;
}

/**
 * `value` cut to at most `max` grapheme clusters, ending in an ellipsis when cut. Stops
 * segmenting as soon as it knows the answer.
 * @param max at least 1: the ellipsis itself takes one
 */
export function truncateGraphemes(value: string, max: number): string {
  if (!Number.isInteger(max) || max < 1) throw new RangeError(`truncateGraphemes: max must be a whole number of at least 1, got ${max}`);
  const kept: string[] = [];
  let count = 0;
  for (const { segment } of GRAPHEMES.segment(value)) {
    count++;
    if (count > max) return kept.slice(0, max - 1).join('') + ELLIPSIS;
    kept.push(segment);
  }
  return value;
}

/**
 * The path, query and fragment as a reader would type them: percent-escapes decoded with
 * `decodeURI` (which leaves `%2F`, `%3F`, `%23` and the other reserved escapes encoded, so the
 * structure never changes). Left encoded when decoding fails, or when the decoded text would
 * carry whitespace or a character the comment schema forbids (an override, a zero-width space).
 */
function readableTail(encoded: string): string {
  let decoded: string;
  try {
    decoded = decodeURI(encoded);
  } catch (error) {
    if (error instanceof URIError) return encoded;
    throw error;
  }
  return WHITESPACE.test(decoded) || FORBIDDEN_ONE.test(decoded) ? encoded : decoded;
}

/**
 * A link's visible text, built from the parsed URL and never from what was typed: `scheme://host`
 * exactly as the href has it (the host lowercased, and in its ASCII, punycode form when it was
 * typed in another script, so a Cyrillic `а` cannot pass for a Latin `a`), then the path, query
 * and fragment, decoded for reading. Only that tail is cut, at {@link COMMENT_LINK_TEXT_MAX}
 * grapheme clusters in all; the host never is.
 */
export function linkText(url: URL): string {
  const origin = `${url.protocol}//${url.host}`;
  const tail = readableTail(`${url.pathname}${url.search}${url.hash}`);
  if (tail === '') return origin;
  return origin + truncateGraphemes(tail, Math.max(COMMENT_LINK_TEXT_MAX - origin.length, 1));
}

function linkHtml(url: URL): string {
  return (
    `<a href="${escapeHtml(url.href)}" rel="${COMMENT_LINK_REL}" target="${COMMENT_LINK_TARGET}" dir="${COMMENT_LINK_DIR}">` +
    `${escapeHtml(linkText(url))}</a>`
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
    html += linkHtml(parsed);
    html += escapeHtml(rest);
    cursor = start + match[0].length;
  }
  return html + escapeHtml(line.slice(cursor));
}

/**
 * A comment's plain text as HTML: paragraphs on blank lines, `<br>` on single newlines, every
 * `& < > " '` escaped, `http(s)` URLs linked with {@link COMMENT_LINK_REL},
 * {@link COMMENT_LINK_TARGET} and {@link COMMENT_LINK_DIR} and shown by {@link linkText},
 * sentence punctuation after a URL kept outside the link, and the schema's forbidden characters
 * stripped first.
 * @returns HTML for `set:html`; the empty string when the text has nothing visible
 */
export function renderCommentHtml(text: string): string {
  // Carriage returns first: they are forbidden characters, and the strip would glue lines together.
  const clean = stripInvisible(text.replace(CARRIAGE_RETURN, '\n'));
  return clean
    .split(PARAGRAPH_BREAK)
    .map((paragraph) => paragraph.replace(EDGE_NEWLINES, ''))
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
 * The approved comment count of one post, from the threads a page looked up once
 * (`getCommentThreads()`): 0 for a post with no data file.
 */
export function commentCountFor(
  threads: ReadonlyMap<string, { data: { comments: readonly unknown[] } }>,
  id: string,
): number {
  return threads.get(id)?.data.comments.length ?? 0;
}

/** One comment as `Comments.astro` shows it. `name` is plain text, for Astro to escape. */
export interface CommentView {
  id: string;
  /** The fragment id of the comment's `<article>`. */
  anchor: string;
  /** The id of the element holding the name, which labels the `<article>`. */
  nameId: string;
  /** The name with forbidden characters stripped. Text, never HTML. */
  name: string;
  /** The text as HTML from {@link renderCommentHtml}. */
  html: string;
  /** ISO-8601 UTC instant. */
  at: string;
  signedIn: boolean;
}

/**
 * What the post page's comment section shows: `null` for a withdrawn story (no comments and no
 * form), otherwise one view per comment, in the file's order (oldest first).
 */
export function commentViews(
  comments: readonly (CommentLike & { signedIn?: boolean })[],
  withdrawn: boolean,
): CommentView[] | null {
  if (withdrawn) return null;
  return comments.map((comment) => {
    const anchor = commentAnchor(comment.id);
    return {
      id: comment.id,
      anchor,
      nameId: `${anchor}-name`,
      name: stripInvisible(comment.name),
      html: renderCommentHtml(comment.text),
      at: comment.at,
      signedIn: comment.signedIn === true,
    };
  });
}

/**
 * The comment half of a post's `NewsArticle` JSON-LD: `commentCount` is every approved comment;
 * `comment` holds the {@link COMMENT_JSON_LD_MAX} newest, newest first, and is absent when there
 * are none. Each carries its own `url`, the post's canonical URL with the comment's anchor. Text
 * and names are stripped of forbidden characters; escaping for the `<script>` block is
 * `toJsonLd`'s job, and every caller must go through it.
 * @param comments the thread as the data file holds it, oldest first
 * @param pageUrl the post's absolute canonical URL
 */
export function commentsJsonLd(
  comments: readonly CommentLike[],
  pageUrl: string,
): {
  commentCount: number;
  comment?: Array<{
    '@type': 'Comment';
    url: string;
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
      url: new URL(`#${commentAnchor(comment.id)}`, pageUrl).href,
      text: stripInvisible(comment.text),
      dateCreated: comment.at,
      author: { '@type': 'Person', name: stripInvisible(comment.name) },
    })),
  };
}
