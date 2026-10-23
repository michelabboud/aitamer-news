import { HomeFeedProtocolError, HOME_POST_ID, HOME_POST_ID_MAX, type BatchExpectation } from './home-feed-protocol.ts';
import { validateHomeFeedSettings } from './home-feed.ts';

export type HomeFeedState = 'idle' | 'loading' | 'error' | 'finished' | 'disposed';
export interface FeedManifest {
  snapshot: string; initialCount: number; initialLimit: number; batchSize: number;
  batchCount: number; plannedCount: number; maxAutoBatches: number;
}
export interface LoadedBatch<T> { ids: string[]; content: T }
export interface RestoredFeedState {
  version: 1; snapshot: string; loadedBatches: number; anchor: string | null; anchorOffset: number; scrollY: number;
}
export const HOME_FEED_HISTORY_KEY = 'aitamerHomeFeedV1';

export function validateFeedManifest(manifest: FeedManifest): FeedManifest {
  validateHomeFeedSettings({ initialPostCount: manifest.initialLimit, nextBatchSize: manifest.batchSize, maxAutoBatches: manifest.maxAutoBatches });
  const { initialCount, initialLimit, plannedCount, batchCount, batchSize, maxAutoBatches, snapshot } = manifest;
  if (!/^[a-f0-9]{64}$/.test(snapshot) || ![initialCount, plannedCount, batchCount].every(Number.isSafeInteger)
    || initialCount < 0 || initialCount > initialLimit || plannedCount < initialCount
    || plannedCount > initialLimit + batchSize * maxAutoBatches || batchCount < 0 || batchCount > maxAutoBatches
    || batchCount !== Math.ceil((plannedCount - initialCount) / batchSize)
    || (initialCount < initialLimit && plannedCount !== initialCount)) throw new Error('Invalid homepage feed manifest');
  return manifest;
}

export function restoredFeedState(value: unknown, manifest: FeedManifest): RestoredFeedState | null {
  if (typeof value !== 'object' || value === null) return null;
  const state = value as RestoredFeedState;
  if (state.version !== 1 || state.snapshot !== manifest.snapshot || !Number.isSafeInteger(state.loadedBatches)
    || state.loadedBatches < 0 || state.loadedBatches > manifest.batchCount
    || (state.anchor !== null && (typeof state.anchor !== 'string' || state.anchor.length > HOME_POST_ID_MAX || !HOME_POST_ID.test(state.anchor)))
    || !Number.isFinite(state.anchorOffset) || Math.abs(state.anchorOffset) > 10000000
    || !Number.isFinite(state.scrollY) || state.scrollY < 0 || state.scrollY > 10000000) return null;
  return state;
}

/** One request and one cursor. DOM, network and history adapters stay outside this state machine. */
export class HomeFeedController<T> {
  readonly manifest: FeedManifest;
  state: HomeFeedState;
  loadedBatches = 0;
  stale = false;
  error: unknown;
  private seenIds: Set<string>;
  private near = false;
  private intent = false;
  private lastScroll = 0;
  private restoring = false;
  private restorationGeneration = 0;
  private request?: AbortController;
  private generation = 0;
  private options: {
    manifest: FeedManifest; initialIds: string[]; pageUrl: string;
    load: (expected: BatchExpectation, signal: AbortSignal) => Promise<LoadedBatch<T>>;
    append: (batch: LoadedBatch<T>) => void; changed?: (controller: HomeFeedController<T>) => void;
  };

  constructor(options: HomeFeedController<T>['options']) {
    this.options = options;
    this.manifest = validateFeedManifest(options.manifest);
    this.seenIds = new Set(options.initialIds);
    if (this.seenIds.size !== options.initialIds.length || options.initialIds.length !== this.manifest.initialCount
      || options.initialIds.some((id) => typeof id !== 'string' || id.length > HOME_POST_ID_MAX || !HOME_POST_ID.test(id))) throw new Error('Invalid initial homepage post IDs');
    this.state = this.manifest.batchCount ? 'idle' : 'finished';
  }

  private publish() { this.options.changed?.(this); }
  resetScroll(y: number) { this.lastScroll = y; this.intent = false; }
  scroll(y: number, near?: boolean) {
    if (near !== undefined) this.near = near;
    const downward = Number.isFinite(y) && y > this.lastScroll;
    this.lastScroll = y;
    if (!downward) this.intent = false;
    if (downward && this.state === 'idle' && !this.restoring) {
      this.intent = true;
      if (this.near) void this.next();
    }
  }
  observe(near: boolean) {
    this.near = near;
    if (near && this.intent && this.state === 'idle' && !this.restoring) void this.next();
  }
  retry() {
    if (this.state !== 'error' || this.stale || this.restoring) return Promise.resolve();
    return this.next();
  }
  async restore(count: number) {
    if (!Number.isSafeInteger(count) || count < this.loadedBatches || count > this.manifest.batchCount || this.state === 'loading' || this.state === 'disposed') return false;
    const restorationGeneration = ++this.restorationGeneration;
    this.restoring = true;
    try {
      while (restorationGeneration === this.restorationGeneration && this.loadedBatches < count && this.state === 'idle') await this.next();
      return restorationGeneration === this.restorationGeneration && this.loadedBatches >= count;
    } finally {
      if (restorationGeneration === this.restorationGeneration) { this.restoring = false; this.intent = false; }
    }
  }
  private async next() {
    if (this.state === 'loading' || this.state === 'finished' || this.state === 'disposed') return;
    const index = this.loadedBatches + 1;
    const offset = this.manifest.initialCount + this.loadedBatches * this.manifest.batchSize;
    const expected = { snapshot: this.manifest.snapshot, index, offset,
      count: Math.min(this.manifest.batchSize, this.manifest.plannedCount - offset),
      seenIds: new Set(this.seenIds), pageUrl: this.options.pageUrl };
    const request = new AbortController();
    const generation = ++this.generation;
    this.request = request;
    this.intent = false;
    this.stale = false;
    this.error = undefined;
    this.state = 'loading';
    this.publish();
    try {
      const batch = await this.options.load(expected, request.signal);
      if (request.signal.aborted || generation !== this.generation) return;
      if (batch.ids.length !== expected.count || new Set(batch.ids).size !== batch.ids.length
        || batch.ids.some((id) => typeof id !== 'string' || id.length > HOME_POST_ID_MAX || !HOME_POST_ID.test(id) || this.seenIds.has(id))) throw new HomeFeedProtocolError('Invalid homepage batch IDs');
      this.options.append(batch);
      batch.ids.forEach((id) => this.seenIds.add(id));
      this.loadedBatches = index;
      this.state = index === this.manifest.batchCount ? 'finished' : 'idle';
    } catch (error) {
      if (request.signal.aborted || generation !== this.generation) return;
      this.error = error;
      this.stale = error instanceof HomeFeedProtocolError && error.stale;
      this.state = 'error';
    } finally {
      if (generation === this.generation) { this.request = undefined; this.publish(); }
    }
  }
  /** Suspend pending work for native back-forward cache; keep the already appended DOM. */
  cancel() {
    ++this.generation;
    ++this.restorationGeneration;
    this.restoring = false;
    this.request?.abort(); this.request = undefined;
    this.intent = false;
    if (this.state === 'loading') this.state = 'idle';
    this.publish();
  }
  dispose() { this.cancel(); this.state = 'disposed'; this.publish(); }
}
