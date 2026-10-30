---
title: "Vary: how caches keep two versions of one URL apart"
description: "How the Vary response header tells a cache which request fields a response depends on, and why Vary: * blocks reuse without revalidation."
pubDate: "2026-10-31T08:00:00Z"
section: dev
tags:
  - http
  - vary
  - caching
  - content-negotiation
  - accept-language
draft: false
heroImage: https://media.aitamer.news/heroes/vary-cache-variants-6b34053f.jpg
heroAlt: Two colored envelopes occupy separate compartments in a paper mailbox.
author: mai
wildness:
  rating: 1
  verified: RFC9111 §4.1 forbids reuse without revalidation unless Vary-nominated fields match; Vary:* never matches.
  claimed: Vary governs private caches too; the missing/misused-Vary debugging lesson is my own framing.
verdict: Send Vary only for headers you actually vary on, and remember it governs every cache including private ones.
sources:
  - title: RFC 9111 §4.1 Calculating Cache Keys with the Vary Header Field
    url: https://www.rfc-editor.org/rfc/rfc9111.html#section-4.1
  - title: RFC 9110 §12.5.5 Vary
    url: https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.5
  - title: RFC 9110 §12.5.4 Accept-Language
    url: https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.4
---

A single URL can return more than one document. A page at `/index` might serve HTML in English, French, or Japanese depending on the `Accept-Language` header the client sends. A cache that stores only the URL as its lookup key will keep whichever response it saw first and hand it to everyone, serving English to someone who asked for Japanese.

The `Vary` response header exists to prevent this. It tells a cache which request header fields a stored response depends on. A server that negotiates language sends `Vary: Accept-Language`. The cache then keys the stored response on the URL plus the value of the client's `Accept-Language`, so the English and French responses are stored and matched as separate entries.

The matching rule is strict ([RFC 9111 §4.1](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.1)). A cache must not use a stored response without revalidating it unless every header field named in its `Vary` value matches between the original request and the new one. Some normalization is allowed: optional whitespace may be added or removed, repeated lines with the same field name may be combined, and values defined as case-insensitive may be normalized. A field that is absent from one request matches another only if it is also absent there.

Two details trip people up. The first is `Vary: *`. It means the response depends on something a cache cannot reason about, so the response always fails to match and must be revalidated before reuse. It blocks reuse without revalidation while still allowing the response to be stored. The second is ranking. When several stored responses do match, a cache must choose one. If the nominated field has a known preference mechanism, such as the `q` quality values in `Accept`, the cache may use it; otherwise it falls back to the most recent response by `Date`.

The practical lesson is that `Vary` is a coordination contract between a server and every cache on the path, and that includes a browser's own private cache, which faces the same risk of choosing the wrong stored representation as one user's preferences change. A server that negotiates on a header but forgets to send `Vary` for it invites a cache to serve the wrong representation; a server that sends `Vary` for a header it does not actually vary on fragments the cache into needless entries. Both mistakes are invisible in a single request and only appear once reusing a stored response comes into play, which is why they are easy to ship and hard to debug.
