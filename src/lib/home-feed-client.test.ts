import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HomeFeedController, validateFeedManifest, restoredFeedState, type FeedManifest } from './home-feed-client.ts';
import { loadHomeFeedHtml } from './home-feed-transport.ts';
import { HomeFeedProtocolError } from './home-feed-protocol.ts';

const snapshot = 'a'.repeat(64);
const manifest: FeedManifest = { snapshot, initialCount: 3, initialLimit: 3, batchSize: 2, batchCount: 2, plannedCount: 7, maxAutoBatches: 2 };
const ids = ['p0', 'p1', 'p2'];
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('initial observer callback and callback storms cannot fetch; a fresh downward scroll permits exactly one batch', async () => {
  let calls = 0;
  let finish!: (value: { ids: string[]; content: string }) => void;
  const appended: string[] = [];
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async () => { calls++; return new Promise((resolve) => { finish = resolve; }); }, append: (batch) => appended.push(batch.content),
  });
  controller.observe(true);
  for (let i = 0; i < 30; i++) controller.observe(true);
  assert.equal(calls, 0);
  controller.scroll(1);
  assert.equal(calls, 1);
  for (let i = 2; i < 30; i++) { controller.scroll(i); controller.observe(true); controller.retry(); }
  assert.equal(calls, 1);
  finish({ ids: ['p3', 'p4'], content: 'first' });
  await tick();
  assert.equal(controller.state, 'idle');
  controller.observe(true);
  assert.equal(calls, 1);
  controller.scroll(30);
  assert.equal(calls, 2);
  finish({ ids: ['p5', 'p6'], content: 'last' });
  await tick();
  assert.equal(controller.state, 'finished');
  for (let i = 31; i < 60; i++) { controller.scroll(i); controller.observe(true); }
  assert.equal(calls, 2);
  assert.deepEqual(appended, ['first', 'last']);
});

test('failure holds the cursor, avoids automatic retries and allows one explicit retry', async () => {
  let calls = 0;
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async (expected) => { calls++; assert.equal(expected.index, 1); if (calls === 1) throw new Error('offline'); return { ids: ['p3', 'p4'], content: 'ok' }; }, append: () => {},
  });
  controller.observe(true); controller.scroll(1); await tick();
  assert.equal(controller.state, 'error'); assert.equal(controller.loadedBatches, 0);
  controller.scroll(2); controller.observe(true); await tick(); assert.equal(calls, 1);
  await controller.retry(); assert.equal(calls, 2); assert.equal(controller.loadedBatches, 1);
});

test('upward movement clears old intent and current sentinel geometry overrides stale observer state', async () => {
  let calls = 0;
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async () => { calls++; return { ids: ['p3', 'p4'], content: '' }; }, append: () => {},
  });
  controller.scroll(10, false);
  controller.scroll(5, false);
  controller.observe(true);
  assert.equal(calls, 0);
  controller.scroll(11, false);
  assert.equal(calls, 0);
  controller.scroll(12, true);
  await tick();
  assert.equal(calls, 1);
});

test('malformed/duplicate IDs and stale snapshots never append; stale errors require refresh', async () => {
  for (const result of [{ ids: ['p3'], content: 'bad' }, { ids: ['p3', 'p3'], content: 'bad' }, { ids: ['p0', 'p4'], content: 'bad' }, new HomeFeedProtocolError('changed', true)]) {
    let appended = 0;
    const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
      load: async () => { if (result instanceof Error) throw result; return result; }, append: () => { appended++; },
    });
    controller.observe(true); controller.scroll(1); await tick();
    assert.equal(controller.state, 'error'); assert.equal(appended, 0); assert.equal(controller.loadedBatches, 0);
    if (result instanceof HomeFeedProtocolError) assert.equal(controller.stale, true);
  }
});

test('dispose aborts an in-flight request and ignores late success', async () => {
  let resolve!: (value: { ids: string[]; content: string }) => void;
  let signal!: AbortSignal;
  let appended = 0;
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async (_, requestSignal) => { signal = requestSignal; return new Promise((done) => { resolve = done; }); }, append: () => { appended++; },
  });
  controller.observe(true); controller.scroll(1); controller.dispose();
  assert.equal(signal.aborted, true);
  resolve({ ids: ['p3', 'p4'], content: 'late' }); await tick();
  assert.equal(controller.state, 'disposed'); assert.equal(appended, 0);
});

test('cancelling restoration ends its loop even when an aborted request settles late', async () => {
  let resolve!: (value: { ids: string[]; content: string }) => void;
  let calls = 0;
  let signal!: AbortSignal;
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async (_, requestSignal) => {
      calls++; signal = requestSignal;
      return new Promise((done) => { resolve = done; });
    }, append: () => assert.fail('cancelled restoration must not append'),
  });
  const restoring = controller.restore(2);
  assert.equal(calls, 1);
  controller.cancel();
  assert.equal(signal.aborted, true);
  resolve({ ids: ['p3', 'p4'], content: 'late' });
  await tick();
  assert.equal(calls, 1, 'the cancelled restore loop must not begin another request');
  assert.equal(await restoring, false, 'cancelled reconstruction cannot later restore the viewport');
  assert.equal(controller.state, 'idle');
  assert.equal(controller.loadedBatches, 0);
});

test('a cancelled restoration cannot interfere with a newer reconstruction', async () => {
  const pending: Array<(value: { ids: string[]; content: string }) => void> = [];
  let appended = 0;
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async () => new Promise((resolve) => pending.push(resolve)), append: () => { appended++; },
  });
  const oldRestoration = controller.restore(2);
  controller.cancel();
  const newRestoration = controller.restore(1);
  assert.equal(pending.length, 2);
  pending[0]({ ids: ['p3', 'p4'], content: 'cancelled' });
  assert.equal(await oldRestoration, false);
  pending[1]({ ids: ['p3', 'p4'], content: 'current' });
  assert.equal(await newRestoration, true);
  assert.equal(appended, 1);
  assert.equal(controller.loadedBatches, 1);
});

test('failed restoration releases its hold so Retry and subsequent automatic batches remain usable', async () => {
  let calls = 0;
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async (expected) => {
      if (++calls === 1) throw new Error('restoration offline');
      return { ids: expected.index === 1 ? ['p3', 'p4'] : ['p5', 'p6'], content: '' };
    }, append: () => {},
  });
  assert.equal(await controller.restore(2), false);
  assert.equal(controller.state, 'error');
  await controller.retry();
  assert.equal(controller.state, 'idle');
  assert.equal(controller.loadedBatches, 1);
  controller.observe(true); controller.scroll(1);
  await tick();
  assert.equal(controller.state, 'finished');
  assert.equal(calls, 3);
});

test('restoration loads only a validated bounded count, and needs a fresh scroll afterwards', async () => {
  let calls = 0;
  const controller = new HomeFeedController({ manifest, initialIds: ids, pageUrl: 'https://example.com/',
    load: async (expected) => { calls++; return { ids: expected.index === 1 ? ['p3', 'p4'] : ['p5', 'p6'], content: '' }; }, append: () => {},
  });
  const state = restoredFeedState({ version: 1, snapshot, loadedBatches: 1, anchor: 'p3', anchorOffset: -15, scrollY: 600 }, manifest);
  assert.ok(state);
  await controller.restore(state.loadedBatches);
  assert.equal(calls, 1); assert.equal(controller.loadedBatches, 1);
  controller.observe(true); assert.equal(calls, 1);
  controller.resetScroll(600); controller.scroll(601); await tick(); assert.equal(calls, 2);
  for (const value of [null, {}, { ...state, snapshot: 'b'.repeat(64) }, { ...state, loadedBatches: 3 }, { ...state, loadedBatches: 1.5 }, { ...state, anchor: 'javascript:x' }, { ...state, scrollY: Infinity }, { ...state, anchorOffset: -Infinity }]) assert.equal(restoredFeedState(value, manifest), null);
  assert.throws(() => validateFeedManifest({ ...manifest, plannedCount: 8 }));
  assert.throws(() => validateFeedManifest({ ...manifest, maxAutoBatches: 11 }));
});

test('transport refuses redirects/foreign responses, bad content types, oversized streams and timeouts', async () => {
  const url = 'https://example.com/home-feed/1/';
  let observed: RequestInit | undefined;
  const validFetch: typeof fetch = async (_, init) => { observed = init; return new Response('<template></template>', { headers: { 'content-type': 'text/html' } }); };
  assert.equal(await loadHomeFeedHtml(url, { fetch: validFetch }), '<template></template>');
  assert.equal(observed?.redirect, 'error'); assert.equal(observed?.credentials, 'same-origin');
  for (const response of [
    new Response('x', { status: 302, headers: { location: '/elsewhere' } }),
    new Response('x', { headers: { 'content-type': 'text/plain' } }),
    new Response('oversized', { headers: { 'content-type': 'text/html' } }),
  ]) await assert.rejects(loadHomeFeedHtml(url, { fetch: async () => response, maxBytes: 4 }));
  const foreign = new Response('x', { headers: { 'content-type': 'text/html' } });
  Object.defineProperty(foreign, 'url', { value: 'https://evil.test/home-feed/1/' });
  await assert.rejects(loadHomeFeedHtml(url, { fetch: async () => foreign }), /URL/);
  await assert.rejects(loadHomeFeedHtml(url, { fetch: async () => new Promise(() => {}), timeoutMs: 5 }), /timed out/);
  const body = new ReadableStream({ start(stream) { stream.enqueue(new TextEncoder().encode('12345')); stream.close(); } });
  await assert.rejects(loadHomeFeedHtml(url, { fetch: async () => new Response(body, { headers: { 'content-type': 'text/html' } }), maxBytes: 4 }), /large/);
});
