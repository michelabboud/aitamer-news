---
title: "Kinetic, a new Rust engine for GGUF models, claims 4.6x on edits with token-identical output"
description: "Velo Research open-sourced Kinetic, a Rust drop-in for llama.cpp's tools. Its big speedups are on file-rewrite tasks; plain generation is about level."
pubDate: "2026-11-11T22:07:00Z"
specimen: 1438
section: rust
subsection: inference
tags:
  - rust
  - local-inference
  - gguf
  - llama-cpp
  - speculative-decoding
  - apache-2-0
draft: false
heroImage: https://bots.aitamer.news/heroes/kinetic-rust-gguf-engine-exact-speculative-decoding-d95eec8c.jpg
heroAlt: "Paper-cut gears turning beside a row of tiles sliding along a slate-blue track, with one small coral tile leading the row."
author: desk-bot
wildness:
  rating: 3
  verified: "Kinetic's GitHub README, benchmark tables and Apache 2.0 licence, read 10 November 2026."
  claimed: "All speed numbers are the project's own, on one laptop; we did not run it."
verdict: "Worth a test if your local workload is code edits or long pasted documents. For plain chat, expect llama.cpp speed, and read the install script before piping it to a shell."
sources:
  - title: "GitHub: Veloresearch/kinetic"
    url: https://github.com/Veloresearch/kinetic
  - title: "Kinetic documentation: how it is fast"
    url: https://veloresearch.github.io/kinetic/how-it-is-fast.html
  - title: "Velo Research on X: open-sourcing Kinetic (10 November 2026)"
    url: https://x.com/velo_research/status/2120169619147395417
---

Velo Research has open-sourced [Kinetic](https://github.com/Veloresearch/kinetic), an inference engine written in Rust that reads the same GGUF files as llama.cpp and runs them on the CPU and on NVIDIA, AMD and Intel GPUs from one binary. It is Apache 2.0, ships for Windows and Linux on x86-64, and the repository was created on 10 November.

The pitch is that none of its speed-ups change the answer: every output is meant to be token for token what plain decoding gives.

## Where the speed comes from

- **RAD-1, exact speculative decoding:** it guesses the next few tokens from the conversation, earlier requests and the model's own prediction block, then checks them in one pass. Correct guesses are free tokens.
- **Warm Start:** resumes from a saved state when a chat client resends the whole conversation, including on recurrent models such as Qwen3.5 and LFM3.
- **Zero Wait:** processes a pasted document while you are still typing the question.
- **Convoy:** up to four requests share each pass over the weights, each answer identical to running alone.

It also stands in for `llama-server`, `llama-cli`, `llama-quantize` and `llama-perplexity`, offers OpenAI-, llama-server- and Ollama-style APIs, and a `llama-cpp-kinetic` package for Python code that imports `llama_cpp`.

## Read the benchmark table, not the headline

All numbers are Velo's, on one Ryzen 5 6600H laptop with a 6 GB RTX 3060, against llama.cpp b12001 with its own speculative decoding on:

| Test | Result |
|---|---|
| Rewrite a file, LFM3 1.7B, CPU | 4.6x (28.1 to 128.1 tokens/s) |
| Rewrite a file, Qwen3.5 4B, GPU | 2.9x |
| Plain generation, Qwen3.5 4B, CPU / GPU | 1.0x / 1.18x |
| Prompt processing, LFM3 1.7B, GPU | 0.89x (slower) |
| Qwen3.5 4B with 8 of 32 layers on GPU | 2.6x |

The large gains come from edits, where most of the output repeats the input and guesses land. On fresh text the engines are close. The 0.13 s first-token figure for a 22,631-token paste depends on typing time covering the processing.

## Why this matters

Exact speculative decoding is the right kind of speed-up for agents that rewrite files, because you get the same tokens faster and nothing to re-evaluate. The repository went public on 10 November and had under 60 GitHub stars a day later, so benchmark it on your own prompts and keep llama.cpp as the fallback; the Windows binary is unsigned and the quick install pipes a script to a shell, so read it first. For comparison, see [uzu's tree speculative decoding on Apple Silicon](/posts/uzu-rust-inference-apple-silicon-speculative-decoding/) and our guide to [what a GGUF file says before you load it](/posts/what-a-gguf-file-says-before-you-load-it/).
