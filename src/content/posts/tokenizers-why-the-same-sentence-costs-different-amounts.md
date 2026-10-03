---
title: "Tokenizers: why the same sentence costs different amounts"
description: "Each model family splits text into tokens with its own tokenizer, so one sentence gets different counts. Here is what that does to cost and context, and how to count before you send."
pubDate: "2026-10-03T15:30:00Z"
specimen: 183
section: models
tags: [tokenizers, tokens, cost, context-window, tiktoken, token-counting]
draft: false
heroImage: https://media.aitamer.news/heroes/tokenizers-why-the-same-sentence-costs-different-amounts-586ad79b.jpg
heroAlt: "A blank paper ribbon passes through a central sorter and emerges as three strands of differently sized paper blocks, in a calm blue, coral, and cream collage."
author: quill
wildness:
  rating: 3
  verified: "Counting tools and behaviour read in three primary docs. No independent test run."
  claimed: "The 30 percent token increase is Anthropic's own figure for its own models."
verdict: "Token counts belong to the model that reads the text. Count with the tokenizer of the model you will pay for, and recount when you switch."
sources:
  - title: "OpenAI tiktoken README"
    url: "https://github.com/openai/tiktoken#readme"
  - title: "Hugging Face Tokenizers documentation"
    url: "https://huggingface.co/docs/tokenizers/index"
  - title: "Anthropic: Token counting"
    url: "https://platform.claude.com/docs/en/build-with-claude/token-counting"
---

## Each model splits text its own way

A tokenizer cuts text into pieces called tokens. The [tiktoken README](https://github.com/openai/tiktoken#readme) shows two encodings, `cl100k_base` and `o200k_base`, used by different models in the OpenAI API. It also says that on average a token is about 4 bytes. The [Hugging Face Tokenizers docs](https://huggingface.co/docs/tokenizers/index) describe a library that trains new vocabularies, and it is used by Hugging Face Transformers. A different vocabulary splits the same sentence differently.

## What the count does to cost and context

Prices, rate limits and context windows are all measured in tokens. [Anthropic's documentation](https://platform.claude.com/docs/en/build-with-claude/token-counting) says usage and billing reflect the counts of the model's own tokenizer. It also says Claude 4.7 and later models use a newer tokenizer that produces roughly 30 percent more tokens for the same text than earlier models, depending on the content. That is a vendor figure, as of October 2026. A prompt that fit one model's context window may not fit another's.

## How to count before you pay

- For OpenAI models, tiktoken's `encoding_for_model("gpt-4o")` returns the tokenizer for that model. Encode your text with it and count the result.
- For Claude, Anthropic offers a token counting endpoint. The docs say it is free, subject to its own rate limits, and returns an estimate that can differ by a small amount from the real count.
- Count with the model you plan to use. Anthropic's docs say not to reuse counts measured on an older model to estimate cost or context fit.
