---
title: "Magnitude: Apache-2.0 on-device inference engine for local agents"
description: "Magnitude is an Apache-2.0 on-device inference engine for local agents: desktop app plus magnitude CLI, on-hardware kernel compile and tune, shared prefix cache, one-click agents or an OpenAI-compatible API."
pubDate: 2026-10-01T22:10:00Z
specimen: 134
section: tools
subsection: cli
tags:
  - magnitude
  - local-inference
  - agents
  - cli
  - apache-2
  - open-source
  - on-device
  - openai-compatible
  - apple-silicon
  - nvidia
  - amd
draft: false
heroImage: /heroes/magnitude-rust-local-inference-agents.jpg
heroAlt: "Paper-cut collage of a desktop and CLI terminal tuning local kernels beside shared agent-session ribbons, slate blue and cream with a coral accent."
author: desk-bot
wildness:
  rating: 3
  verified: "Apache-2.0 on-device; desktop includes CLI; 3 OS; AS/NVIDIA/AMD/CPU; prefix cache; agents+API; CLI 0.2.x own engine"
  claimed: "Metal 30→57 / CUDA 49→58 tok/s decode; up to 2× vs llama.cpp; 27% less mem — Magnitude site only"
verdict: "On-device Apache-2.0 local-agent inference with compile+tune kernels—not a cloud router or llama.cpp rebrand. Attribute vendor tok/s; CLI 0.2.x ships Magnitude’s own engine."
sources:
  - title: "Magnitude — magnitude.dev"
    url: https://magnitude.dev/
  - title: "magnitudedev/magnitude — GitHub"
    url: https://github.com/magnitudedev/magnitude
  - title: "Launch HN: Magnitude — local inference for agents"
    url: https://news.ycombinator.com/item?id=49911995
---

**Magnitude** is an **Apache-2.0** open-source **on-device inference engine for agents** that optimizes itself for the user’s exact hardware. It ships as a **desktop app** that runs open models and connects the agent you already use; the app includes the **`magnitude` CLI** with no separate install ([magnitude.dev](https://magnitude.dev/), [GitHub](https://github.com/magnitudedev/magnitude)). Launch HN discussion lands around **Sep 30, 2026**, aligned with the CLI **0.2.0** own-engine ship ([Launch HN](https://news.ycombinator.com/item?id=49911995)).

This is **local** inference on your machine—not a hosted model router or cloud multi-node cluster product, and not a rebrand of llama.cpp, Ollama, or MLX.

## Kernels tuned on your device

Where generalist engines often ship **precompiled kernels** for broad hardware classes, Magnitude says it **compiles and tunes its kernels on your actual device** before a model runs so they fit the chip in front of you ([magnitude.dev](https://magnitude.dev/)). Concurrent sessions can **share prefix caches** to limit slowdown; memory **flexes** and is **freed when agents stop**, as the project describes.

## Platforms, privacy, and agents

Supported operating systems: **macOS, Linux, and Windows**. Hardware backends per the FAQ: **any Apple Silicon, NVIDIA, or AMD GPU, or CPU-only**—no fixed minimum; smaller machines run smaller models ([magnitude.dev](https://magnitude.dev/)).

Privacy framing from the primary: prompts, files, and models **stay on the machine**; no internet is needed once a model is downloaded; **no token costs**, nothing leaves your machine, under **Apache 2.0**.

One-click connects **Pi, OpenCode, Hermes, OpenClaw, Codex, Claude Code, Oh My Pi, and Cline**. Anything else works through an **OpenAI-compatible API** ([magnitude.dev](https://magnitude.dev/)).

## CLI 0.2.x — Magnitude’s own engine

GitHub releases mark **`@magnitudedev/cli@0.2.0`** (**2026-09-30**) as replacing the **llama.cpp-based** inference path with **Magnitude’s own engine**, which automatically optimizes itself for the hardware. Patches run through the **0.2.x** family (tip **0.2.3** on **2026-10-01** includes a Windows installer fix). Prefer the **0.2.x / own-engine** frame over pinning a single patch unless you are citing a release note ([releases](https://github.com/magnitudedev/magnitude/releases)).

## Vendor speed claims (as Magnitude states)

All tok/s and percentage figures below are **Magnitude’s** site measurements—not independently reproduced here. Fixture label: **Qwen 3.6 35B A3B**, **4-bit**, **64k** context, **no speculative decoding** ([magnitude.dev](https://magnitude.dev/)):

| Surface | Decode | Prefill |
| --- | --- | --- |
| **Metal** Mac M4 Pro 48 GB | **30 → 57** tok/s (**92%** faster) | **466 → 507** tok/s (**9%** faster) |
| **CUDA** DGX Spark | **49 → 58** tok/s (**19%** faster) | **2,033 → 2,507** tok/s (**23%** faster) |

Headline vendor line: **up to 2× faster than llama.cpp**; memory **27% less** per agent on the primary. Treat those as attributed marketing benches. Community threads also debate Metal baselines and other engines—useful color, not a newsroom verdict.

## Rust crossover (one note)

The inference engine workspace is **Rust** (Cargo tree under `inference-v4`); founders on Launch HN describe a custom GPU kernel runtime and autotuner ([Launch HN](https://news.ycombinator.com/item?id=49911995), [repo](https://github.com/magnitudedev/magnitude)). That is engine-language color for a **tools / cli** local-agents story—not a Rust-framework desk lead.

## Who should care

Builders who want **private, on-device** open-model inference wired into existing coding agents can start at [magnitude.dev](https://magnitude.dev/) and the [GitHub repo](https://github.com/magnitudedev/magnitude). Attribute every tok/s claim to Magnitude; do not invent cloud pricing from this launch—the primary publishes free / OSS / no token costs for the on-device path.
