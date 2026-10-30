/**
 * Reload/navigation fence for public reaction totals. IndexedDB's readwrite transaction rereads
 * the story, compares generations and exact canonical bytes, and commits before rendering. Each
 * record in the public store is one bounded public envelope, keyed by its validated data URL.
 * The sibling journal store contains private capability/intents (reaction-journal.ts); it never
 * enters the public record. Browser quota is the cap; public fences have no eviction or expiry.
 *
 * PRIVACY ACTIVATION GATE: this browser persistence also records which stories' totals were read.
 * Include its purpose, public-envelope contents, indefinite retention until site-data clearing,
 * and reset semantics in owner-approved reactions privacy wording before enabling live reactions.
 *
 * An absent record on a new page is a fresh trust/reset boundary: clearing every browser record
 * cannot be detected afterwards. An observable missing/older/changed fence after this page has
 * seen one, corrupt existing bytes, or any database failure closes counts for that page instance.
 * It never deletes/repairs records or falls back to an in-memory-only/v1 reader. Reloading can
 * recover only after storage is available and its existing record validates; deliberately clearing
 * site data starts fresh trust and makes no promise of continuity with the erased fence.
 */
import { DATA_FETCH_TIMEOUT_MS, type DataEvent } from './data-host.ts';
import {
  fetchReactionV2File, initialReactionV2State, parseReactionV2File, reactionV2Transition,
  reactionsV2FileUrl, type ClientReactionV2File, type ReactionV2Fetch, type ReactionV2State,
} from './reactions.ts';

export const REACTION_V2_FENCE_DATABASE = 'atn-reactions-v2';
export const REACTION_V2_FENCE_STORE = 'envelopes';
export const REACTION_BROWSER_DATABASE_VERSION = 2;
export const REACTION_JOURNAL_STORE = 'journal';
const CHANNEL_NAME = 'atn:reactions:v2:fence';

export type PersistentReactionV2State = ReactionV2State & { readonly fenceFailure?: true };
export interface ReactionV2FenceStore {
  /** No event rechecks persistent state (pageshow, another tab, foregrounding). */
  settle(state: ReactionV2State, event?: DataEvent): Promise<ReactionV2State>;
  close(): void;
}

function canonical(file: ClientReactionV2File): string { return `${JSON.stringify(file)}\n`; }

function newestFence(memory: ClientReactionV2File | undefined, stored: unknown, present: boolean, slug: string): ClientReactionV2File | undefined {
  if (!present) {
    if (memory) throw new Error('the remembered reactions fence was removed');
    return undefined;
  }
  const checked = parseReactionV2File(stored, slug);
  if (!checked.ok) throw new Error('the stored reactions fence is invalid');
  if (memory && (BigInt(checked.value.generation) < BigInt(memory.generation) ||
    (checked.value.generation === memory.generation && canonical(checked.value) !== canonical(memory)))) {
    throw new Error('the stored reactions fence conflicts with this page');
  }
  return checked.value;
}

/** One additive database version lets private journal/public fence transactions share a scope. */
export function openReactionBrowserDatabase(onUnavailable: () => void, factory: IDBFactory = globalThis.indexedDB): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!factory) { reject(new Error('IndexedDB is unavailable')); return; }
    let request: IDBOpenDBRequest;
    try { request = factory.open(REACTION_V2_FENCE_DATABASE, REACTION_BROWSER_DATABASE_VERSION); }
    catch { reject(new Error('IndexedDB could not be opened')); return; }
    let abandoned = false;
    const timer = setTimeout(() => failed(), DATA_FETCH_TIMEOUT_MS);
    const failed = () => { abandoned = true; clearTimeout(timer); reject(new Error('IndexedDB could not be opened')); };
    request.onerror = failed; request.onblocked = failed;
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REACTION_V2_FENCE_STORE)) db.createObjectStore(REACTION_V2_FENCE_STORE);
      if (!db.objectStoreNames.contains(REACTION_JOURNAL_STORE)) db.createObjectStore(REACTION_JOURNAL_STORE);
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      if (abandoned) { db.close(); return; }
      db.onversionchange = () => { db.close(); onUnavailable(); };
      db.onclose = onUnavailable;
      resolve(db);
    };
  });
}

/** Production IndexedDB adapter. No successful settle escapes before transaction completion. */
export function openReactionV2FenceStore(url: string, slug: string, onUnavailable: () => void, factory: IDBFactory = globalThis.indexedDB): Promise<ReactionV2FenceStore> {
  return openReactionBrowserDatabase(onUnavailable, factory).then(db => {
    let closed = false;
    const close = () => { closed = true; db.close(); };
    return {
      close,
      settle(state, event) {
        return new Promise((resolveTransaction, rejectTransaction) => {
          if (closed) { rejectTransaction(new Error('IndexedDB is closed')); return; }
          let transaction: IDBTransaction;
          try { transaction = db.transaction(REACTION_V2_FENCE_STORE, 'readwrite'); }
          catch { rejectTransaction(new Error('the reactions transaction could not start')); return; }
          let result: ReactionV2State | undefined;
          const timer = setTimeout(() => { try { transaction.abort(); } catch {} }, DATA_FETCH_TIMEOUT_MS);
          transaction.onabort = transaction.onerror = () => {
            clearTimeout(timer);
            rejectTransaction(new Error('the reactions transaction did not commit'));
          };
          transaction.oncomplete = () => {
            clearTimeout(timer);
            if (result) resolveTransaction(result);
            else rejectTransaction(new Error('the reactions transaction had no result'));
          };
          const store = transaction.objectStore(REACTION_V2_FENCE_STORE);
          // A cursor distinguishes an absent key from a corrupt record whose value is undefined.
          const get = store.openCursor(url);
          get.onsuccess = () => {
            try {
              const stored = get.result?.value;
              const latest = newestFence(state.latest, stored, get.result !== null, slug);
              const seeded: ReactionV2State = { phase: 'loading', attempt: state.attempt, latest };
              result = event ? reactionV2Transition(seeded, event, slug) : { phase: 'ready', attempt: state.attempt, latest, value: latest ?? { reactions: [] } };
              if (event && result.phase === 'ready' && result.latest && canonical(result.latest) !== stored) {
                store.put(canonical(result.latest), url);
              }
            } catch {
              transaction.abort();
            }
          };
        });
      },
    };
  });
}

export interface PersistentReactionV2Options {
  slug: string;
  base: string;
  onState: (state: PersistentReactionV2State) => void;
  fetchImpl?: ReactionV2Fetch;
  openStore?: (url: string, slug: string, onUnavailable: () => void) => Promise<ReactionV2FenceStore>;
  /** Browser notifications request a fresh database read; their payload never supplies counts. */
  subscribe?: (refresh: () => void) => () => void;
  notify?: () => void;
}
export interface PersistentReactionV2Reader {
  readonly initial: Promise<void>;
  retry(): Promise<void>;
  refresh(): Promise<void>;
  reload(): Promise<void>;
  dispose(): void;
}

/** Actual component setup path; every initial load, refresh and retry consults durable state. */
export function loadPersistentReactionV2Totals(options: PersistentReactionV2Options): PersistentReactionV2Reader {
  let state: PersistentReactionV2State = initialReactionV2State();
  let store: ReactionV2FenceStore | undefined;
  let blocked = false;
  let disposed = false;
  // Serialize this page's notifications with network settlement; database transactions serialize tabs.
  let queue: Promise<void> = Promise.resolve();
  const emit = (next: PersistentReactionV2State) => { if (!disposed) { state = next; options.onState(next); } };
  const unavailable = () => {
    if (blocked || disposed) return;
    blocked = true;
    emit({ phase: 'failed', attempt: state.attempt, failure: 'unavailable', reason: 'persistent reactions storage is unavailable or inconsistent', fenceFailure: true });
    store?.close();
  };
  const enqueue = (work: () => Promise<void>) => {
    const pending = queue.then(async () => { if (!blocked && !disposed) await work(); }).catch(unavailable);
    queue = pending;
    return pending;
  };
  let url: string;
  try { url = reactionsV2FileUrl(options.base, options.slug); }
  catch { unavailable(); url = ''; }

  const settle = async (event?: DataEvent) => {
    if (!store) throw new Error('persistent reactions storage is unavailable');
    const next = await store.settle(state, event);
    if (!blocked && !disposed) {
      // Notifications only project a newly committed generation. Re-reading an unchanged or
      // absent fence must not turn a failed network load into ready, disabling its retry.
      if (event || (next.latest && (!state.latest || BigInt(next.latest.generation) > BigInt(state.latest.generation)))) emit(next);
      if (event && next.phase === 'ready' && next.latest) options.notify?.();
    }
  };
  const load = async () => {
    if (blocked || disposed) return;
    const attempt = state.attempt;
    const event = await fetchReactionV2File(url, attempt, options.fetchImpl);
    await enqueue(() => settle(event));
  };
  const initial = (async () => {
    if (blocked) return;
    try {
      store = await (options.openStore ?? openReactionV2FenceStore)(url, options.slug, unavailable);
      if (blocked || disposed) { store.close(); return; }
      // Preflight validates corrupt/unavailable state before making any network request. It does
      // not project unrefreshed counts; fetch settlement rechecks the fence in a new transaction.
      const seeded = await store.settle(state);
      state = { phase: 'loading', attempt: state.attempt, latest: seeded.latest };
      await load();
    } catch { unavailable(); }
  })();
  const refresh = () => enqueue(() => settle());
  let unsubscribe = () => {};
  try { unsubscribe = options.subscribe?.(() => { void initial.then(refresh); }) ?? unsubscribe; }
  catch { unavailable(); }
  return {
    initial,
    refresh: () => initial.then(refresh),
    reload: async () => {
      await initial;
      if (blocked || disposed || state.phase === 'loading') return;
      emit({ phase: 'loading', attempt: state.attempt + 1, latest: state.latest });
      await load();
    },
    retry: async () => {
      await initial;
      if (blocked || disposed || state.phase !== 'failed') return;
      emit({ phase: 'loading', attempt: state.attempt + 1, latest: state.latest });
      await load();
    },
    dispose: () => { disposed = true; unsubscribe(); store?.close(); },
  };
}

/** Optional cross-tab notifications plus revalidation after back/forward navigation or focus. */
export function subscribeReactionV2Fence(refresh: () => void): () => void {
  const visible = () => { if (document.visibilityState === 'visible') refresh(); };
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', visible);
  let channel: BroadcastChannel | undefined;
  try { channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL_NAME) : undefined; }
  catch { /* Database transactions still enforce every network settlement without notifications. */ }
  if (channel) channel.onmessage = refresh;
  return () => {
    window.removeEventListener('pageshow', refresh);
    window.removeEventListener('focus', refresh);
    document.removeEventListener('visibilitychange', visible);
    channel?.close();
  };
}

export function notifyReactionV2Fence(): void {
  try {
    if (typeof BroadcastChannel !== 'function') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(null);
    channel.close();
  } catch { /* Notification failure cannot bypass the durable transaction on the next load. */ }
}
