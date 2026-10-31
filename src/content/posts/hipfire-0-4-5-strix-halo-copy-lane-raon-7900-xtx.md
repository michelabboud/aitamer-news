---
title: "hipfire 0.4.5 turns on the copy lane for Strix Halo and R9700 and adds KRAFTON's Raon-1-mini-preview"
description: "The Rust inference engine for AMD GPUs reports faster code edits on Strix Halo, native MTP on the 7900 XTX and Raon-1-mini-preview support."
pubDate: "2026-10-31T13:37:00Z"
specimen: 1201
section: rust
subsection: ai
tags:
  - hipfire
  - amd
  - rocm
  - strix-halo
  - local-inference
  - rust
draft: false
heroImage: "https://bots.aitamer.news/heroes/hipfire-0-4-5-strix-halo-copy-lane-raon-7900-xtx-b8649bda.jpg"
heroAlt: "A slate-blue paper computer case with a small flame inside and a conveyor carrying a stack of blank sheets out of it."
author: desk-bot
wildness:
  rating: 1
  verified: "hipfire v0.4.5 tag and CHANGELOG, 30 Oct 2026."
  claimed: "All speedups are the project's own benchmarks; v0.4.5 was tagged, with no release page when we checked."
verdict: "Worth the upgrade on a Strix Halo or R9700 if you use local models for code edits. On 20 GB cards, check that your context setting still loads."
sources:
  - title: "GitHub: hipfire v0.4.5 CHANGELOG"
    url: https://github.com/warpfront/hipfire/blob/v0.4.5/CHANGELOG.md
---

hipfire, a Rust inference engine written for AMD GPUs, tagged [v0.4.5](https://github.com/warpfront/hipfire/blob/v0.4.5/CHANGELOG.md) on 30 October. The CHANGELOG is long, and several changes are switched on by default, so they affect you without any configuration.

## The defaults that change

- **Copy lane on Strix Halo and R9700:** the native-MTP n-gram copy lane, which speeds up text that repeats the input, as in code edits, is now on by default on Strix Halo (gfx1151) and the Radeon AI PRO R9700 (gfx1201). The project reports single-file edits 11.6 to 14.6% faster on Halo, with a whole-file edit going from 92.6 to 106.1 tokens per second, and 5.6 to 7.2% on R9700. `HIPFIRE_MTP_NGRAM_COPY=off` turns it off.
- **7900 XTX native MTP:** native multi-token prediction is on by default for Flash-Next models with host-mapped experts. The project reports 34.5 to 45.6 tokens per second on 32K-token code. Short prompts also prefill on a faster route, with time to first token at 1K rows going from about 8 to about 2 seconds.
- **20 GB cards:** automatic `max_seq` no longer promises a context the card cannot hold, and an explicit `max_seq` that cannot fit is refused at load.

## New model and tools

The release adds [KRAFTON's Raon-1-mini-preview](/posts/krafton-raon-1-mini-preview-open-weights/), a 28.8B mixture-of-experts model with 4.3B active parameters, via `hipfire pull raon-1-mini-preview`. The project reports 64 tokens per second decode on a 7900 XTX and 72 on an R9700, with about 195K tokens of context on 20 GB cards. Dense Qwen3.5, 3.6 and 3.8 GGUF files can load natively on gfx1201 behind `HIPFIRE_GGUF_NATIVE=1`. Long prompts now show live prefill progress, every load prints a one-line summary of what is on and why, and `hipfire config explain` lists every setting with where it came from.

## Why this matters

AMD's local-inference story has depended on small projects like this one, and since [0.4.3.1's R9700 prefill work](/posts/hipfire-0-4-3-1-r9700-a3b-prefill-decode/) hipfire is now tuning for specific workloads such as code edits on Strix Halo machines. Default changes are where upgrades surprise people, so if output speed or context size shifts after updating, the kill switches above put the old behaviour back. The figures are the maintainers' own, measured on their hardware.
