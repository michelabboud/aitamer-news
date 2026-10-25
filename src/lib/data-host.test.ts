import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_FETCH_TIMEOUT_MS,
  dataBaseUrl,
  fetchDataFile,
  initialLoadState,
  loadTransition,
  type DataReader,
  type FetchLike,
  type LoadState,
} from './data-host.ts';

/**
 * The data host's shared load machine and fetch (plan docs/plans/2026-10-24-comments-on-r2.md,
 * tasks S3 and R4). The comments thread's own behaviour over it is in `comments-client.test.ts`;
 * the reactions totals' in `reactions.test.ts`.
 */

/** A reader that accepts `{ n: <number> }` and stands a 404 for `{ n: 0 }`. */
const reader: DataReader<{ n: number }> = {
  missing: () => ({ n: 0 }),
  accept: (body) =>
    typeof body === 'object' && body !== null && typeof (body as { n?: unknown }).n === 'number'
      ? { ok: true, value: { n: (body as { n: number }).n } }
      : { ok: false, reason: 'n is not a number' },
};

function answer(state: LoadState<{ n: number }>, status: number, body?: unknown) {
  return loadTransition(state, { type: 'response', attempt: state.attempt, status, body }, reader);
}

test('load: a 2xx the reader accepts is ready with its value', () => {
  assert.deepEqual(answer(initialLoadState(), 200, { n: 4 }), { phase: 'ready', attempt: 1, value: { n: 4 } });
});

test('load: a 404 is ready with what the reader says a missing file means', () => {
  assert.deepEqual(answer(initialLoadState(), 404), { phase: 'ready', attempt: 1, value: { n: 0 } });
});

test('load: another status, no answer, a body that is not JSON and a refused body each fail, with the right kind', () => {
  for (const status of [500, 503, 403, 301, 0]) {
    const state = answer(initialLoadState(), status);
    assert.equal(state.phase, 'failed', String(status));
    assert.equal(state.phase === 'failed' && state.failure, 'unavailable', String(status));
  }
  const offline = loadTransition(initialLoadState<{ n: number }>(), { type: 'network-error', attempt: 1 }, reader);
  assert.equal(offline.phase === 'failed' && offline.failure, 'unavailable');
  const unreadable = loadTransition(initialLoadState<{ n: number }>(), { type: 'unreadable', attempt: 1 }, reader);
  assert.equal(unreadable.phase === 'failed' && unreadable.failure, 'invalid');
  const refused = answer(initialLoadState(), 200, { n: 'sentinel-value' });
  assert.equal(refused.phase === 'failed' && refused.failure, 'invalid');
  assert.ok(refused.phase === 'failed' && !refused.reason.includes('sentinel-value'), 'the reason carries no value from the file');
});

test('load: an answer to another attempt, or after the load settled, is ignored and returns the state itself', () => {
  const loading = initialLoadState<{ n: number }>();
  assert.equal(loadTransition(loading, { type: 'response', attempt: 2, status: 200, body: { n: 1 } }, reader), loading);
  const failed = answer(loading, 500);
  const retrying = loadTransition(failed, { type: 'retry' }, reader);
  assert.deepEqual(retrying, { phase: 'loading', attempt: 2 });
  // The late answer to attempt 1 cannot overwrite attempt 2.
  assert.equal(loadTransition(retrying, { type: 'response', attempt: 1, status: 200, body: { n: 9 } }, reader), retrying);
  const ready = answer(retrying, 200, { n: 3 });
  assert.equal(loadTransition(ready, { type: 'response', attempt: 2, status: 200, body: { n: 8 } }, reader), ready);
});

test('load: retry leaves only the failed state', () => {
  const loading = initialLoadState<{ n: number }>();
  assert.equal(loadTransition(loading, { type: 'retry' }, reader), loading);
  const ready = answer(loading, 404);
  assert.equal(loadTransition(ready, { type: 'retry' }, reader), ready);
  const failed = answer(loading, 500);
  assert.deepEqual(loadTransition(failed, { type: 'retry' }, reader), { phase: 'loading', attempt: 2 });
});

// ---- fetchDataFile ----

function fakeFetch(respond: () => Promise<Pick<Response, 'ok' | 'status' | 'json'>>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl: FetchLike = (url, init) => {
    calls.push({ url, init });
    return respond();
  };
  return { impl, calls };
}

const ok = (body: () => Promise<unknown>) => async () => ({ ok: true, status: 200, json: body });

test('fetch: sends no credentials, in CORS mode, with a timeout signal, to exactly the URL given', async () => {
  const { impl, calls } = fakeFetch(ok(async () => ({ n: 1 })));
  const event = await fetchDataFile('https://data.aitamer.news/v1/reactions/a.json', 1, impl);
  assert.deepEqual(event, { type: 'response', attempt: 1, status: 200, body: { n: 1 } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://data.aitamer.news/v1/reactions/a.json');
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(calls[0].init.mode, 'cors');
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.equal(DATA_FETCH_TIMEOUT_MS, 10_000);
});

test('fetch: a non-2xx answer is a response event whose body is never read', async () => {
  let read = false;
  const { impl } = fakeFetch(async () => ({
    ok: false,
    status: 404,
    json: async () => {
      read = true;
      return {};
    },
  }));
  assert.deepEqual(await fetchDataFile('https://x.test/a.json', 3, impl), { type: 'response', attempt: 3, status: 404 });
  assert.equal(read, false);
});

test('fetch: a rejected fetch is a network error, and so is a timeout while the body arrives', async () => {
  const offline = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')));
  assert.deepEqual(await fetchDataFile('https://x.test/a.json', 1, offline.impl), { type: 'network-error', attempt: 1 });
  for (const name of ['AbortError', 'TimeoutError']) {
    const slow = fakeFetch(
      ok(async () => {
        const error = new Error('aborted');
        error.name = name;
        throw error;
      }),
    );
    assert.deepEqual(await fetchDataFile('https://x.test/a.json', 2, slow.impl), { type: 'network-error', attempt: 2 }, name);
  }
});

test('fetch: a 2xx body that is not JSON is unreadable', async () => {
  const { impl } = fakeFetch(
    ok(async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    }),
  );
  assert.deepEqual(await fetchDataFile('https://x.test/a.json', 1, impl), { type: 'unreadable', attempt: 1 });
});

test('fetch: a redirect is never followed (redirect: error), so a host that redirects is the failed state', async () => {
  const { impl, calls } = fakeFetch(ok(async () => ({ n: 1 })));
  await fetchDataFile('https://x.test/a.json', 1, impl);
  assert.equal(calls[0].init.redirect, 'error');
  // What the browser does with `redirect: 'error'` is to reject the fetch; that is a network error here.
  const redirected = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')));
  assert.deepEqual(await fetchDataFile('https://x.test/a.json', 1, redirected.impl), { type: 'network-error', attempt: 1 });
});

test('fetch: without AbortSignal.timeout (Safari before 16) the 10 s timeout still aborts the request, and the timer is cleared', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const original = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout')!;
  Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true, writable: true });
  t.after(() => Object.defineProperty(AbortSignal, 'timeout', original));

  // A request that never answers: it settles only when its signal aborts.
  let seen: AbortSignal | undefined;
  const impl: FetchLike = (_url, init) =>
    new Promise((_resolve, reject) => {
      seen = init.signal as AbortSignal;
      seen.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
  const pending = fetchDataFile('https://x.test/a.json', 5, impl);
  assert.ok(seen instanceof AbortSignal, 'a signal is sent even without AbortSignal.timeout');
  assert.equal(seen.aborted, false);
  t.mock.timers.tick(DATA_FETCH_TIMEOUT_MS - 1);
  assert.equal(seen.aborted, false, 'not before the 10 s are up');
  t.mock.timers.tick(1);
  assert.equal(seen.aborted, true);
  assert.deepEqual(await pending, { type: 'network-error', attempt: 5 });
});

test('fetch: the fallback timer is cleared when the load ends first, so it cannot fire later', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const original = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout')!;
  Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true, writable: true });
  t.after(() => Object.defineProperty(AbortSignal, 'timeout', original));
  let seen: AbortSignal | undefined;
  const impl: FetchLike = async (_url, init) => {
    seen = init.signal as AbortSignal;
    return { ok: true, status: 200, json: async () => ({ n: 1 }) };
  };
  assert.deepEqual(await fetchDataFile('https://x.test/a.json', 1, impl), { type: 'response', attempt: 1, status: 200, body: { n: 1 } });
  t.mock.timers.tick(DATA_FETCH_TIMEOUT_MS * 2);
  assert.equal(seen!.aborted, false, 'a finished load is never aborted afterwards');
});

test('base: https is accepted; http only on this machine (a mistyped base never goes out in the clear)', () => {
  assert.equal(dataBaseUrl('https://data.aitamer.news/').href, 'https://data.aitamer.news/');
  for (const local of ['http://127.0.0.1:4399/', 'http://localhost:4399/bucket/', 'http://[::1]:4399/']) {
    assert.doesNotThrow(() => dataBaseUrl(local), local);
  }
  for (const remote of ['http://data.aitamer.news/', 'http://example.com/', 'http://127.0.0.2/', 'http://localhost.evil.example/', 'http://192.168.1.5:4399/', 'http://evil.example@localhost/']) {
    assert.throws(() => dataBaseUrl(remote), TypeError, remote);
  }
});
