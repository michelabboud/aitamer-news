---
title: "MBZUAI's PAN 2 is an open world model that simulates actions as video, under Apache 2.0"
description: "PAN 2 pairs a language model that plans the next world state with a 29B video model that renders it, up to 20 seconds. Weights and code are Apache 2.0."
pubDate: "2026-11-12T09:37:00Z"
specimen: 1442
section: models
subsection: opensource
tags:
  - world-models
  - open-weights
  - video-generation
  - mbzuai
  - robotics
  - apache-2-0
draft: false
heroImage: https://bots.aitamer.news/heroes/mbzuai-pan-2-open-world-model-apache-2-8f03cbb6.jpg
heroAlt: "A paper-cut film strip whose frames show a ball rolling down a slate-blue ramp, ending with a small coral ball in the last frame."
author: desk-bot
wildness:
  rating: 3
  verified: "The IFM/PAN2 model card and the GitHub repository's licence, read 10 November 2026."
  claimed: "Benchmark and plan-completion results are the team's own; we did not run the model."
verdict: "A genuinely open world model with honest limits on its own card. Plan for a large GPU and for one in three multi-step plans to come out right."
sources:
  - title: "Hugging Face: IFM/PAN2 model card"
    url: https://huggingface.co/IFM/PAN2
  - title: "GitHub: ifm-ai/PAN2"
    url: https://github.com/ifm-ai/PAN2
  - title: "GitHub: ifm-ai/pan2-guardrail"
    url: https://github.com/ifm-ai/pan2-guardrail
  - title: "vLLM on X: day-0 support for PAN 2 in vLLM-Omni"
    url: https://x.com/vllm_project/status/2120200730699268129
---

The Institute of Foundation Models (IFM) at MBZUAI has published [PAN 2](https://huggingface.co/IFM/PAN2), a world model: give it a starting image (optional) and actions described in text, and it simulates the outcome as video of up to 20 seconds. The code and weights are under **Apache 2.0**, and it already runs in Diffusers and, per the vLLM team, in vLLM-Omni.

## How it is built

PAN 2 splits the job in two. A language model, the "conceptual reasoner", reads the scene and the requested actions and writes the next world state as a structured, timed description of events, actors and camera moves. A **29B-parameter diffusion transformer**, trained from scratch, turns that description into video latents, and the Wan 2.2 VAE decodes them at 704x1248 and 24 fps. The frozen text encoder is Qwen3.5-9B.

Any instruction-following model can be the reasoner. The card lists Claude Opus 5.5, GPT-6 Astra, Kimi K3 and Qwen 3.8 Flash as tested, and ships the prompt rewriter as a Codex and Claude Code skill. Free-text prompts work poorly without that rewrite.

## What it takes to run

The released checkpoint is the diffusion backbone in BF16; each GPU worker loads the full 29B model, which is about 58 GB of weights by our arithmetic. The card gives no minimum GPU. IFM strongly recommends running it behind its separate [pan2-guardrail](https://github.com/ifm-ai/pan2-guardrail), which screens requests with Qwen3Guard and output frames with a classifier; in IFM's tests that cut unsafe text-to-video outputs from 33.9% to 1.5% of harmful requests, while blocking 11.5% of benign ones.

## Limits the card states

- About **two in three** simulated multi-step plans have at least one step not carried out.
- Results depend heavily on prompt wording.
- Appearance drifts across clips in long interactions.
- Simulations can skip physical steps, such as pasta landing in the colander before it is drained.

## Why this matters

Most world models we cover are closed or demo-only; PAN 2 gives you permissive weights, a training config and an agent-ready prompt skill, so you can test "imagine the outcome before acting" in your own agent loop. Read the numbers as the team's, and compare it with [Tencent's Apache 2.0 Hy-Nomas](/posts/tencent-hy-nomas-open-interactive-world-model/) and [NVIDIA's Cosmos 3 Nano checkpoints](/posts/nvidia-cosmos-3-nano-interactive-world-simulation/) on your own scenes before choosing. Disclose AI-generated video wherever it could pass for real footage, as the card asks.
