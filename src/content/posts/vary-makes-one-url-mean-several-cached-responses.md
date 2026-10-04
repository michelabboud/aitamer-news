---
title: "`Vary` Makes One URL Mean Several Cached Responses"
description: A cached response can depend on request headers as well as the URL. `Vary` tells caches which headers to compare before reuse.
pubDate: "2026-10-06T17:30:00Z"
specimen: 322
section: general
tags:
  - http
  - caching
  - vary
  - headers
draft: false
heroImage: https://media.aitamer.news/heroes/vary-makes-one-url-mean-several-cached-responses-755ec9d3.jpg
heroAlt: One web address branches through a cache into different response cards for different requests.
author: ari
wildness:
  rating: 2
  verified: RFC 9111 requires Vary-named request headers to match before reuse without revalidation.
  claimed: One URL can have several stored responses selected using request headers.
verdict: Send `Vary` when request headers influence a cacheable response, then test each variant and the request with that header absent.
sources:
  - title: "RFC 9111: HTTP Caching"
    url: https://www.rfc-editor.org/rfc/rfc9111.html
  - title: "RFC 9110: HTTP Semantics"
    url: https://www.rfc-editor.org/rfc/rfc9110.html
---

A URL can have more than one useful response. A server may choose a language or content encoding from the headers in a request. An HTTP cache can store several responses for the same target. The basic cache key includes the request method and target URI. The response's `Vary` field adds named request headers to the choice of which stored response fits. [HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html) [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html)

## The response names the inputs

Suppose a page can be sent in English or French. A request with `Accept-Language: en` receives the English version, and its response includes `Vary: Accept-Language`. A later request for the same URL sends `Accept-Language: fr`. The cache cannot reuse the stored English response without revalidation just because the URL matches. It must compare the nominated header with the header in the request that produced the stored response. If none of its stored responses matches, it typically forwards the request to the origin server. [HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html)

The same idea applies to `Accept-Encoding`. HTTP semantics gives `Vary: accept-encoding, accept-language` as an example: the server may have used either header, including its absence, to choose the response. A missing nominated header matches only another request where that header is missing. Matching can also account for harmless whitespace or normalization when the header's rules say the values have identical meaning. [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html) [HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html)

## Matching is one condition for reuse

`Vary` controls which stored response fits a request. The cache must also meet the rules for storing the response and the conditions for serving it, including freshness or successful validation. A `Vary` value containing `*` never matches a later request from storage. [HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html)

## What to do

When a cacheable response changes with a request header, send `Vary` with the header names that influenced selection. Include it on the default response too. Test the same URL with different header values and with the header absent. Check that each request receives the intended version. Keep the list tied to the headers that affect selection, since each named header affects which stored response can match. [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html) [HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html)
