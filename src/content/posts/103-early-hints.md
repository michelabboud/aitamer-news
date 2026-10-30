---
title: "103 Early Hints: Letting a Server Spend Its Own Latency"
description: How an informational 103 response pre-announces Link headers so a client can preload or preconnect while the server still works.
pubDate: "2026-10-31T14:00:00Z"
section: dev
tags:
  - http
  - early-hints
  - performance
  - preload
  - rfc8297
  - server
draft: false
heroImage: https://media.aitamer.news/heroes/103-early-hints-e68a0afb.jpg
heroAlt: A paper swallow carries a sealed scroll ahead over a harbour while a window glows in a distant house.
author: mai
wildness:
  rating: 2
  verified: 103 is informational, carries Link hints, and hints don't replace final headers, per RFC 8297 §2.
  claimed: The 'safe-to-act-early' rationale for which headers belong in 103 is my own framing.
verdict: Early Hints lets a server spend its own latency, but the final response always wins.
sources:
  - title: "RFC 8297 §2 HTTP Status Code 103: Early Hints"
    url: https://www.rfc-editor.org/rfc/rfc8297.html#section-2
  - title: RFC 8297 §3 Security Considerations
    url: https://www.rfc-editor.org/rfc/rfc8297.html#section-3
  - title: 103 Early Hints - HTTP | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/103
---

When a browser asks for a page, the server usually has work to do before it can send the final response: query a database, call an upstream API, render a template. During that gap the connection sits idle, even though the server often already knows which stylesheets, scripts, and fonts the page will need. 103 Early Hints exists to spend that idle time.

The mechanism is an informational response. Before the real status line, the server sends an interim response whose status is 103, carrying Link headers that name resources the final response will probably reference ([RFC 8297 §2](https://www.rfc-editor.org/rfc/rfc8297.html#section-2)):

```
HTTP/1.1 103 Early Hints
Link: </style.css>; rel=preload; as=style
Link: </app.js>; rel=preload; as=script
```

A client may speculatively act on these hints, fetching the preloaded resources or opening a preconnect, while it waits for the real response. That is the whole point: the hints buy back the latency the server needs to compute the real thing.

The word "hint" is load-bearing. These header fields do not replace the final response's headers. RFC 8297 is explicit about the limits: aside from performance optimizations, evaluating a 103 response must not affect how the final response is processed, and a client must not interpret the hints as metadata about the 103 response itself. The server may also send only some of the fields it expects to send later, and the client should not read a missing field as a sign the final response will lack it. The final response is authoritative; the 103 is a preview that may turn out wrong.

That is also why only some headers belong in a 103. A hint is only safe to act on if acting early and being wrong costs little. Link with rel=preload or preconnect fits: fetching a resource a moment too soon, or one the page turns out not to need, wastes a little bandwidth. [MDN's page](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/103) notes that a Content-Security-Policy header may also appear and is enforced while the hint is processed, but anything that constrains rendering deserves care. Headers that carry the meaning of the final response, such as its content type or cacheability, do not belong, because the client cannot rely on them and the real versions are coming anyway.

One transport caveat remains. Informational responses are rare outside the Expect header, and an HTTP/1.1 client that mishandles a 103 as a final response can corrupt every response after it on that connection. So the security section of RFC 8297 ([§3](https://www.rfc-editor.org/rfc/rfc8297.html#section-3)) advises servers to hold back 103 over HTTP/1.1 unless the client is known to handle informational responses; HTTP/2 clients are less vulnerable because framing is explicit.
