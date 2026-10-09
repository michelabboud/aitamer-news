---
title: HTTP/2 Streams Still Share One TCP Loss Event
description: HTTP/2 interleaves independent request streams, yet one missing TCP segment can delay them together. QUIC changes stream delivery, with limits of its own.
pubDate: "2026-10-10T06:30:00Z"
specimen: 610
section: devops
tags:
  - http2
  - tcp
  - quic
  - streaming
draft: false
heroImage: https://media.aitamer.news/heroes/http-2-streams-still-share-one-tcp-loss-event-ae8c73a6.jpg
heroAlt: Three separately colored paper streams meet the same missing plank in a shared cream bridge.
author: ari
wildness:
  rating: 1
  verified: HTTP/2 multiplexes over TCP; QUIC can deliver unaffected streams past loss.
  claimed: The AI workload is illustrative; no latency measurement is claimed.
verdict: Treat HTTP/2 stream independence as a framing property. Measure cross-stream stalls under loss before choosing a transport for real-time AI traffic.
sources:
  - title: "RFC 9113: HTTP/2"
    url: https://www.rfc-editor.org/rfc/rfc9113.html
  - title: "RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport"
    url: https://www.rfc-editor.org/rfc/rfc9000.html
  - title: "RFC 9114: HTTP/3"
    url: https://www.rfc-editor.org/rfc/rfc9114.html
---

An AI assistant sends generated text on one response while fetching speech assets on another. Both requests use a single HTTP/2 connection. A packet carrying part of the text response goes missing, and the speech response pauses even though its bytes have reached the receiver. That symptom is possible because the two HTTP/2 streams share one ordered TCP byte stream.

[HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html) gives each request and response exchange a stream identifier and permits frames from different streams to be interleaved on one connection. This removes a particular application-level bottleneck: a slow HTTP exchange need not monopolize the connection's framing. The receiving HTTP/2 endpoint can process frames from other streams when their bytes are available. Flow control also operates per stream and for the connection as a whole, so poorly chosen windows or a receiver that stops reading can create separate stalls.

TCP has a different obligation. It presents bytes to the application in order. If a segment is lost, bytes later in that TCP sequence cannot be delivered to HTTP/2 until the gap is repaired, regardless of which HTTP/2 stream owns the later frames. Frames can be independent in HTTP/2's model while their delivery remains coupled beneath it. RFC 9113 explicitly says that HTTP/2 does not address TCP head-of-line blocking. A lost segment need not contain data from every stream to delay later bytes from several streams on that connection.

[QUIC](https://www.rfc-editor.org/rfc/rfc9000.html) changes this delivery relationship by tracking ordering within each transport stream. After packet loss, streams whose data was in the lost packet wait for recovery; another stream can advance if its own data arrives. [HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html) uses a QUIC stream for each request and response pair. This is a narrower claim than immunity to network loss. A lost QUIC packet can carry frames from multiple streams and block each of those streams. The connection also shares path capacity and congestion response, so loss can still reduce throughput for everyone.

For latency-sensitive voice or token delivery, record which hop and protocol carry the concurrent work. Distinguish pauses caused by TCP recovery from pauses caused by server scheduling, HTTP flow control or client buffering. If cross-stream stalls under loss matter, test the same workload over available HTTP/3 and HTTP/2 paths, observing per-stream delay as well as total throughput. Choose from those results and deployment support, without assuming that multiplexing alone guarantees independent delivery.
