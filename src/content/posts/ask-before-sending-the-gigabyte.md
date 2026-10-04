---
title: Ask Before Sending the Gigabyte
description: "A large HTTP upload can be rejected from its headers before its body is sent. Here is how Expect: 100-continue works and where its limits lie."
pubDate: "2026-10-05T04:00:00Z"
specimen: 250
section: dev
tags:
  - http
  - uploads
  - protocols
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/ask-before-sending-the-gigabyte-cdd3c4d8.jpg
heroAlt: A large cloud file approaches a striped barrier and a server that declines the transfer.
author: ari
wildness:
  rating: 3
  verified: HTTP permits a header-first pause and an early final response before an upload body.
  claimed: The saved transfer depends on the client waiting and the server deciding from headers.
verdict: Use the pause for large uploads that may fail from their headers. Treat 100 Continue as permission to send the body, with a final response still to come.
sources:
  - title: "RFC 9110: Expect"
    url: https://datatracker.ietf.org/doc/html/rfc9110#section-10.1.1
  - title: "RFC 9110: 100 Continue"
    url: https://datatracker.ietf.org/doc/html/rfc9110#section-15.2.1
  - title: "MDN: 100 Continue"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/100
---

A large upload can waste a transfer when the server can already tell from the request headers that it will reject the request. HTTP offers a pause point for this case. A client sending content can include `Expect: 100-continue`, then wait for a response before sending the body. The [HTTP specification](https://datatracker.ietf.org/doc/html/rfc9110#section-10.1.1) describes this as useful when the content is large or an error is likely.

## The exchange

The client sends the request line and headers first. Those headers include `Expect: 100-continue` and an indication that content will follow. The server examines the method, target, and headers. If these are enough to decide the result, it can send a final response immediately. For example, it may reject a request with `401 Unauthorized` or `405 Method Not Allowed` before the upload starts. Otherwise, it sends `100 Continue` to invite the body. [MDN shows this exchange](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/100) with a file upload.

After `100 Continue`, the client sends the body. The server then processes the complete request and sends a final response. `100 Continue` means the initial part has been received and has not yet been rejected. It does not promise that the upload will succeed. [The specification defines it as an interim response](https://datatracker.ietf.org/doc/html/rfc9110#section-15.2.1).

## Where the pause helps

The early decision can use information available in the headers. A server may know that the method is disallowed or that credentials are missing. It can reject on those grounds before receiving the content. A decision that depends on the body's contents still has to wait for the body. This is why the pause is most useful when a header-level rejection is plausible.

The saving is conditional. The [specification](https://datatracker.ietf.org/doc/html/rfc9110#section-10.1.1) allows a client to start sending the body before a response arrives, and says it should not wait indefinitely. If the response is `417 Expectation Failed`, it recommends retrying without the expectation. That response indicates the expectation could not be met along the request path.

## What to do

For large uploads, check whether your HTTP client can send `Expect: 100-continue` and wait briefly before transmitting content. On the server, make decisions available from the method, target, and headers promptly. When those fields settle the result, return the final status. Otherwise, send `100 Continue` so the client can proceed. Keep handling the final response separately: the upload still needs to be received and processed.
