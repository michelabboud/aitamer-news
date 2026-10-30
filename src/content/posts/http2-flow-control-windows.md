---
title: "HTTP/2 Flow Control: Two Windows for Deciding How Much You'll Buffer"
description: How HTTP/2 uses a connection-level and a stream-level credit window so a receiver can limit what it buffers and keep streams from blocking each other.
pubDate: "2026-10-31T12:30:00Z"
section: dev
tags:
  - http2
  - flow-control
  - networking
  - rfc9113
  - performance
  - protocol
draft: false
heroImage: https://media.aitamer.news/heroes/http2-flow-control-windows-6184b9e2.jpg
heroAlt: A paper stream runs through a row of nested window frames and drips into a small basin.
author: mai
wildness:
  rating: 2
  verified: Two-level credit flow control, 65,535-octet initial window, DATA-only, per RFC 9113 §5.2/§5.2.1.
  claimed: The proxy memory-sharing example is from RFC 9113 §5.2.2; the framing around it is mine.
verdict: Flow control lets a receiver decide how much it is willing to buffer, per stream and per connection.
sources:
  - title: RFC 9113 §5.2 Flow Control
    url: https://www.rfc-editor.org/rfc/rfc9113.html#section-5.2
  - title: RFC 9113 §5.2.1 Flow-Control Principles
    url: https://www.rfc-editor.org/rfc/rfc9113.html#section-5.2.1
  - title: RFC 9113 §5.2.3 Flow-Control Performance
    url: https://www.rfc-editor.org/rfc/rfc9113.html#section-5.2.3
---

HTTP/2 gets its speed from multiplexing: many requests share one TCP connection by riding on independent streams. But multiplexing also creates contention. If a receiver cannot process data on one stream yet wants to keep working on others, it needs a way to hold back that one stream without stalling the whole connection. [RFC 9113 §5.2](https://www.rfc-editor.org/rfc/rfc9113.html#section-5.2) defines flow control as the mechanism that lets endpoints do exactly that, and it is defined to protect endpoints operating under resource constraints.

The scheme is credit-based and runs on WINDOW_UPDATE frames. A receiver advertises how many octets it is prepared to accept, and a sender must not transmit DATA beyond that credit. As the receiver consumes data it sends WINDOW_UPDATE to add credit back. Flow control is directional and receiver-driven: each endpoint advertises its own window for what it receives and must obey the window its peer advertises for what it sends.

There are two windows, and a sender must respect both. One covers the connection as a whole, shared by every stream on it. The other covers each stream individually. A sender may send DATA only when both the connection window and that stream's own window have room. This two-level design is what lets a receiver hold back one stream it cannot process yet while the other streams on the connection keep flowing, and it ensures streams on the same connection do not destructively interfere with each other.

Two details matter in practice. First, only DATA frames are subject to flow control. HEADERS, SETTINGS, WINDOW_UPDATE, and the other control frames do not consume window space. The RFC states the reason directly: this ensures that important control frames are not blocked by flow control ([RFC 9113 §5.2.1](https://www.rfc-editor.org/rfc/rfc9113.html#section-5.2.1)). Second, the initial window is 65,535 octets for both a new stream and the overall connection, though an endpoint can advertise more, up to 2^31-1.

The RFC is explicit about who this protects: constrained receivers. A proxy that shares memory across many connections, or one with a slow upstream and a fast downstream, uses flow control to bound how much a peer can push at it. An endpoint that needs no protection can advertise the maximum window and top it up as data arrives, effectively disabling its own flow control. What it cannot do is ignore its peer's signals: a sender is always bound by the window the receiver advertises.

The cost is throughput. [§5.2.3](https://www.rfc-editor.org/rfc/rfc9113.html#section-5.2.3) notes that if an endpoint cannot keep the window it grants its peer larger than that peer's bandwidth-delay product, its own receive throughput will be limited by flow control and performance degrades. The improvement is hedged, not free: sending timely WINDOW_UPDATE frames can improve performance, balanced against the risk of letting a peer consume too much memory.
