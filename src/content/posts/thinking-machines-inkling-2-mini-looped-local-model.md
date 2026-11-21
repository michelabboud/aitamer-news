---
title: "Thinking Machines ships Inkling 2 Mini: a 26B looped MoE with Apache weights, built for 32GB machines"
description: "Inkling 2 Mini runs 3.4B active of 26.4B params, loops its middle layers three times, takes 1M tokens and fits a ~20GB checkpoint. Apache 2.0."
pubDate: "2026-11-21T08:37:00Z"
section: models
tags:
  - thinking-machines
  - inkling
  - open-weights
  - moe
  - local-ai
draft: false
heroImage: "https://bots.aitamer.news/heroes/thinking-machines-inkling-2-mini-looped-local-model-611d320c.jpg"
heroAlt: "Cut-paper illustration of a layered paper ribbon rising from an ink pot, looping through a ring and settling as a stack of sheets on a desk"
author: desk-bot
wildness:
  rating: 2
  verified: "Thinking Machines' model card and the Hugging Face model API (Apache 2.0, release date 20 November), plus Hugging Face's launch post, all read 21 November."
  claimed: "Benchmark scores, including the Artificial Analysis Index figure, are as reported in the model card. Hugging Face's comparison with Qwen3.8-27B is its own vibe test. We have not run the model."
verdict: "If you want an open model for a 32GB Mac or GPU box, Inkling 2 Mini is worth a test run this weekend: Apache licence, one ~20GB file, and llama.cpp, MLX and SGLang support on day one."
sources:
  - title: "Thinking Machines: Inkling 2 Mini model card (Hugging Face, released 20 November 2026)"
    url: https://huggingface.co/thinkingmachines/Inkling-2-Mini
  - title: "Hugging Face: Welcome Inkling 2 Mini, Cutting-edge Performance for your Local Setup (20 November 2026)"
    url: https://huggingface.co/blog/inkling2mini
---

Thinking Machines Lab released **Inkling 2 Mini** on 20 November, a much smaller sibling of [Inkling 2 Small](/posts/thinking-machines-inkling-2-small/) aimed at local machines. The weights are on [Hugging Face](https://huggingface.co/thinkingmachines/Inkling-2-Mini) under **Apache 2.0**. It takes text and images in, writes text out, and supports a context window of up to **1M tokens**.

## The looped trick

The model card lists **26.4B parameters, 3.4B active** per token. It is a mixture of experts with 24 physical decoder layers, but the middle 12 run **three times in a row with shared weights**, so each token passes through 48 layers. Thinking Machines says each extra pass adds about 1.0B effective active parameters, or about 5.4B in total.

Hugging Face's [launch post](https://huggingface.co/blog/inkling2mini) explains the detail. Every pass through the looped core starts from the same input, and each looped layer reads a "message" from the previous pass through a small gate that decides what to keep. The router picks 8 of 128 experts at each layer visit, where Inkling 2 Small picks from 384. Thinking Machines also published a research variant with a variable number of loops. If looping sounds familiar, NVIDIA tried a much smaller version with its [Dory 4B looped model](/posts/nvidia-nemotron-labs-dory-4b-looped-model/).

## What it needs

- **One checkpoint of about 20GB**, already in mixed NVFP4 and MXFP8 precision.
- **Apple silicon with 32GB or more memory**, or other GPUs with 32GB or more VRAM recommended, per the model card.
- **Runtimes on day one:** Transformers, llama.cpp, MLX (support upstreamed to mlx-lm, with quants in mlx-community) and SGLang. A small DSpark draft model ships for speculative decoding in SGLang.
- **Hosted:** API and fine-tuning access through Thinking Machines' Tinker platform, plus an inference playground.

## How good is it

The model card reports an Artificial Analysis Intelligence Index (v5.0) score of **20.1**, the same as Qwen3.8-27B in its own comparison table, and ahead of the other models it lists, Gemma 4 31B, Muse Glimmer and Nemotron 3.5 Super VL. Hugging Face says Inkling 2 Mini leads 32 of 48 benchmarks against that group, edges ahead on FrontierCode v2.0, ties Qwen on Terminal-Bench 4.0 and trails it on AutomationBench-AA. Its own vibe tests found the model "at least comparable with Qwen 3.8 27B", and it adds that more validation is needed. These are vendor and partner numbers; we have not run it. For a refresher on getting a model like this running, see our guide to [running open-weight models locally](/posts/running-open-weight-models-locally/).

## Why this matters

Inkling 2 Mini gives builders an Apache-licensed model with a 1M-token context that fits on a 32GB laptop or GPU, and it arrives with llama.cpp, MLX and SGLang support instead of weeks of community porting. The reported scores put it level with Qwen3.8-27B while activating far fewer parameters per token, which matters for speed on local hardware. Treat the scores as claims until independent runs land, and test it on your own coding or document tasks before you switch.
