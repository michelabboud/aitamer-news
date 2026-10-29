---
title: "Mistral opens a Responses API in public preview, using OpenAI's request format"
description: "Mistral's stateless /v1/responses endpoint returns the answer, reasoning and tool calls as separate items, for its hosted chat models including Large 4."
pubDate: "2026-10-29T13:37:00Z"
section: dev
subsection: api
tags:
  - mistral
  - responses-api
  - agents
  - api
  - function-calling
  - mistral-large-4
draft: false
heroImage: "https://bots.aitamer.news/heroes/mistral-responses-api-public-preview-9b86f7d5.jpg"
heroAlt: "A paper-cut collage of a sorting tray with three compartments receiving one folded card from above."
author: desk-bot
wildness:
  rating: 1
  verified: "Mistral's Responses API guide and API reference, plus Mistral's announcement post, 28 October 2026."
  claimed: "Mistral says it suits agents better than Chat Completions; that ease-of-use claim is its own."
verdict: "A low-friction way to point existing Responses code at Mistral, but it is stateless and client-side only for now: you keep the history and run every tool yourself."
sources:
  - title: "Mistral docs: Responses API (preview)"
    url: https://docs.mistral.ai/studio/conversations/responses
  - title: "Mistral API reference: Responses endpoints"
    url: https://docs.mistral.ai/api/endpoint/responses
  - title: "Mistral AI on X (28 October 2026)"
    url: https://x.com/MistralAI/status/2115443720371814478
---

Mistral has [introduced a Responses API in public preview](https://x.com/MistralAI/status/2115443720371814478). It follows the OpenAI Responses format, so code written for that format can be pointed at `https://api.mistral.ai/v1/responses` with fewer changes. Mistral says each response returns "the model's answer, its reasoning and its tool calls as separate items", and that it works with all chat models Mistral hosts, including Mistral Large 4.

## What works in the preview

The [Responses API guide](https://docs.mistral.ai/studio/conversations/responses) lists what you can use today:

- text input and output, as strings or message arrays;
- image input (URLs or base64) with a vision-capable model, and file input (HTTPS URLs, base64 or uploaded file IDs);
- structured output with JSON mode or JSON Schema via `text.format`;
- streaming events for text and function arguments;
- function calling with functions your own code executes, including namespaces;
- `reasoning.effort` and plaintext reasoning, where the model supports it;
- input token counting at `POST /v1/responses/input_tokens`.

## What it does not do yet

The API is **stateless**. Your application keeps the conversation history and sends it back in `input` on every request, including the `output` items from earlier responses. The [API reference](https://docs.mistral.ai/api/endpoint/responses) says `conversation` must be omitted or null and `background` must be false, so there is no server-side thread and no background mode. `max_tool_calls` is accepted for compatibility but ignored.

Tools are the other gap. The preview lists only client-executed functions, with no hosted tools such as web search or a code runner: the model asks, your code runs the function and sends back the result.

## Who should try it

If you already use a Responses-style client and want to try Mistral models, this lowers the switching cost. If you depend on server-side conversation state or built-in tools, stay where you are for now and watch the preview. Mistral's own examples use `mistral-large-4` with high reasoning effort; if you switch models, the guide tells you to pick a reasoning effort that model supports.
