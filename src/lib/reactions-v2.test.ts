import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REACTION_V2_MAX_BYTES, parseReactionV2File, reactionsV2FileUrl, initialReactionV2State, reactionV2Transition, fetchReactionV2File } from './reactions.ts';
const slug = 'a-story';
const envelope = (generation = '1', reactions = [{ id: 'love', n: 2 }]) => ({ version: 2, slug, generation, reactions });
const bytes = (file: unknown = envelope()) => `${JSON.stringify(file)}\n`;
const response = (state: ReturnType<typeof initialReactionV2State>, file: unknown, status = 200) => reactionV2Transition(state, { type: 'response', attempt: state.attempt, status, body: bytes(file) }, slug);
const retry = (state: ReturnType<typeof initialReactionV2State>) => reactionV2Transition(state, { type: 'retry' }, slug);

test('v2 URL, exact int64 generation, sorted retired ids and empty zero envelopes', () => {
  assert.equal(reactionsV2FileUrl('https://data.aitamer.news/', slug), 'https://data.aitamer.news/v2/reactions/a-story.json');
  for (const generation of ['1', '9007199254740993', '9223372036854775807']) {
    assert.equal(parseReactionV2File(bytes(envelope(generation, [])), slug).ok, true);
  }
  assert.equal(parseReactionV2File(bytes(envelope('1', [{ id: 'retired', n: Number.MAX_SAFE_INTEGER }])), slug).ok, true);
  for (const base of ['https://data.aitamer.news', 'http://example.com/', 'https://user@data.aitamer.news/', 'https://data.aitamer.news/?x']) assert.throws(() => reactionsV2FileUrl(base, slug));
  assert.throws(() => reactionsV2FileUrl('https://data.aitamer.news/', '../escape'));
});

test('hostile envelopes, unsafe numbers, bad generations, unknown keys and noncanonical JSON fail closed', () => {
  const bad: unknown[] = [null, [], { ...envelope(), version: 1 }, { ...envelope(), slug: 'other' }, { ...envelope(), private: 'secret' }];
  for (const generation of [undefined, null, 1, '', '0', '01', '+1', '-1', '1.0', '1e2', ' 1', '1\n', '9223372036854775808', '9'.repeat(20)]) bad.push({ ...envelope(), generation });
  for (const reactions of [[{ id: 'love', n: 0 }], [{ id: 'love', n: 1.1 }], [{ id: 'love', n: 2 ** 53 }], [{ id: '<script>', n: 1 }], [{ id: 'love', n: 1, private: true }], [{ id: 'love', n: 1 }, { id: 'love', n: 2 }], [{ id: 'wow', n: 1 }, { id: 'love', n: 1 }], Array.from({ length: 65 }, (_, i) => ({ id: `r${i}`, n: 1 }))]) bad.push({ ...envelope(), reactions });
  for (const file of bad) assert.equal(parseReactionV2File(bytes(file), slug).ok, false, bytes(file));
  for (const text of [bytes().trim(), bytes().replace('"version":2', '"version":1,"version":2'), bytes().replace('"id":"love"', '"id":"wow","id":"love"'), JSON.stringify(envelope(), null, 2) + '\n', bytes().replace('"love"', '"l\\u006fve"'), ' '.repeat(REACTION_V2_MAX_BYTES + 1)]) assert.equal(parseReactionV2File(text, slug).ok, false);
});

test('latest generation survives refresh, old responses, failures, 404 and changed payload at equal generation', () => {
  let state = response(initialReactionV2State(), envelope('9007199254740993'));
  assert.equal(state.phase, 'ready');
  const latest = state.latest;
  state = response(retry(state), envelope('9007199254740992', []));
  assert.equal(state.phase, 'failed'); assert.deepEqual(state.latest, latest);
  state = response(retry(state), envelope('9007199254740993', []));
  assert.equal(state.phase, 'failed'); assert.deepEqual(state.latest, latest);
  state = reactionV2Transition(retry(state), { type: 'network-error', attempt: state.attempt + 1 }, slug);
  assert.equal(state.phase, 'failed'); assert.deepEqual(state.latest, latest);
  state = response(retry(state), null, 404);
  assert.equal(state.phase, 'ready'); assert.deepEqual(state.latest, latest);
  if (state.phase === 'ready') assert.deepEqual(state.value.reactions, latest?.reactions);
  state = response(retry(state), envelope('9007199254740994', []));
  assert.equal(state.phase, 'ready'); assert.equal(state.latest?.generation, '9007199254740994');
  if (state.phase === 'ready') assert.deepEqual(state.value.reactions, []);
  assert.equal(response(retry(state), envelope('9007199254740994', [])).phase, 'ready');
});

test('initial 404 is zero with no revision and later publication loads; stale attempts cannot move the fence', () => {
  let state = response(initialReactionV2State(), null, 404);
  assert.equal(state.phase, 'ready'); assert.equal(state.latest, undefined);
  if (state.phase === 'ready') assert.deepEqual(state.value.reactions, []);
  state = retry(state);
  const stale = reactionV2Transition(state, { type: 'response', attempt: 1, status: 200, body: bytes(envelope('99')) }, slug);
  assert.equal(stale, state);
  state = response(state, envelope('1'));
  assert.equal(state.latest?.generation, '1');
});

test('bounded fetch uses only v2, omits credentials, refuses malformed UTF8 and stops oversized streams', async () => {
  const url = reactionsV2FileUrl('https://data.aitamer.news/', slug);
  for (const status of [404, 403, 500, 200]) {
    const urls: string[] = [];
    const event = await fetchReactionV2File(url, 1, async (request, init) => {
      urls.push(request); assert.equal(init.credentials, 'omit'); assert.equal(init.redirect, 'error'); assert.equal(init.mode, 'cors');
      return new Response(status === 200 ? bytes() : 'ignored', { status });
    });
    assert.deepEqual(urls, [url]); assert.equal(reactionV2Transition(initialReactionV2State(), event, slug).phase, status === 404 || status === 200 ? 'ready' : 'failed');
  }
  let canceled = false;
  const oversize = await fetchReactionV2File(url, 2, async () => new Response(new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(REACTION_V2_MAX_BYTES + 1)); }, cancel() { canceled = true; } })));
  assert.equal(oversize.type, 'unreadable'); assert.equal(canceled, true);
  for (const body of [new Uint8Array([0xc3, 0x28]), new TextEncoder().encode('é'.repeat(REACTION_V2_MAX_BYTES / 2 + 1))]) {
    const event = await fetchReactionV2File(url, 1, async () => new Response(body)); assert.equal(event.type, 'unreadable');
  }
  const unavailable = await fetchReactionV2File(url, 1, async () => { throw new TypeError('offline'); }); assert.equal(unavailable.type, 'network-error');
});

test('component selects v2 fetch and retains baked/live activation holds', () => {
  const component = readFileSync(new URL('../components/Reactions.astro', import.meta.url), 'utf8');
  assert.match(component, /loadPersistentReactionV2Totals/); assert.doesNotMatch(component, /fetchDataFile\(/);
  const persistence = readFileSync(new URL('./reactions-v2-persistence.ts', import.meta.url), 'utf8');
  assert.match(persistence, /fetchReactionV2File/);
  const site = readFileSync(new URL('./site.ts', import.meta.url), 'utf8');
  assert.match(site, /REACTIONS_LIVE\s*=\s*false/); assert.match(site, /REACTIONS_SOURCE[^=]*=\s*'baked'/);
});

test('terminal line separators cannot escape any v2 slug, id or generation boundary', () => {
  for (const separator of ['\n', '\r', '\u2028', '\u2029']) {
    assert.throws(() => reactionsV2FileUrl('https://data.aitamer.news/', slug + separator));
    assert.equal(parseReactionV2File(bytes({ ...envelope(), slug: slug + separator }), slug).ok, false);
    assert.equal(parseReactionV2File(bytes(envelope('1' + separator)), slug).ok, false);
    assert.equal(parseReactionV2File(bytes(envelope('1', [{ id: 'love' + separator, n: 1 }])), slug).ok, false);
  }
});

test('bounded fetch honors header bounds, split UTF8, exact byte limit, and never accepts v1', async () => {
  const url = reactionsV2FileUrl('https://data.aitamer.news/', slug);
  const body = new TextEncoder().encode(bytes());
  const split = await fetchReactionV2File(url, 1, async () => new Response(new ReadableStream({ start(controller) { for (const byte of body) controller.enqueue(new Uint8Array([byte])); controller.close(); } })));
  assert.equal(reactionV2Transition(initialReactionV2State(), split, slug).phase, 'ready');
  for (const value of [String(REACTION_V2_MAX_BYTES + 1), '-1', 'garbage']) {
    let canceled = false;
    const event = await fetchReactionV2File(url, 1, async () => new Response(new ReadableStream({ cancel() { canceled = true; } }), { headers: { 'Content-Length': value } }));
    assert.equal(event.type, 'unreadable'); assert.equal(canceled, true);
  }
  const exact = await fetchReactionV2File(url, 1, async () => new Response(' '.repeat(REACTION_V2_MAX_BYTES)));
  assert.equal(exact.type, 'response', 'the inclusive byte bound is applied before JSON parsing');
  assert.equal(reactionV2Transition(initialReactionV2State(), exact, slug).phase, 'failed');
  const v1 = await fetchReactionV2File(url, 1, async () => new Response(bytes({ version: 1, slug, reactions: [{ id: 'love', n: 99 }] })));
  assert.equal(reactionV2Transition(initialReactionV2State(), v1, slug).phase, 'failed');
  const bom = await fetchReactionV2File(url, 1, async () => new Response(new Uint8Array([0xef, 0xbb, 0xbf, ...body])));
  assert.equal(reactionV2Transition(initialReactionV2State(), bom, slug).phase, 'failed');
});

test('out-of-order completed fetches cannot overwrite a newer attempt or remembered generation', async () => {
  const url = reactionsV2FileUrl('https://data.aitamer.news/', slug);
  let release!: (response: Response) => void;
  const late = fetchReactionV2File(url, 1, () => new Promise((resolve) => { release = resolve; }));
  let state = reactionV2Transition(initialReactionV2State(), { type: 'network-error', attempt: 1 }, slug);
  state = retry(state);
  state = reactionV2Transition(state, await fetchReactionV2File(url, 2, async () => new Response(bytes(envelope('2', [])))), slug);
  release(new Response(bytes(envelope('1'))));
  assert.equal(reactionV2Transition(state, await late, slug), state);
  assert.equal(state.latest?.generation, '2');
});

test('fetch deadline covers a stalled body and clears its timer after failure', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = fetchReactionV2File(reactionsV2FileUrl('https://data.aitamer.news/', slug), 1, async (_url, init) => new Response(new ReadableStream({ start(controller) {
    init.signal?.addEventListener('abort', () => controller.error(new DOMException('deadline', 'AbortError')), { once: true });
  } })));
  await Promise.resolve();
  context.mock.timers.tick(10_000);
  assert.deepEqual(await pending, { type: 'network-error', attempt: 1 });
  context.mock.timers.reset();
});
