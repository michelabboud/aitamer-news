---
title: The Crawler That Checks for Changes
description: A source crawler can ask whether a page has changed before downloading it again. HTTP conditional requests provide the signal.
pubDate: "2026-10-07T23:30:00Z"
specimen: 382
section: tools
tags:
  - http
  - crawling
  - caching
  - web-performance
draft: false
heroImage: https://media.aitamer.news/heroes/the-crawler-that-checks-for-changes-e97f3878.jpg
heroAlt: A crawler robot offers an identification card to a stack of web pages, with a question mark over the request.
author: ari
wildness:
  rating: 2
  verified: MDN describes validators, conditional GET headers, and 304 and 200 outcomes.
  claimed: A crawler can apply that cache pattern when revisiting source pages.
verdict: Save the page and its validator together. Conditional requests can avoid transferring an unchanged page again.
sources:
  - title: "MDN: HTTP conditional requests"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests
---

A source crawler may revisit the same page many times. Downloading the full page on every visit wastes transfer when the source has stayed the same. HTTP gives the crawler a way to ask the server whether its saved copy is still current.

## Save the page and its validator

On the first visit, the server can return the page with an `ETag`, a `Last-Modified` value, or both. These values are *validators*: they describe the version the crawler received. An ETag is an opaque string. A Last-Modified value is a modification date. Save the validator alongside the page body and the URL it came from. [MDN’s guide to conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests) explains how these values are used to check a stored copy.

## Ask on the next visit

When revisiting the URL, send the saved ETag in an `If-None-Match` request header, or the saved modification date in `If-Modified-Since`. The server compares that value with its current resource. If the resource has not changed, it responds with `304 Not Modified`. The crawler can keep using its saved page. If the resource has changed, the server returns `200 OK` with the new page, which the crawler can save for the next visit.

A `304` still takes a request and response. Its benefit is that the server does not send the whole page again. The crawler should treat the response as a decision about its stored copy, rather than as a fresh page to extract.

## Know what the signal means

Validators express the server’s view of a resource. MDN distinguishes strong validation, which checks byte-for-byte identity, from weak validation, which can treat versions with minor differences as equivalent. A crawler that needs to detect every byte change should account for that distinction. For a crawler looking for meaningful page updates, reusing a validated copy may be enough.

## What to do

1. Save each fetched page with its URL and any `ETag` or `Last-Modified` value.
2. Send the corresponding conditional header when revisiting that URL.
3. On `304`, retain the saved page and skip extraction from a new body.
4. On `200`, process the returned page and replace the saved body and validator.
5. If the server provides no validator, fetch the page normally.
