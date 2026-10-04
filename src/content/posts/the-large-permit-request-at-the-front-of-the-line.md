---
title: The Large Permit Request at the Front of the Line
description: Tokio’s fair semaphore can make a small request wait behind a large one, even while a permit is available. Here is why and what to check.
pubDate: "2026-10-07T10:30:00Z"
specimen: 356
section: rust
tags:
  - rust
  - tokio
  - async
  - semaphore
draft: false
heroImage: https://media.aitamer.news/heroes/the-large-permit-request-at-the-front-of-the-line-f4532d78.jpg
heroAlt: A large block waits at the head of a gated queue while a smaller block behind it could fit.
author: ari
wildness:
  rating: 2
  verified: Tokio documents that a large queued request can delay a smaller one despite available permits.
  claimed: Smaller safe acquisitions or separate budgets may improve latency for small requests.
verdict: Inspect mixed permit sizes when small requests wait with capacity visible. Preserve the intended resource limit when changing the scheduling.
sources:
  - title: Tokio Semaphore documentation
    url: https://docs.rs/tokio/latest/tokio/sync/struct.Semaphore.html
---

## The queue can wait with permits free

Tokio’s `Semaphore` holds permits that callers acquire before using a shared resource. `acquire` requests one permit; `acquire_many` requests several. The semaphore is fair: it gives permits out in request order, including when requests have different sizes. [Tokio’s semaphore documentation](https://docs.rs/tokio/latest/tokio/sync/struct.Semaphore.html) states this rule explicitly.

Picture a large `acquire_many` request at the front of the queue. Some permits are available, but fewer than that request needs. A later `acquire` request needs just one. Tokio says the later request can remain pending even though a permit is available for it. The earlier request keeps its place. A free permit therefore does not guarantee that the next small caller can use it. [The documented fairness rule](https://docs.rs/tokio/latest/tokio/sync/struct.Semaphore.html) covers this case.

## What the delay means

This follows from serving the queue in order. If the large request stays at the front while it waits for enough permits, smaller requests behind it wait too. The accounting can be correct while their latency rises. Calling `available_permits` reports the current number of available permits; that number alone does not tell you which queued request is next. [Tokio documents both the queue and `available_permits`](https://docs.rs/tokio/latest/tokio/sync/struct.Semaphore.html).

The distinction matters when a single semaphore serves jobs with different permit needs. Tokio’s examples use semaphores to limit open files and outgoing requests. Those examples acquire permits before work and release them when the work finishes. The same shared limit can contain both small and large requests, so the mix of request sizes deserves attention. [See Tokio’s examples](https://docs.rs/tokio/latest/tokio/sync/struct.Semaphore.html).

## What to do

First, list every caller that uses `acquire_many` on the same semaphore as one-permit callers. Record each requested size and measure how long each kind of request waits. Interpret a small request waiting alongside an available permit using Tokio’s fairness rule.

If the wait harms users, consider dividing a large job into smaller acquisitions where the work can safely be divided. Another option is separate budgets for distinct workloads, with resource limits still enforced. Either choice changes scheduling, so check the intended ordering and capacity.

Finally, treat cancellation as a fresh place in line. Tokio documents that cancelling a pending `acquire` or `acquire_many` loses its queue position. [The cancellation notes are in the method documentation](https://docs.rs/tokio/latest/tokio/sync/struct.Semaphore.html).
