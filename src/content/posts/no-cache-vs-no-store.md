---
title: "no-cache vs no-store: Two Directives That Sound Alike and Mean Different Things"
description: Why no-cache still allows caching and requires revalidation, while no-store forbids storing the response at all.
pubDate: "2026-11-01T07:30:00Z"
section: dev
tags:
  - cache-control
  - caching
  - http
  - rfc9111
  - web
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/no-cache-vs-no-store-62e982b1.jpg
heroAlt: A paper cabinet with a magnifying glass and a checked badge on one side and a page dropping into an empty compartment on the other.
author: mai
wildness:
  rating: 2
  verified: no-cache permits storage but requires validation; no-store forbids storage, per RFC 9111.
  claimed: The latency-vs-bandwidth 304 framing and the example directive choices are my own.
verdict: no-cache allows storing but requires revalidation before every reuse; no-store forbids keeping the data at all.
sources:
  - title: RFC 9111 §5.2.2.4 no-cache
    url: https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.4
  - title: RFC 9111 §5.2.2.5 no-store
    url: https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.5
---

Two Cache-Control directives confuse people because both seem to say "don't cache me," yet they place different obligations on a cache. The difference is exact.

no-cache does not forbid storing. A cache may hold the response. What it may not do, in its unqualified form, is use that stored copy to satisfy any other request without first forwarding it for validation and receiving a successful response ([RFC 9111 §5.2.2.4](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.4)). So every reuse costs a round trip back to the origin.

There is also a qualified form, where no-cache takes a list of field names as an argument. It means a cache may reuse the response without revalidation as long as it excludes the listed fields from what it serves, so `no-cache="Set-Cookie"` lets a cache reuse the rest of the response while stripping that header ([RFC 9111 §5.2.2.4](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.4)). The RFC adds a caveat: this qualified form is often handled by caches as if it were plain no-cache, because its special handling is not widely implemented.

no-store forbids storing at all. A cache must not store any part of the request or the response, and must not use the response to satisfy any other request ([RFC 9111 §5.2.2.5](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.5)). The RFC is careful about what "must not store" means: no intentional storage in non-volatile storage, plus a best-effort attempt to remove the information from volatile storage promptly after forwarding it. It then warns that the directive is not a reliable or sufficient mechanism for ensuring privacy, since malicious or compromised caches might not obey it.

The practical difference is a trade-off between freshness and traffic. no-cache keeps the cache in the loop but forces a validation round trip on every reuse, which saves nothing on latency but can still save bandwidth when the origin replies with a small 304 Not Modified. no-store removes the cache from the loop entirely, at the cost of fetching the full response every time.

A last confusion is about scope. Both directives apply to private and shared caches, and a private cache is often a component of the browser itself, so no-store does constrain the browser's cache. What it does not constrain is rendering: a browser that displays a no-store response is still obeying the directive, because the prohibition is against keeping it in storage for reuse, not against showing it once.

Choosing between them comes down to what you are protecting. For a personalized page that is safe for a cache to hold but must never be served stale, no-cache plus revalidation fits. For data that should not persist anywhere, such as a response containing credentials or account numbers, no-store is the stronger signal, with the understanding that it is a best-effort instruction, not a privacy guarantee.
