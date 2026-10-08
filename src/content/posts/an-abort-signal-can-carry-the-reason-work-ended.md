---
title: An Abort Signal Can Carry the Reason Work Ended
description: AbortSignal.reason and throwIfAborted help distinguish cancellation from ordinary failure; combine caller cancellation with a timeout for bounded AI requests.
pubDate: "2026-10-09T18:30:00Z"
specimen: 586
section: dev
tags:
  - javascript
  - cancellation
  - ai-development
draft: false
heroImage: https://media.aitamer.news/heroes/an-abort-signal-can-carry-the-reason-work-ended-53251a77.jpg
heroAlt: A cut teal paper cord keeps a rust reason-tag attached beside a small cream hourglass.
author: ari
wildness:
  rating: 1
  verified: AbortSignal exposes a reason, throws it on request, and supports timeout and any composition.
  claimed: The transcription example is illustrative; no browser compatibility or latency measurement is claimed.
verdict: Pass a combined caller and timeout signal into each AI request, propagate its reason, and track source signals separately when attribution matters.
sources:
  - title: "MDN Web Docs: AbortSignal"
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
  - title: "MDN Web Docs: AbortController.abort()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
  - title: "MDN Web Docs: AbortSignal.timeout()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
  - title: "MDN Web Docs: AbortSignal.any()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static
---

A user starts a new turn while the previous transcription request is still running. The old request should stop, and the application should know whether it ended because the user moved on or because a deadline expired. An [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) can carry that reason through the cancellation path.

An `AbortController` owns a signal. Calling [`controller.abort(reason)`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) marks it aborted and makes `signal.reason` available. The reason is a JavaScript value, so an application may supply a deliberate `DOMException` or another value. `signal.throwIfAborted()` throws that same reason immediately if work was cancelled before it began. This closes the common gap where an operation receives an already aborted signal and proceeds anyway.

For a request that belongs to one turn, combine the caller’s signal with a deadline:

```js
async function getTranscript(url, callerSignal) {
  const deadline = AbortSignal.timeout(8000);
  const signal = AbortSignal.any([callerSignal, deadline]);
  signal.throwIfAborted();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Transcript request failed: ${response.status}`);
  return response.json();
}
```

[`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) creates a signal that aborts after the given number of active milliseconds; its reason is a `TimeoutError` exception. That clock can pause in a suspended worker or while a document is in the back-forward cache. [`AbortSignal.any()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static) makes one signal that aborts when an input aborts. Pass that combined signal into `fetch` so cancellation covers the request and response-body read. The caller can end a superseded turn with a reason such as `controller.abort(new DOMException("Turn replaced", "AbortError"))`.

Do not treat an error name alone as proof of which input fired. A caller may provide its own reason. The combined signal keeps the first abort reason, but does not identify its source. For inputs already aborted at creation, it uses the first such input in the iterable. If product behavior depends on attribution, retain the caller and timeout signals and inspect their aborted states, accounting for a race in which both eventually abort. Log the settled operation once, with the reason relevant at that point.

Cancellation is cooperative. A custom promise-based API should reject unsettled work with `signal.reason`, check for prior abortion, and remove its abort listener on normal completion. A signal stays aborted, so create a fresh controller or timeout for each new turn. That gives the next request a clean lifetime and makes a stopped turn visible as a distinct outcome rather than a generic failure.
