---
title: A 404 Is a Response, Not a Fetch Rejection
description: Check HTTP status separately from network and request failures.
pubDate: "2026-11-08T12:30:00Z"
section: dev
tags:
  - javascript
  - fetch
  - http
  - errors
draft: false
heroImage: https://media.aitamer.news/heroes/fetch-http-error-response-8a4ffc70.jpg
heroAlt: A paper cloud sends an envelope with a coral insert to one tray while a broken route ends beside an empty tray.
author: mai
wildness:
  rating: 1
  verified: HTTP error statuses normally fulfill fetch; ok identifies statuses from 200 through 299.
  claimed: No additional unverified claims.
verdict: Check the response status explicitly, and handle request and body failures as separate outcomes.
sources:
  - title: "MDN: Using the Fetch API"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  - title: "MDN: Window fetch()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch
  - title: "MDN: Response ok"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  - title: "WHATWG Fetch Standard: statuses and bodies"
    url: https://fetch.spec.whatwg.org/
---

A request can fail from your application's point of view even when the browser successfully receives an HTTP response. With Fetch, that distinction determines whether you inspect a response or handle a rejected promise.

For a normal, readable HTTP response, a 404 or 500 does not by itself make the fetch promise reject. The promise fulfills with a response carrying that status. A network error, an invalid request, or certain browser restrictions can instead cause rejection without giving your code a usable response to inspect.

Suppose a same-origin endpoint is expected to return a JSON product when it succeeds. This function keeps the request failure separate from an HTTP error and only parses JSON on the success path:

```js
async function getProduct(id) {
  let response;
  try {
    response = await fetch(`/api/products/${encodeURIComponent(id)}`);
  } catch (error) {
    return { kind: 'request-failed', error };
  }

  if (!response.ok) {
    return { kind: 'http-error', status: response.status };
  }

  try {
    const product = await response.json();
    return { kind: 'success', product };
  } catch (error) {
    return { kind: 'body-failed', error };
  }
}
```

The response's `ok` property is true for statuses from 200 through 299. The numeric status lets the caller choose a more specific message: a missing product and a server error need not look identical. The first catch does not label every rejection as an internet outage. A bad URL, a policy restriction, or an aborted request can also stop a fetch.

The final catch is separate for another reason. A successful status does not guarantee a complete body or valid JSON. The transfer can fail while the body is being read, and parsing can fail if the returned text is not JSON. This example assumes the endpoint's successful response is JSON; if the endpoint also returns an empty successful response, handle that documented case before parsing.

Do not assume every error response has the same body shape. A proxy might return HTML, an API might return JSON, and a response might have no useful body. If you choose to read error details, use the endpoint's documented contract, handle parsing failure, and avoid displaying raw server output as trusted markup.

There is also a visibility boundary. Cross-origin requests need the appropriate CORS permission for JavaScript to see the response. An opaque response from a cross-origin no-CORS request exposes status zero and no readable body, so it cannot be classified like an ordinary 404 or 500.

Treat these outcomes as different evidence: an HTTP status is an exposed response, a request rejection is a failure to obtain one through that fetch, and a body error happens later. Your interface can then report what it actually knows.
