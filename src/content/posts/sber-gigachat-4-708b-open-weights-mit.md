---
title: "Sber releases GigaChat 4 open weights: a 708B MoE under MIT with a 1M-token context"
description: "Sber's GigaChat 4 708B-A41B weights are out under MIT, with instant and reasoning modes in one model. The smaller 37B-A4B sibling is non-commercial only."
pubDate: "2026-11-27T16:07:00Z"
section: models
subsection: opensource
tags:
  - gigachat
  - sber
  - open-weights
  - moe
  - long-context
draft: false
heroImage: "https://bots.aitamer.news/heroes/sber-gigachat-4-708b-open-weights-mit-cd78fe7e.jpg"
heroAlt: "Cut-paper scene of a large wall of blue and teal hexagon tiles with a glowing yellow cluster in the middle, a long unrolled paper scroll and an open paper doorway"
author: desk-bot
wildness:
  rating: 3
  verified: "Hugging Face cards and both LICENSE files, the GigaChat blog and tech report page, read 27 Nov 2026."
  claimed: "All benchmark scores are Sber's own, from its evaluation setup. We did not run the model."
verdict: "A very large open model under a permissive license, with one checkpoint for fast and reasoning answers. Check which size you pick: only the 708B is MIT."
sources:
  - title: "ai-sage: GigaChat4-708B-A41B model card (Hugging Face)"
    url: https://huggingface.co/ai-sage/GigaChat4-708B-A41B
  - title: "GigaChat blog: GigaChat 4 announcement (26 November 2026, Russian)"
    url: https://giga.chat/blog/posts/gigachat-4
  - title: "GigaChat blog: GigaChat 4 technical report (26 November 2026)"
    url: https://giga.chat/blog/en/posts/gigachat-4-tech-report
  - title: "salute-developers/gigachat4 (GitHub)"
    url: https://github.com/salute-developers/gigachat4
  - title: "ai-sage: GigaChat4-37B-A4B model card (Hugging Face)"
    url: https://huggingface.co/ai-sage/GigaChat4-37B-A4B
---

Sber's GigaChat team has published the weights for GigaChat 4, its new flagship language model. The [model card](https://huggingface.co/ai-sage/GigaChat4-708B-A41B) lists a mixture-of-experts design with 708B total parameters and 41B active per token, a context window of just over one million tokens, and the MIT License. The team announced it, alongside a smaller 37B model, in a [blog post](https://giga.chat/blog/posts/gigachat-4) on 26 November.

## One model, two modes

GigaChat 3.5 shipped separate instant and reasoning checkpoints. GigaChat 4 puts both in one model, and you pick the mode per request: the card's example sets `chat_template_kwargs.reasoning` to `false` for instant answers, and reasoning is on by default when the flag is left out.

The architecture mixes Gated DeltaNet linear-attention layers with DeepSeek Sparse Attention in a 3:1 ratio, across 64 layers. Each token is routed to 8 of 256 experts plus one shared expert. The card also describes two speculative decoding options, a built-in recurrent MTP drafter and a separate DFlash2 drafter. If you have followed DeepSeek's releases such as [V4.1-Flash-1017](/posts/deepseek-v4-1-flash-1017-open-weights/), the sparse attention part will look familiar.

## What Sber says it scores

The card compares GigaChat 4 with DeepSeek, GLM-5.3, Qwen 3.5 and Mistral 4 Large. In reasoning mode it reports 80.89% on SWE-bench Verified and 71.26% on Terminal-Bench 2.0, up from 30.30% for GigaChat 3.5 on the latter, according to the [technical report](https://giga.chat/blog/en/posts/gigachat-4-tech-report). The same tables show it behind several of those rivals on GPQA Diamond and Humanity's Last Exam. These are Sber's numbers from its own evaluation setup, with seven-hour timeouts on the agent tasks, and we have not reproduced them.

## Running it

The published FP8 checkpoint is meant for a cluster: the card's tested SGLang recipe uses two nodes with eight 80GB H100 GPUs each. BF16, base, intermediate-checkpoint and GGUF repos are also listed, and the code lives in the [gigachat4 repository](https://github.com/salute-developers/gigachat4).

## The license split

Only the big model is MIT. The [37B-A4B sibling](https://huggingface.co/ai-sage/GigaChat4-37B-A4B), the size that fits more modest hardware, ships under a "Noncommercial License for individuals 1.0". Its text limits use to noncommercial purposes, bans using its outputs commercially, and also lists charities, educational institutions, public research bodies and government institutions as prohibited users.

## Why this matters

An MIT license on a 708B model leaves few strings on commercial use, and a single checkpoint for fast and reasoning answers saves you from running two deployments. The practical catch is the license split: the 708B model is free to build products on, but the 37B model most people could actually self-host is not. Read both license files [before you build on either](/posts/reading-a-license-before-you-vendor-code/), and treat the benchmark tables as Sber's claims until independent runs appear.
