---
title: The Prefix You Keep Paying For
description: A repeated prompt can cost less when its beginning stays the same. Here is how to arrange stable instructions and changing context so the cache has something useful to reuse.
pubDate: "2026-10-07T03:00:00Z"
specimen: 341
section: models
tags:
  - prompt-caching
  - api-costs
  - prompt-design
  - performance
draft: false
heroImage: https://media.aitamer.news/heroes/the-prefix-you-keep-paying-for-ed63b179.jpg
heroAlt: Repeated paper cards share a common stack while a hand holds a separate changing card.
author: ari
wildness:
  rating: 2
  verified: The guide documents prefix matching, cache rates, eligibility, and usage fields.
  claimed: A stable opening can reduce repeated input work when later requests reuse it.
verdict: Place shared material first, then measure reuse. Prompt order helps only when the prefix is eligible and later requests find a matching cache entry.
sources:
  - title: "OpenAI API: Prompt caching"
    url: https://developers.openai.com/api/docs/guides/prompt-caching
---

Every request begins somewhere. For an application that sends the same instructions with each new user message, that beginning may be expensive to process again and again. [OpenAI’s prompt caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) describes a way to reuse work from an earlier request when a later request shares the same prompt prefix. The useful design question is simple: how much of the beginning can stay identical while the user’s task changes?

## The cache follows the beginning

A prefix is the content at the start of a prompt. OpenAI says its cache can preserve intermediate model state for that prefix. When a later request finds a matching entry, the model reuses that state and processes the new input that follows it. The response is still generated anew. A cache hit does not mean the earlier answer is copied. [The guide explains the reuse and output behavior](https://developers.openai.com/api/docs/guides/prompt-caching).

Order therefore matters. Imagine a support application that sends its response rules, product reference material, and a customer’s current question. If the rules and reference material come first, requests can share that opening even as questions differ. If each request begins with a customer name or a fresh timestamp, the shared material starts after the first change. The cache cannot match the prefix past that change. This example applies [OpenAI’s advice to put stable instructions and shared material first](https://developers.openai.com/api/docs/guides/prompt-caching).

The comparison covers more than the words a developer can see in a message. OpenAI says the rendered context includes instructions, tool definitions, and conversation history. Changes to tool schemas, their order, output format settings, or parts of the conversation can change the prefix. A request that appears to reuse the same written instructions may still have a different rendered beginning. [The guide lists settings that affect matching](https://developers.openai.com/api/docs/guides/prompt-caching).

## Put changing context where it belongs

A practical layout starts with instructions that apply to every request. Shared reference material follows. Customer details, the current task, and other changing content come later. Keep the stable portion byte for byte consistent where the application permits it. Avoid inserting a timestamp into an otherwise shared opening. This arrangement gives the cache a longer common prefix to find. [OpenAI recommends moving dynamic content toward the end or into later messages](https://developers.openai.com/api/docs/guides/prompt-caching).

Conversation history needs similar care. In a continuing exchange, earlier messages can become part of the reusable prefix for the next turn. Appending a new message preserves the earlier sequence. Rewriting, summarizing, or truncating that sequence changes what the next request begins with and can reduce reuse. Those changes may still serve the conversation; they have a cache cost to consider. [OpenAI calls out this trade-off in its guidance on preserving history](https://developers.openai.com/api/docs/guides/prompt-caching).

The length of the stable opening matters too. A prefix must meet the model’s minimum cacheable length. OpenAI currently states a minimum of 1,024 visible input tokens for GPT-5.6 and later; earlier models vary by request settings. That is a reason to check the model’s rules before expecting a short instruction to produce cache hits. It is not a reason to pad every prompt. Extra input has a cost, and the guide advises measuring whether reuse pays for it. [The minimum and the cost trade-off are documented here](https://developers.openai.com/api/docs/guides/prompt-caching).

## A hit changes the input bill

Cached input uses a different rate from ordinary input. OpenAI’s guide says the rates vary by model. For GPT-5.6 and later, it describes a higher rate for writing eligible content to cache and a lower rate for reading it again. The first request therefore has a cost of its own. Savings depend on later requests reusing enough of what was written. [The guide gives the current rate rules and an example calculation](https://developers.openai.com/api/docs/guides/prompt-caching).

Reuse is also time sensitive. Entries expire, and a later request needs to reach a machine that still holds a matching entry. Matching text alone cannot promise a hit. Cached tokens still count toward token rate limits. These limits make prompt caching a useful cost and latency measure, rather than a guarantee about every request. [OpenAI describes cache lifetime, location, and rate limits](https://developers.openai.com/api/docs/guides/prompt-caching).

## Measure the shared part

The response usage fields provide a direct check. OpenAI recommends tracking total input tokens, cached tokens, cache write tokens, latency, and realized cost. Compare these across representative requests before and after changing prompt order. A high cached-token count shows that an eligible prefix was reused. A low count calls for checking the actual rendered beginning, the model’s minimum length, and changes to settings or history. [The guide names these usage fields and measurements](https://developers.openai.com/api/docs/guides/prompt-caching).

## What to do

1. Write down the order of the content sent with a typical request. Mark each part as shared or changing.
2. Move shared instructions and reference material to the beginning. Put the current user context after them.
3. Keep tool definitions and earlier conversation messages stable when the task allows it.
4. Check the selected model’s cache length, rates, and breakpoint options in [OpenAI’s guide](https://developers.openai.com/api/docs/guides/prompt-caching).
5. Compare cached tokens, cache write tokens, latency, and input cost over real traffic. Keep the layout when those measurements show a benefit.
