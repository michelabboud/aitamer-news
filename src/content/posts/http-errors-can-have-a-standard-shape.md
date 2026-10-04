---
title: HTTP Errors Can Have a Standard Shape
description: RFC 9457 gives HTTP API errors a standard JSON shape. Learn which fields clients can rely on and how to define useful problem types.
pubDate: "2026-10-05T06:00:00Z"
specimen: 254
section: dev
tags:
  - http
  - apis
  - error-handling
  - standards
draft: false
heroImage: https://media.aitamer.news/heroes/http-errors-can-have-a-standard-shape-ace3b3b4.jpg
heroAlt: Different error symbols pass through a funnel into one consistent alert card.
author: ari
wildness:
  rating: 1
  verified: RFC 9457 defines JSON problem details for HTTP APIs.
  claimed: Clients can route known problems by type without parsing prose.
verdict: Use problem details when clients need structured error information beyond the HTTP status. Keep type stable, status aligned, and details safe to expose.
sources:
  - title: "RFC 9457: Problem Details for HTTP APIs"
    url: https://www.rfc-editor.org/rfc/rfc9457.html
---

## The response has two layers

An HTTP status code gives a client the broad result of a request. It may leave out information the client needs to handle an error. [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) defines problem details: a JSON object for carrying that information in an HTTP response. Its media type is `application/problem+json`.

## The fields have different jobs

`type` identifies the kind of problem with a URI. Clients must treat it as the primary identifier, so application logic can branch on that value. `title` is a short summary for people. `detail` explains this particular occurrence in human-readable text. Clients should not extract machine data by parsing `detail`. `instance` can identify the specific occurrence. `status`, when present, repeats the HTTP status code for convenience; the response must use the same code. All five fields are optional. An omitted `type` means `about:blank`, which adds no meaning beyond the status code. These roles come from [the standard's field definitions](https://www.rfc-editor.org/rfc/rfc9457.html).

For example, an API could return this body with an HTTP 422 response and a `Content-Type: application/problem+json` header:

```json
{
  "type": "https://example.com/problems/invalid-quantity",
  "title": "Invalid quantity",
  "status": 422,
  "detail": "Quantity must be greater than zero.",
  "instance": "/problems/requests/abc123",
  "field": "quantity"
}
```

This is an illustrative problem type. The `field` member is an extension. RFC 9457 allows problem types to define such members and requires clients to ignore extensions they do not recognize. An API can provide a machine-readable field name without asking clients to search the prose in `detail`. [The extension rules](https://www.rfc-editor.org/rfc/rfc9457.html) describe this behavior.

## What to do

1. Choose the HTTP status code that fits the error.
2. Define a stable `type` URI for each application-specific condition that needs distinct client behavior. Document its meaning, title, status, and extensions. If the URI uses HTTPS, make it lead to guidance people can read.
3. Return `application/problem+json` with a useful `detail`. Check error text and occurrence links for private data or implementation details before exposing them.
4. In clients, handle known `type` values, ignore unknown extensions, and keep a fallback for unfamiliar problem types.

[RFC 9457's guidance on defining types and security](https://www.rfc-editor.org/rfc/rfc9457.html) supports these steps.
