/**
 * Reactions on story pages: the set a reader chooses from, and the pure helpers the page needs to
 * show baked totals and remember a reader's own choice.
 *
 * The set is the one source of truth. The page renders it (`src/components/Reactions.astro`), the
 * data contract checks each `id` against {@link REACTION_ID} (`src/content/reaction-schema.ts`),
 * and the desk's comments Worker keeps its own vendored copy of the ids to decide what it accepts —
 * never imported across repositories, pinned by a test on the desk's side. Order is display order.
 *
 * Swapping the set: adding an id goes here first (so the page can render it), then into the
 * Worker (so it is accepted). Removing one goes the other way: the Worker stops accepting it, then
 * the id may leave here. A retired id can stay in a baked file for good, because the totals are
 * permanent, so everything below counts an unknown id in the total and never gives it a chip.
 *
 * Pure, with no `astro:content` import, so `src/lib/reactions.test.ts` runs it under plain
 * `node:test`.
 */

import { SITE } from './site-meta.ts';

/** One reaction a reader can choose. */
export interface Reaction {
  /** Stored by the desk and written in the data file. Matches {@link REACTION_ID}. Never changes once published. */
  readonly id: string;
  /** What the page shows. */
  readonly emoji: string;
  /** The reaction's name, for the button, the caption and screen readers. */
  readonly label: string;
}

/**
 * The reaction set, in display order. The emoji are written as escapes so the exact code points are
 * visible: Love is U+2764 with U+FE0F (emoji presentation), which a bare heart glyph may lack.
 */
export const REACTIONS = Object.freeze([
  { id: 'love', emoji: '\u2764\uFE0F', label: 'Love' }, // ❤️
  { id: 'wow', emoji: '\u{1F92F}', label: 'Wow' }, // 🤯
  { id: 'funny', emoji: '\u{1F602}', label: 'Funny' }, // 😂
  { id: 'angry', emoji: '\u{1F621}', label: 'Angry' }, // 😡
  { id: 'skeptical', emoji: '\u{1F914}', label: 'Skeptical' }, // 🤔
  { id: 'overhyped', emoji: '\u{1F388}', label: 'Overhyped' }, // 🎈
  { id: 'underrated', emoji: '\u{1F48E}', label: 'Underrated' }, // 💎
] as const satisfies readonly Reaction[]);
for (const reaction of REACTIONS) Object.freeze(reaction);

/** An id of the current set. */
export type ReactionId = (typeof REACTIONS)[number]['id'];

/**
 * The shape of any reaction id, known or retired: a lowercase letter, then up to 23 lowercase
 * letters, digits or hyphens. ASCII only, so it means the same with and without the `u` flag.
 */
export const REACTION_ID = /^[a-z][a-z0-9-]{0,23}$/;

const BY_ID: ReadonlyMap<string, Reaction> = new Map(REACTIONS.map((reaction) => [reaction.id, reaction]));

/** @returns true when `id` is in the current set */
export function isKnownReaction(id: string): id is ReactionId {
  return BY_ID.has(id);
}

/** @returns the reaction with this id, or `undefined` for an id the set does not know */
export function reactionById(id: string): Reaction | undefined {
  return BY_ID.get(id);
}

/** The counts of one story, split into what the page can show and what it only counts. */
export interface ReactionTotals {
  /** Known ids with a count above zero, in set order. */
  readonly known: ReadonlyMap<ReactionId, number>;
  /** Ids the set does not know (retired ones), with their counts. Counted in `total`, never shown as a chip. */
  readonly unknown: ReadonlyMap<string, number>;
  /** Every count in the file, known and unknown. */
  readonly total: number;
}

/**
 * The totals of one story's reactions file, or zero when the story has none.
 * @param file the parsed data file (`src/content/reactions/<slug>.json`), or `undefined` when the
 *   story has no file — the normal state of a story nobody has reacted to
 */
export function reactionTotals(file: { reactions: readonly { id: string; n: number }[] } | undefined): ReactionTotals {
  const counts = new Map<string, number>();
  for (const { id, n } of file?.reactions ?? []) counts.set(id, (counts.get(id) ?? 0) + n);
  const known = new Map<ReactionId, number>();
  for (const { id } of REACTIONS) {
    const n = counts.get(id);
    if (n !== undefined && n > 0) known.set(id, n);
  }
  const unknown = new Map<string, number>();
  let total = 0;
  for (const [id, n] of counts) {
    total += n;
    if (!isKnownReaction(id) && n > 0) unknown.set(id, n);
  }
  return { known, unknown, total };
}

/**
 * The reactions to show in the summary: the `count` known ids with the highest counts, ties broken
 * by set order, zero counts never.
 */
export function topReactions(known: ReadonlyMap<ReactionId, number>, count = 3): ReactionId[] {
  const order = new Map(REACTIONS.map((reaction, index) => [reaction.id, index]));
  return [...known]
    .filter(([, n]) => n > 0)
    .sort(([a, na], [b, nb]) => nb - na || order.get(a)! - order.get(b)!)
    .slice(0, count)
    .map(([id]) => id);
}

const COUNT_FORMAT = new Intl.NumberFormat('en-US');

/** "1 reaction", "12 reactions", "1,204 reactions". */
export function reactionCount(n: number): string {
  return `${COUNT_FORMAT.format(n)} ${n === 1 ? 'reaction' : 'reactions'}`;
}

/**
 * A choice's accessible name in the panel: "Overhyped, 12 reactions".
 * @throws {RangeError} for an id the set does not know: the panel only ever lists the set
 */
export function reactionLabel(id: string, n: number): string {
  const reaction = reactionById(id);
  if (!reaction) throw new RangeError(`reactionLabel: ${JSON.stringify(id)} is not in the reaction set`);
  return `${reaction.label}, ${reactionCount(n)}`;
}

/** "Love", "Love and Wow", "Love, Wow and Funny". */
function listLabels(ids: readonly ReactionId[]): string {
  const labels = ids.map((id) => reactionById(id)!.label);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/**
 * The summary button's accessible name: "12 reactions: Overhyped, Love and Wow" — the total, then
 * the top three. A story whose only counts are retired ids reads "4 reactions"; a story with none
 * reads "No reactions yet" (the page hides the summary then, but the label is never empty).
 */
export function summaryLabel(totals: ReactionTotals): string {
  if (totals.total === 0) return 'No reactions yet';
  const top = topReactions(totals.known);
  return top.length === 0 ? reactionCount(totals.total) : `${reactionCount(totals.total)}: ${listLabels(top)}`;
}

/**
 * How long the browser remembers a reader's own choice: the same 30 days the desk keeps the choice
 * against the reader's hashed address before folding it into the anonymous totals. After that the
 * desk would count the reader again, so the browser forgets at the same time.
 */
export const REACTION_MEMORY_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The `localStorage` key a story's own choice is kept under. Never a cookie. */
export function reactionStorageKey(slug: string): string {
  return `${REACTION_STORAGE_PREFIX}${slug}`;
}

/** The prefix of every {@link reactionStorageKey}, so a page can find and sweep them all. */
export const REACTION_STORAGE_PREFIX = 'atn:react:';

/**
 * What the page stores under {@link reactionStorageKey}.
 *
 * - `{ r: "wow", at }` — the reader's choice, confirmed by the desk.
 * - `{ r: "wow", at, unsent: true }` — chosen, but the desk has not said `ok` yet (the request is
 *   in flight, was refused quietly — a rate limit, the daily cap, offline — or the reader left the
 *   page before it went out). The page shows it and sends it again once on the next load of that
 *   story, until the desk answers `ok` or the record expires.
 * - `{ r: null, at, unsent: true }` — a removal the desk has not confirmed (a tombstone). Once it
 *   is confirmed the key is deleted: no key means no reaction.
 */
export interface StoredReaction {
  /** A reaction id of the current set, or `null` for a removal not yet confirmed. */
  readonly r: ReactionId | null;
  /** When the reader chose it (or removed it), as an ISO-8601 time. */
  readonly at: string;
  /** Present, and `true`, until the desk answers `ok`. */
  readonly unsent?: true;
}

/**
 * The reader's remembered choice, or `null` to forget it. Anything the page did not write is
 * forgotten rather than trusted: storage is the reader's to edit. `null` for no value, text that
 * is not JSON, a value of another shape, an id the set no longer knows, a removal that is not
 * marked unsent, an `unsent` that is not `true`, a time that does not parse, a time later than
 * `now` (a choice cannot come from the future), and a record older than
 * {@link REACTION_MEMORY_DAYS} — the desk has forgotten it by then too.
 * @param stored the raw `localStorage` value, `null` when absent
 * @param now the current time
 */
export function parseStoredReaction(stored: string | null, now: Date): StoredReaction | null {
  if (stored === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    return null;
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const { r, at, unsent } = value as Record<string, unknown>;
  if (unsent !== undefined && unsent !== true) return null;
  if (r === null ? unsent !== true : typeof r !== 'string' || !isKnownReaction(r)) return null;
  if (typeof at !== 'string') return null;
  const chosen = Date.parse(at);
  if (Number.isNaN(chosen)) return null;
  const age = now.getTime() - chosen;
  if (age < 0 || age > REACTION_MEMORY_DAYS * DAY_MS) return null;
  return unsent === true ? { r: r as ReactionId | null, at, unsent: true } : { r: r as ReactionId, at };
}

/** The stored text for a record: what {@link parseStoredReaction} reads back. */
export function encodeStoredReaction(record: StoredReaction): string {
  return JSON.stringify(record.unsent ? { r: record.r, at: record.at, unsent: true } : { r: record.r, at: record.at });
}

/** How the page reads the Worker's answer to one `POST /react`. */
export type ReactionOutcome = 'ok' | 'closed' | 'rejected' | 'failed';

/**
 * Answers that will never change for this request: 400 (a malformed request) and 403 (an origin the
 * Worker does not allow). Sending the same record again would only be refused again, so the page
 * drops it. 410 is permanent too, and also closes reactions on the page.
 *
 * 404 ("that story is not known") is deliberately not here: the Worker reads the list of stories
 * from the site's `threads.json` through a cache, so for several minutes after a story is published
 * it does not know it yet. A choice made then is kept unsent and sent again on the next load.
 */
export const REACTION_REJECTED_STATUSES: ReadonlySet<number> = new Set([400, 403]);

/**
 * `ok` for a 2xx answer; `closed` for 410 (the story's reactions are closed); `rejected` for a
 * permanent refusal ({@link REACTION_REJECTED_STATUSES}); `failed` for anything transient — a rate
 * limit, the daily cap, a server error, no answer at all (pass `null`). Only `failed` keeps the
 * record unsent, to be sent again on the next load of the story; the page is quiet about it.
 */
export function reactionOutcome(status: number | null): ReactionOutcome {
  if (status === null) return 'failed';
  if (status === REACTIONS_CLOSED_STATUS) return 'closed';
  if (REACTION_REJECTED_STATUSES.has(status)) return 'rejected';
  return status >= 200 && status < 300 ? 'ok' : 'failed';
}

/**
 * The hosts whose pages the comments Worker accepts reactions from: the site and its www host, and
 * the two local development hosts (which the Worker accepts only in local development). Anywhere
 * else — the retired GitHub Pages copy, a `pages.dev` address, a mirror — the Worker's 403 carries
 * no CORS header, so the browser hides it: the page would see "no answer", keep the choice unsent
 * and resend it on every visit for 30 days. So the component does not run there at all.
 */
export const REACTION_HOSTS: ReadonlySet<string> = new Set([SITE.domain, `www.${SITE.domain}`, 'localhost', '127.0.0.1']);

/** Whether a page on `hostname` (`location.hostname`) may offer reactions. Exact, case-insensitive. */
export function reactionsHostAllowed(hostname: string): boolean {
  return REACTION_HOSTS.has(hostname.toLowerCase());
}

/**
 * What storage should hold after the Worker answered `sent`, given what it holds now. `undefined`
 * leaves it alone: a newer choice was made while `sent` was in flight, so that one is still owed,
 * or the answer was transient (`failed`) and the record stays unsent. Otherwise, for the record
 * that was sent: on `ok`, the confirmed record, or `null` (delete the key) for a confirmed
 * removal; on a permanent refusal (`rejected`, `closed`), `null` — it will never be accepted, so
 * it is not sent again.
 */
export function settledRecord(current: StoredReaction | null, sent: StoredReaction, outcome: ReactionOutcome = 'ok'): StoredReaction | null | undefined {
  if (outcome === 'failed') return undefined;
  if (current === null || current.r !== sent.r || current.at !== sent.at) return undefined;
  if (outcome !== 'ok') return null;
  return sent.r === null ? null : { r: sent.r, at: sent.at };
}

/**
 * The storage keys to delete when a story page loads: every reactions record (by
 * {@link REACTION_STORAGE_PREFIX}) that {@link parseStoredReaction} would forget — expired,
 * malformed or unknown. So the browser keeps a choice for {@link REACTION_MEMORY_DAYS} and no
 * longer, even for a story the reader never opens again. Other keys are never touched.
 */
export function expiredReactionKeys(entries: Iterable<readonly [key: string, value: string | null]>, now: Date): string[] {
  const expired: string[] = [];
  for (const [key, value] of entries) {
    if (key.startsWith(REACTION_STORAGE_PREFIX) && parseStoredReaction(value, now) === null) expired.push(key);
  }
  return expired;
}

/** How long the page waits for the Worker before it treats a request as failed (and unsent). */
export const REACTION_REQUEST_TIMEOUT_MS = 10_000;

// --- the page's side of the contract with the comments Worker's `POST /react` ------------------

/**
 * Where a choice is sent: the `/react` path on the comments Worker, resolved against
 * `COMMENTS_ENDPOINT` so a local build pointed at `wrangler dev` (`PUBLIC_COMMENTS_ENDPOINT`)
 * reacts against the same local Worker.
 * @throws {TypeError} when `commentsEndpoint` is not an absolute URL
 */
export function reactEndpoint(commentsEndpoint: string): string {
  return new URL('react', commentsEndpoint).href;
}

/**
 * The form fields the Worker reads, sent as `application/x-www-form-urlencoded` (a "simple"
 * request: no preflight). An empty `reaction` removes the reader's reaction.
 */
export const REACTION_REQUEST_FIELDS = Object.freeze({ slug: 'slug', reaction: 'reaction' });

/** The Worker's answer for a story whose comments (and so reactions) are closed. */
export const REACTIONS_CLOSED_STATUS = 410;

/** Shown in place of the React button on a closed story, and after the Worker answers 410. */
export const REACTIONS_CLOSED_MESSAGE = 'Reactions are closed on this story.';

/** Shown inside the panel when script is off: choosing needs the page script. */
export const REACTIONS_NO_SCRIPT_MESSAGE = 'Reacting needs JavaScript.';

/** The caption under the panel while a choice is hovered or focused: "Overhyped · 12". */
export function reactionCaption(id: string, n: number): string {
  const reaction = reactionById(id);
  if (!reaction) throw new RangeError(`reactionCaption: ${JSON.stringify(id)} is not in the reaction set`);
  return `${reaction.label} · ${COUNT_FORMAT.format(n)}`;
}

/**
 * The in-session counts after the reader changes their choice from `previous` to `next` (either
 * may be `null`: no reaction). The new choice gains one, the old one loses one and never goes
 * below zero — the baked file may not include the reader's earlier click yet ("counts lag up to a
 * run"). Choosing the current reaction again is the page's "remove", so callers pass `next: null`
 * for it; `previous === next` changes nothing. Returns a new map; the input is not changed.
 */
export function applyChoice(
  counts: ReadonlyMap<string, number>,
  previous: ReactionId | null,
  next: ReactionId | null,
): Map<string, number> {
  const after = new Map(counts);
  if (previous === next) return after;
  if (previous !== null) after.set(previous, Math.max(0, (after.get(previous) ?? 0) - 1));
  if (next !== null) after.set(next, (after.get(next) ?? 0) + 1);
  return after;
}

/**
 * What a tap on `tapped` means, given the reader's current choice: the same reaction again
 * removes it (`null`), any other replaces it.
 */
export function nextChoice(current: ReactionId | null, tapped: ReactionId): ReactionId | null {
  return current === tapped ? null : tapped;
}
