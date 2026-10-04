---
title: The Longest Prompt Sets the Batch Shape
description: Padding to the longest input lets each batch set its length. Padding to a fixed length uses a chosen target, while truncation handles inputs that exceed a limit.
pubDate: "2026-10-07T01:00:00Z"
specimen: 337
section: models
tags:
  - tokenization
  - padding
  - transformers
  - batching
draft: false
heroImage: https://media.aitamer.news/heroes/the-longest-prompt-sets-the-batch-shape-db0cc826.jpg
heroAlt: Suitcases packed with prompts of different lengths are constrained by the height of the longest stack.
author: ari
wildness:
  rating: 2
  verified: The guide defines longest-input padding, maximum-length padding, and separate truncation settings.
  claimed: The longest input in a batch can determine that batch’s padded length.
verdict: Use longest-input padding for a length that follows each batch. Set an explicit maximum and truncation when calls need a chosen length limit.
sources:
  - title: Padding and truncation | Transformers documentation
    url: https://huggingface.co/docs/transformers/main/en/pad_truncation
---

A batch can contain inputs of different lengths. To make it a rectangular tensor, a tokenizer can add special padding tokens to the shorter inputs. The [Transformers padding guide](https://huggingface.co/docs/transformers/main/en/pad_truncation) describes two ways to choose the padded length: follow the longest input in the batch, or use a maximum length.

## Padding to the longest input

With `padding=True` or `padding="longest"`, the tokenizer pads shorter inputs until they match the longest input in that batch. That input sets the padded length for the call. A later batch can have a different padded length if its longest input is different.

There is a single-input exception. When a call contains just one sequence, longest-input padding adds nothing. The guide presents padding to the longest input, together with truncation to the model’s accepted maximum, as a common choice.

## Padding to a fixed length

With `padding="max_length"`, the tokenizer pads toward a supplied `max_length`. If you omit the value, it uses the maximum length accepted by the model when one is defined. This setting also pads a call containing just one sequence. Supplying a length gives separate calls the same padding target instead of letting each batch choose its own.

A padding target alone does not shorten an input that exceeds it. The [guide’s padding and truncation examples](https://huggingface.co/docs/transformers/main/en/pad_truncation) show truncation as a separate option. The guide also says that when a model has no specific maximum input length, padding or truncation to an unspecified `max_length` is deactivated. Supply a length when a specific target is required.

## Truncation changes the contents

Padding adds tokens to short inputs. Truncation shortens long inputs. If inputs must fit within a limit, choose a truncation setting as well as a padding setting. For paired sequences, the guide lists strategies that control which sequence is shortened.

## What to do

Start with `padding=True` when each batch can take its padded length from its longest input. Use `padding="max_length"` with an explicit `max_length` when calls need a chosen target. Add `truncation=True` when long inputs must be shortened, and check the pair-specific strategies for paired inputs.
