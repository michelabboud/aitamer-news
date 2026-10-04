---
title: "Reading a 429: rate-limit headers for agents"
description: "A 429 can tell an agent when to retry and which limit it reached. The response body also matters: some 429s will not clear with backoff."
pubDate: "2026-10-05T15:30:00Z"
specimen: 214
section: devops
tags:
  - http
  - rate-limits
  - retries
  - agents
draft: false
heroImage: https://media.aitamer.news/heroes/reading-a-429-rate-limit-headers-for-agents-a173dee8.jpg
heroAlt: A calm paper-cut collage of a coral gate, a looping blue thread, and a layered ledger, with generous cream space around them.
author: ari
wildness:
  rating: 3
  verified: RFCs define 429 and Retry-After.
  claimed: Provider header and retry behavior comes from their API docs.
verdict: Read the headers and error body, then bound retries across calls that share the limit.
sources:
  - title: "RFC 6585, section 4: 429 Too Many Requests"
    url: https://www.rfc-editor.org/rfc/rfc6585.html#section-4
  - title: "RFC 9110, section 10.2.3: Retry-After"
    url: https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3
  - title: "OpenAI API: rate limits in headers"
    url: https://developers.openai.com/api/docs/guides/rate-limits#rate-limits-in-headers
  - title: "Anthropic API: response headers"
    url: https://platform.claude.com/docs/en/api/rate-limits#response-headers
  - title: "OpenAI API: retrying with exponential backoff"
    url: https://developers.openai.com/api/docs/guides/rate-limits#retrying-with-exponential-backoff
  - title: "OpenAI API: spend limits"
    url: https://developers.openai.com/api/docs/guides/rate-limits#spend-limits
  - title: "Anthropic API: reaching your spend cap"
    url: https://platform.claude.com/docs/en/api/rate-limits#reaching-your-spend-cap
---

An HTTP `429 Too Many Requests` means the caller has sent too many requests in a given time. [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585.html#section-4) allows a `Retry-After` header and leaves the accounting scope to the server. An agent should inspect the response before scheduling more work.

## Read the headers

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3) defines `Retry-After` as either a nonnegative number of seconds or an HTTP date. For a temporary limit, use it to time the next attempt.

Rate-limit fields add context. [OpenAI](https://developers.openai.com/api/docs/guides/rate-limits#rate-limits-in-headers) lists `x-ratelimit-remaining-requests` and `x-ratelimit-reset-requests`; its reset value is a duration. [Anthropic](https://platform.claude.com/docs/en/api/rate-limits#response-headers) lists `anthropic-ratelimit-requests-remaining` and `anthropic-ratelimit-requests-reset`; its reset value is an RFC 3339 timestamp. Both document token limit fields too. Read the field for the limit the response describes.

## Back off across calls

Pause calls that share the affected limit. Honor a valid `Retry-After` as a minimum wait, then add a small random delay. If the header is absent or invalid, use exponential backoff with jitter; [OpenAI recommends adding a small random delay](https://developers.openai.com/api/docs/guides/rate-limits#retrying-with-exponential-backoff) so clients do not retry together. Cap both attempts and total retry time. Account for SDK retries before adding another loop. OpenAI says failed requests count toward its per-minute limit, so immediate repeats can prolong throttling.

## Check the error body

Read the error body before retrying. [OpenAI says](https://developers.openai.com/api/docs/guides/rate-limits#spend-limits) a hard spend limit can also return 429. [Anthropic says](https://platform.claude.com/docs/en/api/rate-limits#reaching-your-spend-cap) its spend-cap 429 has no `retry-after`, and retries fail until access resumes. Surface that condition or defer the job until the account state changes.

## What to do

Read the error body and the relevant rate-limit headers together. Follow valid server retry hints, bound retries across shared limits, and surface spend-cap errors for an account decision.
