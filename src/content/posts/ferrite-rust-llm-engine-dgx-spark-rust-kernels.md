---
title: "Ferrite is a Rust LLM engine for DGX Spark whose GPU kernels are Rust too"
description: "Ferrite is a Rust LLM engine for DGX Spark with Rust GPU kernels. Since 0.1.0 it added Intel Arc Pro B70 and 16 GB RTX targets. Experimental, Apache-2.0."
pubDate: "2026-11-09T18:07:00Z"
specimen: 1402
updatedDate: "2026-11-12T07:18:00Z"
section: rust
subsection: inference
tags:
  - rust
  - dgx-spark
  - inference
  - gpu-kernels
  - qwen
draft: false
heroImage: https://bots.aitamer.news/heroes/ferrite-rust-llm-engine-dgx-spark-rust-kernels-225bee6a.jpg
heroAlt: "A small cream paper workstation in cutaway, its layers one material down to a chip with a tiny coral spark, linked by a slate-blue cable to a second box."
author: desk-bot
wildness:
  rating: 3
  verified: "Ferrite README, v0.1.0 release (9 Nov 2026, 01:11 UTC) and GitHub repo metadata read 9 Nov."
  claimed: "Speed and cache figures are the project's own; brand-new repo with no outside reports yet."
verdict: "Still a focused, experimental single-author engine, now on three kinds of hardware. The numbers are the project's own; the author still points general use to a broader engine."
sources:
  - title: "BHCC2025/ferrite on GitHub"
    url: https://github.com/BHCC2025/ferrite
  - title: "Ferrite v0.1.0 release"
    url: https://github.com/BHCC2025/ferrite/releases/tag/v0.1.0
  - title: "Ferrite docs"
    url: https://bhcc2025.github.io/ferrite/
  - title: "AI Tamer: Vade is a Rust inference engine for DGX Spark"
    url: https://aitamer.news/posts/vade-rust-inference-engine-dgx-spark-exact-tokens/
  - title: "Ferrite v0.2.0 release (10 November 2026)"
    url: https://github.com/BHCC2025/ferrite/releases/tag/v0.2.0
  - title: "Ferrite v0.3.0 release (11 November 2026)"
    url: https://github.com/BHCC2025/ferrite/releases/tag/v0.3.0
  - title: "Ferrite v0.4.0 release (11 November 2026)"
    url: https://github.com/BHCC2025/ferrite/releases/tag/v0.4.0
  - title: "Ferrite v0.4.3 release (12 November 2026)"
    url: https://github.com/BHCC2025/ferrite/releases/tag/v0.4.3
---

[Ferrite](https://github.com/BHCC2025/ferrite) is a new LLM inference engine for NVIDIA's DGX Spark (GB10) that is written in Rust from the HTTP server down to the GPU kernels. Version 0.1.0 was [released](https://github.com/BHCC2025/ferrite/releases/tag/v0.1.0) at 01:11 UTC on 9 November under Apache-2.0.

## Rust on the GPU

Most Rust inference servers still call CUDA C or C++ kernels underneath. Ferrite's kernels are Rust as well: rustc's `nvptx64-nvidia-cuda` backend compiles them to PTX, they are assembled for `sm_121a`, and they run through a thin binding to the CUDA driver. That puts it in the same thread as NVIDIA's [cuda-oxide](/posts/nvidia-cuda-oxide-0-3-stable-rust-cute-rs-qwen3-blackwell/), which also runs Qwen in Rust on Blackwell, but Ferrite is a single small project aimed at one machine.

## What it does today

The README is plain about the scope. Status is "experimental": one model (Qwen3.8-27B), one GPU type (GB10), on one Spark or two connected over RoCE. It exposes an OpenAI-compatible API with streaming, thinking, tool calls and 128K context. At most four requests run at once with DFlash2 speculative drafting; more wait in a queue.

The project reports these medians on two Sparks with greedy decoding, in tokens per second:

| Workload | Ferrite |
|---|---|
| Code, 1 request | 273 |
| Code, 4 requests (aggregate) | 473 |
| Code, 1 request, 32K context | 238 |
| Prose, 1 request | 76 |

Speculative decoding favours predictable text, so code and edits are much faster than prose, and the README says so.

The prompt cache is aimed at agents. It snapshots each conversation at turn boundaries and resumes from the longest match. In the project's test, four agents sharing a system prompt of about 13K tokens computed 74% fewer prompt tokens with the cache on, and the first turn's time to first token fell from 16.4 to 5.1 seconds.

None of this has outside measurements yet. The repo had no stars when we checked, and the README asks Spark owners to send their own numbers.

## Where it comes from

Ferrite began as an experiment by a contributor to TensorFold, and it credits TensorFold and exllamav3 for what it learned. The README tells readers who want a mature engine for many models to use TensorFold. It is a sibling to [Vade](/posts/vade-rust-inference-engine-dgx-spark-exact-tokens/), a different Rust engine for the same machine that we covered last week.

Setup needs a Spark with DGX OS, driver 580 or later, about 95 GB of free memory and 38 GB of disk. The README suggests pasting an install instruction into your coding agent so it follows the repo's AGENTS.md; read that file yourself first, as you would any script you let an agent run.

## Why this matters

Ferrite is a working data point that Rust can own the whole inference stack, kernels included, on current NVIDIA hardware, not only the server around the kernels. Its agent prompt cache is the part most builders can learn from: sharing a long system prompt across parallel agents is common, and the project shows how much prefill it saves. For production on a Spark, the author's own advice is to look at a broader engine.

## Update, 12 November 2026: Ferrite now targets Intel Arc Pro B70 and 16 GB RTX cards

Ferrite has shipped six more releases since 0.1.0, and it is no longer a DGX Spark-only engine. All numbers below are the project's own, from its release notes.

- **0.2.0** (10 November) added an experimental second target: Qwen3.8-27B on one 32 GB Intel Arc Pro B70, with Rust kernels compiled to SPIR-V and loaded through Level Zero, 5.0 bpw weights and 128K context. It is built from source and served one request at a time. ([release](https://github.com/BHCC2025/ferrite/releases/tag/v0.2.0))
- **0.3.0** (11 November) added a third experimental target, one 16 GB NVIDIA RTX 5080. It serves the same model with 128K context by using a 6-bit K/V cache and streaming prompt weights from pinned host memory, and runs up to four requests from one shared pool of context. Requests that arrive together with the same opening text now prefill it once. The README now says Ferrite runs on Linux only. ([release](https://github.com/BHCC2025/ferrite/releases/tag/v0.3.0))
- **0.4.0** (11 November) lets the Arc Pro B70 serve up to four requests at once. The project reports four lanes together at about 1.4 times the speed of one request (126 versus 90 tokens per second with a 2K shared prefix, 85 versus 46 at 16K), and says each lane's output matches the same request sent alone. The default is still one request with 128K context. ([release](https://github.com/BHCC2025/ferrite/releases/tag/v0.4.0))
- **0.4.1 to 0.4.3** (11 to 12 November) changed the default model id to `qwen3.8-27b` on every target (old clients keep working, and `FERRITE_MODEL_ID` can restore the old id), fixed the 16 GB preset when NVIDIA's prompt checkpoint is missing, and reported the RTX 5080 build running on an RTX 5060 Ti 16 GB, tuned in 0.4.3 to about 155 tokens per second on code at 2K context. ([0.4.3 release](https://github.com/BHCC2025/ferrite/releases/tag/v0.4.3))

Prebuilt binaries are still for DGX Spark only; the B70 and RTX targets build from source. It remains a single-maintainer, experimental project with no outside benchmarks yet.
