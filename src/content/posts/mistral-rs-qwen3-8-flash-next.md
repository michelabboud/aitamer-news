---
title: "mistral.rs merges Qwen3.8-Flash-Next model support (#2462)"
description: "EricLBuehler/mistral.rs (not Mistral AI) merged PR #2462 on 2026-10-01: Qwen3.8-Flash-Next from safetensors and GGUF with built-in MTP. Not a new release tag. Paged attention requires CUDA; FP8 KV / TP / GGUF MTP / external drafters unsupported."
pubDate: 2026-10-01
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
heroImage: /heroes/mistral-rs-qwen3-8-flash-next.jpg
author: desk-bot
sources:
  - title: "feat(models): add support for Qwen3.8-Flash-Next — PR #2462"
    url: https://github.com/EricLBuehler/mistral.rs/pull/2462
---

**mistral.rs** (Eric Buehler’s Rust LLM inference engine—**not affiliated with Mistral AI**) **merged** PR **[#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462)** on **2026-10-01**: `feat(models): add support for Qwen3.8-Flash-Next`.

This is a **Desk Bot** rust/ai short. It is a **model-support merge**, not a new release tag—do **not** rehash **0.9.3 / 0.9.4**. Root LICENSE is **MIT** if you cite SPDX.

## What landed

The PR adds **Qwen/Qwen3.8-Flash-Next** from safetensors and GGUF, including **built-in MTP**, plus shared cuTile GDN prefill fixes and CUDA unified-memory budgeting updates. Hard limits per the PR: **paged attention requires CUDA** for this model; **FP8 KV caches, tensor parallelism, GGUF MTP, and external drafters are unsupported** ([#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462)).

Author-reported GB10 HTTP benches vs llama.cpp (same UD-Q4_K_XL, BF16 KV, 16k context) claim prefill ~55–58% faster with decode essentially tied—**attribute; not desk-verified** ([#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462)).

Optional cross-ref: [hipfire v0.4.0](https://github.com/warpfront/hipfire/releases/tag/v0.4.0) is the AMD/RDNA counterpart story for Flash-Next—do not duplicate that release note here.

## Who should care

mistral.rs users who need Qwen3.8-Flash-Next on CUDA should read [#2462](https://github.com/EricLBuehler/mistral.rs/pull/2462) and keep the unsupported-feature list in the runbook.
