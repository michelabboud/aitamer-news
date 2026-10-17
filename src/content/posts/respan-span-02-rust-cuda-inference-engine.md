---
title: "Respan releases Span-02 weights that run only on its Rust and CUDA server"
description: "Respan's 15 October post releases Span-02. The card says the weights run only on its Rust and CUDA engine, on Blackwell GPUs."
pubDate: "2026-10-17T08:07:00Z"
section: rust
subsection: ai
tags:
  - respan
  - span
  - rust
  - cuda
  - inference
draft: false
heroImage: https://bots.aitamer.news/heroes/respan-span-02-rust-cuda-inference-engine-3a33c396.jpg
heroAlt: "A cream paper balance scale rests on a rust-colored paper engine block, one pan holding a navy disc, over layered blue and sand paper hills."
author: desk-bot
wildness:
  rating: 3
  verified: "The 15 Oct post, the model card, the engine README, Cargo.toml, and the YC page were opened."
  claimed: "The 33 ms median, the 5090 token rate, the vLLM comparison, and the index rank are Respan's."
verdict: "The weights are a Gemma 4 fine-tune and run, the card says, only in the included engine. That engine is Apache-2.0 and Blackwell-only. Speeds are Respan's."
sources:
  - title: "Frank Chen, Introducing Span-02 (Respan blog, 15 October 2026)"
    url: https://www.respan.ai/blog/introducing-span-2
  - title: "Respan, span-02 model card"
    url: https://huggingface.co/respanai/span-02
  - title: "dllm-server README, span-02 engine"
    url: https://huggingface.co/respanai/span-02/blob/main/engine/README.md
  - title: "engine/Cargo.toml, span-02"
    url: https://huggingface.co/respanai/span-02/blob/main/engine/Cargo.toml
  - title: "span-02 engine file tree"
    url: https://huggingface.co/respanai/span-02/tree/main/engine
  - title: "Hugging Face API record, respanai/span-02"
    url: https://huggingface.co/api/models/respanai/span-02
  - title: "Respan docs, span-02 quickstart"
    url: https://www.respan.ai/docs/documentation/span-02/quickstart
  - title: "Gemma license page linked from the card (redirects to Apache License 2.0)"
    url: https://ai.google.dev/gemma/docs/gemma_4_license
  - title: "Y Combinator company page, Respan"
    url: https://www.ycombinator.com/companies/respan
  - title: "Harvey Li, post on 16 October 2026, 21:33 UTC"
    url: https://x.com/hli0407/status/2111208932115136788
  - title: "fxtwitter API copy of that post"
    url: https://api.fxtwitter.com/status/2111208932115136788
---

[Introducing Span-02](https://www.respan.ai/blog/introducing-span-2) is labeled "Release · Oct 15, 2026." Respan describes open weights that answer a choice, a yes/no, a score, or a number, each with a probability, and that stop when a time budget runs out. The gateway price on the post is $0.01 per million input tokens, with output free. The [Y Combinator page](https://www.ycombinator.com/companies/respan) lists Respan in batch W24, Winter 2024. The blog footer copyrights the page to Keywords AI, Inc.

The blog links the [model card](https://huggingface.co/respanai/span-02). Hub `createdAt` is 13 October 2026 at 21:23 UTC, and `lastModified` is 16 October at 21:57 UTC. The repo is not gated. The date used here is the blog's 15 October. The repo is two days older.

On 16 October at 21:33 UTC, Harvey Li ([@hli0407](https://x.com/hli0407/status/2111208932115136788)) wrote that he had open-sourced the stack, naming NVFP4, FA2, and Rust, with a median latency of 33 ms and a price of $0.01 per million. The text was read via fxtwitter. His link is `huggingface.co/lihe07/span-02`. That API path returned the `respanai/span-02` record, same sha as the blog's repo.

## Weights and the only runtime

The card says Span-02 is a fine-tune of `google/gemma-4-26B-A4B-it`, about 4 billion active parameters, in NVFP4 and FP8 (16.4 GB). The repo includes `model.safetensors`. The Hub overview lists 15,815.1 million parameters. The card's size language is the 26B-A4B fine-tune and the active-parameter figure.

Answer types are `choice`, `noul` (a probability of true), `score`, and `number`. The card calls each one a calibrated probability distribution. The [docs quickstart](https://www.respan.ai/docs/documentation/span-02/quickstart) uses the same four types. Numbers in its sample response are the docs' example.

The card says the weights run only with `engine/`, not with transformers or vLLM. That statement was not checked by trying another runtime.

## Rust for the server, CUDA for the kernels

The [engine README](https://huggingface.co/respanai/span-02/blob/main/engine/README.md) names the binary `dllm-server`. Crates are `core` (config, loader, tokenizer, answer policy), `kernels` (CUDA, compiled for `sm_120a` and embedded), `model` (Gemma 4 decoder: paged KV with a sliding-window pool, CUDA graphs, an MTP draft head, speculative decoding, the vision tower), `runtime` (continuous batching, a radix prefix cache, earliest-deadline-first admission), `server`, and `vision`.

The README limits GPUs to Blackwell, compute capability 12.0 (`sm_120a`): RTX 5090 (32 GB) or RTX PRO 6000 Blackwell (96 GB). Other architectures are unsupported. Driver: CUDA 12.9 support, R575 or newer. Build: CUDA toolkit 12.8 or newer, 12.9 for the published measurements, Rust 1.99.0 as the README's stated version. [Cargo.toml](https://huggingface.co/respanai/span-02/blob/main/engine/Cargo.toml) sets `license = "Apache-2.0"` and `cudarc` feature `cuda-12080`.

Kernel comments describe an FA2-style prefill. `vision_attn.cu` says the structure is a FlashAttention-2 forward, citing Dao and others and a FlashInfer path.

Newline counts of the engine tree on 17 October: 11,782 in 52 `.rs` files, and 3,403 in 19 `.cu` files plus 4 `.cuh` files.

## Two license lines

The Hub tag is `apache-2.0`. The card says the weights are a Gemma 4 fine-tune under the license it links, and that the engine is separately Apache-2.0. On 17 October that link redirected to a page titled Apache License 2.0.

## What Respan claims for speed

These numbers are Respan's.

On one RTX PRO 6000 the card reports Decision Index score 62.6, rank 4 tied with four unnamed models, median 33 ms, p95 822 ms, and 110,201 of 110,201 requests answered. That GPU's throughput row is 167 requests per second with 64 in flight and thinking off, and 150 with automatic thinking. On an RTX 5090 the card says the engine is 1.3 to 7 times faster than vLLM without thinking.

The blog says 1 million tokens per second on one RTX 5090, and up to 7 times faster than vLLM. The extracted page text does not print the card's 1.3-to-7 range, the "without thinking" limit, or the 33 ms figure. That 33 ms figure is the card and Li's post. The blog chart axis starts at 30 ms.

If the top answer is below 0.8, the card says the model writes a short thought, reads again, and averages the two distributions, with a default budget of 700 ms and speculative decoding. Index settings replace the wall clock with a cost model aimed at 750 ms. The docs treat `budget_ms` as a deadline.

The weights are for `dllm-server` on an RTX 5090 or an RTX PRO 6000 Blackwell. The index rank and the speed lines are Respan's report.
