---
title: ALPN Chooses a Protocol Inside the TLS Handshake
description: A trusted certificate can coexist with an unexpected HTTP protocol. Learn how ALPN selects h2 or http/1.1 and what to verify at a voice or AI API edge.
pubDate: "2026-10-10T05:30:00Z"
specimen: 608
section: devops
tags:
  - tls
  - alpn
  - http2
  - api-infrastructure
draft: false
heroImage: https://media.aitamer.news/heroes/alpn-chooses-a-protocol-inside-the-tls-handshake-009021e1.jpg
heroAlt: A paper handshake selects a teal ribbon above a secure navy arch, while an unused rust ribbon remains separate.
author: ari
wildness:
  rating: 1
  verified: ALPN selects one advertised application protocol per TLS connection.
  claimed: A valid certificate alone does not establish which HTTP version was selected.
verdict: Verify negotiated ALPN and HTTP version at each TLS hop before treating HTTP/2 as a property of an AI or voice API connection.
sources:
  - title: "RFC 7301: TLS Application-Layer Protocol Negotiation Extension"
    url: https://www.rfc-editor.org/rfc/rfc7301.html
  - title: "RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3"
    url: https://www.rfc-editor.org/rfc/rfc8446.html
  - title: "RFC 9113: HTTP/2"
    url: https://www.rfc-editor.org/rfc/rfc9113.html
---

A voice assistant opens one secure connection to an API gateway. Its certificate validates, the request succeeds, and the team assumes HTTP/2 is carrying concurrent audio and control requests. The gateway may actually have selected HTTP/1.1. Certificate validation answers who the client connected to; the application protocol needs its own observation.

Application-Layer Protocol Negotiation, or ALPN, is a TLS extension for choosing a protocol on a connection that can serve several protocols on the same port. Under [RFC 7301](https://www.rfc-editor.org/rfc/rfc7301.html), the client advertises supported protocol identifiers in its ClientHello, in preference order. A client might offer `h2` and `http/1.1`. The server selects one shared identifier, and that selection governs the application data on that connection. If the server supports none of the offered protocols, the specification calls for a fatal `no_application_protocol` alert. The server cannot select `h2` and then exchange HTTP/1.1 messages on that connection.

There is a version detail behind diagrams of this exchange. RFC 7301 depicts the server's answer in ServerHello for the TLS handshake it specifies. In [TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html), ALPN appears in ClientHello and the server's EncryptedExtensions message. The useful operational fact remains that the choice is made during the handshake, before ordinary application traffic. The `h2` identifier is specifically the identifier for HTTP/2 over TLS, as [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html) specifies.

Suppose a gateway terminates TLS for `voice.example` and forwards requests to several backends. It can present the correct certificate while selecting `http/1.1` because its listener or the client has no working `h2` overlap. The upstream hop may use a different protocol again. A successful certificate check at the public endpoint therefore says nothing about the HTTP version on either hop. ALPN also describes a connection choice, so a result observed on one connection should not be copied onto every new or resumed connection.

For a streaming or concurrent AI service, inspect the negotiated ALPN value and the HTTP version from the actual client to the actual endpoint. Check each TLS hop separately when a proxy terminates and reestablishes TLS. If HTTP/2 is a requirement, make that an explicit endpoint check and fail visibly when it is absent. If HTTP/1.1 is supported, document the fallback and test its behavior under the application's real concurrency.
