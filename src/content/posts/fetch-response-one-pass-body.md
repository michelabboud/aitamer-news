---
title: A Fetch Response Body Is Usually a One-Pass Read
description: Reading a response consumes its body stream. Clone before the body is locked or disturbed when two consumers need it.
pubDate: "2026-11-07T08:30:00Z"
specimen: 1278
section: dev
tags:
  - javascript
  - fetch
  - streams
  - http
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/fetch-response-one-pass-body-85951b79.jpg
heroAlt: A cream paper ribbon passes from a full reel through a reader to a second reel, with a spare reel beside it.
author: mai
wildness:
  rating: 1
  verified: Cloning a response with a body creates two stream branches.
  claimed: A slower clone branch can accumulate unread data.
verdict: Clone before the body is locked or disturbed, and account for buffering when consumers read at different speeds.
sources:
  - title: WHATWG Fetch Standard
    url: https://fetch.spec.whatwg.org/
  - title: WHATWG Streams Standard
    url: https://streams.spec.whatwg.org/
  - title: "MDN: Response clone()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Response/clone
  - title: "MDN: Response bodyUsed"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Response/bodyUsed
  - title: "MDN: Response body"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Response/body
---

Suppose you fetch a JSON document, call `response.json()`, and then try `response.text()` to inspect the original text. The second operation normally rejects. Both methods need to consume the same response body, and that body is a stream rather than a reusable copy of the downloaded document.

Reading does not have to finish before this matters. Once a non-null body stream is disturbed by reading or cancellation, it cannot be consumed again through the response. A body is also unusable while its stream is locked to a reader. Calling `response.clone()` on an unusable response throws a `TypeError`; body-consuming methods reject their promises when the body is unusable.

When two consumers genuinely need their own reads, clone first:

```js
async function loadDocument() {
  const response = await fetch('/document.json');
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`);
  }

  const copy = response.clone();
  const [text, data] = await Promise.all([
    response.text(),
    copy.json()
  ]);
  return { text, data };
}
```

This hypothetical endpoint is expected to return a small JSON document. The original and the clone each provide a body for one consumer. The caller still needs to handle network failures and invalid JSON. A successful HTTP status alone does not prove the document is valid JSON.

Cloning a response with a body tees its stream into two branches. It does not make a second request to the server. The branches can progress at different speeds, but that convenience has a cost: unread data can accumulate for the slower branch. If one branch is never consumed, the entire body may be buffered for it. Avoid this pattern for a large or unbounded response unless you have designed and tested the memory behavior.

Often the simpler answer is to read once and reuse the result. For a small document, `const text = await response.text()` followed by `JSON.parse(text)` gives you both the source string and parsed value without a cloned stream. Treat that string carefully if it contains secrets or personal information.

`bodyUsed` is useful, but it is not a complete availability test. A freshly acquired reader locks the body even before reading, so `bodyUsed` can still be false while cloning fails. Releasing that reader without reading can make the undisturbed body available again. Once it has been read or canceled, releasing the lock does not rewind it.

Finally, responses with a null body are a separate case. The ordinary one-pass warning concerns a present body stream, not an absent stream that has no bytes to consume.
