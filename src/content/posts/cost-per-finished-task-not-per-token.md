---
title: Cost per finished task, not per token
description: Token prices are the input to your bill, not the bill. Caching, output pricing, batching and retries decide what a finished task costs, and you can measure that figure directly.
pubDate: "2026-10-04T18:30:00Z"
specimen: 231
section: general
tags:
  - cost
  - pricing
  - prompt-caching
  - llm-usage
  - budgeting
draft: false
heroImage: https://media.aitamer.news/heroes/cost-per-finished-task-not-per-token-155bcbe2.jpg
heroAlt: Paper pieces pass through a machine with a retry loop before a hand collects completed parcels.
author: quill
wildness:
  rating: 2
  verified: Price multipliers, cache rules and usage fields read on official Anthropic pages
  claimed: Cost per finished task is a better unit than price per token
verdict: Compare the total cost of every attempt with the number of results you accepted. That cost per finished task captures retries, cache hits, and output spend that a token price alone misses.
sources:
  - title: Anthropic pricing
    url: https://platform.claude.com/docs/en/about-claude/pricing
  - title: Anthropic prompt caching documentation
    url: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  - title: "Claude Code: Manage costs effectively"
    url: https://code.claude.com/docs/en/costs
---

A price list quotes dollars per million tokens. What you care about is what it cost to get a result you accepted. The two numbers can sit far apart, and the official docs show why.

## What changes the bill for one task

The [Anthropic pricing page](https://platform.claude.com/docs/en/about-claude/pricing) lists several multipliers between the list price and the invoice:

- **Output costs more than input.** For Claude Sonnet 5.5 the page lists $2 per million input tokens and $10 per million output tokens. The [Claude Code cost guide](https://code.claude.com/docs/en/costs) adds that thinking tokens are billed as output tokens.
- **Cached input costs less.** A cache read is priced at 0.1x the base input price on most models. A 5-minute cache write is 1.25x and a 1-hour write is 2x. The page says caching pays off after one cache read for the 5-minute duration.
- **Batch work is discounted.** The Batch API gives a 50% discount on input and output tokens.
- **Token counts differ by model.** The page says Claude 4.7 and later models use a newer tokenizer that produces approximately 30% more tokens for the same text. A price per token on two model generations does not describe the same amount of text.

## Retries and rework are part of the cost

The cost guide says token costs scale with context size, and that Claude Code sends the full conversation with every request. A task that takes three attempts incurs the cost of all three. When those attempts happen in one long conversation, later requests can carry more context and cost more than earlier ones.

That changes how to compare models. Assume attempts of similar size. If a cheaper model needs three attempts to produce an acceptable result, a pricier model that succeeds on the first attempt is cheaper overall whenever its cost per attempt is below three times the cheaper model's. The guide points the same way when it recommends plan mode to prevent expensive re-work and test cases as verification targets.

## How to measure it

Define the unit as total spend on all attempts divided by the number of results you accepted. The [prompt caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) names the response fields you need: `cache_creation_input_tokens`, `cache_read_input_tokens` and `input_tokens`. Output tokens are reported alongside them. The default cache lifetime is 5 minutes, so a pause longer than that means the next request pays to rebuild the cache.

The cost guide notes that the dollar figure in Claude Code's `/usage` is computed locally from token counts at list price, unless an administrator has set a `modelPricing` table for the organization's contracted rates. It is an estimate. The Console usage page is the authoritative record.

## What to do

1. Pick one repeatable kind of task and write down what counts as accepted.
2. Log every attempt for that task, including failed ones, with its token fields from the response.
3. Divide total spend by accepted results. This is your cost per finished task.
4. Run the same task set on a second model or setting and compare the two figures, not the list prices.
5. Check the cache read share. If it is low, move stable content such as system prompts and reference documents to the start of the request.
6. Send work that does not need an immediate answer through the Batch API.
7. Recheck the pricing page when you change models, because multipliers and prices differ by model.
