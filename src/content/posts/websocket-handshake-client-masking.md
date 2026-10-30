---
title: The WebSocket Upgrade Handshake, and Why Browsers Mask Client Frames
description: How the WebSocket Upgrade handshake proves a server actually understands the protocol, and why client-to-server frames are XOR-masked even over TLS.
pubDate: "2026-10-31T11:00:00Z"
section: dev
tags:
  - websocket
  - http
  - rfc6455
  - security
  - networking
  - protocol
draft: false
heroImage: https://media.aitamer.news/heroes/websocket-handshake-client-masking-10df9347.jpg
heroAlt: A sealed envelope sits behind a lattice screen bearing a paper mask, beside a key on a tag.
author: mai
wildness:
  rating: 2
  verified: Per-frame masking key in frame header; mandatory client masking even over TLS, per RFC 6455 §5.1/§5.3.
  claimed: The cache-poisoning scenario is my articulation, anchored to §5.1/§5.3 wording.
verdict: Masking protects the proxies in between, not your secrets.
sources:
  - title: RFC 6455 §5.1 Overview
    url: https://www.rfc-editor.org/rfc/rfc6455.html#section-5.1
  - title: RFC 6455 §5.3 Client-to-Server Masking
    url: https://www.rfc-editor.org/rfc/rfc6455.html#section-5.3
  - title: RFC 6455 §1.3 Opening Handshake
    url: https://www.rfc-editor.org/rfc/rfc6455.html#section-1.3
  - title: RFC 6455 §4.1 Client Requirements
    url: https://www.rfc-editor.org/rfc/rfc6455.html#section-4.1
---

Every WebSocket connection begins as an ordinary HTTP request. A browser opens a TCP connection, then sends a GET request with a few extra headers:

```
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://example.com
```

The Upgrade and Connection headers ask the server to switch protocols. Sec-WebSocket-Key is a 16-byte nonce, base64-encoded. Sec-WebSocket-Version is fixed: the spec requires it to be 13, which is the only value a client may send ([RFC 6455 §4.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-4.1)). The Origin header, required of browser clients, tells the server which page is opening the connection.

The server responds, if it agrees, with status 101 Switching Protocols:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

Sec-WebSocket-Accept is what makes this a proof rather than a formality. The server takes the client's key, concatenates it with the fixed GUID 258EAFA5-E914-47DA-95CA-C5AB0DC85B11, hashes the result with SHA-1, and base64-encodes the digest. The client recomputes the same value and compares. A match proves the server actually read the handshake. The RFC states the purpose directly: this prevents an attacker from tricking a WebSocket server by sending it carefully crafted packets using XMLHttpRequest or a form submission ([RFC 6455 §1.3](https://www.rfc-editor.org/rfc/rfc6455.html#section-1.3)). The server must prove it received a real WebSocket handshake, so it does not accept a connection that is not a WebSocket connection.

Once both sides accept, the connection stops being HTTP and becomes a stream of binary frames. But the wire format is asymmetric: frames from the client to the server must be masked, and frames from the server to the client must not be ([RFC 6455 §5.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.1)).

Masking works like this. For each frame, the client picks a fresh 32-bit key from a strong source of entropy and places it in the frame header, just before the payload. Every payload byte is then XORed with the key byte at the same position modulo four, so payload byte i is combined with key[i % 4]. The receiver reverses the operation with the same key. It is reversible obfuscation, not encryption; anyone who sees the key can decode the payload.

The point is not confidentiality. The RFC says clients mask all frames to avoid confusing network intermediaries such as intercepting proxies, and for the security reasons discussed later ([RFC 6455 §5.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.1)). After the handshake, a browser script chooses the payload bytes of every frame it sends, and the browser does not police them. Without masking, an attacker could select the exact bytes that appear on the wire and poison a shared intermediary cache. The spec says the unpredictability of the key is essential to prevent authors of malicious applications from selecting the bytes that appear on the wire ([RFC 6455 §5.3](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.3)). Masking is mandatory even over a TLS connection, a sign that it defends against intermediaries rather than eavesdroppers ([RFC 6455 §5.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.1)).
