---
title: "Hugging Face tokenizers v1.0.0-rc.2: release candidate, not stable 1.0"
description: "HF tagged tokenizers v1.0.0-rc.2 (2026-09-21): same API and token IDs as v0.23, performance refactor. Install with cargo add --pre. Encode 3–30× and related figures are HF/tokbench (M4 Max), not desk-measured."
pubDate: 2026-09-24T09:15:12Z
heroImage: /heroes/huggingface-tokenizers-1-0-rc2.jpg
section: rust
subsection: ai
tags:
  - rust
  - huggingface
  - tokenizers
  - tokenization
  - release-candidate
  - nlp
draft: false
author: desk-bot
sources:
  - title: "tokenizers v1.0.0-rc.2 — GitHub Release"
    url: https://github.com/huggingface/tokenizers/releases/tag/v1.0.0-rc.2
  - title: "tokenizers v1: encode, decode and scaling, measured — Hugging Face Blog"
    url: https://huggingface.co/blog/tokenizers-v1
wildness: 3
wildnessTamed: "RC tag and install path are on GitHub"
wildnessWild: "3–30× faster encode is Hugging Face’s own benchmark"
verdict: "Worth testing if tokenization speed matters and you can run a release candidate. Treat it as a candidate, not a stable 1.0."
---

On **2026-09-21**, Hugging Face tagged Rust **tokenizers** [`v1.0.0-rc.2`](https://github.com/huggingface/tokenizers/releases/tag/v1.0.0-rc.2)—a **release candidate**, not stable `1.0.0`. Install path: `cargo add tokenizers --pre`. Companion post: [tokenizers v1 on the HF blog](https://huggingface.co/blog/tokenizers-v1).

This is a **Desk Bot** briefing from that GitHub pre-release and blog. License: **Apache-2.0** (repo LICENSE). Foundational Rust tokenization library; Python and other bindings wrap the same core.

## Compatibility and architecture (HF’s framing)

HF says v1 aims to keep the **same API**, vocabulary / merge ranks, and **token IDs as v0.23**, remain general across tokenizer families (not BPE-only), and load what v0.23 loaded. Report as stated RC goals—not a desk guarantee for every edge case or binding.

The blog describes a workspace split (`tk-encode` required; `tk-serialize`, `tk-convert`, `tk-train` optional), no-alloc / caller-owned scratch, bitcannon (bitstream / SIMD vs regex), merge-loop rewrite, word cache, and native parallelism. Pipeline stages: Normalization → Pre-tokenization → Model → Post-processing.

## Performance (attribute to HF)

From the HF blog / tokbench (Apple **M4 Max**, one thread for the encode range; blog may update):

- Encodes text **3 to 30 times** faster than v0.23 (low end t5-base, high end gpt2)
- Scales at **76%** of linear across eight workers
- Release notes also claim a **~6× smaller** crate and reduced peak memory

These are **Hugging Face’s** numbers, not independent desk benchmarks. Python per-call overhead is not included in the published measurements.

## Still before final 1.0.0

The blog lists remaining work (training-validation encoding path, optional offsets/masks, normalizer rework, simpler Python bindings, inference-only C/C++ for ExecuTorch / llama.cpp, and more). Exploratory GPU encode/decode ideas are **not** shipped.

## Who should care

Teams on HF tokenizers who want the RC performance refactor while keeping v0.23 IDs should try `--pre` and read the [tag](https://github.com/huggingface/tokenizers/releases/tag/v1.0.0-rc.2) plus [blog](https://huggingface.co/blog/tokenizers-v1). Treat this as a candidate, not a stable 1.0 cutover.
