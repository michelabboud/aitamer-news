---
title: Local AI Without a Frozen Page
description: A Web Worker can move browser-side computation away from the interface thread. Here is how to send work, return results, and handle the limits.
pubDate: "2026-10-05T11:00:00Z"
specimen: 264
section: dev
tags:
  - web-workers
  - browser
  - local-ai
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/local-ai-without-a-frozen-page-c696968d.jpg
heroAlt: A person uses a responsive computer while requests travel to a separate room where a model runs.
author: ari
wildness:
  rating: 2
  verified: Workers run separately and exchange data with the page through messages.
  claimed: Request IDs are a useful application safeguard against displaying stale replies.
verdict: Move browser-side computation to a worker, keep rendering on the page, and test payloads, errors, and stale results.
sources:
  - title: Using Web Workers
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
  - title: The structured clone algorithm
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
  - title: Transferable objects
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
---

A local AI feature may spend time processing text, images, or other input in the browser. If that work occupies the page’s main thread, the interface can become slow to respond. A Web Worker gives the computation a separate thread. The page can keep handling its interface while the worker runs. The two sides communicate through messages, as [MDN’s Web Workers guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) explains.

## Put computation in a dedicated worker

A dedicated worker starts from a JavaScript file and belongs to the script that created it. That makes it a useful starting point for a feature on one page. The page creates a `Worker`, sends it an input, and waits for a result. The worker runs in its own global context. It cannot directly change the page’s document or use the page’s `window` object. The page remains responsible for showing a loading state, accepting input, and rendering the answer. [MDN describes these boundaries and the worker constructor](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

For a local AI feature, the worker can hold the computation that prepares input and runs inference, provided the chosen runtime works in a worker context. Check that requirement before moving code. A library that expects direct access to page elements needs a different interface. Keep the worker’s inputs and outputs as data. Let the page own the controls and display.

## Make messages the interface

Both sides use `postMessage()` to send data. Each receives it through a message event. In a simple flow, the page sends an input to the worker. The worker computes a result and posts it back. The page reads the event’s `data` and updates the visible output. [MDN shows this round trip](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) with a small calculation.

For a larger feature, give messages a clear shape. A request might contain `type`, `id`, and `input`. A reply might contain `type`, `id`, and `result`. The `type` tells each side what the message means. The `id` lets the page connect a reply to the request that produced it. These fields are an application design choice. They keep loading, success, progress, and failure messages from becoming an assortment of unrelated values.

## Keep old answers out of new requests

A person can change the input while earlier work is still running. If the page displays every reply as it arrives, an answer for an earlier input can replace the answer the person now expects. Give each request an ID and record which one is current. When a reply arrives, render it only if its ID matches the current request. This follows from the [message-based exchange described by MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers); the ID check is a safeguard the application supplies.

Decide what another submission should do while work is active. The interface can disable submission, queue a request, or accept a new one and ignore an older reply. Make that choice visible through the loading state. A worker moves computation away from the page’s interface thread, but the page still has to decide which result belongs on screen.

## Watch the cost of moving data

Messages have a cost of their own. Data sent through `postMessage()` is generally copied using the structured clone algorithm. The worker and page usually receive separate objects. Functions and document nodes cannot be cloned this way, so messages should carry the data the computation needs rather than page objects. [MDN documents the copying rules and unsupported values](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

For large binary input, check whether a transferable object fits the task. An `ArrayBuffer` can be transferred to a worker instead of copied. After transfer, its original buffer is detached and the sender can no longer use that memory. A typed array can be sent while its underlying buffer is transferred. That ownership change matters if the page still needs the input. [MDN’s transferable objects guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) shows the pattern. Send the data required for the job, and decide deliberately whether the page must retain it.

## Handle failure and cancellation

A worker can report a result through a message. It can also raise a runtime error that reaches the worker’s `onerror` handler on the page. The page should leave its loading state and show a useful failure when that happens. If the feature must stop a running worker immediately, the page can call `terminate()`. That ends the worker thread, so a later request needs a worker ready to receive it. [MDN documents error handling and termination](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

Treat these cases as part of the interface design. A reply for an obsolete request should not disturb the current output. An error should not leave a spinner running forever. A stopped worker should not leave the page waiting for a message that will never arrive.

## Keep the promise precise

A worker separates the page’s interface code from its computation. It does not promise a quick answer. The page can still spend time processing a large reply or updating the document. Measure the time to a result and the responsiveness of the controls as separate concerns. The [worker guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) also notes that workers can make network requests. Running code in a worker alone therefore says nothing about whether an AI feature keeps its data on the device. Check the feature’s actual data flow before calling it local.

## What to do

1. Identify the browser-side computation that delays the interface. Check whether its library can run without direct access to the page’s document.
2. Start with a dedicated worker. Keep controls and rendering on the page. Send input to the worker and return results through `postMessage()`.
3. Define request, result, progress, and error messages. Add a request ID so the page can ignore replies for older input.
4. Inspect each payload. Use ordinary cloned data when it is small and convenient. Consider transferring an `ArrayBuffer` when moving a large binary payload, and account for the sender losing access.
5. Test a new submission during active work, a worker error, and a stopped worker. Confirm that the interface remains usable and always reaches a clear result or failure state.
