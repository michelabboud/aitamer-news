import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AROUND_THE_FIRE_EXCERPT_MAX,
  AROUND_THE_FIRE_MAX,
  COMMENTS_FAILED_TEXT,
  COMMENT_COUNT_PENDING_LABEL,
  aroundTheFire,
  commentsFileUrl,
  commentsIndexUrl,
  countFor,
  dataBaseUrl,
  deepLinkCommentId,
  deepLinkScrollBehavior,
  fireExcerpt,
  initialThreadState,
  resolveDeepLink,
  retryAnnouncement,
  storyHref,
  threadCountLabel,
  threadTransition,
  validateCommentsIndex,
  commentsIndexReader,
  type ClientRecentComment,
  type ThreadState,
} from './comments-client.ts';
import { COMMENTS_INDEX_KEY, commentsIndexSchema, COMMENTS_INDEX_RECENT_MAX, COMMENTS_INDEX_TEXT_MAX } from '../content/comments-index-schema.ts';
import { COMMENTS_PER_FILE_MAX } from '../content/comment-schema.ts';

/**
 * Plan docs/plans/2026-10-24-comments-on-r2.md, task S3: the pure half of the comments loader.
 * The fetching and the DOM are checked by hand in a browser (the close-out's checklist); what
 * decides what a reader sees is checked here.
 */

const BASE = 'https://data.aitamer.news/';
const SLUG = 'the-gap-between-the-needles';
const ID_A = '01K5ZQ8M3A0000000000000000';
const ID_B = '01K5ZQ8M3B0000000000000000';

const file = (comments: unknown[], slug = SLUG) => ({ version: 1, slug, generatedAt: '2026-10-24T10:00:00Z', comments });
const comment = (id: string, extra: Record<string, unknown> = {}) => ({ id, name: 'Ada', text: 'Hello there', at: '2026-10-24T09:00:00Z', ...extra });

// ---- URLs ----

test('URLs: the comments file and the index sit under the data base', () => {
  assert.equal(commentsFileUrl(BASE, SLUG), `https://data.aitamer.news/v1/comments/${SLUG}.json`);
  assert.equal(commentsIndexUrl(BASE), 'https://data.aitamer.news/v1/comments-index.json');
  // A base with a path keeps it, and a local fixture server works the same way.
  assert.equal(commentsFileUrl('http://127.0.0.1:4399/bucket/', 'a'), 'http://127.0.0.1:4399/bucket/v1/comments/a.json');
  // The index key is the contract's, not a second spelling of it.
  assert.equal(new URL(commentsIndexUrl(BASE)).pathname, `/${COMMENTS_INDEX_KEY}`);
});

test('URLs: a base that is not an absolute https URL (http only on this machine) ending in / is refused', () => {
  for (const base of ['data.aitamer.news/', '/v1/', 'ftp://data.aitamer.news/', 'javascript:alert(1)//', 'http://data.aitamer.news/', 'https://data.aitamer.news',
    'https://data.aitamer.news/bucket', 'https://user:pw@data.aitamer.news/', 'https://data.aitamer.news/?x=1', 'https://data.aitamer.news/#x', '']) {
    assert.throws(() => dataBaseUrl(base), TypeError, base);
    assert.throws(() => commentsIndexUrl(base), TypeError, base);
  }
});

test('URLs: the error never echoes the base, which could hold a credential', () => {
  try {
    dataBaseUrl('https://user:sentinel-secret@data.aitamer.news/');
    assert.fail('accepted');
  } catch (error) {
    assert.doesNotMatch(String(error), /sentinel-secret/);
  }
});

test('URLs: only a contract slug makes a file URL, so no path or query can be smuggled in', () => {
  for (const slug of ['', '../secrets', 'a/b', 'A', '-a', 'a?x=1', 'a#b', 'a.json', 'a%2Fb', 'x'.repeat(121)]) {
    assert.throws(() => commentsFileUrl(BASE, slug), TypeError, slug);
  }
  assert.doesNotThrow(() => commentsFileUrl(BASE, 'x'.repeat(120)));
});

// ---- the thread's state machine ----

const respond = (state: ThreadState, status: number, body?: unknown) =>
  threadTransition(state, { type: 'response', attempt: state.attempt, status, body }, SLUG);

test('thread: starts loading, first attempt, and the count says "Comments"', () => {
  const state = initialThreadState();
  assert.deepEqual(state, { phase: 'loading', attempt: 1 });
  assert.equal(threadCountLabel(state), COMMENT_COUNT_PENDING_LABEL);
  assert.equal(retryAnnouncement(state), '');
});

test('thread: a valid file shows the list, with the count from it', () => {
  const state = respond(initialThreadState(), 200, file([comment(ID_A), comment(ID_B, { signedIn: true })]));
  assert.equal(state.phase, 'list');
  assert.deepEqual(state.phase === 'list' && state.comments.map((c) => [c.id, c.signedIn]), [[ID_A, false], [ID_B, true]]);
  assert.equal(threadCountLabel(state), '2 comments');
  // The first load is not announced: the thread is not an update the reader asked for.
  assert.equal(retryAnnouncement(state), '');
});

test('thread: 404 is the empty state (no approved comment, no object), and so is a file with none', () => {
  const missing = respond(initialThreadState(), 404);
  assert.deepEqual(missing, { phase: 'empty', attempt: 1 });
  assert.equal(threadCountLabel(missing), 'No comments');
  assert.equal(respond(initialThreadState(), 200, file([])).phase, 'empty');
});

test('thread: another HTTP status or no answer is "unavailable", and offers the retry', () => {
  for (const status of [500, 502, 503, 403, 410, 304, 0]) {
    const state = respond(initialThreadState(), status);
    assert.equal(state.phase, 'failed', String(status));
    assert.equal(state.phase === 'failed' && state.failure, 'unavailable', String(status));
    assert.equal(threadCountLabel(state), COMMENT_COUNT_PENDING_LABEL);
  }
  const offline = threadTransition(initialThreadState(), { type: 'network-error', attempt: 1 }, SLUG);
  assert.equal(offline.phase === 'failed' && offline.failure, 'unavailable');
});

test('thread: a body that is not JSON, or a file the check refuses, is "invalid" and shows nothing of it', () => {
  const unreadable = threadTransition(initialThreadState(), { type: 'unreadable', attempt: 1 }, SLUG);
  assert.equal(unreadable.phase === 'failed' && unreadable.failure, 'invalid');
  const bad = [
    file([comment(ID_A)], 'another-story'), // a file for another page
    { ...file([comment(ID_A)]), version: 2 },
    file([comment(ID_A), comment('not-a-ulid')]), // one bad comment rejects the whole file
    file([comment(ID_A, { text: '‮​' })]), // nothing visible once stripped
    file([comment(ID_A), comment(ID_A)]),
    file(Array.from({ length: COMMENTS_PER_FILE_MAX + 1 }, () => comment(ID_A))),
    null,
    [],
    'text',
  ];
  for (const body of bad) {
    const state = respond(initialThreadState(), 200, body);
    assert.equal(state.phase, 'failed', JSON.stringify(body)?.slice(0, 80));
    assert.equal(state.phase === 'failed' && state.failure, 'invalid');
  }
});

test('thread: the failure reason names the field, never the attacker-controlled value', () => {
  const state = respond(initialThreadState(), 200, file([comment('<img src=x onerror=alert(1)>')]));
  assert.equal(state.phase, 'failed');
  assert.doesNotMatch(state.phase === 'failed' ? state.reason : '', /onerror|<img/);
});

test('thread: retry leaves the failed state to the next attempt; a second failure keeps counting', () => {
  const failed = respond(initialThreadState(), 503);
  const retrying = threadTransition(failed, { type: 'retry' }, SLUG);
  assert.deepEqual(retrying, { phase: 'loading', attempt: 2 });
  const again = respond(retrying, 500);
  assert.equal(again.phase, 'failed');
  assert.equal(retryAnnouncement(again), COMMENTS_FAILED_TEXT);
  const third = threadTransition(again, { type: 'retry' }, SLUG);
  assert.equal(third.attempt, 3);
  const loaded = respond(third, 200, file([comment(ID_A)]));
  assert.equal(loaded.phase, 'list');
  // After a retry the reader pressed, the result is said politely.
  assert.equal(retryAnnouncement(loaded), 'Comments loaded: 1 comment.');
  assert.equal(retryAnnouncement(respond(threadTransition(respond(initialThreadState(), 500), { type: 'retry' }, SLUG), 404)), 'Comments loaded: no comments.');
});

test('thread: retry is ignored anywhere but the failed state (no double fetch)', () => {
  const loading = initialThreadState();
  assert.equal(threadTransition(loading, { type: 'retry' }, SLUG), loading);
  const list = respond(loading, 200, file([comment(ID_A)]));
  assert.equal(threadTransition(list, { type: 'retry' }, SLUG), list);
  const empty = respond(initialThreadState(), 404);
  assert.equal(threadTransition(empty, { type: 'retry' }, SLUG), empty);
});

test('thread: a stale answer, or one after the thread settled, changes nothing', () => {
  const retrying = threadTransition(respond(initialThreadState(), 500), { type: 'retry' }, SLUG);
  // The first attempt's late answer arrives while the second is in flight.
  assert.equal(threadTransition(retrying, { type: 'response', attempt: 1, status: 200, body: file([comment(ID_A)]) }, SLUG), retrying);
  const list = respond(initialThreadState(), 200, file([comment(ID_A)]));
  assert.equal(threadTransition(list, { type: 'network-error', attempt: 1 }, SLUG), list);
});

// ---- deep links ----

test('deep link: #c-<ULID> is the anchor, as the baked thread has always had it', () => {
  assert.equal(deepLinkCommentId(`#c-${ID_A}`), ID_A);
  assert.equal(deepLinkCommentId(`c-${ID_A}`), ID_A);
  assert.equal(deepLinkCommentId(`#%63-${ID_A}`), ID_A); // percent-encoded, decoded as the browser does
  for (const hash of ['', '#', '#comments', `#comment-${ID_A}`, '#c-', '#c-not-a-ulid', `#c-${ID_A.toLowerCase()}`, `#c-${ID_A}x`, '#c-%E0%A4%A', `#C-${ID_A}`]) {
    assert.equal(deepLinkCommentId(hash), null, hash);
  }
});

test('deep link: only a comment the list rendered is a target', () => {
  const comments = [{ id: ID_A }, { id: ID_B }];
  assert.equal(resolveDeepLink(`#c-${ID_B}`, comments), ID_B);
  assert.equal(resolveDeepLink('#c-01K5ZQ8M3C0000000000000000', comments), null);
  assert.equal(resolveDeepLink('#comments', comments), null);
  assert.equal(resolveDeepLink(`#c-${ID_A}`, []), null);
});

test('deep link: reduced motion jumps, otherwise it scrolls smoothly', () => {
  assert.equal(deepLinkScrollBehavior(true), 'auto');
  assert.equal(deepLinkScrollBehavior(false), 'smooth');
});

// ---- the comments index ----

const recent = (slug: string, id: string, extra: Record<string, unknown> = {}) => ({
  slug, title: `Story ${slug}`, id, name: 'Ada', text: 'A comment', at: '2026-10-24T09:00:00Z', ...extra,
});
const index = (extra: Record<string, unknown> = {}) => ({
  version: 1, site: 'aitamer', generatedAt: '2026-10-24T09:00:00Z',
  counts: { 'story-a': 2, 'story-b': 1 },
  recent: [recent('story-a', ID_B), recent('story-b', ID_A, { signedIn: true, truncated: true })],
  ...extra,
});

test('index: a valid index gives every count and the recent comments, stripped', () => {
  const check = validateCommentsIndex(index({ recent: [recent('story-a', ID_B, { name: 'A​da' })] }));
  assert.equal(check.ok, true);
  if (!check.ok) return;
  assert.equal(countFor(check.counts, 'story-a'), 2);
  assert.equal(countFor(check.counts, 'story-b'), 1);
  assert.equal(countFor(check.counts, 'not-listed'), 0);
  assert.equal(check.recent[0].name, 'Ada');
  assert.equal(validateCommentsIndex(index({ counts: {}, recent: [] })).ok, true);
});

test('index: any violation refuses the whole index, naming the field and not the value', () => {
  const bad: [string, unknown][] = [
    ['not an object', []],
    ['version', index({ version: 2 })],
    ['counts not an object', index({ counts: [] })],
    ['count zero', index({ counts: { 'story-a': 0 } })],
    ['count fraction', index({ counts: { 'story-a': 1.5 } })],
    ['count as text', index({ counts: { 'story-a': '2' } })],
    ['count over a file', index({ counts: { 'story-a': COMMENTS_PER_FILE_MAX + 1 } })],
    ['bad slug key', index({ counts: { '../x': 1 } })],
    ['recent not an array', index({ recent: {} })],
    ['recent too long', index({ recent: Array.from({ length: COMMENTS_INDEX_RECENT_MAX + 1 }, () => recent('story-a', ID_A)) })],
    ['recent bad slug', index({ recent: [recent('Story', ID_A)] })],
    ['recent bad id', index({ recent: [recent('story-a', '<script>')] })],
    ['recent empty title', index({ recent: [recent('story-a', ID_A, { title: '' })] })],
    ['recent invisible name', index({ recent: [recent('story-a', ID_A, { name: '​‮' })] })],
    ['recent text over the cut', index({ recent: [recent('story-a', ID_A, { text: 'x'.repeat(COMMENTS_INDEX_TEXT_MAX + 1) })] })],
    ['recent bad time', index({ recent: [recent('story-a', ID_A, { at: 'yesterday' })] })],
    ['recent signedIn false', index({ recent: [recent('story-a', ID_A, { signedIn: false })] })],
    ['recent truncated as text', index({ recent: [recent('story-a', ID_A, { truncated: 'yes' })] })],
  ];
  for (const [what, value] of bad) {
    const check = validateCommentsIndex(value);
    assert.equal(check.ok, false, what);
    assert.doesNotMatch(check.ok ? '' : check.reason, /<script>|\.\.\/x|yesterday/, what);
  }
});

// The rules that need two fields at once (POST.md section 8a, rules 1 and 3 to 6): a reader refuses
// a file that breaks one, whole. Each case is also run through the contract's own schema, so the
// reader and the desk's validator cannot disagree about what a valid index is.
const ID_C = '01K5ZQ8M3C0000000000000000';
const T09 = '2026-10-24T09:00:00Z';
const T10 = '2026-10-24T10:00:00Z';

test('index: cross-field rules the contract states for a reader refuse the whole index', () => {
  const bad: [string, unknown][] = [
    ['duplicate id', index({ counts: { 'story-a': 2 }, recent: [recent('story-a', ID_B), recent('story-a', ID_B)] })],
    ['slug missing from counts', index({ counts: { 'story-a': 2 }, recent: [recent('story-a', ID_B), recent('story-b', ID_A)] })],
    ['more recent entries than the count', index({ counts: { 'story-a': 1 }, recent: [recent('story-a', ID_B), recent('story-a', ID_A)] })],
    ['generatedAt is not the first at', index({ generatedAt: T10 })],
    ['generatedAt missing with a recent entry', (({ generatedAt: _gone, ...rest }) => rest)(index())],
    ['older entry before a newer one', index({ generatedAt: T09, recent: [recent('story-a', ID_B, { at: T09 }), recent('story-b', ID_A, { at: T10 })] })],
    ['same at, id ascending', index({ recent: [recent('story-b', ID_A), recent('story-a', ID_B)] })],
    ['counts keys not sorted', index({ counts: { 'story-b': 1, 'story-a': 2 } })],
  ];
  for (const [what, value] of bad) {
    const check = validateCommentsIndex(value);
    assert.equal(check.ok, false, what);
    assert.equal(commentsIndexSchema.safeParse(value).success, false, `${what}: the contract's schema agrees`);
    assert.doesNotMatch(check.ok ? '' : check.reason, /story-|01K5Z/, `${what}: the reason names no value`);
  }
});

test('index: an index that keeps every cross-field rule is accepted, as the schema accepts it', () => {
  const good: [string, unknown][] = [
    ['empty recent, any generatedAt', index({ counts: { 'story-a': 2 }, recent: [], generatedAt: T10 })],
    ['a story shown fewer times than its count', index({ counts: { 'story-a': 5, 'story-b': 1 }, recent: [recent('story-a', ID_B)] })],
    ['same at, id descending', index({ recent: [recent('story-a', ID_B), recent('story-a', ID_A)] })],
    ['strictly older entries', index({ generatedAt: T10, recent: [recent('story-a', ID_A, { at: T10 }), recent('story-b', ID_C, { at: T09 })] })],
    ['sorted counts', index({ counts: { 'story-a': 2, 'story-b': 1, 'story-c': 1 } })],
    ['digit-only slugs, whatever order the text had', index({ counts: { '10': 1, '9': 1, 'story-a': 2 }, recent: [recent('story-a', ID_B)] })],
  ];
  for (const [what, value] of good) {
    assert.equal(validateCommentsIndex(value).ok, true, what);
    assert.equal(commentsIndexSchema.safeParse(value).success, true, `${what}: the contract's schema agrees`);
  }
});

test('index: the reader for the data host takes a 404 as an empty index and refuses a broken file', () => {
  assert.deepEqual(commentsIndexReader.missing(), { counts: new Map(), recent: [] });
  const accepted = commentsIndexReader.accept(index());
  assert.equal(accepted.ok, true);
  assert.equal(commentsIndexReader.accept(index({ generatedAt: T10 })).ok, false);
});

test('Around the fire: only stories this page lists, newest first as the index has them, capped, linked to the comment', () => {
  const entries: ClientRecentComment[] = Array.from({ length: 40 }, (_, i) => ({
    slug: i % 4 === 0 ? 'withdrawn-story' : 'story-a', title: 'Story A', id: ID_A, name: `Reader ${i}`, text: 'Hi', at: '2026-10-24T09:00:00Z',
  }));
  const stories = new Map([['story-a', '/posts/story-a/']]);
  const rows = aroundTheFire(entries, stories);
  assert.equal(rows.length, AROUND_THE_FIRE_MAX);
  assert.ok(rows.every((row) => row.href === `/posts/story-a/#c-${ID_A}`));
  assert.deepEqual(rows.slice(0, 3).map((row) => row.name), ['Reader 1', 'Reader 2', 'Reader 3']);
  assert.deepEqual(aroundTheFire(entries, new Map()), []);
  assert.equal(aroundTheFire(entries, stories, 2).length, 2);
});

test('Around the fire: the excerpt is one line, stripped, and cut at a grapheme', () => {
  assert.equal(fireExcerpt('  one\n\ntwo​  three '), 'one two three');
  const long = fireExcerpt('👩‍👩‍👧'.repeat(AROUND_THE_FIRE_EXCERPT_MAX + 5));
  assert.ok(long.endsWith('…'));
  assert.ok([...new Intl.Segmenter().segment(long)].length <= AROUND_THE_FIRE_EXCERPT_MAX + 1);
  assert.equal(long.replace('…', '').length % '👩‍👩‍👧'.length, 0, 'no family emoji is split');
});

test('story href: the count link without its #comments fragment', () => {
  assert.equal(storyHref('/posts/a/#comments'), '/posts/a/');
  assert.equal(storyHref('/base/posts/a/'), '/base/posts/a/');
});

// ---- the browser bundle stays free of zod and the Astro runtime ----

/** Every local module the browser code imports, followed through the graph from the client entry points. */
function importGraph(entries: string[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const pending = entries.map((e) => new URL(e, import.meta.url));
  while (pending.length) {
    const url = pending.pop()!;
    if (graph.has(url.href)) continue;
    const source = readFileSync(url, 'utf8');
    const specifiers = [...source.matchAll(/^\s*import\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm)]
      .filter((m) => !/^\s*import\s+type\b/.test(m[0]))
      .map((m) => m[1]);
    graph.set(url.href, specifiers);
    for (const specifier of specifiers) {
      if (specifier.startsWith('.')) {
        const next = new URL(specifier.endsWith('.ts') ? specifier : `${specifier}.ts`, url);
        pending.push(next);
      }
    }
  }
  return graph;
}

test('bundle: the modules the browser scripts import pull in no zod and no astro: runtime', () => {
  // R4: the reactions script imports reactions.ts and the shared data-host loader too.
  const graph = importGraph(['./comments-client.ts', './comment-dom.ts', './date-format.ts', './data-host.ts', './reactions.ts']);
  assert.ok([...graph.keys()].some((href) => href.endsWith('/content/comment-limits.ts')));
  assert.ok([...graph.keys()].some((href) => href.endsWith('/lib/data-host.ts')));
  for (const [href, specifiers] of graph) {
    for (const specifier of specifiers) {
      assert.ok(specifier.startsWith('.'), `${href} imports ${specifier}: the browser modules import local files only`);
      assert.doesNotMatch(specifier, /comment-schema|comments-index-schema|\/site(\.ts)?$|zod|astro/, `${href} imports ${specifier}`);
    }
  }
});

test('bundle: the importGraph reader sees an import it should refuse', () => {
  const specifiers = [...`import { z } from 'astro/zod';\nimport type { X } from './y';\nimport './side.ts';`.matchAll(/^\s*import\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  assert.deepEqual(specifiers, ['astro/zod', './y', './side.ts']);
});
