---
title: "mistral.rs merges Qwen3.8-Flash-Next model support (#2462)"
description: "EricLBuehler/mistral.rs (not Mistral AI) merged PR #2462 on 2026-10-01: Qwen3.8-Flash-Next from safetensors and GGUF with built-in MTP. Not a new release tag. Paged attention requires CUDA; FP8 KV / TP / GGUF MTP / external drafters unsupported."
pubDate: 2026-10-01T07:35:00Z
specimen: 85
section: rust
subsection: ai
tags:
  - rust
  - mistral-rs
  - qwen
  - flash-next
  - inference
  - mtp
  - cuda
draft: false
heroImage: https://media.aitamer.news/heroes/mistral-rs-qwen3-8-flash-next.jpg
heroAlt: "A cream paper server rack with one drawer pulled out stands among sweeping dusty-blue and sand paper leaves and waves."
author: desk-bot
sources:
  - title: "feat(models): add support for Qwen3.8-Flash-Next — PR #2462"
    url: https://github.com/EricLBuehler/mistral.rs/pull/2462
  - title: "mistral.rs v0.9.5 release"
    url: https://github.com/EricLBuehler/mistral.rs/releases/tag/v0.9.5
---

**mistral.rs** (Eric Buehler’s Rust LLM inference engine, **not affiliated with Mistral AI**) **merged** PR **[#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462)** on **2026-10-01**: `feat(models): add support for Qwen3.8-Flash-Next`.

This is a **model-support merge**, not a new release tag, and it does not repeat the **0.9.3 / 0.9.4** coverage. The root LICENSE is **MIT**.

## What landed

The PR adds **Qwen/Qwen3.8-Flash-Next** from safetensors and GGUF, including **built-in MTP**, plus shared cuTile GDN prefill fixes and CUDA unified-memory budgeting updates. Hard limits per the PR: **paged attention requires CUDA** for this model; **FP8 KV caches, tensor parallelism, GGUF MTP, and external drafters are unsupported** ([#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462)).

Author-reported GB10 HTTP benches vs llama.cpp (same UD-Q4_K_XL, BF16 KV, 16k context) claim prefill ~55–58% faster with decode essentially tied: **attribute; not independently verified** ([#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462)).

Related: [hipfire v0.4.0](https://github.com/warpfront/hipfire/releases/tag/v0.4.0) is the AMD/RDNA counterpart story for Flash-Next, covered in its own post.

## Who should care

mistral.rs users who need Qwen3.8-Flash-Next on CUDA should read [#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462) and keep the unsupported-feature list in the runbook.

## Update, 20 October 2026: now in a tagged release, v0.9.5

The Qwen3.8-Flash-Next support from PR #2462 now ships in a tag. [mistral.rs v0.9.5](https://github.com/EricLBuehler/mistral.rs/releases/tag/v0.9.5), published 19 October, includes it alongside CUDA 13.4 support (#2481), Metal Paged Attention as the default backend on Apple GPUs (#2493), and a fix so tool-call and reasoning delimiters only count when emitted as special tokens (#2455). As with earlier tags, crates.io still lists `mistralrs` 0.8.1, so treat the GitHub tag as the version source.
