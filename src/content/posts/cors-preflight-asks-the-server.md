---
title: A CORS preflight asks the server for permission, and only the browser enforces the answer
description: Browsers send an OPTIONS preflight for non-safelisted methods, headers or Content-Type values, the server answers with allow lists, and the browser alone decides whether the script sees the response.
pubDate: "2026-10-31T13:00:00Z"
specimen: 1166
section: dev
tags:
  - cors
  - http
  - browsers
  - web-security
  - fetch
draft: false
heroImage: https://media.aitamer.news/heroes/cors-preflight-asks-the-server-51ab4076.jpg
heroAlt: A paper dove carries a sealed scroll toward a stone gateway whose road is closed by a lowered barrier.
author: quill
wildness:
  rating: 2
  verified: Safelists, preflight and allow-list checks (Fetch Standard); browser enforcement, credentials (MDN).
  claimed: That CORS is not access control and POST needs CSRF checks is the post's judgment.
verdict: Answer preflights with explicit allow lists, and enforce authorization on the server as if CORS did not exist.
sources:
  - title: "Fetch Standard: CORS-safelisted method"
    url: https://fetch.spec.whatwg.org/#cors-safelisted-method
  - title: "Fetch Standard: CORS-preflight fetch"
    url: https://fetch.spec.whatwg.org/#cors-preflight-fetch
  - title: "MDN: Cross-Origin Resource Sharing (CORS)"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
---

A page calls `fetch` against an API on another origin, and the network panel shows an `OPTIONS` request that the code never made. That is a CORS preflight. The browser sends it to ask the server whether the real request is allowed, and the browser decides what to do with the answer. Here is what triggers it, what the server must answer, and who enforces it.

## Simple requests skip the preflight

The [Fetch Standard](https://fetch.spec.whatwg.org/#cors-safelisted-method) defines a CORS-safelisted method as GET, HEAD or POST. It also defines a short list of CORS-safelisted request headers. [MDN's CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) lists them as `Accept`, `Accept-Language`, `Content-Language`, `Content-Type` and `Range`, each with conditions. For `Content-Type`, the standard says the value's MIME type essence must be `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain`, and that a safelisted header value longer than 128 bytes does not qualify.

A request that stays inside those limits goes out without a preflight. MDN adds two less obvious conditions: no event listeners on `XMLHttpRequest.upload`, and no `ReadableStream` in the request.

## What triggers it

The standard's HTTP fetch algorithm makes a preflight when the method is not a CORS-safelisted method, or when the request carries a header outside the safelist, and the browser has no cached permission for it. The common cases:

```js
// Preflighted: PUT is not a safelisted method
fetch("https://api.example.com/items/7", { method: "PUT" });

// Preflighted: JSON is not one of the three Content-Type values
fetch("https://api.example.com/items", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "x" }),
});

// Preflighted: a custom header
fetch("https://api.example.com/items", { headers: { "X-Request-Id": "abc" } });
```

The JSON case surprises people most: the method is a plain POST, but the header value triggers the preflight.

## What the server must answer

The standard defines a CORS-preflight request as one that checks to see if the CORS protocol is understood. It uses `OPTIONS`, with `Access-Control-Request-Method` naming the method the real request will use and `Access-Control-Request-Headers` naming its headers. A successful answer is restricted to an ok status, such as 200 or 204, and looks like this (`Access-Control-Max-Age` is optional):

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type, X-Request-Id
Access-Control-Max-Age: 600
```

In the [CORS-preflight fetch](https://fetch.spec.whatwg.org/#cors-preflight-fetch) steps, the browser reads the allowed methods and headers and fails the request if the real method, unless it is a safelisted GET, HEAD or POST, or a non-safelisted header is missing from them; without credentials, a `*` matches any header except `Authorization`, which must be named. `Access-Control-Max-Age` sets how long the browser may cache the result; without it, the standard uses 5 seconds. MDN adds that a request with credentials needs `Access-Control-Allow-Credentials: true` and an explicit origin, because the `*` wildcard is not allowed when credentials are involved.

## The browser enforces it

MDN states the purpose directly: for security reasons, browsers restrict cross-origin HTTP requests initiated from scripts, and they use CORS in APIs such as `fetch()` and `XMLHttpRequest` to do it. The server only declares what it permits. The browser reads the headers and decides whether the script may see the response. For a simple request, MDN notes that the server does not have to opt in to receive it, because the threat is no worse than a form submission; it must opt in only to share the response with the script. The request arrives and runs either way.

That has two consequences. A CORS header is not access control: a client outside the browser never sends a preflight and simply ignores the headers. And a state-changing endpoint reachable by a simple POST needs its own protection, such as authentication and anti-forgery checks.

## The rule

Answer `OPTIONS` with an ok status and explicit allow lists, name origins instead of `*` when credentials are involved, and enforce authorization on the server as if CORS did not exist.
