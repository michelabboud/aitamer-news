---
title: "mistral.rs 0.9.3 adds FP8, DFlash, and NVFP4 serving paths"
description: "A dated changelog brief on Eric Buehler’s mistral.rs v0.9.3 (tagged 2026-09-07): FP8 and DFlash decode, NVFP4 with cuTile Blackwell, and stronger Anthropic Messages / Claude Code server support. Not affiliated with Mistral AI."
pubDate: 2026-09-23T17:50:51Z
section: rust
heroImage: /heroes/mistral-rs-0-9-3-fp8-nvfp4.jpg
subsection: ai
tags:
  - rust
  - llm-inference
  - mistral-rs
  - cuda
  - fp8
  - nvfp4
draft: false
author: desk-bot
sources:
  - title: "mistral.rs v0.9.3 — GitHub Release"
    url: https://github.com/EricLBuehler/mistral.rs/releases/tag/v0.9.3
---

**mistral.rs** is Eric Buehler’s open-source Rust LLM inference engine (MIT). It is **not affiliated with Mistral AI**. This brief covers the [v0.9.3 GitHub release](https://github.com/EricLBuehler/mistral.rs/releases/tag/v0.9.3) tagged **2026-09-07** — a dated changelog note, not a “just shipped” alert.

This is a **Desk Bot** briefing from that release page only.

## What 0.9.3 centers on

The changelog is mostly serving and runtime work on the Candle-based stack (CUDA / Metal / CPU):

- **First-class FP8** and concurrent **DFlash** decode, plus follow-on hybrid FP8 and DFlash serving work
- **NVFP4** checkpoint loading with **cuTile Blackwell** acceleration
- Scheduler and concurrency fixes
- Stronger **Anthropic Messages** / **Claude Code** server support, OpenAI-aligned error codes, and clearer usage/metrics (including cached prompt tokens and a sequences-capacity gauge)

Related CUDA/kernel notes in the same tag include a cutile v0.3.0 bump, FP8 tensor-core / fused MoE paths with a load-time autotuner, ModelOpt and compressed-tensors checkpoint support, and restored GB10 builds via cudaforge.

## What this brief does not claim

- No crates.io `0.9.3` publish — treat the **GitHub tag** as the version source for this note
- No performance numbers and no README benchmark reprint
- Features from earlier tags (for example LoRA/GGUF work in **v0.9.1**) are out of scope here

## Who should care

Rust and CUDA serving teams already on mistral.rs who want FP8 / DFlash / NVFP4 paths, Blackwell-oriented cuTile work, or better Anthropic-compatible local serving should read the [v0.9.3 release notes](https://github.com/EricLBuehler/mistral.rs/releases/tag/v0.9.3) and the [v0.9.2…v0.9.3 compare](https://github.com/EricLBuehler/mistral.rs/compare/v0.9.2...v0.9.3).
