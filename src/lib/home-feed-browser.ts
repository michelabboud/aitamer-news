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
 * Appends and implicit focus/navigation animations can emit downward scrolls without new input.
 * Keep automatic loading outside both effects; physical scrolling remains native. Restore each
 * exact prior declaration when loading finishes or the adapter is disposed.
 */
export function suppressFeedScrollEffects(style: CSSStyleDeclaration): () => void {
  const properties = [['overflow-anchor', 'none'], ['scroll-behavior', 'auto']] as const;
  const previous = properties.map(([name]) => ({ name, value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) }));
  for (const [name, value] of properties) style.setProperty(name, value, 'important');
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    for (const { name, value, priority } of previous) {
      if (value) style.setProperty(name, value, priority);
      else style.removeProperty(name);
    }
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
  const refresh = root.querySelector<HTMLAnchorElement>('[data-home-feed-refresh]');
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
  let restoreScrollEffects: (() => void) | undefined;
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
    const hidingFocusedRetry = controller.stale && document.activeElement === retry;
    cards.setAttribute('aria-busy', String(loading));
    errors.hidden = !failed && !(loading && retryRequest);
    retry.hidden = controller.stale;
    if (hidingFocusedRetry) refresh?.focus({ preventScroll: true });
    // Retain focus during an explicit retry; repeated activation is rejected by the controller.
    retry.setAttribute('aria-disabled', String(loading));
    status.textContent = loading ? 'Loading more sightings…'
      : failed ? controller.stale ? 'The stories changed. Refresh this page or view all News.' : 'More sightings could not be loaded. Retry or view all News.'
      : controller.state === 'finished' && controller.loadedBatches > 0 ? `Showing the latest ${controller.manifest.plannedCount} sightings. View all News for the complete field guide.`
      : controller.loadedBatches > 0 ? `${controller.manifest.initialCount + controller.loadedBatches * controller.manifest.batchSize} sightings shown.` : '';
    if (controller.state === 'finished' || controller.state === 'disposed') {
      observer?.disconnect();
      restoreScrollEffects?.(); restoreScrollEffects = undefined;
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
        const focusedBeforeAppend = document.activeElement;
        const recoveryFocused = focusedBeforeAppend !== null && errors.contains(focusedBeforeAppend);
        const outsideRetryViewport = retryRequest && !recoveryFocused ? { left: window.scrollX, top: window.scrollY } : null;
        cards.append(batch.content);
        // The recovery block will hide on success; preserve focus from either Retry or Refresh.
        if (recoveryFocused && firstLink) {
          firstLink.focus({ preventScroll: true });
          // Finish any older focus-scroll animation before it can chase the moved Retry control.
          firstLink.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        } else if (outsideRetryViewport) {
          // Settle an older outside focus-scroll target after the DOM has moved beneath it.
          window.scrollTo({ ...outsideRetryViewport, behavior: 'instant' });
          controller.resetScroll(window.scrollY);
        }
      },
      changed: render,
    });
  } catch (error) {
    status.textContent = 'More sightings are available in News.';
    console.error('[home-feed] Invalid homepage configuration', error);
    return;
  }
  if (controller.state !== 'finished') restoreScrollEffects = suppressFeedScrollEffects(document.documentElement.style);
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
        // Restoration must settle before releasing its hold, regardless of site smooth-scroll CSS.
        window.scrollTo({ left: 0, top: Math.max(0, y), behavior: 'instant' });
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
