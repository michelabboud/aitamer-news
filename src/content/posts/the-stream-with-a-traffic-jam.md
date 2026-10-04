---
title: The Stream With a Traffic Jam
description: When generated chunks arrive faster than downstream code can process them, queues grow. Backpressure gives the producer a signal to slow down, if that signal can reach it.
pubDate: "2026-10-05T23:00:00Z"
specimen: 287
section: dev
tags:
  - streams
  - javascript
  - backpressure
  - web-apis
draft: false
heroImage: https://media.aitamer.news/heroes/the-stream-with-a-traffic-jam-f408e4d1.jpg
heroAlt: Paper messages pile up on a conveyor behind a narrow processing gate.
author: ari
wildness:
  rating: 2
  verified: MDN and the Streams Standard document queues, backpressure signals, and source limits.
  claimed: Detached work can form a backlog beyond the stream’s internal queue.
verdict: Follow the pressure signal from the slow sink to the producer. A queue setting helps only when the producer or its wrapper responds.
sources:
  - title: Streams API concepts | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts
  - title: Streams Standard | WHATWG
    url: https://streams.spec.whatwg.org/
  - title: "ReadableStreamDefaultController: desiredSize property | MDN"
    url: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController/desiredSize
  - title: "WritableStreamDefaultWriter: ready property | MDN"
    url: https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultWriter/ready
  - title: "ReadableStream: pipeTo() method | MDN"
    url: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/pipeTo
---

Imagine a page displaying generated text as chunks arrive. Other code formats, stores, or forwards those chunks. Trouble starts when the source produces them faster than the next step can finish. The waiting data accumulates somewhere. [MDN’s Streams API guide](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts) calls the mechanism for regulating that flow backpressure.

Think of a narrow road after a busy junction. Slowing cars at the junction protects the road from a growing line. In a stream, the useful signal travels in the opposite direction from the data. The destination indicates that it needs time. Earlier stages can then slow their own work. The analogy has a limit: software cannot always slow the original source. Whether it can matters as much as the queue itself.

## Where the traffic builds

A readable stream supplies chunks. A writable stream accepts them. A transform stream sits between them and changes the chunks as they pass. [MDN describes](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts) a pipe chain that connects these parts. It also describes internal queues: readable streams hold chunks waiting to be read, and writable streams hold chunks waiting for their sink to process them.

Imagine generated text flowing through a formatter and then into a slow destination. If the formatter receives new text while the destination is still handling earlier text, the destination’s queue fills. The formatter can become blocked in turn. A pipe chain can pass that pressure back toward the producer. The [Streams Standard](https://streams.spec.whatwg.org/) says transform streams in a pipe respect backpressure, so data is not read faster than it can be transformed and consumed.

A queue can absorb a brief mismatch between stages. A queue that keeps growing moves the delay into memory. Backpressure makes the mismatch visible to the part of the program that can reduce production.

## How a stream asks for room

A queuing strategy assigns a size to each chunk and compares the total queued size with a high water mark. The difference is the desired size. [MDN gives the calculation](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts): high water mark minus queued size. A positive value means there is room under the chosen mark. Zero or a negative value signals pressure. The [controller’s desiredSize property](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController/desiredSize) can be negative when the queue is overfull.

The mark signals a preferred queue size. It is no hard ceiling. A producer that ignores the signal can keep offering chunks. Honoring the signal matters more than choosing a mark. The size measure matters too. The [Streams Standard](https://streams.spec.whatwg.org/) describes strategies that count chunks and strategies that add their byte lengths. If chunks vary greatly in size, counting them alone can hide how much data is waiting.

For a source that produces data on demand, a stream’s pull method can request more when the consumer has room. For a source that pushes data, the code wrapping it may need to pause the source when desiredSize falls to zero or below and resume it later. [MDN explains both paths](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts). The [Streams Standard’s push source example](https://streams.spec.whatwg.org/) shows explicit pause and resume calls. Those calls require an underlying source that offers such control.

## Where the signal can stop

A stream wrapper cannot create a pause control for a source that lacks one. The [Streams Standard](https://streams.spec.whatwg.org/) includes a push source without backpressure support. In that example, data remains queued when the consumer reads too slowly. When connecting an external producer to a stream, inspect this boundary: determine whether pressure reaches the producer or ends at a queue.

Code can also start work for each chunk without waiting for that work to finish. The unfinished tasks then accumulate outside the stream’s queue. The [Streams Standard](https://streams.spec.whatwg.org/) says a writable sink can return a promise to signal backpressure to a readable stream. That mechanism depends on the sink reporting when its work finishes. Keep a slow operation inside the awaited read or write path when it must limit the producer.

If you write to a `WritableStream` manually, the writer’s [`ready` promise](https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultWriter/ready) resolves when the queue’s desired size becomes positive again. Awaiting it before adding another chunk gives the destination room to recover. If the data already arrives as a readable stream, [`pipeTo()`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/pipeTo) connects it to a writable destination and returns a promise for the piping operation. That promise rejects on errors, so handle failure as part of the flow.

## What to do

Trace a chunk from its source through each transform to its final sink. Identify where each stage waits and where it keeps queued data. Use a pipe chain when its endpoints fit the Streams API. When writing manually, wait for the writer to be ready and await the write. For a custom readable source, check desiredSize and connect the pressure signal to a real pause or demand mechanism.

Then exercise a slow destination. Watch whether pending work and queued data settle while the source keeps producing. If they keep rising, find the point where waiting stops reaching upstream. Slow the producer, bound the work waiting outside the stream, or choose an explicit policy for excess data. Backpressure is useful when its signal reaches a place that can act on it.
