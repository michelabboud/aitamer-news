---
title: "NVIDIA's Flare prepares models in PyTorch and serves them from a Rust runtime"
description: "NVIDIA's Flare, now Hyperflare, is an Apache-2.0 local inference server for SM120/SM121 GPUs. Python prepares each model; a Rust runtime serves it."
pubDate: "2026-10-22T12:07:00Z"
specimen: 981
updatedDate: "2026-11-12T07:18:00Z"
section: rust
subsection: ai
tags:
  - nvidia
  - inference
  - local-ai
  - coding-agents
  - rust
draft: false
heroImage: "https://bots.aitamer.news/heroes/nvidia-flare-local-inference-rust-runtime-ab18d92f.jpg"
heroAlt: "Paper-cut illustration of a rust-red candle with a layered yellow paper flame on a slate-grey box, a rust-red gear leaning against its side on blue-grey paper."
author: desk-bot
wildness:
  rating: 2
  verified: "The repo README, docs/model-preparation.md and GitHub metadata (created 20 October, Apache-2.0)."
  claimed: "No benchmarks were checked. NVIDIA has published no launch post for Flare that we found."
verdict: "Still a narrow research prototype: if you have an SM120 or SM121 box and run one of its recipes, try it against vLLM on your own workload, as its README says."
sources:
  - title: "NVIDIA/flare-local-inference (GitHub)"
    url: https://github.com/NVIDIA/flare-local-inference
  - title: "Flare README"
    url: https://github.com/NVIDIA/flare-local-inference/blob/main/README.md
  - title: "Flare docs: Model preparation and serving"
    url: https://github.com/NVIDIA/flare-local-inference/blob/main/docs/model-preparation.md
  - title: "AI Tamer: Magnitude, an Apache-2.0 on-device inference engine for local agents"
    url: https://aitamer.news/posts/magnitude-rust-local-inference-agents/
  - title: "Hyperflare v0.1.0 release (11 November 2026)"
    url: https://github.com/NVIDIA/hyperflare-inference/releases/tag/v0.1.0
  - title: "Hyperflare README"
    url: https://github.com/NVIDIA/hyperflare-inference
---

NVIDIA has a new public repository, [flare-local-inference](https://github.com/NVIDIA/flare-local-inference), created on 20 October under Apache-2.0. Its [README](https://github.com/NVIDIA/flare-local-inference/blob/main/README.md) describes Flare as "a local inference server for NVIDIA SM120/SM121 GPUs, built for long conversations, coding agents, and repeated tool use," aimed at workstations and compact systems "such as DGX Spark." We found no NVIDIA announcement; the repository is the source.

## Python to prepare, Rust to serve

The design splits the work in two. A preparation tool called Ignition uses PyTorch, Transformers and FlashInfer/b12x to load a model, tune kernels, compile forwards and capture CUDA graphs into a runtime package. Helios, which the README calls "the Rust runtime, serves that package without Python." All compilation and graph capture finish before serving starts.

The [model preparation guide](https://github.com/NVIDIA/flare-local-inference/blob/main/docs/model-preparation.md) adds detail:

- A runtime package is a signed bundle of content-addressed blobs: weights, graphs, kernels and frontend assets. The final format uses a signed envelope with encrypted cubins and graph records, and unsigned staging packages cannot load in Helios.
- Every recipe defaults to FP8 E4M3 KV-cache storage. The guide names Qwen, GLM and DeepSeek recipes, each keeping some model-specific formats.
- Each tensor-parallel size needs its own package. The guide says Qwen at TP1 and TP2 and GLM at TP4 have been run end to end, and Qwen at TP4 still needs validation.
- Conversation state, including recurrent state alongside KV caches, is treated as one unit so reuse, branching and resuming keep it intact. That is the part aimed at agents that come back to the same long context.

## What it does not claim

The README is unusually plain about limits. "vLLM covers a much broader range of models, hardware, and deployment patterns. Flare trades that breadth for a focused serving contract around selected models and local workloads." It adds that Rust gives the runtime explicit resource ownership, but "performance still depends on the GPU work, memory traffic, and scheduling," and tells readers to "compare the engines on your actual model and workload."

Two cautions. The hardware scope is SM120 and SM121 only. And GitHub lists Python as the repository's main language: the Rust is the serving runtime, not the whole project. For another take on local agent inference, see [Magnitude](/posts/magnitude-rust-local-inference-agents/).

## Update, 12 November 2026: Flare is now Hyperflare, with a first v0.1.0 release

NVIDIA's repository is now [NVIDIA/hyperflare-inference](https://github.com/NVIDIA/hyperflare-inference), and the project calls itself Hyperflare; the old `flare-local-inference` address redirects there. We found no announcement of the rename, so we only report that the project is now published under that name.

Its first tagged release, [v0.1.0](https://github.com/NVIDIA/hyperflare-inference/releases/tag/v0.1.0), was published at 19:31 UTC on 11 November. The notes list more than 80 merged pull requests and ten first-time contributors (GitHub logins; we did not check who employs them). Highlights from the notes:

- **Prefix caching across machines.** Disk prefix caching across hosts, a prefix KV cache shared between instances and hosts through a pool manager, and the host cache tiers moved into a separate crate, `selene`, that does not need CUDA.
- **Multi-host serving.** Preparing and serving over hosts cabled as a chain, and prefix cache pools for multi-host tensor parallelism with opt-in RoCE on x86_64.
- **More model recipes.** A Gemma 4 text recipe with multi-token prediction, DeepSeek V4.1 work including numeric reasoning effort and an opt-in MXFP8 draft head, NVFP4 draft heads for Qwen3.8 tensor parallelism, and Kimi K3.1 changes.
- **Windows.** Preparing, exporting and serving packages on Windows on RTX Spark N1X.
- **Usage reporting.** Reasoning token counts in Responses and Chat usage, and a hard reasoning-token budget.

The README framing has not softened. It calls Hyperflare "a research prototype" and says it "is not, and will never be, a replacement for production inference engines like vLLM."
