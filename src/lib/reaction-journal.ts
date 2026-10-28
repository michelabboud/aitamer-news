/**
 * Private reaction intent journal (ADR 0128). A joint IndexedDB transaction pins the public
 * snapshot and persists the immutable intent BEFORE POST. Numbers remain provisional against
 * that pin until all issued sequences are processed/superseded and the public fence reaches the
 * receipt barrier. No receipt claims a personal contribution or exposes prior source state.
 *
 * PRIVACY GATE: bearer capability, choice/intent identities and processing watermarks are private
 * browser data, never public-envelope fields, URLs, notification payloads or logs. The stream
 * expires after 30 days; authenticated terminal closure has a further 24-hour recovery grace.
 * Expired unresolved work is never replayed under a new identity. Rotation requires a terminal
 * close receipt and its public barrier, or an explicitly disclosed local continuity reset.
 * Client time and HTTP 410 never prove settlement. Clearing site data loses local
 * continuity and cannot revoke requests already issued. No public activation is authorized here.
 */
import { DATA_FETCH_TIMEOUT_MS } from './data-host.ts';
import { isKnownReaction, isReactionV2Generation, liveCounts, parseReactionV2File, reactionsV2FileUrl, type ClientReactionFile, type ClientReactionV2File, type ReactionId } from './reactions.ts';
import { REACTION_JOURNAL_STORE, REACTION_V2_FENCE_STORE, openReactionBrowserDatabase, notifyReactionV2Fence, subscribeReactionV2Fence } from './reactions-v2-persistence.ts';
import { REACTION_CLOSE_GRACE_MS, REACTION_STREAM_MAX_OPERATIONS, closeReactionStream, validateReactionClosure, issueReactionStream, sendReactionIntent, reactionOperation, validateReactionIntent, validateReactionReceipt, validateReactionStream, isReactionOperation, type ReactionIntent, type ReactionStream, type ReactionReceiptFetch, type ReactionClosure } from './reaction-receipts.ts';

const JOURNAL_MAX_BYTES = 128 * 1024; // 256 bounded intents, one capability and two bounded snapshots.
const DELIVERY_LEASE_MS = DATA_FETCH_TIMEOUT_MS + 2000;
const EMPTY: ClientReactionFile = { reactions: [] };
export const REACTION_CONFIRMATION_PENDING = 'Your reaction is waiting for confirmation. Counts are provisional.';
export const REACTION_CONFIRMATION_EXPIRED = 'Earlier confirmation expired. Counts are unavailable while earlier requests remain unresolved.';
export const REACTION_CONFIRMATION_STORAGE = 'Your reaction could not be saved. Counts are unavailable.';
export const REACTION_CONFIRMATION_RESET = 'Local confirmation reset. Earlier requests may still finish. Choose again to send a new request.';
export const REACTION_RESET_DISCLOSURE = 'Resetting discards local retry history; requests already sent may still finish.';
const STREAM_FULL = 'Earlier reactions are still confirming. Try your choice again shortly.';

interface Pin { readonly bytes: string | null; readonly known: boolean; readonly choice: ReactionId | null }
interface Lease { readonly token: string; readonly until: number }
interface Journal {
  version: 1; revision: string; epoch: string; selected: ReactionId | null; stream: ReactionStream | null;
  intents: ReactionIntent[]; through: string; barrier: string | null; pin: Pin | null;
  seen: string | null; closure: ReactionClosure | null; resetUncertain: boolean; unrecoverable: boolean; lease: Lease | null; attempted: string;
}
export interface ReactionJournalView {
  readonly choice: ReactionId | null;
  readonly counts: Map<string, number>; readonly unknown: number; readonly known: boolean;
  readonly provisional: boolean; readonly notice: string; readonly storageFailure?: true; readonly canReset: boolean;
}
interface Snapshot { readonly order: bigint; journal: Journal; envelope: ClientReactionV2File | undefined; view: ReactionJournalView }
interface Delivery { readonly epoch: string; readonly token: string; readonly intent: ReactionIntent; readonly stream: ReactionStream | null; readonly closing: boolean }
export interface ReactionJournalOptions {
  slug: string; base: string; endpoint: string; initialChoice: ReactionId | null;
  onState: (view: ReactionJournalView) => void;
  fetchImpl?: ReactionReceiptFetch; now?: () => number;
  openDatabase?: typeof openReactionBrowserDatabase;
  subscribe?: (refresh: () => void) => () => void;
}
export interface ReactionJournalReader {
  readonly initial: Promise<void>;
  choose(choice: ReactionId | null): Promise<void>;
  refresh(publicReady?: boolean): Promise<void>;
  retry(): Promise<void>;
  reset(): Promise<void>;
  block(): void;
  dispose(): void;
}
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: string[]): value is Record<string, unknown> { return record(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)); }
function choice(value: unknown): value is ReactionId | null { return value === null || (typeof value === 'string' && isKnownReaction(value)); }
function zeroSequence(value: unknown): value is string { return value === '0' || (typeof value === 'string' && /^[1-9][0-9]{0,2}(?![\s\S])/.test(value) && Number(value) <= REACTION_STREAM_MAX_OPERATIONS); }
function envelope(bytes: unknown, slug: string): ClientReactionV2File | undefined {
  if (bytes === null) return undefined;
  const checked = parseReactionV2File(bytes, slug); if (!checked.ok) throw new Error('invalid reaction journal snapshot'); return checked.value;
}
function parseJournal(raw: unknown, slug: string, now: number): Journal {
  if (typeof raw !== 'string' || raw.length > JOURNAL_MAX_BYTES || new TextEncoder().encode(raw).byteLength > JOURNAL_MAX_BYTES) throw new Error('invalid reaction journal');
  const value: unknown = JSON.parse(raw);
  if (JSON.stringify(value) !== raw || !exact(value, ['version', 'revision', 'epoch', 'selected', 'stream', 'intents', 'through', 'barrier', 'pin', 'seen', 'closure', 'resetUncertain', 'unrecoverable', 'lease', 'attempted']) || value.version !== 1 || typeof value.resetUncertain !== 'boolean' || typeof value.unrecoverable !== 'boolean' || !isReactionV2Generation(value.revision) || !isReactionOperation(value.epoch) || !choice(value.selected) || !Array.isArray(value.intents) || value.intents.length > REACTION_STREAM_MAX_OPERATIONS || !zeroSequence(value.through) || !zeroSequence(value.attempted) || (value.stream !== null && !validateReactionStream(value.stream, slug, now, true))) throw new Error('invalid reaction journal');
  const operations = new Set<string>();
  for (const [index, intent] of value.intents.entries()) {
    if (!validateReactionIntent(intent) || intent.sequence !== String(index + 1) || operations.has(intent.operation)) throw new Error('invalid reaction journal intents'); operations.add(intent.operation);
  }
  if (Number(value.through) > value.intents.length || Number(value.attempted) > value.intents.length || (value.through === '0' ? value.barrier !== null : typeof value.barrier !== 'string')) throw new Error('invalid reaction journal fence');
  if (value.barrier !== null && !isReactionV2Generation(value.barrier)) throw new Error('invalid reaction journal barrier');
  envelope(value.seen, slug);
  if (value.closure !== null && (value.stream === null || !validateReactionClosure(value.closure, value.stream as ReactionStream))) throw new Error('invalid reaction journal closure');
  if (value.pin !== null) {
    if (!exact(value.pin, ['bytes', 'known', 'choice']) || typeof value.pin.known !== 'boolean' || !choice(value.pin.choice)) throw new Error('invalid reaction journal pin'); envelope(value.pin.bytes, slug);
  } else if (Number(value.through) < value.intents.length && value.closure === null) throw new Error('unresolved reaction journal lost its pin');
  if (value.lease !== null && (!exact(value.lease, ['token', 'until']) || !isReactionOperation(value.lease.token) || typeof value.lease.until !== 'number' || !Number.isSafeInteger(value.lease.until))) throw new Error('invalid reaction journal lease');
  return value as unknown as Journal;
}
function fresh(initialChoice: ReactionId | null): Journal {
  return { version: 1, revision: '1', epoch: reactionOperation(), selected: initialChoice, stream: null, intents: [], through: '0', barrier: null, pin: null, seen: null, closure: null, resetUncertain: false, unrecoverable: false, lease: null, attempted: '0' };
}
function expired(journal: Journal, now: number): boolean { return journal.stream !== null && Date.parse(journal.stream.expiresAt) <= now; }
function settled(journal: Journal, latest: ClientReactionV2File | undefined): boolean {
  return journal.intents.length === 0 || (journal.closure !== null && latest !== undefined && BigInt(latest.generation) >= BigInt(journal.closure.generation)) || (Number(journal.through) >= journal.intents.length && journal.barrier !== null && latest !== undefined && BigInt(latest.generation) >= BigInt(journal.barrier));
}

export function createReactionJournal(options: ReactionJournalOptions): ReactionJournalReader {
  const now = options.now ?? (() => Date.now());
  let url: string | undefined;
  try { url = reactionsV2FileUrl(options.base, options.slug); } catch { /* Initial state fails closed below. */ }
  let db: IDBDatabase | undefined; let blocked = false; let disposed = false; let hadJournal = false;
  let publicReady = false; let currentChoice = options.initialChoice;
  let latestMemory: string | null = null; let nextSnapshotOrder = 0n; let renderedOrder = 0n; let renderedEpoch: string | undefined; let damagedBytes: string | undefined;
  const unavailable = () => {
    if (blocked || disposed) return; blocked = true;
    options.onState({ choice: currentChoice, ...liveCounts(EMPTY, null, null), known: false, provisional: false, notice: REACTION_CONFIRMATION_STORAGE, storageFailure: true, canReset: damagedBytes !== undefined }); db?.close();
  };
  const transaction = <T>(action: (journal: Journal, latest: ClientReactionV2File | undefined) => T): Promise<{ value: T; snapshot: Snapshot; changed: boolean }> => new Promise((resolve, reject) => {
    if (!db || !url || blocked || disposed) { reject(new Error('reaction journal unavailable')); return; }
    const order = ++nextSnapshotOrder;
    const tx = db.transaction([REACTION_JOURNAL_STORE, REACTION_V2_FENCE_STORE], 'readwrite');
    const timer = setTimeout(() => { try { tx.abort(); } catch {} }, DATA_FETCH_TIMEOUT_MS);
    const journals = tx.objectStore(REACTION_JOURNAL_STORE);
    const privateRead = journals.openCursor(url); const publicRead = tx.objectStore(REACTION_V2_FENCE_STORE).openCursor(url);
    let pending = 2; let result: { value: T; snapshot: Snapshot; changed: boolean } | undefined;
    tx.onabort = tx.onerror = () => { clearTimeout(timer); reject(new Error('reaction journal transaction failed')); };
    tx.oncomplete = () => { clearTimeout(timer); result ? resolve(result) : reject(new Error('reaction journal transaction empty')); };
    const ready = () => {
      if (--pending) return;
      try {
        const raw = privateRead.result?.value;
        if (!privateRead.result && hadJournal) throw new Error('reaction journal was cleared');
        let journal: Journal;
        try { journal = privateRead.result ? parseJournal(raw, options.slug, now()) : fresh(options.initialChoice); }
        catch (error) { if (typeof raw === 'string' && raw.length <= JOURNAL_MAX_BYTES) damagedBytes = raw; throw error; }
        const stored = publicRead.result ? envelope(publicRead.result.value, options.slug) : undefined;
        const previous = envelope(journal.seen ?? latestMemory, options.slug);
        if (previous && (!stored || BigInt(stored.generation) < BigInt(previous.generation) || (stored.generation === previous.generation && JSON.stringify(stored) !== JSON.stringify(previous)))) throw new Error('public reaction fence regressed');
        if (stored) journal.seen = `${JSON.stringify(stored)}\n`;
        if (settled(journal, stored)) journal.pin = null;
        const value = action(journal, stored);
        if (settled(journal, stored)) journal.pin = null;
        if (JSON.stringify(journal) !== raw) journal.revision = String(BigInt(journal.revision) + 1n);
        const bytes = JSON.stringify(journal);
        if (new TextEncoder().encode(bytes).byteLength > JOURNAL_MAX_BYTES) throw new Error('reaction journal too large');
        const changed = bytes !== raw;
        if (changed) journals.put(bytes, url);
        const pinned = journal.pin; const file = pinned ? envelope(pinned.bytes, options.slug) ?? EMPTY : stored ?? EMPTY;
        const counts = pinned ? liveCounts(file, pinned.choice, journal.selected) : liveCounts(file, null, null);
        const isExpired = expired(journal, now());
        const view: ReactionJournalView = { choice: journal.selected, ...counts, known: isExpired && pinned !== null ? false : pinned?.known ?? (stored !== undefined || publicReady), provisional: pinned !== null, notice: isExpired && !settled(journal, stored) ? REACTION_CONFIRMATION_EXPIRED : pinned ? REACTION_CONFIRMATION_PENDING : journal.resetUncertain ? REACTION_CONFIRMATION_RESET : '', canReset: journal.unrecoverable || (isExpired && !settled(journal, stored) && journal.stream !== null && now() >= Date.parse(journal.stream.expiresAt) + REACTION_CLOSE_GRACE_MS) };
        result = { value, changed, snapshot: { order, journal, envelope: stored, view } };
      } catch { tx.abort(); }
    };
    privateRead.onsuccess = ready; publicRead.onsuccess = ready;
  });
  // Every snapshot is read in an overlapping readwrite transaction, so this reader's
  // transaction creation order is also its database observation order. Compare that local
  // order to reject delayed callbacks. A durable revision belongs to its journal epoch: a
  // damaged-record reset cannot trust/inherit it, and other tabs may miss the damaged bytes.
  // Such tabs must still project the validated replacement, including its reset uncertainty.
  const emit = (snapshot: Snapshot) => { if (!blocked && !disposed && snapshot.order >= renderedOrder) { renderedOrder = snapshot.order; renderedEpoch = snapshot.journal.epoch; hadJournal = true; latestMemory = snapshot.journal.seen; currentChoice = snapshot.view.choice; options.onState(snapshot.view); } };
  const inspect = async () => { const result = await transaction(() => {}); emit(result.snapshot); return result.snapshot; };
  const deliver = async (force: boolean) => {
    if (blocked || disposed) return;
    try {
      const claimed = await transaction((journal): Delivery | null => {
        const closing = expired(journal, now());
        if (closing && journal.unrecoverable && !force) return null;
        if ((journal.lease && journal.lease.until > now()) || journal.intents.length === 0) return null;
        if (closing ? journal.closure !== null || (journal.stream !== null && now() >= Date.parse(journal.stream.expiresAt) + REACTION_CLOSE_GRACE_MS) : Number(journal.through) >= journal.intents.length || (!force && Number(journal.attempted) >= journal.intents.length)) return null;
        const token = reactionOperation(); journal.lease = { token, until: now() + DELIVERY_LEASE_MS }; journal.attempted = String(journal.intents.length);
        return { epoch: journal.epoch, token, intent: journal.intents.at(-1)!, stream: journal.stream, closing };
      });
      emit(claimed.snapshot);
      const work = claimed.value; if (!work) return;
      if (work.closing && work.stream) {
        const answer = await closeReactionStream(options.endpoint, work.stream, options.fetchImpl);
        const saved = await transaction(journal => {
          if (journal.epoch !== work.epoch || journal.stream?.stream !== work.stream!.stream) return false;
          if (journal.lease?.token === work.token) journal.lease = null;
          if (!answer.ok) { if (!journal.closure && (answer.status === 403 || answer.status === 409 || answer.status === 410)) journal.unrecoverable = true; return false; }
          if (!validateReactionClosure(answer.value, journal.stream)) throw new Error('invalid terminal reaction closure');
          if (journal.closure && JSON.stringify(journal.closure) !== JSON.stringify(answer.value)) throw new Error('reaction closure changed');
          journal.closure = answer.value; journal.unrecoverable = false; return true;
        });
        emit(saved.snapshot); if (saved.value) notifyReactionV2Fence(); return;
      }
      if (!work.stream) {
        const answer = await issueReactionStream(options.endpoint, options.slug, now(), options.fetchImpl);
        const saved = await transaction(journal => {
          if (journal.epoch !== work.epoch || journal.lease?.token !== work.token) return false;
          journal.lease = null;
          if (!answer.ok) { if (!journal.closure && (answer.status === 403 || answer.status === 409 || answer.status === 410)) journal.unrecoverable = true; return false; }
          journal.stream = answer.value; journal.unrecoverable = false; return true;
        });
        emit(saved.snapshot); if (saved.value) { notifyReactionV2Fence(); await deliver(true); }
        return;
      }
      const answer = await sendReactionIntent(options.endpoint, work.stream, work.intent, options.fetchImpl);
      const saved = await transaction(journal => {
        // Old streams and old leases never overwrite newer stream/intent state. A valid duplicate
        // receipt may still advance coverage even when another tab acquired a later delivery lease.
        if (journal.epoch !== work.epoch || journal.stream?.stream !== work.stream!.stream) return false;
        if (journal.lease?.token === work.token) journal.lease = null;
        if (!answer.ok) { if (!journal.closure && (answer.status === 403 || answer.status === 409 || answer.status === 410)) journal.unrecoverable = true; return false; }
        journal.unrecoverable = false;
        const receipt = answer.value;
        if (!validateReactionReceipt(receipt, journal.stream, work.intent) || Number(receipt.processedThrough) > journal.intents.length) throw new Error('receipt does not cover issued journal work');
        if (BigInt(receipt.processedThrough) > BigInt(journal.through)) { journal.through = receipt.processedThrough; journal.barrier = receipt.generation; }
        else if (receipt.processedThrough === journal.through && (journal.barrier === null || BigInt(receipt.generation) < BigInt(journal.barrier))) journal.barrier = receipt.generation;
        return true;
      });
      emit(saved.snapshot); if (saved.value) notifyReactionV2Fence();
      if (saved.snapshot.journal.intents.length > Number(saved.snapshot.journal.attempted)) { await deliver(false); }
    } catch { unavailable(); }
  };
  const initial = (async () => { try { if (!url) { unavailable(); return; } db = await (options.openDatabase ?? openReactionBrowserDatabase)(unavailable); if (blocked || disposed) { db.close(); return; } await inspect(); void deliver(true); } catch { unavailable(); } })();
  const refresh = async (ready = false) => {
    await initial; if (blocked || disposed) return; if (ready) publicReady = true;
    try { await inspect(); await deliver(false); } catch { unavailable(); }
  };
  let unsubscribe = () => {};
  try { unsubscribe = (options.subscribe ?? subscribeReactionV2Fence)(() => { void refresh(); }); } catch { unavailable(); }
  let resetFlight: Promise<void> | undefined;
  return {
    initial,
    refresh,
    retry: async () => { await initial; await deliver(true); },
    choose: async next => {
      await initial; if (blocked || disposed) return;
      try {
        let capacity = false;
        const changed = await transaction((journal, latest) => {
          if ((expired(journal, now()) || journal.intents.length === REACTION_STREAM_MAX_OPERATIONS) && settled(journal, latest)) {
            // Durable processing/publication proof settles old work, including a validated terminal
            // closure when expired. Only an explicit choice starts the next stream.
            const replacement = fresh(journal.selected); replacement.resetUncertain = journal.resetUncertain; replacement.seen = journal.seen; replacement.revision = journal.revision; Object.assign(journal, replacement);
          }
          if (expired(journal, now())) { capacity = true; return; }
          if (journal.intents.length >= REACTION_STREAM_MAX_OPERATIONS) { capacity = true; return; }
          if (journal.pin === null) journal.pin = { bytes: latest ? `${JSON.stringify(latest)}\n` : null, known: latest !== undefined || publicReady, choice: journal.selected };
          const intent: ReactionIntent = { sequence: String(journal.intents.length + 1), operation: reactionOperation(), reaction: next };
          if (!validateReactionIntent(intent)) throw new Error('invalid reaction choice');
          journal.intents.push(intent); journal.selected = next;
        });
        emit(changed.snapshot);
        if (capacity) options.onState({ ...changed.snapshot.view, notice: expired(changed.snapshot.journal, now()) ? REACTION_CONFIRMATION_EXPIRED : STREAM_FULL });
        else { notifyReactionV2Fence(); await deliver(false); }
      } catch { unavailable(); }
    },
    reset: () => {
      // Coalesce before the first await: double activation must not create two owners
      // of the recovery connection or replace an epoch twice. Failed attempts release this.
      if (resetFlight) return resetFlight;
      resetFlight = (async () => {
        await initial;
        if (disposed) return;
        if (blocked && damagedBytes !== undefined) {
          const expected = damagedBytes;
          let recoveryDb: IDBDatabase | undefined;
          try {
            // A recovery attempt owns its connection until successful adoption. A losing
            // or failed attempt can close only that connection, never another live reader.
            recoveryDb = await (options.openDatabase ?? openReactionBrowserDatabase)(() => { if (db === recoveryDb) unavailable(); });
            if (disposed) { recoveryDb.close(); return; }
            const recovered = await new Promise<Snapshot | undefined>((resolve, reject) => {
              const order = ++nextSnapshotOrder;
              const tx = recoveryDb!.transaction([REACTION_JOURNAL_STORE, REACTION_V2_FENCE_STORE], 'readwrite');
              const timer = setTimeout(() => { try { tx.abort(); } catch {} }, DATA_FETCH_TIMEOUT_MS);
              const privateStore = tx.objectStore(REACTION_JOURNAL_STORE); const own = privateStore.openCursor(url!);
              const pub = tx.objectStore(REACTION_V2_FENCE_STORE).openCursor(url!); let remaining = 2; let snapshot: Snapshot | undefined;
              tx.onabort = tx.onerror = () => { clearTimeout(timer); reject(new Error('reaction reset failed')); };
              tx.oncomplete = () => { clearTimeout(timer); resolve(snapshot); };
              const ready = () => {
                if (--remaining) return;
                try {
                  // Exact observed bytes, rather than a guessed epoch, authorize only the damaged
                  // record the reader saw. A concurrent newer record is never replaced.
                  if (own.result?.value !== expected) return;
                  const latest = pub.result ? envelope(pub.result.value, options.slug) : undefined;
                  const previous = envelope(latestMemory, options.slug);
                  if (previous && (!latest || BigInt(latest.generation) < BigInt(previous.generation) || (latest.generation === previous.generation && JSON.stringify(latest) !== JSON.stringify(previous)))) throw new Error('public reset fence changed');
                  const journal = fresh(currentChoice); journal.resetUncertain = true; journal.seen = latest ? `${JSON.stringify(latest)}\n` : null;
                  privateStore.put(JSON.stringify(journal), url!);
                  snapshot = { order, journal, envelope: latest, view: { choice: currentChoice, ...liveCounts(latest ?? EMPTY, null, null), known: latest !== undefined || publicReady, provisional: false, notice: REACTION_CONFIRMATION_RESET, canReset: false } };
                } catch { tx.abort(); }
              };
              own.onsuccess = ready; pub.onsuccess = ready;
            });
            if (recovered && !disposed) { db = recoveryDb; blocked = false; damagedBytes = undefined; emit(recovered); notifyReactionV2Fence(); }
            else recoveryDb.close();
          } catch { recoveryDb?.close(); if (!disposed) options.onState({ choice: currentChoice, ...liveCounts(EMPTY, null, null), known: false, provisional: false, notice: REACTION_CONFIRMATION_STORAGE, storageFailure: true, canReset: true }); }
          return;
        }
        if (blocked || !renderedEpoch) return;
        const expectedEpoch = renderedEpoch;
        try {
          const reset = await transaction((journal, latest) => {
            if (journal.epoch !== expectedEpoch) return false;
            const replacement = fresh(journal.selected);
            replacement.revision = journal.revision; replacement.seen = journal.seen;
            replacement.resetUncertain = true;
            Object.assign(journal, replacement);
            return true;
          });
          emit(reset.snapshot);
          if (reset.value) notifyReactionV2Fence();
          // No stream/intent network request follows reset. An explicit later choice is required.
        } catch { unavailable(); }
      })().finally(() => { resetFlight = undefined; });
      return resetFlight;
    },
    block: unavailable,
    dispose: () => { disposed = true; unsubscribe(); db?.close(); },
  };
}
