---
title: An Attention Mask Keeps Padding Out of Attention
description: Padding lets prompts of different lengths share a batch. An attention mask marks which positions the model should attend to.
pubDate: "2026-10-06T15:00:00Z"
specimen: 318
section: models
tags:
  - attention-masks
  - padding
  - tokenization
  - transformers
draft: false
heroImage: https://media.aitamer.news/heroes/an-attention-mask-keeps-padding-out-of-attention-bdc74412.jpg
heroAlt: Stacks of token cards pass through a gate that leaves the dotted padding cards out of the lit path.
author: ari
wildness:
  rating: 1
  verified: Hugging Face shows padded token IDs paired with masks that mark padding as 0.
  claimed: The mask lets prompts of different lengths share a batch without attending to padding.
verdict: Pad shorter prompts for a shared batch, then pass the tokenizer’s attention mask so the model can ignore padded positions.
sources:
  - title: "Transformers glossary: attention mask"
    url: https://huggingface.co/docs/transformers/en/glossary#attention-mask
  - title: Padding and truncation
    url: https://huggingface.co/docs/transformers/main/pad_truncation
  - title: Preprocess
    url: https://huggingface.co/docs/transformers/main/preprocessing
---

## Why a batch needs padding

A tokenizer turns each prompt into token IDs. Prompts can produce sequences of different lengths. A model batch needs a rectangular input tensor, so shorter sequences receive special padding tokens until they match the chosen length. Hugging Face’s [padding guide](https://huggingface.co/docs/transformers/main/pad_truncation) shows how `padding=True` extends shorter inputs to the longest sequence in a batch.

Those added positions make the batch fit together. They contain no words from the shorter prompt. An attention mask tells the model which positions to attend to and which to ignore. The [Transformers glossary](https://huggingface.co/docs/transformers/en/glossary#attention-mask) describes this mask as an optional input when batching sequences.

## How the mask marks padding

In the glossary’s BERT example, the tokenizer returns both `input_ids` and `attention_mask`. The shorter sequence gains padding IDs on its right. Its mask has `1` at positions to attend to and `0` at padded positions. The longer sequence has `1` across its positions because it needs no padding. The padded IDs remain in the batch, while the mask tells the model to leave them out of attention.

The mask gives an instruction for each position in each sequence. Prompts can therefore share the same tensor shape while keeping their own boundaries between tokens and padding. Hugging Face’s [preprocessing guide](https://huggingface.co/docs/transformers/main/preprocessing) shows returned masks alongside padded token IDs for a batch of sentences.

Padding and truncation address different length problems. Padding extends short inputs to a chosen length. Truncation shortens inputs that exceed a chosen limit. A padding mask cannot recover text removed by truncation. The [padding guide](https://huggingface.co/docs/transformers/main/pad_truncation) lists separate controls for these operations.

## What to do

Use the tokenizer paired with the model. Tokenize prompts as a batch with padding enabled. Inspect `input_ids` and `attention_mask` together: padded positions should line up with mask values of `0`. Pass the returned mask with the token IDs when calling the model. If you also enable truncation, choose its limit deliberately because truncation removes tokens from long inputs.
