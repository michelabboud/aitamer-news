---
title: When Two Tabs Run the Same Background Job
description: Two tabs can start the same sync at once. Web Locks lets them coordinate the work within one browser, with clear limits for retries and work beyond that browser.
pubDate: "2026-10-06T09:00:00Z"
specimen: 306
section: dev
tags:
  - web-locks
  - javascript
  - browser-apis
  - concurrency
draft: false
heroImage: https://media.aitamer.news/heroes/when-two-tabs-run-the-same-background-job-d6821936.jpg
heroAlt: Two browser tabs show the same background task connected through one locked job queue.
author: ari
wildness:
  rating: 2
  verified: Named Web Locks coordinate participating tabs and workers within the browser’s lock scope.
  claimed: One exclusive lock can prevent overlapping outbox syncs when every entry point uses it.
verdict: Use a named exclusive lock to coordinate the job across tabs. Choose whether a busy tab waits or skips, and retain durable progress and server-side duplicate handling for retries.
sources:
  - title: Web Locks API | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
  - title: "LockManager: request() method | MDN"
    url: https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request
  - title: Web Locks API | W3C Editor’s Draft
    url: https://w3c.github.io/web-locks/
---

Two tabs can load the same app, see the same pending work, and each start a background sync. A flag held by one tab cannot settle that race because the other tab has its own running script. The [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) gives them a way to coordinate. A tab or worker requests a named lock, holds it while work runs, and releases it when that work finishes.

## One name protects one job

A lock name is a string chosen by the app. It represents the work or resource being protected. If every place that starts an outbox sync requests `outbox-sync`, the browser can coordinate those requests across tabs and workers that share the lock manager. The default mode is exclusive. While one script holds that name, another exclusive request for it cannot be granted. The name therefore needs to be consistent across every entry point. [MDN’s overview](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) and the [Web Locks specification](https://w3c.github.io/web-locks/) describe this scope.

The lock should cover the whole operation that must not overlap. A callback that starts a fetch and returns immediately releases the lock before the fetch finishes. Use an async callback and await the work inside it. The request’s promise settles after the callback finishes and the lock is released. A thrown error also ends the callback and releases the lock. [The request reference](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request) spells out that lifecycle.

## Choose whether the second tab waits

By default, a second request for a held name waits. This is useful when both operations must run, such as two changes that need serial access to one resource. Each tab will get a turn. Waiting alone does not remove duplicate work. If both callbacks say “sync the outbox,” both may run, one after the other. That follows from the [queueing behavior](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).

For a job where the second tab may stand down, use `ifAvailable: true`. When the lock cannot be granted without waiting, the callback receives `null`. The app can then skip that attempt. Both tabs must request the same name for this to work. [The request reference](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request) shows this option.

```js
async function trySyncOutbox() {
  if (!navigator.locks) {
    throw new Error("Web Locks unavailable");
  }

  return navigator.locks.request(
    "outbox-sync",
    { ifAvailable: true },
    async (lock) => {
      if (!lock) return false;

      await syncPendingOutbox();
      return true;
    }
  );
}
```

Here, `syncPendingOutbox()` is the app’s own function. A `true` result means this call acquired the lock and its callback completed. A `false` result means it did not get the lock. If `syncPendingOutbox()` rejects, the request rejects and the lock is released. The caller should handle that failure and decide when to retry. Those outcomes follow from the [callback and return rules](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request).

## The lock has a narrow boundary

Web Locks coordinate participating code within the browser’s relevant storage scope. They do not coordinate another device, another browser profile, or a private browsing session with a regular session. They also do not coordinate a different origin. The [specification’s scope and private browsing sections](https://w3c.github.io/web-locks/) make those boundaries explicit. A server receiving requests from several devices still needs its own rule for duplicate or conflicting work.

A lock is temporary. Once the first callback finishes, a later tab can acquire the same name and start the job again. If the requirement is to process each record once, store progress with the records and check it as part of the job. A server action that can be retried should identify the operation so the server can handle a repeated request safely. These are design consequences of the lock’s temporary, browser-scoped behavior. [The specification](https://w3c.github.io/web-locks/) describes the lifecycle and scope.

When a tab closes or its document unloads, its remaining locks are released, and another waiting tab can proceed. The lock’s release does not establish whether the old job finished its external work. Recovery code therefore needs to inspect durable progress before repeating side effects. The [specification’s termination rules](https://w3c.github.io/web-locks/) support the handoff; the recovery advice follows from the possibility of interrupted work.

## Keep the lock design simple

The API also offers shared mode for multiple readers, an abort signal for a request that is still waiting, and a query method that returns a snapshot of held and pending locks. A basic sync that allows one active run can start with an exclusive lock and one name. Avoid nesting differently ordered locks: two scripts can each hold one name while waiting for the other. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) documents the options and that deadlock pattern.

The `steal` option releases an existing lock and grants a new one, while the old callback may continue running. That can put two operations in flight despite the intended guard. The [request reference](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request) warns about this behavior. For ordinary contention, choose whether the second request waits or skips.

Web Locks are exposed in secure contexts and in workers as well as pages. Check for `navigator.locks` before relying on this path, and decide how the app behaves when it is unavailable. The [API overview](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) lists those platform conditions.

## What to do

1. Give the job one stable lock name and use it in every tab and worker that can start the work.
2. Put the entire critical operation inside an awaited async callback. Use the default exclusive mode when only one run should be active.
3. Choose waiting when every request must run. Choose `ifAvailable` when a busy tab can skip this attempt.
4. Keep durable progress and server-side duplicate handling for work that must survive closure, retries, other devices, or other browser profiles.
5. Open two tabs and trigger the job in both. Check that they follow the chosen wait-or-skip policy, then repeat with one tab closing during the work.
