/**
 * Comments read in the browser: the decisions, without the DOM (docs/plans/2026-10-24-comments-on-r2.md
 * §2.6, §2.9; task S3; site ADR 0047). Used only while `COMMENTS_SOURCE` in `./site.ts` is `'r2'`.
 *
 * - **Where the files are:** {@link commentsFileUrl} and {@link commentsIndexUrl} build the two URLs
 *   on the public data host from `COMMENTS_DATA_BASE`, refusing anything but an absolute https (http for a loopback host)
 *   base and a contract slug, so a page can only ever ask for `v2/comments/<slug>.json` or
 *   `v2/comments-index.json` there.
 * - **What the story page shows:** {@link threadTransition} is the thread's state machine
 *   (loading, the list, empty, failed with a retry). A missing projection (404) or an empty
 *   withdrawal envelope is the empty state. A file is shown only after `validateCommentFileV2`
 *   accepted all of it; any violation is the failed state. V1 responses are refused, with no legacy fallback.
 * - **What the list pages show:** {@link validateCommentsIndex} checks the comments index
 *   (`../content/comments-index-schema-v2.ts`) the same way before a count or a name reaches a page;
 *   {@link countFor} and {@link aroundTheFire} merge it into the page's own stories.
 * - **Deep links:** {@link deepLinkCommentId} reads `#c-<id>`, the anchor the baked thread has
 *   always used (`commentAnchor`), so every link already out there keeps working.
 *
 * Pure: no global `document`, `window`, `fetch` or timer, and no zod (its constants come from
 * `../content/comment-limits.ts`), so `src/lib/comments-client.test.ts` runs it under `node:test`
 * and the story page's bundle stays small. The scripts in `CommentsLive.astro` (the thread) and
 * `CommentIndexLive.astro` (the counts and "Around the fire") do the fetching and the DOM.
 */
import {
  COMMENT_CONTRACT_VERSION,
  COMMENTS_INDEX_SITE_MAX,
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
import { codePointsWithin, validateCommentFile, visibleAfterStrip, type ClientComment, type CommentFileCheck } from './comment-dom.ts';
import { COMMENT_V2_CONTRACT_VERSION, COMMENTS_V2_FILE_PREFIX, COMMENTS_V2_INDEX_KEY, isCommentUtcInstant, parseCommentRevision } from '../content/comment-v2-limits.ts';
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
export const COMMENTS_FILE_PREFIX = COMMENTS_V2_FILE_PREFIX;
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
 * @returns the URL of a story's comments file, `<base>v2/comments/<slug>.json`
 * @throws TypeError when the base is not a data base ({@link dataBaseUrl}) or `slug` is not a slug
 */
export function commentsFileUrl(base: string, slug: string): string {
  const root = dataBaseUrl(base);
  if (!isSlug(slug)) throw new TypeError('commentsFileUrl: not a slug');
  return new URL(`${COMMENTS_FILE_PREFIX}${slug}.json`, root).href;
}

/**
 * @returns the URL of the comments index, `<base>v2/comments-index.json`
 * @throws TypeError when the base is not a data base ({@link dataBaseUrl})
 */
export function commentsIndexUrl(base: string): string {
  return new URL(COMMENTS_V2_INDEX_KEY, dataBaseUrl(base)).href;
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

/** V2 envelopes reuse the frozen v1 comment renderer checks, after accepting v2 metadata only. */
export function validateCommentFileV2(value: unknown, slug: string): CommentFileCheck {
  if (!isSlug(slug)) throw new TypeError('validateCommentFileV2: the page slug is not a slug');
  if (!isRecord(value)) return { ok: false, reason: 'the file is not a JSON object' };
  if (value.version !== COMMENT_V2_CONTRACT_VERSION) return { ok: false, reason: `version is not ${COMMENT_V2_CONTRACT_VERSION}` };
  if (parseCommentRevision(value.revision) === null) return { ok: false, reason: 'revision is not a canonical positive decimal string of at most 40 digits' };
  if (!isCommentUtcInstant(value.generatedAt)) return { ok: false, reason: 'generatedAt is not an ISO-8601 UTC time' };
  // The input version was checked above. Reusing comment-level checks does not accept a v1 response.
  const check = validateCommentFile({ ...value, version: COMMENT_CONTRACT_VERSION }, slug);
  if (!check.ok) return check;
  const generatedAt = Date.parse(value.generatedAt);
  for (const [position, comment] of check.comments.entries()) {
    if (!isCommentUtcInstant(comment.at)) return { ok: false, reason: `comments[${position}].at is not an ISO-8601 UTC time` };
    const at = Date.parse(comment.at);
    if (at > generatedAt) return { ok: false, reason: `comments[${position}].at is later than generatedAt` };
    if (position > 0 && at < Date.parse(check.comments[position - 1].at)) {
      return { ok: false, reason: `comments[${position}] breaks the oldest-first order` };
    }
  }
  return check;
}

function threadReader(slug: string): DataReader<ClientComment[]> {
  return {
    missing: () => [],
    accept: (body) => {
      const check = validateCommentFileV2(body, slug);
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
 * - 404 is empty: no projection yet. Another non-2xx, a network error or the
 *   timeout is `unavailable`. A 2xx whose body is not JSON, or that `validateCommentFileV2` refuses,
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

/** Keys in the order a JavaScript object can show them when sorted by UTF-16 code unit (see the contract's rule 1). */
function sortedKeyOrder(keys: readonly string[]): string[] {
  return Object.keys(Object.fromEntries([...keys].sort().map((key) => [key, 0])));
}

/**
 * Checks the comments index fetched in the browser before any of it reaches a page. Every rule the
 * contract states for a reader (`../content/comments-index-schema-v2.ts`) is
 * enforced here except omission of a story whose title cannot be found, which only the
 * desk can know; a file that breaks one is refused whole.
 * - `version` is 2, `revision` is a canonical positive decimal string of at most 40 digits; `counts` maps at most {@link COMMENTS_INDEX_STORIES_MAX} slugs, keys
 *   sorted ascending, to whole numbers from 1 to {@link COMMENTS_PER_FILE_MAX}.
 * - `recent` holds at most {@link COMMENTS_INDEX_RECENT_MAX} comments, each with a slug, a title, a
 *   ULID, a name and a text within their caps and still visible once stripped, a readable `at`, and
 *   `signedIn` and `truncated` absent or `true`.
 * - Across entries: ids are unique; `recent` is newest first by `at`, equal times by id descending;
 *   every slug is a key of `counts` and `recent` holds no more comments of a story than its count;
 *   every `at` is no later than the informational UTC `generatedAt`; generation need not equal
 *   the newest comment time.
 * The one thing not checked is the order of a `counts` slug made only of digits, which a
 * JavaScript reader cannot see (the schema's description says so). Envelope metadata is checked but never shown.
 */
export function validateCommentsIndex(value: unknown): CommentsIndexCheck {
  if (!isRecord(value)) return { ok: false, reason: 'the index is not a JSON object' };
  if (value.version !== COMMENT_V2_CONTRACT_VERSION) return { ok: false, reason: `version is not ${COMMENT_V2_CONTRACT_VERSION}` };
  if (parseCommentRevision(value.revision) === null) return { ok: false, reason: 'revision is not a canonical positive decimal string of at most 40 digits' };
  if (!isCommentUtcInstant(value.generatedAt)) return { ok: false, reason: 'generatedAt is not an ISO-8601 UTC time' };
  if (!isSlug(value.site) || value.site.length > COMMENTS_INDEX_SITE_MAX) return { ok: false, reason: 'site is not a site slug' };
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
  const expectedOrder = sortedKeyOrder(keys);
  if (keys.some((key, position) => key !== expectedOrder[position])) return { ok: false, reason: 'counts is not sorted by slug' };
  if (!Array.isArray(recent)) return { ok: false, reason: 'recent is not an array' };
  if (recent.length > COMMENTS_INDEX_RECENT_MAX) return { ok: false, reason: `recent has more than ${COMMENTS_INDEX_RECENT_MAX} entries` };
  const checked: ClientRecentComment[] = [];
  const seenIds = new Set<string>();
  const shownPerSlug = new Map<string, number>();
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
    if (!isCommentUtcInstant(at)) return { ok: false, reason: `${where}.at is not an ISO-8601 UTC time` };
    if (Date.parse(at) > Date.parse(value.generatedAt)) return { ok: false, reason: `${where}.at is later than generatedAt` };
    if (signedIn !== undefined && signedIn !== true) return { ok: false, reason: `${where}.signedIn is neither absent nor true` };
    if (truncated !== undefined && truncated !== true) return { ok: false, reason: `${where}.truncated is neither absent nor true` };
    const cleanTitle = visibleAfterStrip(title);
    const cleanName = visibleAfterStrip(name);
    const cleanText = visibleAfterStrip(text);
    if (cleanTitle === null) return { ok: false, reason: `${where}.title has no visible character` };
    if (cleanName === null) return { ok: false, reason: `${where}.name has no visible character` };
    if (cleanText === null) return { ok: false, reason: `${where}.text has no visible character` };

    if (seenIds.has(id)) return { ok: false, reason: `${where}.id appears twice in recent` };
    seenIds.add(id);
    const total = countMap.get(slug);
    if (total === undefined) return { ok: false, reason: `${where}.slug is not a key of counts` };
    const shown = (shownPerSlug.get(slug) ?? 0) + 1;
    shownPerSlug.set(slug, shown);
    if (shown > total) return { ok: false, reason: `${where}.slug has more comments in recent than its count` };
    const before = checked[checked.length - 1];
    if (before !== undefined) {
      const later = Date.parse(at) - Date.parse(before.at);
      if (later > 0 || (later === 0 && id > before.id)) return { ok: false, reason: `${where} breaks the newest-first order` };
    }
    checked.push({ slug, title: cleanTitle, id, name: cleanName, text: cleanText, at });
  }
  return { ok: true, counts: countMap, recent: checked };
}

/** How the comments index is read from the data host (`./data-host.ts`): a 404 is no comments yet, a file that breaks the contract is refused whole. */
export const commentsIndexReader: DataReader<{ counts: ReadonlyMap<string, number>; recent: ClientRecentComment[] }> = {
  missing: () => ({ counts: new Map(), recent: [] }),
  accept: (body) => {
    const check = validateCommentsIndex(body);
    return check.ok ? { ok: true, value: { counts: check.counts, recent: check.recent } } : check;
  },
};

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
