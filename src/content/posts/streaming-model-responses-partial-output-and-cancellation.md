---
title: "Streaming model responses: partial output and cancellation"
description: How to handle a model response that arrives in pieces. It covers server-sent events, partial JSON, user cancellation, and what is safe to store.
pubDate: "2026-10-04T03:30:00Z"
specimen: 204
section: dev
tags: [streaming, sse, llm-apis, json, error-handling]
draft: false
heroImage: https://media.aitamer.news/heroes/streaming-model-responses-partial-output-and-cancellation-178c8c00.jpg
heroAlt: "A coral paper thread winds through open drawers and ends tucked in a cream jar, in a calm layered collage of soft blues and warm neutrals."
author: quill
wildness:
  rating: 2
  verified: "SSE parsing rules and fetch abort behavior come from the WHATWG spec and MDN."
  claimed: "Event names and recovery advice are the providers' own documentation."
verdict: "Treat a stream as unfinished until the provider's completion event arrives, and store only what you can name as complete or partial."
sources:
  - title: "WHATWG HTML Standard: Server-sent events"
    url: "https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream"
  - title: "Anthropic: Streaming messages"
    url: "https://platform.claude.com/docs/en/build-with-claude/streaming"
  - title: "OpenAI: Streaming API responses"
    url: "https://developers.openai.com/api/docs/guides/streaming-responses"
  - title: "MDN: AbortController.abort()"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort"
---

## How the stream arrives

Providers stream over server-sent events. Under the [WHATWG parsing rules](https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream), a blank line ends an event and the stream must be UTF-8. If the connection ends mid-event, "any pending data must be discarded". A cut connection can therefore drop the last event without any error.

## Know when it finished

A closed connection does not mean a finished answer. Wait for the provider's completion event. [OpenAI's Responses API](https://developers.openai.com/api/docs/guides/streaming-responses) emits `response.completed`. [Anthropic's Messages API](https://platform.claude.com/docs/en/build-with-claude/streaming) sends `message_delta` with a `stop_reason`, then `message_stop`. Anthropic also says errors such as `overloaded_error` can arrive inside the stream, after a 200 response has started.

## Partial JSON

Tool arguments stream as fragments. Anthropic's docs say the deltas are partial JSON strings, and the final input is always an object. Accumulate the fragments and parse after `content_block_stop`. Do not act on a tool call before then.

## Cancellation

When the user cancels, abort the request. In browsers, [`AbortController.abort()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) rejects an in-flight fetch with an `AbortError`. Treat that rejection as an expected outcome of cancelling.

## What to store

Keep the text received so far and mark it with a status: complete, cancelled, or errored. Never present cancelled text as a full answer. Anthropic notes that tool use and thinking blocks cannot be partially recovered, so discard unfinished ones. OpenAI warns that partial output is harder to moderate, so check text before showing it where that matters.
