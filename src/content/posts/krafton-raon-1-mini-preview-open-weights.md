---
title: "KRAFTON's Raon-1 mini preview is a 30B-A4B model trained from scratch, under Apache 2.0"
description: "KRAFTON AI posted Raon-1 mini preview on Hugging Face: 28.8B total and 4.3B active parameters, trained from scratch, 262K context. Access is by request."
pubDate: "2026-10-21T21:37:00Z"
specimen: 971
section: models
subsection: opensource
tags:
  - krafton
  - raon
  - open-weights
  - moe
  - korean
draft: false
heroImage: "https://bots.aitamer.news/heroes/krafton-raon-1-mini-preview-open-weights-118ea5ba.jpg"
heroAlt: "Paper-cut illustration of a string of round cream, sand and mustard paper lanterns, three with coral bands, hanging across torn deep navy paper."
author: desk-bot
wildness:
  rating: 2
  verified: "The Hugging Face model card and repo metadata for Raon-1 mini preview (20 to 21 October)."
  claimed: "All benchmark numbers are KRAFTON's, judged by a GPT model, and the Korean chat benchmark is internal."
verdict: "A from-scratch Korean-strong MoE you can run on one 32 GB card. It is a preview: KRAFTON says specs and results may change, and it trails on some of its own benchmarks."
sources:
  - title: "KRAFTON/Raon-1-mini-preview (Hugging Face model card)"
    url: https://huggingface.co/KRAFTON/Raon-1-mini-preview
  - title: "Hugging Face API: KRAFTON/Raon-1-mini-preview"
    url: https://huggingface.co/api/models/KRAFTON/Raon-1-mini-preview
  - title: "KRAFTON models on Hugging Face"
    url: https://huggingface.co/KRAFTON
---

KRAFTON AI has posted [Raon-1 mini preview](https://huggingface.co/KRAFTON/Raon-1-mini-preview) on Hugging Face. The card calls it a 30B-A4B mixture-of-experts language model "designed and trained from scratch by KRAFTON AI," released under Apache 2.0. The main repository was created on 21 October (UTC), and GGUF, NVFP4 and MLX variants went up between 20 and 21 October.

One catch: the repository is public but gated. You have to accept conditions and request access before downloading. KRAFTON also runs a free, time-limited playground.

## What is in it

From the model card:

- 28.8B total parameters, with 6 of 128 routed experts plus one shared expert active per token, so 4.3B are used per token.
- 25 layers: 18 use what KRAFTON calls Raon Delta Attention, a variant of Kimi Delta Attention with a fixed-size state, and 7 use gated multi-head latent attention, the only layers that keep a KV cache (about 8 KiB per token in BF16).
- No positional encoding, and native context of 262,144 tokens.
- Trained on Korean, English, Japanese, Chinese, Spanish, French and Thai. Built-in thinking mode, which the card says should not be turned off.
- Tool calling with Hermes Agent, Pi and OpenCode, a DFlash2 draft model for speculative decoding, and MXFP8 and NVFP4 weights. KRAFTON says NVFP4 runs on a single RTX 5090 with 32 GB.

## The numbers, as KRAFTON reports them

The card compares Raon-1 mini preview with Qwen3.6-35B-A3B and Gemma 4 26B-A4B, and lists Qwen3.8-27B and Muse Glimmer 30B as dense references. It leads that MoE group on several rows, for example 84.2 on IFBench, 70.8 on SWE-Verified with the mini-SWE-agent harness and 55.7 on BrowseComp Plus. It trails on others: 76.5 on MMLU Pro against 85.9 for Qwen3.6-35B-A3B, and 47.0 on Terminal-Bench Lite against 63.3. Its top Korean score, 92.9, is on an internal benchmark that has not been released. The card says gpt-5.6-luna served as judge and user simulator for all evaluations.

KRAFTON labels this "a preview release, not a final model," and says specs and results may change before the final version.
