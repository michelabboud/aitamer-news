---
title: An HTTP Redirect Can Change the Request Method
description: A POST followed by a redirect can become a GET or remain a POST. The choice between 303, 307, 308, and historic 301/302 behavior changes what a form or API client sends next.
pubDate: "2026-10-09T09:30:00Z"
section: dev
tags:
  - http
  - redirects
  - apis
draft: false
heroImage: https://media.aitamer.news/heroes/an-http-redirect-can-change-the-request-method-a89505ad.jpg
heroAlt: A cream path forks through a blue gate toward a rust submission envelope or a separate cream reading card and result frame.
author: ari
wildness:
  rating: 1
  verified: RFC 9110 defines 303 retrieval, 307/308 method preservation, and optional POST-to-GET for 301/302.
  claimed: The API example is illustrative; client library behavior needs direct testing.
verdict: Use 303 to send a completed POST toward a retrieval URI, and 307/308 when the next request must retain its method. Treat 301/302 POST conversion as client-dependent.
sources:
  - title: RFC 9110, HTTP Semantics, Section 15.4 Redirection
    url: https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4
---

A user submits a voice transcript for summarization. The server accepts a `POST`, then sends a `Location` header. Does the client fetch a result page, or does it send the transcript again to the new address? The answer depends on the redirect status, and a client that follows redirects automatically can hide the second request from application code.

[RFC 9110's redirection rules](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4) draw two different paths. A `303 See Other` points to a different resource that provides an indirect response to the original request. After a POST, the client can retrieve that resource with `GET` (or `HEAD`). This is a good fit for a form that creates a summarization job and then displays `/jobs/42`: the POST submits the work; the follow-up GET reads its status. The result URI need not be equivalent to the submission URI.

```http
POST /jobs HTTP/1.1
Content-Type: application/json

{"transcript":"..."}

HTTP/1.1 303 See Other
Location: /jobs/42
```

The client follows with `GET /jobs/42`. Reloading that page can retrieve the status again without asking the browser to resubmit the POST. This pattern is useful when a human may bookmark or refresh the result. It also makes the API contract legible: the creation response tells the client where to look next, while the job's state determines what that GET returns.

A `307 Temporary Redirect` tells an automatically redirecting client **not to change the request method**. A `308 Permanent Redirect` gives the same method-preserving instruction while identifying a permanent new URI. If `POST /jobs` receives one of these, the follow-up remains POST to the URI in `Location`. A client must therefore be prepared to resend the request content as appropriate. That can be awkward for a streamed audio upload whose body cannot be replayed from memory or disk. It also matters for trust: redirecting a request with transcript content to a different origin deserves deliberate scrutiny. RFC 9110 tells clients to update automatically generated headers for the new target and to consider removing caller-supplied sensitive headers such as `Authorization` and `Cookie` when redirection has security implications.

`301 Moved Permanently` and `302 Found` are less precise for a POST. Early clients disagreed about whether to preserve POST or convert it to GET. The current specification explicitly allows a user agent to change POST to GET for either status. It does **not** promise that every client will do so. `301` signals a permanent URI move; `302` signals a temporary location. If method preservation is the requirement, use `308` for the permanent case or `307` for the temporary one. If a separate retrieval is the requirement, use `303`.

The distinction is larger than a label on the response. When a redirect changes the method to GET or HEAD, RFC 9110 says the client should remove headers that describe the old request content, including `Content-Type` and `Content-Length`. A server handling the destination must not assume that a POST body survived a `303` or a POST-to-GET `301` or `302`. Conversely, a server handling the destination of a `307` or `308` must be ready for the original method and content semantics. An endpoint designed only for GET may reject the preserved POST.

A redirect policy also needs to account for the first request. A `307` or `308` describes the next request's method; it does not tell the client whether the original server applied any side effect before returning the redirect. For a job-creation endpoint, define the redirect before processing the job, or give the operation an application-level idempotency rule so a repeated submission cannot create a second job. In an integration test, capture both requests and assert the destination, method, content, and sensitive headers. Test a direct request to the final URI too, since some clients expose redirect responses to their callers instead of following them.

Automatic following is permitted, not mandatory. A user agent may decline to follow, and it should detect redirect loops. That leaves two practical checks for API designers. First, decide whether the client should retrieve a result or repeat the operation at a different URI. Second, test the real client library's redirect policy with a POST body, including what it does with replayable and streamed bodies and with credentials across origins. Those are client behaviors and deployment choices; the status code supplies the protocol intent, not an end-to-end guarantee that every client will complete the second request.

For form submissions, `303` makes the handoff to a readable result explicit. For an API route that has moved and must continue receiving the same method, choose `307` or `308` according to whether the move is temporary or permanent. Avoid depending on a particular POST conversion for `301` or `302`, because the specification intentionally leaves that choice to the user agent.
