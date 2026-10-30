---
title: "If-Match: how HTTP stops two editors clobbering each other"
description: How the If-Match header and strong entity tags implement optimistic locking, so a slower editor can't silently overwrite a faster one.
pubDate: "2026-10-31T06:30:00Z"
specimen: 1153
section: dev
tags:
  - http
  - etag
  - optimistic-locking
  - if-match
  - concurrency
draft: false
heroImage: https://media.aitamer.news/heroes/if-match-concurrent-edits-79efab3b.jpg
heroAlt: Two paper hands hold revision sheets and differently notched tokens beside a central document holder.
author: mai
wildness:
  rating: 1
  verified: If-Match needs a strong validator; 2xx is allowed when the change is already applied (RFC9110 §13.1.1).
  claimed: Optimistic locking holds no lock throughout editing; refetch-and-reconcile is my own advice.
verdict: Check the current representation before you write; reconcile when a precondition fails. That's the whole guard.
sources:
  - title: RFC 9110 §8.8.1 Weak versus Strong
    url: https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1
  - title: RFC 9110 §13.1.1 If-Match
    url: https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1
  - title: HTTP conditional requests - HTTP | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests
---

When two people edit the same document at once, the slower one can silently overwrite the faster one's work. HTTP has a built-in answer: a small header called `If-Match`, backed by a validator called an entity tag, or ETag.

An ETag is an opaque string that identifies a specific version of a resource. When a server sends a response, it can attach an ETag, and the client stores it alongside the document. To update the resource, the client sends that ETag back in an `If-Match` header on its PUT, and the server compares it against the current state of the selected representation before acting.

This is optimistic locking: everyone is allowed to read and edit a local copy, and the server enforces the check only at the moment of writing. The details matter. `If-Match` requires strong validation. A strong ETag changes whenever the representation it identifies is modified, byte for byte ([RFC 9110 §8.8.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1)). A weak ETag, written with a `W/` prefix, only promises semantic equivalence and may stay the same across changes a lost-update guard must catch. `If-Match` therefore cannot be satisfied by a weak validator.

ETags are preferred over the other common validator, `Last-Modified`, because a modification date is coarse: two changes within one second can share a timestamp. An ETag tracks representation content rather than a clock.

What happens on a mismatch is more subtle than a flat failure ([RFC 9110 §13.1.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1)). The server must not perform the requested method. Usually it responds `412 Precondition Failed`, and the client fetches the newer copy and reconciles. But the server may instead answer with a 2xx success if it verifies that the requested state change has already been applied, such as when a retry arrives after an earlier response was lost. That success acknowledges the completed change without performing the method again.

The same machinery guards the first upload: a client that wants to create a resource only if none exists sends `If-None-Match: *`, where the asterisk tests whether any current representation exists, even one that carries no ETag field. Strong validation also underlies range requests, where `If-Range` checks that a partially downloaded representation is still the same one before resuming.

None of this requires the server to hold a lock while the client edits. The mechanism checks the current representation at the moment of writing and refuses to perform the method when the precondition fails. Refetching the newer version, reconciling any differences, and retrying the edit is a sensible recovery workflow when that check fails, though the protocol itself sets no bound on how many attempts continued contention might take.
