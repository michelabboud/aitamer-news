---
title: Resume a Model Download Safely
description: A partial download is useful only when the remaining bytes belong to the same file. HTTP range requests and validators let you check before appending.
pubDate: "2026-10-07T23:00:00Z"
specimen: 381
section: tools
tags:
  - downloads
  - http
  - range-requests
  - etag
draft: false
heroImage: https://media.aitamer.news/heroes/resume-a-model-download-safely-f641533f.jpg
heroAlt: A partially filled download document resumes from a server and ends beside a verification shield.
author: ari
wildness:
  rating: 2
  verified: RFC 9110 defines If-Range and requires a shared strong validator to combine partial responses.
  claimed: Apply those HTTP rules when resuming a model file download.
verdict: A safe resume needs the saved byte position and a strong validator. Append only after checking the partial response.
sources:
  - title: HTTP range requests | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests
  - title: "RFC 9110: HTTP Semantics"
    url: https://www.rfc-editor.org/rfc/rfc9110.html
---

A stalled model download can leave a useful prefix on disk. [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) let a client ask for the remaining bytes. The file at the same address may have changed while the download was stopped. Appending bytes from the new file to the old prefix would leave a mixed result.

## Save the identity of the partial file

Record the number of bytes already stored and the original response's strong ETag. An ETag is a server supplied validator for a representation. A weak ETag starts with `W/` and cannot be used with `If-Range`. Keep the URL and representation settings, including content encoding, consistent. Byte positions refer to the representation the server sends. The [HTTP specification](https://www.rfc-editor.org/rfc/rfc9110.html) permits combining partial responses only when they share a strong validator.

If there is no strong ETag, a `Last-Modified` date works with `If-Range` only under the specification's strong validator rules and only when there is no ETag. If that cannot be established, fetch the file again from the start.

## Check the resumed response

Suppose the saved file contains N bytes. Request the same resource with `Range: bytes=N-` and `If-Range` set to the saved strong ETag. If the representation still matches, the server can return `206 Partial Content`. If it changed, `If-Range` directs the server to ignore the range and return the full representation. [MDN's guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) explains these response paths.

For a `206` response, inspect `Content-Range` before appending. Its starting position must equal N, and its total length must agree with any total already recorded. Check a returned ETag against the saved one. `Content-Length` describes the returned body, which may be only the remaining part, so it cannot substitute for `Content-Range`. A `200` response contains a full replacement: save it as a new download instead of appending it. A `416` response means the requested range is unsatisfiable; inspect the file and response before trying again. These checks follow the [range response rules](https://www.rfc-editor.org/rfc/rfc9110.html).

## What to do

1. Keep the partial file and its strong ETag together.
2. Resume from the exact saved byte count with `Range` and `If-Range`.
3. Append only after a `206` response passes the validator and `Content-Range` checks.
4. Start a fresh file for a `200` response or when the saved metadata is missing or inconsistent.

These checks prevent a completed transfer from joining bytes from different versions.
