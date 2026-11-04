---
title: Cancel the Stream or Release the Reader? Those Are Different Decisions
description: Cancel discards the remaining stream data and requests source cleanup. Releasing a lock leaves the stream for another reader.
pubDate: "2026-11-07T12:30:00Z"
specimen: 1280
section: dev
tags:
  - javascript
  - streams
  - async
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/stream-cancel-release-reader-037da211.jpg
heroAlt: Two paper taps sit above a blue tray; one is closed while the other flows beside its detached handle.
author: mai
wildness:
  rating: 1
  verified: Cancellation discards queued data; releasing a reader lock does not cancel the stream.
  claimed: A tee branch's cancellation can wait for the other branch.
verdict: Cancel to abandon the stream; release the lock to hand it off, and handle pending reads and cancellation errors.
sources:
  - title: WHATWG Streams Standard
    url: https://streams.spec.whatwg.org/
  - title: "MDN: ReadableStream cancel()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/cancel
  - title: "MDN: ReadableStreamDefaultReader cancel()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/cancel
  - title: "MDN: ReadableStreamDefaultReader releaseLock()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/releaseLock
---

A reader holds an exclusive lock on a readable stream. When your code stops reading, two actions are available, and they answer different questions: do you want to abandon the remaining data, or hand the stream to another consumer?

`reader.cancel(reason)` expresses that you no longer want the stream. For a readable stream, cancellation closes it, discards queued chunks, and invokes the underlying source's cancellation mechanism. The returned promise tracks that cancellation operation, including asynchronous source cleanup. Await it or handle its rejection.

`reader.releaseLock()` is a synchronous handoff. It disconnects that reader and lets another reader acquire the stream. It does not cancel the stream or discard its unread queue. Data the first reader already received is still consumed; releasing a lock does not rewind anything.

Here is a hypothetical first-chunk inspector. A `STOP` chunk means no remaining data is needed; otherwise, the caller receives the first result and can acquire another reader for what remains:

```js
async function inspectFirst(stream) {
  const reader = stream.getReader();
  try {
    const first = await reader.read();
    if (!first.done && first.value === 'STOP') {
      await reader.cancel('stop marker received');
      return { stopped: true };
    }
    return { stopped: false, first };
  } finally {
    reader.releaseLock();
  }
}
```

If cancellation rejects, the function rejects too, and `finally` still releases the lock. For a stream that was readable when cancellation began, a failure in the underlying cancellation process does not reopen or error the now-closed stream. It is reported through the cancellation promise. A stream that was already errored is a different case: cancellation rejects with its stored error.

The lock determines which cancellation call to use. While a reader owns the stream, `stream.cancel()` returns a promise rejected with `TypeError`; use the active reader's `cancel()` instead. Canceling does not itself release that reader's lock. Once the lock is released, calling `cancel()` on that old reader also returns a rejected promise.

There is a sharp edge in handoffs: if `releaseLock()` runs while reads are pending, those read promises reject with `TypeError`. Coordinate outstanding reads and handle their rejections before handing over. The old reader's `closed` promise can reject when its lock is released before the stream closes, too.

Finally, cancellation is a request to the underlying source, not a universal guarantee about a network connection or remote server. Teed streams add another complication: one branch's cancellation promise can wait while the other branch remains active. Design cleanup around the actual source and both consumers, rather than assuming every cancellation settles immediately.
