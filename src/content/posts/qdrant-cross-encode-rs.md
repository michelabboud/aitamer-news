---
title: "cross-encode-rs: Rust ONNX cross-encoder reranking (Qdrant blog)"
description: "Qdrant’s Clelia Bertelli blog (Sep 25, 2026) covers cross-encode-rs—a Rust ONNX Runtime cross-encoder for reranking. crates.io owner is AstraBert (not a Qdrant-org crate). ~1.1×/~1.4× vs Python stacks on M4 Max are vendor-reported; all three hand work to onnxruntime. Linux/macOS only."
pubDate: 2026-10-01T10:38:00Z
specimen: 95
section: rust
subsection: opensource
tags:
  - rust
  - cross-encode-rs
  - onnx
  - reranking
  - cross-encoder
  - qdrant
  - astrabert
  - rag
  - opensource
draft: false
heroImage: https://media.aitamer.news/heroes/qdrant-cross-encode-rs.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Qdrant blog (Bertelli): cross-encode-rs Rust ONNX rerank; crates.io owner AstraBert; Linux/macOS"
  claimed: "~1.1× MiniLM median / ~1.4× Jina on M4 Max vs fastembed/sentence-transformers (vendor-reported)"
verdict: "A solid ops angle for a dedicated rerank binary without Python or the GIL. Benchmarks are the Qdrant blog’s, the crate owner is AstraBert, and Rust does not beat Python on FLOPs when all three use onnxruntime."
sources:
  - title: "Oxidizing Cross-Encoders — Qdrant Blog"
    url: https://qdrant.tech/blog/oxidizing-cross-encoders/
  - title: "cross-encode-rs — crates.io"
    url: https://crates.io/crates/cross-encode-rs
---

Qdrant’s blog (**Clelia Bertelli**, **2026-09-25**) covers **`cross-encode-rs`**: Rust ONNX Runtime cross-encoder inference for **reranking** (query+doc scored together), aimed at AI rerank services without a Python runtime/GIL ([blog](https://qdrant.tech/blog/oxidizing-cross-encoders/)).

On [crates.io](https://crates.io/crates/cross-encode-rs) the owner is **AstraBert** (Clelia Bertelli), so this is **not** a Qdrant-org release; the announcement is on the **Qdrant blog**. The README notes **Linux and macOS only**.

## What shipped

- Tokenize → length-sorted batches → `ort` ONNX session → sigmoid/softmax by `num_labels`
- Compared vs **`fastembed`** and **`sentence-transformers`** (ONNX/CPU) on MiniLM + Jina `jina-reranker-v2-base-multilingual` (`mteb/scidocs-reranking`)
- Ops angle: single binary, no GIL, controlled batching worker for concurrent load

## Benchmarks (vendor claims)

All speedups are **vendor-reported** on a MacBook **M4 Max**—not independently verified ([blog](https://qdrant.tech/blog/oxidizing-cross-encoders/)):

- MiniLM: ~**1.1×** faster at the median vs the Python stacks
- Larger Jina model: about **1.4×** ahead (blog: ~1.3–1.5× across percentiles)

**All three** libraries hand work to **`onnxruntime`**, so this is not a claim of language superiority or Rust>Python FLOPs. Load-time: with Python startup excluded, session create is close; whole-process gap favors Rust mainly via no Python cold start.

## Who should care

Teams building a dedicated rerank microservice who want an ONNX-backed binary without Python should read the [Qdrant blog](https://qdrant.tech/blog/oxidizing-cross-encoders/) and the [crates.io page](https://crates.io/crates/cross-encode-rs)—attribute benches, keep the AstraBert ownership note, and stay on Linux/macOS.
