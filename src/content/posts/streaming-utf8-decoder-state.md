---
title: A Character Split Across Network Chunks
description: Keep decoder state across byte chunks so a split UTF-8 character survives intact.
pubDate: "2026-11-06T12:30:00Z"
section: dev
tags:
  - javascript
  - encoding
  - streams
  - fetch
  - utf-8
draft: false
heroImage: https://media.aitamer.news/heroes/streaming-utf8-decoder-state-e8a5acb2.jpg
heroAlt: Torn coral butterfly pieces sit on two paper conveyor belts beside a reassembled butterfly and an empty tray.
author: mai
wildness:
  rating: 1
  verified: Streaming decode preserves state between chunks and requires a final flush.
  claimed: No additional unverified claims.
verdict: Use one streaming decoder per byte sequence, flush it at a successful end, and parse message boundaries separately.
sources:
  - title: WHATWG Encoding Standard
    url: https://encoding.spec.whatwg.org/
  - title: "WHATWG Encoding Standard source: TextDecoder and TextDecoderStream"
    url: https://raw.githubusercontent.com/whatwg/encoding/main/encoding.bs
  - title: "MDN: TextDecoder decode()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode
  - title: "MDN: TextDecoderStream"
    url: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream
  - title: WHATWG Streams Standard
    url: https://streams.spec.whatwg.org/
---

A network chunk is a convenient piece of bytes, not a promise that a character ends at its boundary. If you decode each chunk as a complete, independent UTF-8 document, a perfectly valid character can turn into replacement characters.

Consider the euro sign, `€`. In UTF-8 its bytes are `E2 82 AC`. A response might deliver `E2` in one chunk and `82 AC` in the next. The bytes make sense together. Separately, neither chunk contains the complete character.

A streaming decoder keeps the unfinished sequence until more bytes arrive. This example reads a hypothetical UTF-8 endpoint and hands decoded text to a caller as it becomes available:

```js
async function readText(url, onText) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      onText(decoder.decode(value, { stream: true }));
    }
    onText(decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
```

The same decoder handles every chunk. With the split euro sign, the first streaming call can return an empty string; the next can return `€`. Empty output is normal when the decoder needs more bytes. After a successful end of stream, the final call flushes any remaining decoder state. Do not discard its result.

The flush matters when the final bytes are incomplete. In the default replacement mode, an unfinished sequence at the end can produce a replacement character. With fatal mode enabled, it can instead produce a decoding error. Either way, skipping the final call can hide the fact that the stream ended halfway through a character.

There is a shorter pipeline when the environment supports `TextDecoderStream`: pipe the byte stream through a decoder stream and read the resulting text stream. It carries decoding state across chunks and handles the final flush as the stream closes. The choice between the two approaches is mostly about how much control your surrounding code needs.

Two boundaries still matter. First, choose the encoding the protocol actually uses. This example assumes UTF-8; a decoder cannot infer the correct encoding from arbitrary bytes. Second, decoded string chunks are not guaranteed to be complete lines, JSON values, or application messages. A line parser needs its own buffer for a line split across text chunks.

By default, malformed input is replaced with `�`. If damaged text must fail instead, construct the decoder with `{ fatal: true }` and handle the resulting error. A read can also fail because the network stream errors. The example releases its reader lock in either case, but it does not cancel the source on an early failure; add a cancellation policy if abandoning that stream. It flushes only after a successful end, rather than treating a failed transfer as a complete document.
