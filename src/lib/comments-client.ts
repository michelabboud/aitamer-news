/**
 * Comments read in the browser: the decisions, without the DOM (docs/plans/2026-10-24-comments-on-r2.md
 * §2.6, §2.9; task S3; site ADR 0047). Used only while `COMMENTS_SOURCE` in `./site.ts` is `'r2'`.
 *
 * - **Where the files are:** {@link commentsFileUrl} and {@link commentsIndexUrl} build the two URLs
 *   on the public data host from `COMMENTS_DATA_BASE`, refusing anything but an absolute http(s)
 *   base and a contract slug, so a page can only ever ask for `v1/comments/<slug>.json` or
 *   `v1/comments-index.json` there.
 * - **What the story page shows:** {@link threadTransition} is the thread's state machine
 *   (loading, the list, empty, failed with a retry). A 404 is the empty state, because a story with
 *   no approved comment has no object. A file is shown only after `validateCommentFile`
 *   (`./comment-dom.ts`) accepted all of it; any violation is the failed state, so a bad file shows
 *   nothing rather than part of itself.
 * - **What the list pages show:** {@link validateCommentsIndex} checks the comments index
 *   (`../content/comments-index-schema.ts`) the same way before a count or a name reaches a page;
 *   {@link countFor} and {@link aroundTheFire} merge it into the page's own stories.
 * - **Deep links:** {@link deepLinkCommentId} reads `#c-<id>`, the anchor the baked thread has
 *   always used (`commentAnchor`), so every link already out there keeps working.
 *
 * Pure: no global `document`, `window`, `fetch` or timer, and no zod (its constants come from
 * `../content/comment-limits.ts`), so `src/lib/comments-client.test.ts` runs it under `node:test`
 * and the story page's bundle stays small. The scripts in `Comments.astro`, `CommentCount.astro`
 * and `campfire.astro` do the fetching and the DOM.
 */
import {
  COMMENTS_INDEX_CONTRACT_VERSION,
  COMMENTS_INDEX_KEY,
  COMMENTS_INDEX_RECENT_MAX,
  COMMENTS_INDEX_STORIES_MAX,
  COMMENTS_INDEX_TEXT_MAX,
  COMMENTS_INDEX_TITLE_MAX,
  COMMENTS_PER_FILE_MAX,
  COMMENT_NAME_MAX,
  COMMENT_SLUG,
  COMMENT_SLUG_MAX,
  ULID,
} from '../content/comment-limits.ts';
import { codePointsWithin, validateCommentFile, visibleAfterStrip, type ClientComment } from './comment-dom.ts';
import { commentAnchor, commentCountLabel, stripInvisible, truncateGraphemes } from './comment-text.ts';
import {
  DATA_FETCH_TIMEOUT_MS,
  dataBaseUrl,
  loadTransition,
  type DataEvent,
  type DataReader,
  type LoadFailure,
  type LoadState,
} from './data-host.ts';

/** Checked here for the comments files; the rule is shared with every data file (`./data-host.ts`). */
export { dataBaseUrl };

/** Where a story's comments file sits under the data host's base, before `<slug>.json`. */
export const COMMENTS_FILE_PREFIX = 'v1/comments/';
/** How long the page waits for a data file before it shows the failed state: the data host's ({@link DATA_FETCH_TIMEOUT_MS}). */
export const COMMENTS_FETCH_TIMEOUT_MS = DATA_FETCH_TIMEOUT_MS;

/** What a story's thread says while its file loads: a plain paragraph, not a live region (plan §2.9). */
export const COMMENTS_LOADING_TEXT = 'Loading comments…';
/** A story with no approved comment, the same words the baked thread uses. */
export const COMMENTS_EMPTY_TEXT = 'Nobody has pulled up a log by this one yet. Be the first to say what you make of it.';
/** The failed state: the file could not be fetched, or was refused. */
export const COMMENTS_FAILED_TEXT = 'Comments could not be loaded right now.';
/** The retry button's text, which is also its accessible name. */
export const COMMENTS_RETRY_LABEL = 'Try loading the comments again';
/** Shown in place of the thread when the browser runs no script. */
export const COMMENTS_NOSCRIPT_TEXT = 'The comments on this story load with JavaScript.';
/** What a comment count link says before (or without) the data that counts it. */
export const COMMENT_COUNT_PENDING_LABEL = 'Comments';

/** How many of the newest comments site-wide "Around the fire" shows. */
export const AROUND_THE_FIRE_MAX = 30;
/** How many characters of a comment's text "Around the fire" shows, before an ellipsis. */
export const AROUND_THE_FIRE_EXCERPT_MAX = 160;
/** "Around the fire" with no comment on any story the page lists. */
export const AROUND_THE_FIRE_EMPTY_TEXT = 'Nobody has pulled up a log yet. Be the first, on any story.';
/** "Around the fire" while the index loads. */
export const AROUND_THE_FIRE_LOADING_TEXT = 'Loading the newest comments…';
/** "Around the fire" when the index could not be fetched, or was refused. */
export const AROUND_THE_FIRE_FAILED_TEXT = 'The newest comments could not be loaded right now.';
/** "Around the fire" when the browser runs no script. */
export const AROUND_THE_FIRE_NOSCRIPT_TEXT = 'The newest comments load with JavaScript. Every story above still links to its thread.';

const WHITESPACE_RUN = /\s+/g;

/** A comment's text as one line, cut to a feed-row length. Plain text: the page sets it as text. */
export function fireExcerpt(text: string): string {
  const collapsed = stripInvisible(text).replace(WHITESPACE_RUN, ' ').trim();
  return truncateGraphemes(collapsed, AROUND_THE_FIRE_EXCERPT_MAX);
}

// ---- URLs ----------------------------------------------------------------------------------

function isSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= COMMENT_SLUG_MAX && COMMENT_SLUG.test(value);
}

/**
 * @returns the URL of a story's comments file, `<base>v1/comments/<slug>.json`
 * @throws TypeError when the base is not a data base ({@link dataBaseUrl}) or `slug` is not a slug
 */
export function commentsFileUrl(base: string, slug: string): string {
  const root = dataBaseUrl(base);
  if (!isSlug(slug)) throw new TypeError('commentsFileUrl: not a slug');
  return new URL(`${COMMENTS_FILE_PREFIX}${slug}.json`, root).href;
}

/**
 * @returns the URL of the comments index, `<base>v1/comments-index.json`
 * @throws TypeError when the base is not a data base ({@link dataBaseUrl})
 */
export function commentsIndexUrl(base: string): string {
  return new URL(COMMENTS_INDEX_KEY, dataBaseUrl(base)).href;
}

// ---- The story page's thread ---------------------------------------------------------------

/** Why the thread shows the failed state: the host did not answer well, or the file was refused. */
export type ThreadFailure = LoadFailure;

/**
 * The thread's state. `attempt` counts loads (the first is 1, each retry adds one), so the answer
 * to an earlier attempt can never overwrite a later one.
 */
export type ThreadState =
  | { phase: 'loading'; attempt: number }
  | { phase: 'list'; attempt: number; comments: ClientComment[] }
  | { phase: 'empty'; attempt: number }
  /** `reason` is for the console, and never carries a value from the file. */
  | { phase: 'failed'; attempt: number; failure: ThreadFailure; reason: string };

/** The thread's events: the data host's (`./data-host.ts`). */
export type ThreadEvent = DataEvent;

/** The state a story page starts in: loading, first attempt. */
export function initialThreadState(): ThreadState {
  return { phase: 'loading', attempt: 1 };
}

function threadReader(slug: string): DataReader<ClientComment[]> {
  return {
    missing: () => [],
    accept: (body) => {
      const check = validateCommentFile(body, slug);
      return check.ok ? { ok: true, value: check.comments } : check;
    },
  };
}

function asLoad(state: ThreadState): LoadState<ClientComment[]> {
  if (state.phase === 'list') return { phase: 'ready', attempt: state.attempt, value: state.comments };
  if (state.phase === 'empty') return { phase: 'ready', attempt: state.attempt, value: [] };
  return state;
}

/**
 * The thread's state machine: the data host's {@link loadTransition}, read for a comments file.
 * - `retry` leaves only the failed state, to loading with the next attempt; anywhere else it is ignored.
 * - An answer counts only while loading, and only for the attempt in flight; any other is stale and ignored.
 * - 404 is empty: no approved comment, so no object. Another non-2xx, a network error or the
 *   timeout is `unavailable`. A 2xx whose body is not JSON, or that `validateCommentFile` refuses,
 *   is `invalid`. A valid file with no comments is empty too.
 * Returns `state` itself when the event changes nothing.
 * @param slug the page's own slug; the file must name it
 */
export function threadTransition(state: ThreadState, event: ThreadEvent, slug: string): ThreadState {
  const load = asLoad(state);
  const next = loadTransition(load, event, threadReader(slug));
  if (next === load) return state;
  if (next.phase !== 'ready') return next;
  return next.value.length === 0 ? { phase: 'empty', attempt: next.attempt } : { phase: 'list', attempt: next.attempt, comments: next.value };
}

/** What the thread's count says in each state: "Comments" until the file has answered. */
export function threadCountLabel(state: ThreadState): string {
  if (state.phase === 'list') return commentCountLabel(state.comments.length);
  if (state.phase === 'empty') return commentCountLabel(0);
  return COMMENT_COUNT_PENDING_LABEL;
}

/** What the polite status line says after a load the reader asked for (a retry); nothing for the first load. */
export function retryAnnouncement(state: ThreadState): string {
  if (state.attempt <= 1) return '';
  if (state.phase === 'list' || state.phase === 'empty') return `Comments loaded: ${threadCountLabel(state).toLowerCase()}.`;
  if (state.phase === 'failed') return COMMENTS_FAILED_TEXT;
  return '';
}

// ---- Deep links ----------------------------------------------------------------------------

const ANCHOR_PREFIX = commentAnchor('');
const PERCENT_ENCODED = /%[0-9A-Fa-f]{2}/;

/**
 * The comment id a location's fragment names, `#c-<ULID>` (`commentAnchor`, the baked thread's
 * anchor since it shipped), or `null` for any other fragment. A percent-encoded fragment is decoded
 * first, as the browser does when it looks for the element.
 */
export function deepLinkCommentId(hash: string): string | null {
  let fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  if (PERCENT_ENCODED.test(fragment)) {
    try {
      fragment = decodeURIComponent(fragment);
    } catch {
      return null;
    }
  }
  if (!fragment.startsWith(ANCHOR_PREFIX)) return null;
  const id = fragment.slice(ANCHOR_PREFIX.length);
  return ULID.test(id) ? id : null;
}

/** The id to scroll to and focus after the list renders: the fragment's comment, if the list holds it. */
export function resolveDeepLink(hash: string, comments: readonly { id: string }[]): string | null {
  const id = deepLinkCommentId(hash);
  return id !== null && comments.some((comment) => comment.id === id) ? id : null;
}

/** How to scroll to a deep-linked comment: at once for a reader who asked for reduced motion. */
export function deepLinkScrollBehavior(prefersReducedMotion: boolean): 'auto' | 'smooth' {
  return prefersReducedMotion ? 'auto' : 'smooth';
}

// ---- The comments index ----------------------------------------------------------------------

/** One of the index's newest comments that passed {@link validateCommentsIndex}: texts stripped of forbidden characters. */
export interface ClientRecentComment {
  slug: string;
  title: string;
  id: string;
  name: string;
  text: string;
  at: string;
}

export type CommentsIndexCheck =
  | { ok: true; counts: ReadonlyMap<string, number>; recent: ClientRecentComment[] }
  /** `reason` names the field that failed, never its value. */
  | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks the comments index fetched in the browser before any of it reaches a page: `version` is
 * the contract's, `counts` maps at most {@link COMMENTS_INDEX_STORIES_MAX} slugs to whole numbers
 * from 1 to {@link COMMENTS_PER_FILE_MAX}, and `recent` holds at most
 * {@link COMMENTS_INDEX_RECENT_MAX} comments, each with a slug, a title, a ULID, a name and a text
 * within their caps and still visible once stripped, a readable `at`, and `signedIn` and
 * `truncated` absent or `true`. The fields the pages do not show (`site`, `generatedAt`) and the
 * contract's ordering rules are not checked: they cannot put anything wrong on a page.
 */
export function validateCommentsIndex(value: unknown): CommentsIndexCheck {
  if (!isRecord(value)) return { ok: false, reason: 'the index is not a JSON object' };
  if (value.version !== COMMENTS_INDEX_CONTRACT_VERSION) return { ok: false, reason: `version is not ${COMMENTS_INDEX_CONTRACT_VERSION}` };
  const { counts, recent } = value;
  if (!isRecord(counts)) return { ok: false, reason: 'counts is not an object' };
  const keys = Object.keys(counts);
  if (keys.length > COMMENTS_INDEX_STORIES_MAX) return { ok: false, reason: `counts has more than ${COMMENTS_INDEX_STORIES_MAX} stories` };
  const countMap = new Map<string, number>();
  for (const key of keys) {
    if (!isSlug(key)) return { ok: false, reason: 'a counts key is not a slug' };
    const n = counts[key];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > COMMENTS_PER_FILE_MAX) {
      return { ok: false, reason: `a count is not a whole number from 1 to ${COMMENTS_PER_FILE_MAX}` };
    }
    countMap.set(key, n);
  }
  if (!Array.isArray(recent)) return { ok: false, reason: 'recent is not an array' };
  if (recent.length > COMMENTS_INDEX_RECENT_MAX) return { ok: false, reason: `recent has more than ${COMMENTS_INDEX_RECENT_MAX} entries` };
  const checked: ClientRecentComment[] = [];
  for (const [index, entry] of recent.entries()) {
    const where = `recent[${index}]`;
    if (!isRecord(entry)) return { ok: false, reason: `${where} is not an object` };
    const { slug, title, id, name, text, at, signedIn, truncated } = entry;
    if (!isSlug(slug)) return { ok: false, reason: `${where}.slug is not a slug` };
    if (typeof id !== 'string' || !ULID.test(id)) return { ok: false, reason: `${where}.id is not a ULID` };
    if (typeof title !== 'string' || !codePointsWithin(title, COMMENTS_INDEX_TITLE_MAX)) {
      return { ok: false, reason: `${where}.title is not a string of 1 to ${COMMENTS_INDEX_TITLE_MAX} characters` };
    }
    if (typeof name !== 'string' || !codePointsWithin(name, COMMENT_NAME_MAX)) {
      return { ok: false, reason: `${where}.name is not a string of 1 to ${COMMENT_NAME_MAX} characters` };
    }
    if (typeof text !== 'string' || !codePointsWithin(text, COMMENTS_INDEX_TEXT_MAX)) {
      return { ok: false, reason: `${where}.text is not a string of 1 to ${COMMENTS_INDEX_TEXT_MAX} characters` };
    }
    if (typeof at !== 'string' || !Number.isFinite(Date.parse(at))) return { ok: false, reason: `${where}.at is not a time` };
    if (signedIn !== undefined && signedIn !== true) return { ok: false, reason: `${where}.signedIn is neither absent nor true` };
    if (truncated !== undefined && truncated !== true) return { ok: false, reason: `${where}.truncated is neither absent nor true` };
    const cleanTitle = visibleAfterStrip(title);
    const cleanName = visibleAfterStrip(name);
    const cleanText = visibleAfterStrip(text);
    if (cleanTitle === null) return { ok: false, reason: `${where}.title has no visible character` };
    if (cleanName === null) return { ok: false, reason: `${where}.name has no visible character` };
    if (cleanText === null) return { ok: false, reason: `${where}.text has no visible character` };
    checked.push({ slug, title: cleanTitle, id, name: cleanName, text: cleanText, at });
  }
  return { ok: true, counts: countMap, recent: checked };
}

/** A story's approved comment count from the index: 0 for a story the index does not list. */
export function countFor(counts: ReadonlyMap<string, number>, slug: string): number {
  return counts.get(slug) ?? 0;
}

/** One row of "Around the fire", ready for the page to set as text. */
export interface FireRow {
  /** The comment on its story page: the story's link on this page, plus `#c-<id>`. */
  href: string;
  name: string;
  title: string;
  excerpt: string;
  at: string;
}

/**
 * "Around the fire" from the index: its newest comments (already newest first), only on stories
 * this page lists (a story withdrawn, or not yet built into this deploy, is left out), at most
 * `max`, each linking to its comment on the story page.
 * @param stories the page's stories: slug to the story page's URL, without a fragment
 */
export function aroundTheFire(
  recent: readonly ClientRecentComment[],
  stories: ReadonlyMap<string, string>,
  max: number = AROUND_THE_FIRE_MAX,
): FireRow[] {
  const rows: FireRow[] = [];
  for (const comment of recent) {
    if (rows.length >= max) break;
    const href = stories.get(comment.slug);
    if (href === undefined) continue;
    rows.push({ href: `${href}#${commentAnchor(comment.id)}`, name: comment.name, title: comment.title, excerpt: fireExcerpt(comment.text), at: comment.at });
  }
  return rows;
}

/** A story page's URL from a count link's `href` (which ends in `#comments`): the same URL without its fragment. */
export function storyHref(countHref: string): string {
  const hash = countHref.indexOf('#');
  return hash === -1 ? countHref : countHref.slice(0, hash);
}
