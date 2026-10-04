---
title: When a Repetition Rule Becomes a Ban
description: A repetition penalty discourages reused tokens. An n-gram rule can rule out a repeated sequence entirely, including one the text needs.
pubDate: "2026-10-07T11:00:00Z"
specimen: 357
section: models
tags:
  - text-generation
  - decoding
  - repetition
  - transformers
draft: false
heroImage: https://media.aitamer.news/heroes/when-a-repetition-rule-becomes-a-ban-b08ab8fb.jpg
heroAlt: Repeated leaf cards approach a gate marked with a stop symbol.
author: ari
wildness:
  rating: 2
  verified: The docs define a score penalty and a negative-infinity n-gram ban.
  claimed: A ban can suppress a repeated phrase that the text needs.
verdict: Use a penalty when repetition needs room. Use an n-gram ban when an exact sequence must not recur, and check that required phrases still appear.
sources:
  - title: Generation · Hugging Face
    url: https://huggingface.co/docs/transformers/main_classes/text_generation
  - title: Utilities for generation · Hugging Face
    url: https://huggingface.co/docs/transformers/internal/generation_utils
---

Repeated phrases can make generated text hard to read. Generation settings offer two ways to reduce them. A repetition penalty makes a reused token less attractive. An n-gram ban removes a specific repeated sequence from the next-token choices. That difference matters when a phrase needs to appear more than once.

## A penalty changes the odds

Hugging Face's [generation settings](https://huggingface.co/docs/transformers/main_classes/text_generation) define `repetition_penalty` as a numeric control, with 1.0 meaning no penalty. Its [processor documentation](https://huggingface.co/docs/transformers/internal/generation_utils) says values above 1.0 penalize tokens already seen. The penalty applies at most once per token. For decoder-only models, the prompt's tokens count by default.

This is a broad rule. It can discourage a repeated word even when the second use is useful. It can also leave a repeated phrase intact: lowering a token's score does not make that token impossible to select. The setting has no knowledge of whether repetition is a verbal loop or a necessary name.

## An n-gram rule closes a path

`no_repeat_ngram_size` sets a length for sequences that may occur only once. An n-gram is a run of adjacent tokens. When a candidate token would complete a previously seen n-gram, the [n-gram processor](https://huggingface.co/docs/transformers/internal/generation_utils) gives that candidate a score of negative infinity. It is removed from consideration at that step.

The same documentation warns that blocking repeated pairs in an article about New York can make the city's name appear only once. In decoder-only generation, n-grams from the prompt count too. A prompt containing an important phrase can therefore affect whether the continuation may repeat it. A larger n-gram size changes which sequences trigger the rule; it does not turn the ban into a gentle penalty.

## What to do

First, keep an output with both controls inactive as a reference. Then change one control at a time while keeping the prompt and other generation settings fixed. Compare whether loops shrink and whether needed names or phrases survive. If a phrase must recur, inspect it in both the prompt and output before enabling an n-gram ban. Use a penalty when some repetition is acceptable. Use a ban when repeating an exact token sequence is the failure you need to prevent.
