/**
 * The desk's public data host, read in the browser: what every file the site fetches from it has in
 * common (docs/plans/2026-10-24-comments-on-r2.md §2.5, §2.6; tasks S3 and R4; site ADR 0047).
 *
 * - **Where:** {@link dataBaseUrl} checks `COMMENTS_DATA_BASE` (`./site.ts`), the one base every
 *   `v1/…` key on the host hangs from: `https:`, or `http:` for a loopback host only.
 * - **How a load goes:** {@link loadTransition} is the state machine every file shares: loading,
 *   ready, or failed with a retry. Each load has an attempt number, so the answer to an earlier
 *   attempt can never overwrite a later one. What a 404 means and whether a body is acceptable are
 *   the caller's (`./comments-client.ts` for the thread, `./reactions.ts` for the totals).
 * - **The fetch itself:** {@link fetchDataFile} turns one `fetch` into one event for the machine,
 *   and never throws.
 *
 * No `document` or `window`, one timer (the timeout's fallback, cleared when the load ends), and no zod or `astro:*` import, so it runs under `node:test`
 * (`./data-host.test.ts`) and stays small in the browser bundle. `fetchDataFile` takes its `fetch`
 * as a parameter for the same reason.
 */

/** How long the page waits for a data file before it treats the load as failed. A network matter, not an operator knob. */
export const DATA_FETCH_TIMEOUT_MS = 10_000;

/**
 * Hosts a page may reach over plain `http:`: this machine only, for a local fixture server. Any
 * other host must be `https:`, so a mistyped base can never send a reader's request in the clear.
 * (`URL.hostname` keeps the brackets of an IPv6 literal.)
 */
export const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['127.0.0.1', 'localhost', '[::1]']);

/**
 * The data host's base as a URL: absolute `https:` (or `http:` for a loopback host only), no
 * credentials, no query, no fragment, and a path ending in `/` (so `new URL(key, base)` keeps its path).
 * @throws TypeError naming what is wrong, never echoing the value
 */
export function dataBaseUrl(base: string): URL {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new TypeError('COMMENTS_DATA_BASE is not an absolute URL');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new TypeError('COMMENTS_DATA_BASE must be an https URL');
  if (url.protocol === 'http:' && !LOOPBACK_HOSTS.has(url.hostname)) {
    throw new TypeError('COMMENTS_DATA_BASE must be https, or http on this machine only (127.0.0.1, localhost, [::1])');
  }
  if (url.username || url.password) throw new TypeError('COMMENTS_DATA_BASE must not carry credentials');
  if (url.search || url.hash || base.includes('?') || base.includes('#')) {
    throw new TypeError('COMMENTS_DATA_BASE must not carry a query or a fragment');
  }
  if (!url.pathname.endsWith('/') || !base.endsWith('/')) throw new TypeError('COMMENTS_DATA_BASE must end in /');
  return url;
}

/** Why a load failed: the host did not answer well, or the file was refused. */
export type LoadFailure = 'unavailable' | 'invalid';

/** A load's state. `attempt` counts loads (the first is 1, each retry adds one). */
export type LoadState<T> =
  | { phase: 'loading'; attempt: number }
  | { phase: 'ready'; attempt: number; value: T }
  /** `reason` is for the console, and never carries a value from the file. */
  | { phase: 'failed'; attempt: number; failure: LoadFailure; reason: string };

export type DataEvent =
  /** The host answered. `body` is the parsed JSON for a 2xx answer, and is not read otherwise. */
  | { type: 'response'; attempt: number; status: number; body?: unknown }
  /** The host answered 2xx, but the body was not JSON. */
  | { type: 'unreadable'; attempt: number }
  /** No answer: offline, refused by CORS, DNS, or the timeout. */
  | { type: 'network-error'; attempt: number }
  /** The page asked to load again. */
  | { type: 'retry' };

/** What a caller says about a 2xx body: accepted as `value`, or refused with a reason that carries no value from the file. */
export type DataCheck<T> = { ok: true; value: T } | { ok: false; reason: string };

/** How one kind of file is read. */
export interface DataReader<T> {
  /** The value a 404 stands for: the desk deletes a file that would say nothing. */
  missing: () => T;
  /** Checks a 2xx body; anything refused is the failed state, so a bad file shows nothing of itself. */
  accept: (body: unknown) => DataCheck<T>;
}

const HTTP_NOT_FOUND = 404;

/** The state a page starts in: loading, first attempt. */
export function initialLoadState<T>(): LoadState<T> {
  return { phase: 'loading', attempt: 1 };
}

function isSuccess(status: number): boolean {
  return Number.isInteger(status) && status >= 200 && status <= 299;
}

/**
 * The load's state machine. It returns `state` itself whenever the event changes nothing, so a
 * caller can tell an ignored event by identity.
 * - `retry` leaves only the failed state, to loading with the next attempt; anywhere else it is ignored.
 * - An answer counts only while loading, and only for the attempt in flight; any other is stale and ignored.
 * - 404 is ready with `reader.missing()`. Another non-2xx, a network error or the timeout is
 *   `unavailable`. A 2xx whose body is not JSON, or that `reader.accept` refuses, is `invalid`.
 */
export function loadTransition<T>(state: LoadState<T>, event: DataEvent, reader: DataReader<T>): LoadState<T> {
  if (event.type === 'retry') {
    return state.phase === 'failed' ? { phase: 'loading', attempt: state.attempt + 1 } : state;
  }
  if (state.phase !== 'loading' || event.attempt !== state.attempt) return state;
  const { attempt } = state;
  switch (event.type) {
    case 'network-error':
      return { phase: 'failed', attempt, failure: 'unavailable', reason: 'the data host did not answer' };
    case 'unreadable':
      return { phase: 'failed', attempt, failure: 'invalid', reason: 'the file is not JSON' };
    case 'response': {
      if (event.status === HTTP_NOT_FOUND) return { phase: 'ready', attempt, value: reader.missing() };
      if (!isSuccess(event.status)) {
        return { phase: 'failed', attempt, failure: 'unavailable', reason: `the data host answered ${Number(event.status)}` };
      }
      const check = reader.accept(event.body);
      if (!check.ok) return { phase: 'failed', attempt, failure: 'invalid', reason: check.reason };
      return { phase: 'ready', attempt, value: check.value };
    }
  }
}

/** The part of `fetch` this module uses, so a test can hand in its own. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/** The timeout's signal, and the call that stops its timer once the load is over. */
interface Deadline {
  signal: AbortSignal;
  clear: () => void;
}

/**
 * A signal that aborts after {@link DATA_FETCH_TIMEOUT_MS}. `AbortSignal.timeout` where the browser
 * has it (nothing to clear); an `AbortController` and a timer where it does not (Safari before 16),
 * so the timeout holds on an older phone too.
 */
function deadline(): Deadline {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return { signal: AbortSignal.timeout(DATA_FETCH_TIMEOUT_MS), clear: () => {} };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DATA_FETCH_TIMEOUT_MS);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/**
 * One fetch of a data file, as an event for {@link loadTransition}. Sent with
 * `credentials: 'omit'` (the host is public and must never see a cookie), `mode: 'cors'` and
 * `redirect: 'error'` (the host answers the file itself or fails: a redirect would take the page
 * somewhere the policy never named, so it is the failed state). Never throws.
 * @param fetchImpl the browser's `fetch` by default
 */
export async function fetchDataFile(url: string, attempt: number, fetchImpl: FetchLike = (u, init) => fetch(u, init)): Promise<DataEvent> {
  const { signal, clear } = deadline();
  try {
    let response: Pick<Response, 'ok' | 'status' | 'json'>;
    try {
      response = await fetchImpl(url, { credentials: 'omit', mode: 'cors', redirect: 'error', signal });
    } catch {
      return { type: 'network-error', attempt };
    }
    if (!response.ok) return { type: 'response', attempt, status: response.status };
    try {
      return { type: 'response', attempt, status: response.status, body: await response.json() };
    } catch (error) {
      // The timeout can fire while the body is still arriving: that is the network, not the file.
      const name = error instanceof Error ? error.name : '';
      return name === 'AbortError' || name === 'TimeoutError' ? { type: 'network-error', attempt } : { type: 'unreadable', attempt };
    }
  } finally {
    clear();
  }
}
