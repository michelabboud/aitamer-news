---
title: A Cache Can Serve Stale Content Under an Explicit Contract
description: stale-while-revalidate and stale-if-error permit different kinds of bounded staleness. Their windows start after freshness ends, and each trades current data for a specific benefit.
pubDate: "2026-10-09T10:00:00Z"
section: dev
tags:
  - http
  - caching
  - reliability
draft: false
heroImage: https://media.aitamer.news/heroes/a-cache-can-serve-stale-content-under-an-explicit-contract-0d2d753c.jpg
heroAlt: An older blue catalog stays inside a rust boundary while a fresh cream catalog refreshes beside a small rain cloud.
author: ari
wildness:
  rating: 1
  verified: RFC 5861 defines separate bounded windows for background revalidation and error fallback.
  claimed: The catalog example is illustrative; no cache implementation behavior was tested.
verdict: Set freshness and stale windows from the product’s tolerance for old data. Revalidation latency and error fallback are separate permissions, each with an upper bound.
sources:
  - title: RFC 5861, HTTP Cache-Control Extensions for Stale Content
    url: https://www.rfc-editor.org/rfc/rfc5861.html
---

Suppose an AI voice application's public model catalog takes time to regenerate. A cache can keep the listing responsive during routine refreshes, and it can retain a previous listing through a short origin outage. Those are two different promises, expressed by two [Cache-Control extensions in RFC 5861](https://www.rfc-editor.org/rfc/rfc5861.html).

```http
Cache-Control: max-age=60, stale-while-revalidate=30, stale-if-error=300
```

For the first 60 seconds, the response is fresh. Once it becomes stale, `stale-while-revalidate=30` permits a cache to serve the old response for up to 30 more seconds while it attempts revalidation without making that request wait. The directive says the cache **may** serve stale content and **should** attempt background revalidation. If no request arrives during the window, no request-triggered refresh occurs. After that window expires, this directive alone no longer justifies serving the old response; the next request can have to wait for normal validation.

`stale-if-error=300` addresses failure instead of routine refresh latency. If an eligible error occurs after freshness ends, a cache may use the stale response while it is no more than 300 seconds stale. RFC 5861 names errors that would produce `500`, `502`, `503`, or `504`; its introduction also discusses network and DNS failures. In the example, a response aged 200 seconds is 140 seconds stale, so an error can make the saved catalog eligible. Once its staleness exceeds 300 seconds, this directive alone no longer grants that fallback. The 300 seconds is measured beyond the 60-second fresh lifetime, not from the original response time.

Neither directive guarantees that a particular cache will store, revalidate, or serve the response. They give permission within limits. A voice application should set the windows to match the cost of outdated data: a public catalog can often tolerate a brief delay in showing a newly added model, while a user's transcript, account state, or permission decision may require a much tighter policy. Also decide what the interface should do when the stale window ends and the origin is still unavailable.

Choose `stale-while-revalidate` when ordinary refresh latency is the concern, and `stale-if-error` when short outages are the concern. Combine them only after calculating the maximum age the application will accept, then verify the behavior of the caches actually in the request path.
