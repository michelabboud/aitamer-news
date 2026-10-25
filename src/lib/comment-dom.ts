/**
 * Reader comments in the browser (docs/plans/2026-10-24-comments-on-r2.md §2.6, §2.9; threat
 * sketch item 5): the client half of the one renderer. Comment text is attacker-controlled and,
 * once comments load from the public data host, it reaches the page at run time. So this module
 * never hands a string to anything that parses HTML. It builds every node with `createElement`,
 * `createTextNode`, `textContent` and `setAttribute`, from the same structure the server renders
 * (`commentTextBlocks` in `./comment-text.ts`). A test reads this file and fails on any
 * HTML-parsing sink.
 *
 * What it can put into a comment's text: `<p>`, `<br>` and `<a>`, and on a link only `href`,
 * `rel`, `target` and `dir`. A link's `href` is set only from a URL that `parseLinkable` accepts
 * again here (absolute `http:` or `https:`), as `url.href`.
 *
 * Before anything renders, `validateCommentFile` checks the whole file against the parts of the
 * comment contract (`../content/comment-schema.ts`) the page relies on, using that contract's own
 * constants. Any violation rejects the whole file, so a bad file shows nothing rather than part
 * of itself.
 *
 * Pure apart from the DOM it is given: no global `document`, no fetch, no timers. The loading
 * states, the fetch and the deep link are the page script's job (plan task S3).
 */
import {
  COMMENTS_PER_FILE_MAX,
  COMMENT_CONTRACT_VERSION,
  COMMENT_NAME_MAX,
  COMMENT_SLUG,
  COMMENT_TEXT_MAX,
  ULID,
} from '../content/comment-limits.ts';
import {
  COMMENT_LINK_DIR,
  COMMENT_LINK_REL,
  COMMENT_LINK_TARGET,
  commentAnchor,
  commentTextBlocks,
  isLinkSegment,
  parseLinkable,
  stripInvisible,
  type CommentParagraph,
  type CommentSegment,
} from './comment-text.ts';

/** What `Comments.astro` shows for a signed-in writer, kept identical between the two renderers. */
export const COMMENT_SIGNED_IN_LABEL = 'Signed in';
export const COMMENT_SIGNED_IN_TITLE = 'Signed in when they wrote this';
export const COMMENT_TIME_TITLE = 'Link to this comment';
export const COMMENT_ID_TITLE = "This comment's id: quote it to the desk to ask for a removal";

/** One comment that passed {@link validateCommentFile}: name and text already stripped of forbidden characters. */
export interface ClientComment {
  id: string;
  /** Plain text, set with `textContent`. */
  name: string;
  /** Plain text, rendered by {@link appendCommentText}. */
  text: string;
  /** ISO-8601 instant, as the file carries it. */
  at: string;
  signedIn: boolean;
}

export type CommentFileCheck =
  | { ok: true; comments: ClientComment[] }
  /** `reason` names the field that failed, never its value: the value is attacker-controlled. */
  | { ok: false; reason: string };

/** A link's segment becomes an `<a>` only through here: the href is parsed again, and set as `url.href`. */
function segmentNode(document: Document, segment: CommentSegment): Node {
  if (!isLinkSegment(segment)) return document.createTextNode(segment.text);
  const url = parseLinkable(segment.href);
  // `commentTextBlocks` only builds links from URLs `parseLinkable` accepted, so this branch is a
  // second wall for a hand-built block: anything else is shown as its label, as text.
  if (url === null || url.href !== segment.href) return document.createTextNode(segment.label);
  const link = document.createElement('a');
  link.setAttribute('href', url.href);
  link.setAttribute('rel', COMMENT_LINK_REL);
  link.setAttribute('target', COMMENT_LINK_TARGET);
  link.setAttribute('dir', COMMENT_LINK_DIR);
  link.textContent = segment.label;
  return link;
}

/**
 * Appends already-tokenized paragraphs to `element`: one `<p>` per paragraph, a `<br>` between
 * lines, text nodes for text and `<a>` for links. Exported for the test of the link wall; pages
 * call {@link appendCommentText}.
 */
export function appendCommentBlocks(element: Element, blocks: readonly CommentParagraph[]): void {
  const document = element.ownerDocument;
  for (const paragraph of blocks) {
    const p = document.createElement('p');
    paragraph.forEach((line, index) => {
      if (index > 0) p.appendChild(document.createElement('br'));
      for (const segment of line) p.appendChild(segmentNode(document, segment));
    });
    element.appendChild(p);
  }
}

/**
 * Appends a comment's text to `element` as the server renders it (`renderCommentHtml`), built
 * from DOM nodes: the same paragraphs, line breaks and links, the same `rel`, `target` and `dir`.
 * Appends nothing when the text has nothing visible.
 */
export function appendCommentText(element: Element, text: string): void {
  appendCommentBlocks(element, commentTextBlocks(text));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether `value` has 1 to `max` Unicode code points (the contract counts code points, as JSON Schema does). Stops at `max + 1`.
 * Exported for the comments index check (`./comments-client.ts`), which holds its fields to the same rule.
 */
export function codePointsWithin(value: string, max: number): boolean {
  let count = 0;
  for (const _ of value) if (++count > max) return false;
  return count > 0;
}

/** A field that holds something a reader can see once the forbidden characters are gone, stripped; `null` otherwise. */
export function visibleAfterStrip(value: string): string | null {
  const stripped = stripInvisible(value);
  return stripped.trim() === '' ? null : stripped;
}

/**
 * Checks a comment data file fetched in the browser before anything of it is shown: `version` is
 * the contract's, `slug` is the page's, `comments` is an array of at most
 * {@link COMMENTS_PER_FILE_MAX}, and each comment has a ULID `id` (unique in the file), a `name`
 * and a `text` within their caps and still visible once the forbidden characters are stripped,
 * an `at` that `Date.parse` reads, and a `signedIn` that is absent or `true`. Fields the page does
 * not show (`generatedAt`, a key a later additive contract version adds) are not checked.
 * @param value the parsed JSON, of unknown shape
 * @param slug the page's own slug
 * @returns the comments, in the file's order, with name and text stripped; or the first reason
 * the file was refused
 * @throws TypeError when `slug` is not a slug: that is the caller's bug, not the file's
 */
export function validateCommentFile(value: unknown, slug: string): CommentFileCheck {
  if (!COMMENT_SLUG.test(slug)) throw new TypeError('validateCommentFile: the page slug is not a slug');
  if (!isRecord(value)) return { ok: false, reason: 'the file is not a JSON object' };
  if (value.version !== COMMENT_CONTRACT_VERSION) return { ok: false, reason: `version is not ${COMMENT_CONTRACT_VERSION}` };
  if (value.slug !== slug) return { ok: false, reason: "slug is not this page's slug" };
  const { comments } = value;
  if (!Array.isArray(comments)) return { ok: false, reason: 'comments is not an array' };
  if (comments.length > COMMENTS_PER_FILE_MAX) return { ok: false, reason: `comments has more than ${COMMENTS_PER_FILE_MAX} entries` };

  const seen = new Set<string>();
  const checked: ClientComment[] = [];
  for (const [index, comment] of comments.entries()) {
    const where = `comments[${index}]`;
    if (!isRecord(comment)) return { ok: false, reason: `${where} is not an object` };
    const { id, name, text, at, signedIn } = comment;
    if (typeof id !== 'string' || !ULID.test(id)) return { ok: false, reason: `${where}.id is not a ULID` };
    if (seen.has(id)) return { ok: false, reason: `${where}.id is not unique in the file` };
    seen.add(id);
    if (typeof name !== 'string' || !codePointsWithin(name, COMMENT_NAME_MAX)) {
      return { ok: false, reason: `${where}.name is not a string of 1 to ${COMMENT_NAME_MAX} characters` };
    }
    if (typeof text !== 'string' || !codePointsWithin(text, COMMENT_TEXT_MAX)) {
      return { ok: false, reason: `${where}.text is not a string of 1 to ${COMMENT_TEXT_MAX} characters` };
    }
    if (typeof at !== 'string' || !Number.isFinite(Date.parse(at))) return { ok: false, reason: `${where}.at is not a time` };
    if (signedIn !== undefined && signedIn !== true) return { ok: false, reason: `${where}.signedIn is neither absent nor true` };
    const cleanName = visibleAfterStrip(name);
    if (cleanName === null) return { ok: false, reason: `${where}.name has no visible character` };
    const cleanText = visibleAfterStrip(text);
    if (cleanText === null) return { ok: false, reason: `${where}.text has no visible character` };
    checked.push({ id, name: cleanName, text: cleanText, at, signedIn: signedIn === true });
  }
  return { ok: true, comments: checked };
}

export interface CommentListOptions {
  /**
   * How a comment's time reads, the same function the server page uses (`formatDateTime` in
   * `./site.ts`), passed in because that module imports the Astro runtime.
   */
  formatTime: (date: Date) => string;
}

function elementWith(document: Document, tag: string, attributes: Readonly<Record<string, string>>, text?: string): Element {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

/**
 * The thread as `Comments.astro` renders it, built from DOM nodes: an `<ol class="comment-list">`
 * with one `<li><article>` per comment, labelled by its name, the name and the text with
 * `dir="auto"`, the signed-in mark, the time linking to the comment's anchor, and its id.
 * @param comments comments that passed {@link validateCommentFile}, in the order to show them
 * @returns the list, not yet in the page
 */
export function renderCommentList(
  document: Document,
  comments: readonly ClientComment[],
  options: CommentListOptions,
): Element {
  const list = elementWith(document, 'ol', { class: 'comment-list' });
  for (const comment of comments) {
    const anchor = commentAnchor(comment.id);
    const nameId = `${anchor}-name`;
    const header = elementWith(document, 'header', { class: 'comment__meta' });
    header.appendChild(elementWith(document, 'span', { class: 'comment__name', id: nameId, dir: 'auto' }, comment.name));
    if (comment.signedIn) {
      header.appendChild(elementWith(document, 'span', { class: 'comment__signed', title: COMMENT_SIGNED_IN_TITLE }, COMMENT_SIGNED_IN_LABEL));
    }
    const timeLink = elementWith(document, 'a', { class: 'comment__time', href: `#${anchor}`, title: COMMENT_TIME_TITLE });
    timeLink.appendChild(elementWith(document, 'time', { datetime: comment.at }, options.formatTime(new Date(comment.at))));
    header.appendChild(timeLink);
    header.appendChild(elementWith(document, 'span', { class: 'comment__id', title: COMMENT_ID_TITLE }, comment.id));

    const body = elementWith(document, 'div', { class: 'comment__text', dir: 'auto' });
    appendCommentText(body, comment.text);

    const article = elementWith(document, 'article', { class: 'comment', id: anchor, 'aria-labelledby': nameId });
    article.appendChild(header);
    article.appendChild(body);
    const item = document.createElement('li');
    item.appendChild(article);
    list.appendChild(item);
  }
  return list;
}
