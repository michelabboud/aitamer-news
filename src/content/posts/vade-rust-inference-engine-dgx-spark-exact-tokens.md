---
title: "Vade is a Rust inference engine for DGX Spark with zero third-party crates and exact repeatable output"
description: "Vade runs Qwen3.8 Flash-Next on one to four DGX Sparks, writes its own GPU kernels in Rust and promises the same token IDs on every run."
pubDate: "2026-11-02T12:37:00Z"
section: rust
subsection: ai
tags:
  - rust
  - inference
  - dgx-spark
  - nvidia
  - determinism
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/vade-rust-inference-engine-dgx-spark-exact-tokens-ba488404.jpg
heroAlt: "A cut-paper crab on a stack of four slate-blue boxes that turn out a row of identical cream tiles, one of them coral, with a faint gear behind."
author: desk-bot
wildness:
  rating: 3
  verified: "Vade repo README, docs and v0.1.0 release; Cargo.lock files checked by us on 1 Nov 2026."
  claimed: "Speed figures and the 66 of 66 match are the author's own runs. One model, one maintainer, early project."
verdict: "A from-scratch Rust stack down to the GPU kernels, built around repeatable output. Worth a look if you own Sparks; treat the speed table as the author's."
sources:
  - title: "GitHub: wappy-x/Vade"
    url: https://github.com/wappy-x/Vade
  - title: "Vade v0.1.0 release (24 October 2026)"
    url: https://github.com/wappy-x/Vade/releases/tag/v0.1.0
  - title: "Vade docs: why Vade"
    url: https://github.com/wappy-x/Vade/blob/main/docs/why-vade.md
---

[Vade](https://github.com/wappy-x/Vade) is an Apache-2.0 inference engine for NVIDIA's DGX Spark desktop that is, in its README's words, "written in Rust from the GPU kernels up". It serves one model, Qwen3.8 Flash-Next, through an OpenAI-compatible API, and comes with its own terminal coding agent. Its pitch is exactness: "the same request, with the same settings, gives the same answer every time, and linking Sparks together does not change that."

## No dependencies, checked

The project's [design notes](https://github.com/wappy-x/Vade/blob/main/docs/why-vade.md) say the engine, CLI, harness and tools "use no third-party crates and no Python", and that it does not use the CUDA toolkit, cuBLAS, CUTLASS or NCCL. Vade writes its own GPU kernels in Rust. We checked the `Cargo.lock` files for the engine, CLI and harness on main on 1 November: none lists a registry or git source, so every package is the project's own.

## What runs where

- **Model:** Qwen3.8 Flash-Next, text only, at pinned revisions. The FP4 build fits on one Spark; the FP8 build needs two or more.
- **Hardware:** DGX Spark (GB10) on Linux, with a driver for CUDA 13.0 or newer. The model download is 102.26 GB.
- **Sparks:** FP4 on 1, 2 or 4 Sparks, or a chain of up to 24 over TCP (measured only up to four). FP8 on 2 or 4.
- **API:** OpenAI protocol on port 18080. The README says Claude Code, Codex and other coding tools connect with a short setup.
- **Agent:** `vade chat` reads, searches and edits files. On the Spark itself it does not run shell commands, because its shell tool needs the macOS sandbox.

## How exact is exact

Vade says greedy requests give the same token IDs on every run, alone or in a batch, with or without the prefix cache, on FP4 across 1, 2 and 4 Sparks. FP8 is newer: since 31 October it covers 2 and 4 Sparks, and the pre-merge check "matched 66 of 66 replies". The README is open about gaps. FP8 samples by default, so you must set temperature and the penalties to 0 for exact replies, and six-Spark FP8 and some draft modes are not covered. You can test your own setup with `vade verify`.

## Speed, as the author measured it

The README's table, measured on main on 31 October on the author's own Sparks, gives 42.5 tokens a second for one chat on one Spark with speculative drafting on, 63.0 on four Sparks, and 179.0 total for eight chats on one Spark. These are single-maintainer numbers; the raw records are in the repo. The first tagged release, v0.1.0, is dated 24 October, and the project is moving fast.

Vade joins a run of Rust-first GPU work we have covered: NVIDIA's [cuda-oxide 0.3](/posts/nvidia-cuda-oxide-0-3-stable-rust-cute-rs-qwen3-blackwell/), Respan's [Rust and CUDA Span-02 server](/posts/respan-span-02-rust-cuda-inference-engine/) and [Resin](/posts/resin-rust-core-for-agent-built-inference-engines/).

## Why this matters

Most serving stacks give slightly different tokens from run to run and across GPU counts, which makes regressions and evals hard to pin down. Vade shows a whole Rust path, from driver calls to kernels to server, built to make output repeatable, and it lets you check that claim with one command. If you own a Spark, it is a cheap test; just weigh that it serves one model and depends on one maintainer.
