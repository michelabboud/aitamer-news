---
title: "OpenAI's Responses API can now keep a prompt cache for 12 hours, at twice the usual write price"
description: "Since 20 October, GPT-5.6 and later can hold a cached prefix for at least 12 hours in the Responses API. Writes cost 2.5x input; read prices are unchanged."
pubDate: "2026-10-21T12:37:00Z"
specimen: 958
section: dev
subsection: api
tags:
  - openai
  - prompt-caching
  - responses-api
  - pricing
  - agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-12-hour-prompt-caching-responses-api-e7ea3f5f.jpg"
heroAlt: "Paper-cut illustration of a slate-blue hourglass with mustard sand beside a large sealed teal jar and a small open jar on a cream shelf."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI's API changelog entry for 20 October and the prompt caching guide."
  claimed: "The break-even figures are our arithmetic from OpenAI's rates, assuming full prefix reuse."
verdict: "Useful for agents that reuse the same long instructions or tools hours apart. If your prefix is reused every few minutes anyway, the default 30-minute cache is cheaper."
sources:
  - title: "OpenAI API changelog, 20 October 2026 entry"
    url: https://developers.openai.com/api/docs/changelog
  - title: "OpenAI API guide: Prompt caching"
    url: https://developers.openai.com/api/docs/guides/prompt-caching
  - title: "AI Tamer: The Prefix You Keep Paying For"
    url: https://aitamer.news/posts/the-prefix-you-keep-paying-for/
---

OpenAI's [API changelog](https://developers.openai.com/api/docs/changelog) for 20 October adds 12-hour prompt caching to `v1/responses`. The entry says it "keeps shared instructions, tools, and context cached longer to benefit from lower cached-input pricing, even when requests are hours apart," and that "12-hour cache writes cost 2.5x the input token price."

## How it works

The [prompt caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) puts the option in `prompt_cache_options.ttl`, for GPT-5.6 and later in the Responses API:

| `ttl` | Minimum lifetime | Cache-write rate |
|---|---|---|
| `"30m"` (default) | 30 minutes | 1.25x the uncached input rate |
| `"12h"` | 12 hours | 2.5x the uncached input rate |

The guide says these are total write rates, not surcharges on top of normal input. Reads cost the same for both lifetimes: 0.1x the ordinary input rate on most of these models and 0.05x on GPT-6.1 Sol.

A few details from the guide that matter in practice:

- The request-level `ttl` applies to the implicit breakpoint and to explicit breakpoints without their own setting. `prompt_cache_breakpoint.ttl` overrides it for a single explicit breakpoint, so one request can hold a long-lived shared prefix and a short-lived session block.
- Each request can create up to four cache writes. The minimum cacheable prompt is 1,024 tokens for GPT-5.6 and later.
- `"12h"` is a minimum, not a deletion deadline. OpenAI may keep entries longer, and the setting does not change the maximum data-retention policy.
- Unsupported values return `400 invalid_request_error`. Older models keep the separate `prompt_cache_retention` parameter.

## When it pays

By our arithmetic from those rates: if your requests arrive more than 30 minutes apart, the default cache has expired each time, so every request pays a fresh 1.25x write. With `"12h"`, the first request pays 2.5x and each later one reads at 0.1x. Two requests cost 2.6x against 2.5x on the default. From the third request on, 12 hours is ahead: 2.7x against 3.75x on the default, or 3x with no caching at all. That suits stable system prompts, tool definitions or reference material that a scheduled agent reuses through the day. For a chat or agent loop that hits the cache every few minutes, the default stays cheaper. Our explainer [The Prefix You Keep Paying For](/posts/the-prefix-you-keep-paying-for/) covers how to order a prompt so the stable part comes first.
