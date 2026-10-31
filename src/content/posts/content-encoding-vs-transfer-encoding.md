---
title: "Content-Encoding vs Transfer-Encoding: Two Kinds of Compression, Two Different Jobs"
description: Why gzip and brotli belong to the representation itself, while chunked transfer is about how bytes cross the wire.
pubDate: "2026-11-01T08:30:00Z"
specimen: 1183
section: dev
tags:
  - http
  - compression
  - content-encoding
  - transfer-encoding
  - rfc9112
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/content-encoding-vs-transfer-encoding-6e00379b.jpg
heroAlt: A tied bundle of folded papers rides on one wagon of a paper train crossing an arched bridge.
author: mai
wildness:
  rating: 2
  verified: Representation vs message split, q-value preference, Content-Length ban, per RFC 9112 and MDN.
  claimed: The gzip-then-chunk example is my own framing; the smuggling risk is stated in RFC 9112 §6.1.
verdict: Content-Encoding describes the data; Transfer-Encoding describes the message.
sources:
  - title: RFC 9112 §6.1 Transfer-Encoding
    url: https://www.rfc-editor.org/rfc/rfc9112.html#section-6.1
  - title: RFC 9112 §6.2 Content-Length
    url: https://www.rfc-editor.org/rfc/rfc9112.html#section-6.2
  - title: IANA HTTP Content Coding Registry
    url: https://www.iana.org/assignments/http-parameters#content-coding
  - title: MDN Content-Encoding header
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding
  - title: MDN Accept-Encoding header
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding
---

Two HTTP headers both deal with encoding, and both can shrink what crosses the wire, but they operate at different layers and are easily confused. The line between them is drawn in [RFC 9112 §6.1](https://www.rfc-editor.org/rfc/rfc9112.html#section-6.1): unlike Transfer-Encoding, Content-Encoding is a characteristic of the representation.

Content-Encoding names a transformation applied to the selected representation's data. The common values are gzip and br for Brotli, both registered in the [IANA HTTP Content Coding Registry](https://www.iana.org/assignments/http-parameters#content-coding), and [MDN's Content-Encoding reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding) lists them alongside deflate and newer codings such as zstd. Negotiation runs through Accept-Encoding: a client lists the codings it can decode, and the server replies with the one it chose via Content-Encoding. Preference is carried by quality values, not list order, so [MDN's Accept-Encoding page](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding) shows a client weighting brotli at q=1.0 and gzip at q=0.8.

Transfer-Encoding is different. [RFC 9112 §6.1](https://www.rfc-editor.org/rfc/rfc9112.html#section-6.1) defines it as the list of transfer codings applied to the content to form the message body. The workhorse value is chunked, which breaks a body into size-prefixed chunks so a sender can stream a response whose length it does not know in advance. Where Content-Encoding is a characteristic of the representation, Transfer-Encoding is a property of the message, and the RFC adds that any recipient along the request or response chain may decode the received transfer codings or apply new ones.

One rule surprises people: [RFC 9112 §6.2](https://www.rfc-editor.org/rfc/rfc9112.html#section-6.2) says a sender must not send a Content-Length field in any message that also carries Transfer-Encoding. On the receiving side, §6.1 notes that Transfer-Encoding is defined as overriding Content-Length, and a server may reject a request containing both. Mixing the two invites request smuggling, which is why the fields are kept apart.

The separation explains why one response can legitimately carry both headers at once. A server might gzip a JSON response because the client advertised it, then send that compressed body using chunked transfer because the final size was unknown when it started writing. Content-Encoding says what the bytes mean; Transfer-Encoding says how the message is being delivered. [MDN's Content-Encoding reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding) makes the same distinction, describing Transfer-Encoding as handling how HTTP messages are delivered on a hop-by-hop basis while Content-Encoding describes the representation itself.

A client that wants to know whether a payload was compressed should look at Content-Encoding, not at whether the wire happened to use chunking.
