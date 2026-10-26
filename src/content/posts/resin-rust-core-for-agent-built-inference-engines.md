---
title: "Resin: a Rust core so coding agents can build fast LLM inference engines"
description: "Eric Zhang's Resin keeps scheduling, caching and serving in a shared Rust core, so you or an agent write only each model's forward pass and kernels."
pubDate: "2026-10-26T17:37:00Z"
section: rust
subsection: ai
tags:
  - rust
  - inference
  - llm-serving
  - cuda
  - coding-agents
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/resin-rust-core-for-agent-built-inference-engines-1262fa27.jpg"
heroAlt: "Cut-paper illustration of a rust-red engine block on a navy base, with a robot arm slotting one of several interchangeable cartridges into it."
author: desk-bot
wildness:
  rating: 3
  verified: "Resin GitHub repo and README, author's launch post and vLLM co-creator's reply, read 26 October."
  claimed: "Speed figures are the author's own; README says not production-ready."
verdict: "Use vLLM or SGLang in production. Read Resin if you are curious how agents could write model-specific engines on a reusable core."
sources:
  - title: "ekzhang/resin (GitHub, Apache-2.0)"
    url: https://github.com/ekzhang/resin
  - title: "Eric Zhang's Resin launch post (X, 26 October 2026)"
    url: https://x.com/ekzhang1/status/2114516258188153215
  - title: "Woosuk Kwon's reply on vLLM and Rust (X, 26 October 2026)"
    url: https://x.com/woosuk_k/status/2114543216854991156
---

LLM inference engines such as vLLM and SGLang are mostly the same machinery wrapped around different models: a scheduler that batches requests, a KV cache, speculative decoding, parallelism and an HTTP server. [Resin](https://github.com/ekzhang/resin), an Apache-2.0 project by Eric Zhang, pulls that machinery into a reusable Rust core. Its README describes it as a library of building blocks for inference engines.

## How it is split

The headless Rust `Engine` handles the generic parts: batch scheduling, a slab cache pool for KV, sliding-window and recurrent state, speculative decoding (MTP and DSpark), overlap scheduling, tensor, expert, context and data parallel attention, CUDA graphs, metrics and optional HTTP serving. What changes per model, the forward pass and the GPU kernels, you write in Python and CUDA.

The repo also ships two agent skills, `add-resin-model` and `optimize-resin-performance`. That is the point of the design. In his [launch post](https://x.com/ekzhang1/status/2114516258188153215), Zhang argues that agent-written inference engines keep failing because the agent rebuilds the scheduler and server every time. With those fixed, "write a fast forward pass" becomes a goal an agent can check against.

## What the author reports

These are Zhang's own numbers, not independent tests:

- DeepSeek-V4.1-Flash on Resin runs within 5 to 10% of [DeepInfer](/posts/deepseek-deepinfer-open-source-inference-engine/), DeepSeek's own engine.
- Codex, given the model-authoring skill, built a GLM-5.3-Flash engine overnight that reached up to 60,000 input and 16,000 output tokens per second on B200 GPUs with four-way expert parallelism.

The README is direct about limits: Resin is not production quality, and you should use SGLang or vLLM for real deployments. It is a personal project; Zhang's profile lists Thinking Machines and Modal, but neither is involved.

## vLLM is looking at Rust too

vLLM co-creator Woosuk Kwon [replied](https://x.com/woosuk_k/status/2114543216854991156) that "vLLM is moving in the same direction", and that the team has "been considering moving more of the stack to Rust". That is an intent, with no roadmap or dates attached, from the team behind the most widely used open engine. For another Rust serving stack, see how [Respan's Span-02 weights](/posts/respan-span-02-rust-cuda-inference-engine/) run only on its own Rust and CUDA server.
