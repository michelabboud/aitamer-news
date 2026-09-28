---
title: "Tokens, context windows, and what an AI request costs"
description: "A practical guide to tokenization, input and output pricing, caching, batch requests, and estimating a feature's monthly model bill."
pubDate: "2026-09-30T19:00:00Z"
specimen: 59
section: "general"
tags: ["tokens", "api-pricing", "context-windows", "prompt-caching", "batch-api"]
draft: false
heroImage: "https://media.aitamer.news/heroes/tokens-and-cost.jpg"
heroAlt: "A paper-cut collage of text tiles passing through a counting gate and splitting into piles, with one stack shown for reuse."
author: "ari"
sources:
  - title: "Understand and count tokens | Gemini API"
    url: "https://ai.google.dev/gemini-api/docs/tokens"
  - title: "Gemini Developer API pricing"
    url: "https://ai.google.dev/gemini-api/docs/pricing"
  - title: "Batch API | Gemini API"
    url: "https://ai.google.dev/gemini-api/docs/batch-api"
  - title: "OpenAI tiktoken"
    url: "https://github.com/openai/tiktoken"
  - title: "Understanding and counting tokens | OpenAI Help Center"
    url: "https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens"
  - title: "Context caching | Gemini API"
    url: "https://ai.google.dev/gemini-api/docs/caching"
  - title: "Context caching | Gemini Generate Content API"
    url: "https://ai.google.dev/gemini-api/docs/generate-content/caching"
  - title: "Gemini thinking | Gemini API"
    url: "https://ai.google.dev/gemini-api/docs/thinking"
wildness:
  rating: 3
  verified: "Token mechanics are cross-checked against Google and OpenAI; the example arithmetic was checked."
  claimed: "Gemini rates and caching details come from Google; monthly usage is illustrative."
verdict: "Measure token usage on real requests, price input and output separately, then choose caching or batch only when the workload fits."
---

An application programming interface (API) bill can look mysterious when a request is made of ordinary text but priced in tokens. The useful mental model is simple: a model receives a sequence of token IDs, processes the input, and produces another sequence. The provider counts those sequences and applies the selected model's rates. Your source code may send a few paragraphs, but the bill follows the model's count, not your character count.

## A token is a model's text unit

A token may represent a character, part of a word, a whole short word, or a piece of punctuation. The process of splitting text this way is tokenization. It gives a model a finite vocabulary of reusable units. Google's [token guide](https://ai.google.dev/gemini-api/docs/tokens) says a Gemini token averages about four characters, while also showing that a token can be a single character or an entire word. Treat that character estimate as a rough guide for Gemini, not a conversion rule for every model.

Tokenizers differ. OpenAI's open-source [tiktoken library](https://github.com/openai/tiktoken) describes byte-pair encoding and maps different OpenAI models to particular encodings. Google documents its own token counting interface. [OpenAI says](https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens) the same text can have different token counts depending on the model, encoding, and language, so a word count is not a reliable token count.

Use the tokenizer for plain text or the counting endpoint for a full request, where available. Gemini's `count_tokens` method counts input size before a request; its response usage can report input, output, cached, thinking, and tool-use counts. After launch, usage returned by the actual API calls is better evidence than a hand estimate. Include system instructions, conversation history, tool definitions, and any retrieved material in the measurement. They can all add to the model's input.

## Input and output have separate meters

Input tokens are the material the model receives. This commonly includes instructions, the latest user message, prior turns, and data your application supplies. Output tokens are the generated response. Google's [thinking guide](https://ai.google.dev/gemini-api/docs/thinking) says Gemini reports thinking tokens separately and bills them at the output rate. Providers often set different prices for these meters, and generated tokens may cost more per token than input tokens.

The bill is usually a sum, not one rate multiplied by the combined count. For each billed category, multiply tokens by its price per million, then add the results. For Gemini requests with thinking, add reported output and thinking tokens when applying the output rate. If a model uses tools, the provider may report additional token categories. Read the selected API's usage fields and pricing notes, and compare them with your own logs so that hidden parts of a multi-step feature do not disappear from the estimate.

## Context is a capacity limit

A context window is the maximum token capacity a model can handle for an interaction. Google's [guide](https://ai.google.dev/gemini-api/docs/tokens#context-window) defines the Gemini context window as the combined input and output limit, and its API exposes input and output limits for each model. The available space therefore has to cover both the material sent in and the response being generated.

Context capacity and price answer different questions. A larger window lets a request carry more material; it does not make that material free. Long histories, pasted source files, retrieved documents, and detailed tool schemas can increase input usage on repeated calls. Keep only context that helps the current step, summarize older turns when appropriate, and measure the full request shape. Check the specific model's current limits rather than assuming every model in a product family has the same capacity.

## Caching and batch change the rate or timing

Prompt or context caching can reduce the price of repeated input. Google's [implicit caching guide](https://ai.google.dev/gemini-api/docs/caching) says caching is enabled by default for Gemini 2.5 and newer models; a repeated prefix can improve the chance of a hit. Cache rules vary by model, including minimum input sizes. Google's [explicit caching guide](https://ai.google.dev/gemini-api/docs/generate-content/caching) describes separately created caches with storage charges; the Interactions API supports only implicit caching. Its [pricing table](https://ai.google.dev/gemini-api/docs/pricing) lists a distinct cached-token rate and storage charge for Gemini 3.8 Flash. Count actual cache-hit usage and, for explicit caching, storage time when estimating savings. If the prefix changes often or requests rarely repeat, caching may add complexity without much benefit.

Batch processing is for work that does not need an immediate answer. Google's [Batch API documentation](https://ai.google.dev/gemini-api/docs/batch-api) says batch usage is priced at 50% of the equivalent standard interactive API cost and jobs are designed to complete within 24 hours. Google's Batch API currently works with `generateContent`, not the Interactions API. That can fit offline classification, evaluations, or queued summaries. It is a poor fit for a user waiting on a synchronous response. Confirm the chosen model is supported and account for the turnaround requirement before counting the discount.

## Estimate a feature with measured usage

Consider a developer-support feature that summarizes a code excerpt and suggests a next step. Suppose it handles 10,000 requests per month. A first estimate assumes 1,500 input tokens and 300 tokens billed at the output rate, including any thinking tokens, per request, with no caching or batch processing. Those are workload assumptions, not provider data. That totals 15 million input tokens and 3 million tokens billed at the output rate.

As of September 2026, Google's [pricing page](https://ai.google.dev/gemini-api/docs/pricing) lists Gemini 3.8 Flash's paid Standard rate at $0.75 per million input tokens and $3.75 per million output and thinking tokens through December 31, 2026. Applying those dated rates gives:

- Input: 15 million ÷ 1 million × $0.75 = $11.25.
- Output rate: 3 million ÷ 1 million × $3.75 = $11.25.
- Estimated model usage: $22.50 for the month.

This is a token-only estimate for that model and paid price tier. It excludes other services, taxes, and any usage beyond the assumed request shape. The assumed 1,500-token input is below Google's [4,096-token implicit caching minimum](https://ai.google.dev/gemini-api/docs/caching) for Gemini 3.8 Flash. The pricing page lists lower cached input and batch rates, but do not subtract a discount until you have verified that the feature qualifies and measured the likely hit rate or batch volume. It also states future rates for 2027, which is why a price estimate should carry its effective date.

For a production estimate, log per-request input, output, and thinking usage for representative traffic. Include retries, empty or oversized requests, multi-step model calls, and tail cases in addition to the average. Multiply the observed monthly token totals by the rates for the exact model and processing mode you intend to use. Recalculate when the model, prompt, traffic, or published rates change.

Start with the simplest model that meets your quality and latency needs, then measure it against real examples. Use actual API usage for the budget, the model-specific counter to catch oversized requests before sending them, caching for stable repeated context, and batch for work that can wait. That turns a rough token guess into an estimate you can compare with a real bill.
