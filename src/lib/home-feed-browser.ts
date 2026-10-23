import {
  HomeFeedController, HOME_FEED_HISTORY_KEY, restoredFeedState,
  type FeedManifest, type RestoredFeedState,
} from './home-feed-client.ts';
import { batchUrl, domFeedTree, validateBatchTree } from './home-feed-protocol.ts';
import { loadHomeFeedHtml } from './home-feed-transport.ts';

const HOME_FEED_NEAR_END_PX = 500;

/** Bound scroll-driven History API writes; navigation still records the exact final position. */
export function createHistoryWriteGate(clock: () => number = () => performance.now()) {
  let lastSavedAt = -Infinity;
  return (force = false) => {
    const now = clock();
    if (!force && now - lastSavedAt < 1000) return false;
    lastSavedAt = now;
    return true;
  };
}

/**
 * Appending above a visible sentinel/footer can make native scroll anchoring emit another
 * downward scroll. Opt out while automatic batches remain, for every scrolling input method.
 * Keep the exact prior declaration so finishing or disposing returns ownership to the page.
 */
export function suppressFeedScrollAnchoring(style: CSSStyleDeclaration): () => void {
  const previousValue = style.getPropertyValue('overflow-anchor');
  const previousPriority = style.getPropertyPriority('overflow-anchor');
  style.setProperty('overflow-anchor', 'none', 'important');
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    if (previousValue) style.setProperty('overflow-anchor', previousValue, previousPriority);
    else style.removeProperty('overflow-anchor');
  };
}

/** Start once. Unsupported browsers retain the initial stories, panels, footer and News links. */
export function mountHomeFeed(root: HTMLElement) {
  if (root.dataset.feedMounted || !('IntersectionObserver' in window) || !('fetch' in window) || !('HTMLTemplateElement' in window)) return;
  root.dataset.feedMounted = 'true';
  const cards = root.querySelector<HTMLElement>('[data-home-feed-cards]');
  const sentinel = root.querySelector<HTMLElement>('[data-home-feed-sentinel]');
  const status = root.querySelector<HTMLElement>('[data-home-feed-status]');
  const errors = root.querySelector<HTMLElement>('[data-home-feed-error]');
  const retry = root.querySelector<HTMLButtonElement>('[data-home-feed-retry]');
  if (!cards || !sentinel || !status || !errors || !retry) return;
  const number = (name: string) => {
    const value = root.dataset[name];
    if (!value || !/^(0|[1-9]\d*)$/.test(value)) throw new Error('Invalid homepage configuration');
    return Number(value);
  };
  let controller: HomeFeedController<DocumentFragment>;
  let observer: IntersectionObserver | undefined;
  let restoring = false;
  let suspended = false;
  let frame = 0;
  let lifecycleGeneration = 0;
  let pendingRestoration: RestoredFeedState | null = null;
  let retryRequest = false;
  let restoreScrollAnchoring: (() => void) | undefined;
  const pageUrl = window.location.href;
  const historyWriteDue = createHistoryWriteGate();
  const save = (force = false) => {
    if (restoring || pendingRestoration || suspended || controller.state === 'disposed') return;
    if (!historyWriteDue(force)) return;
    const visible = [...document.querySelectorAll<HTMLElement>('[data-home-post]')]
      .find((element) => { const box = element.getBoundingClientRect(); return box.bottom > 0 && box.top < window.innerHeight; });
    const state: RestoredFeedState = {
      version: 1, snapshot: controller.manifest.snapshot, loadedBatches: controller.loadedBatches,
      anchor: visible?.dataset.homePost ?? null,
      anchorOffset: visible?.getBoundingClientRect().top ?? 0, scrollY: Math.max(0, window.scrollY),
    };
    try {
      const previous = typeof history.state === 'object' && history.state !== null && !Array.isArray(history.state) ? history.state : {};
      history.replaceState({ ...previous, [HOME_FEED_HISTORY_KEY]: state }, '');
    } catch (error) {
      // Browsers can disable history state in privacy modes; feed reading remains usable.
      console.warn('[home-feed] Unable to retain the reading position', error);
    }
  };
  const render = () => {
    const loading = controller.state === 'loading';
    const failed = controller.state === 'error';
    cards.setAttribute('aria-busy', String(loading));
    errors.hidden = !failed && !(loading && retryRequest);
    retry.hidden = controller.stale;
    // Retain focus during an explicit retry; repeated activation is rejected by the controller.
    retry.setAttribute('aria-disabled', String(loading));
    status.textContent = loading ? 'Loading more sightings…'
      : failed ? controller.stale ? 'The stories changed. Refresh this page or view all News.' : 'More sightings could not be loaded. Retry or view all News.'
      : controller.state === 'finished' && controller.loadedBatches > 0 ? `Showing the latest ${controller.manifest.plannedCount} sightings. View all News for the complete field guide.`
      : controller.loadedBatches > 0 ? `${controller.manifest.initialCount + controller.loadedBatches * controller.manifest.batchSize} sightings shown.` : '';
    if (controller.state === 'finished' || controller.state === 'disposed') {
      observer?.disconnect();
      restoreScrollAnchoring?.(); restoreScrollAnchoring = undefined;
    }
    if (!loading) { retryRequest = false; save(); }
  };
  try {
    const initialIds = JSON.parse(root.dataset.initialIds ?? 'null');
    const manifest: FeedManifest = {
      snapshot: root.dataset.snapshot ?? '', initialCount: number('initialCount'), initialLimit: number('initialLimit'),
      batchSize: number('batchSize'), batchCount: number('batchCount'), plannedCount: number('plannedCount'), maxAutoBatches: number('maxAutoBatches'),
    };
    if (!Array.isArray(initialIds) || initialIds.some((id) => typeof id !== 'string')) throw new Error('Invalid homepage IDs');
    controller = new HomeFeedController({
      manifest, initialIds, pageUrl,
      load: async (expected, signal) => {
        const url = batchUrl(root.dataset.batchPrefix ?? '', expected.index, pageUrl);
        const html = await loadHomeFeedHtml(url, { signal });
        // Parse inside an inert template so even rejected images/embeds cannot start loads.
        const parsed = document.createElement('template');
        parsed.innerHTML = html;
        const ids = validateBatchTree(domFeedTree(parsed.content), expected);
        const template = parsed.content.querySelector('template');
        if (!template) throw new Error('Missing homepage template');
        return { ids, content: document.importNode(template.content, true) };
      },
      append: (batch) => {
        const firstLink = batch.content.querySelector<HTMLAnchorElement>('h3 a');
        const retryFocused = document.activeElement === retry;
        cards.append(batch.content);
        // Only an explicit Retry can transfer focus to the newly available story.
        if (retryFocused) firstLink?.focus({ preventScroll: true });
      },
      changed: render,
    });
  } catch (error) {
    status.textContent = 'More sightings are available in News.';
    console.error('[home-feed] Invalid homepage configuration', error);
    return;
  }
  if (controller.state !== 'finished') restoreScrollAnchoring = suppressFeedScrollAnchoring(document.documentElement.style);
  controller.resetScroll(window.scrollY);
  const onScroll = () => {
    if (restoring || suspended) return;
    const box = sentinel.getBoundingClientRect();
    controller.scroll(window.scrollY, box.top <= window.innerHeight + HOME_FEED_NEAR_END_PX && box.bottom >= 0);
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; save(); });
  };
  const onRetry = () => {
    if (controller.state !== 'error' || controller.stale) return;
    retryRequest = true;
    if (pendingRestoration) resumePendingRestoration(true);
    else void controller.retry();
  };
  observer = new IntersectionObserver((entries) => {
    if (!restoring && !suspended) controller.observe(entries.some((entry) => entry.target === sentinel && entry.isIntersecting));
  }, { rootMargin: `0px 0px ${HOME_FEED_NEAR_END_PX}px 0px`, threshold: 0 });
  const observe = () => { if (controller.state !== 'finished' && controller.state !== 'disposed') observer?.observe(sentinel); };
  /** Retain the validated destination through suspension and consume it only after positioning. */
  function resumePendingRestoration(retryFailedBatch = false) {
    if (!pendingRestoration || restoring || suspended || controller.state === 'disposed') return;
    if (controller.state === 'error' && !retryFailedBatch) { render(); observe(); return; }
    const target = pendingRestoration;
    const generation = lifecycleGeneration;
    const current = () => generation === lifecycleGeneration && pendingRestoration === target && !suspended && controller.state !== 'disposed';
    restoring = true;
    void (async () => {
      if (retryFailedBatch) {
        await controller.retry();
        if (!current()) return;
      }
      const completed = await controller.restore(target.loadedBatches);
      if (!current()) return;
      if (!completed) { restoring = false; controller.resetScroll(window.scrollY); render(); observe(); return; }
      requestAnimationFrame(() => {
        if (!current()) return;
        const anchor = target.anchor ? document.getElementById(`home-post-${target.anchor}`) : null;
        const y = anchor ? window.scrollY + anchor.getBoundingClientRect().top - target.anchorOffset : target.scrollY;
        window.scrollTo(0, Math.max(0, y));
        requestAnimationFrame(() => {
          if (!current()) return;
          pendingRestoration = null;
          restoring = false;
          controller.resetScroll(window.scrollY);
          render(); observe();
        });
      });
    })();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  retry.addEventListener('click', onRetry);
  const onPageHide = (event: PageTransitionEvent) => {
    save(true);
    ++lifecycleGeneration;
    suspended = true;
    observer?.disconnect();
    cancelAnimationFrame(frame); frame = 0;
    if (event.persisted) controller.cancel();
    else {
      controller.dispose();
      window.removeEventListener('scroll', onScroll);
      retry.removeEventListener('click', onRetry);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('pagehide', onPageHide);
    }
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (!event.persisted || !suspended) return;
    restoring = false;
    suspended = false;
    controller.resetScroll(window.scrollY);
    controller.observe(false);
    if (pendingRestoration) resumePendingRestoration();
    else observe();
  };
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  pendingRestoration = navigation?.type === 'back_forward' ? restoredFeedState(history.state?.[HOME_FEED_HISTORY_KEY], controller.manifest) : null;
  if (pendingRestoration) resumePendingRestoration();
  else { render(); observe(); }
}
