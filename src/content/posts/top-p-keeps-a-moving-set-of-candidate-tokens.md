---
title: Top-p Keeps a Moving Set of Candidate Tokens
description: Top-p sets a probability-mass cutoff for the next token. The number of candidates changes as the model's probabilities change.
pubDate: "2026-10-07T06:00:00Z"
specimen: 347
section: models
tags:
  - top-p
  - nucleus-sampling
  - text-generation
  - decoding
draft: false
heroImage: https://media.aitamer.news/heroes/top-p-keeps-a-moving-set-of-candidate-tokens-c630399a.jpg
heroAlt: Colored token shapes pass through a curved funnel that selects a changing subset.
author: ari
wildness:
  rating: 2
  verified: At top-p 0.92, Hugging Face illustrates pools of nine and three candidates.
  claimed: A moving candidate pool is a useful way to reason about this setting.
verdict: Top-p fixes a probability-mass threshold. The candidate count changes with the next-token distribution. Check sampling and other filters when comparing outputs.
sources:
  - title: Generation · Hugging Face
    url: https://huggingface.co/docs/transformers/main/main_classes/text_generation
  - title: "How to generate text: using different decoding methods for language generation with Transformers"
    url: https://huggingface.co/blog/how-to-generate
  - title: The Curious Case of Neural Text Degeneration
    url: https://arxiv.org/abs/1904.09751
---

## The cutoff follows probability mass

At each step, a text generator has a probability distribution over possible next tokens. Top-p, also called nucleus sampling, forms a pool from that distribution. It keeps the smallest set of the most probable tokens whose combined probability reaches the chosen threshold. The remaining tokens are excluded from that draw. The retained probabilities are then redistributed before a token is sampled. [Hugging Face's generation reference](https://huggingface.co/docs/transformers/main/main_classes/text_generation) defines the cutoff, and its [decoding guide](https://huggingface.co/blog/how-to-generate) shows the sampling step.

The threshold describes how much probability mass to cover. The number of tokens needed to cover it depends on the distribution at that step. A fixed value of `top_p` can therefore produce pools of different sizes across one response.

## The candidate count changes with the context

A sharp distribution places much of its probability on a few tokens. A flatter distribution spreads that mass across more tokens. With the same cutoff, the sharp distribution reaches the target sooner. In [Hugging Face's illustrated example](https://huggingface.co/blog/how-to-generate), a cutoff of 0.92 keeps nine candidates in one distribution and three in another. Each next-token distribution determines its own count.

Top-k keeps a set number of the highest-probability tokens. The [generation reference](https://huggingface.co/docs/transformers/main/main_classes/text_generation) defines that fixed count. Top-p lets the count follow the probability shape. The [paper that introduced nucleus sampling](https://arxiv.org/abs/1904.09751) describes this moving set as a way to trim the lower-probability tail.

## Sampling controls the final choice

When the pool contains several tokens, it leaves room for different continuations. The sampler chooses among the retained candidates using their adjusted probabilities. In Transformers, `do_sample=True` enables sampling. With `do_sample=False` and one beam, generation uses greedy decoding. [The generation reference](https://huggingface.co/docs/transformers/main/main_classes/text_generation) specifies those modes. Top-k can also be combined with top-p, so check both settings when reading an output.

## What to do

When testing a text generator, first confirm that sampling is enabled. Record the current `top_p`, `top_k`, and temperature settings. Change `top_p` while holding the other settings and prompt steady. Read several continuations for each setting. For a given distribution, a lower cutoff retains a smaller or equal pool; a higher cutoff can admit more candidates. Choose the setting whose outputs fit the task, and keep the sampling settings together so the comparison can be repeated.
