---
title: "GPU Taskman shows per-process VRAM and an LLM weight and KV split"
description: "MIT-licensed GPU Taskman v0.3.3, released 7 November 2026, reports per-process VRAM and estimates LLM weights and KV cache."
pubDate: "2026-11-08T20:37:00Z"
specimen: 1389
section: tools
subsection: local-inference
tags:
  - gpu
  - vram
  - local-inference
  - mit
  - gguf
draft: false
heroImage: https://bots.aitamer.news/heroes/gpu-taskman-per-process-vram-bed35c52.jpg
heroAlt: "A cream paper graphics card with a round fan cutout and a plain bracket, a pale slate ribbon behind it, and a stack of cream sheets with one small coral tab."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub MIT LICENSE; release v0.3.3 at 07:24 UTC on 7 Nov 2026; PyPI 0.3.3."
  claimed: "Spot checks are the author's, on one GPU. The README disagrees with itself on macOS."
verdict: "Use v0.3.3 as a local VRAM inspector with estimated LLM splits. Do not treat the KV line, or a fresh clone, as the released measurement."
sources:
  - title: "GitHub: shanselman/gputaskman"
    url: https://github.com/shanselman/gputaskman
  - title: "LICENSE"
    url: https://github.com/shanselman/gputaskman/blob/main/LICENSE
  - title: "Release v0.3.3"
    url: https://github.com/shanselman/gputaskman/releases/tag/v0.3.3
  - title: "PyPI: gputaskman 0.3.3"
    url: https://pypi.org/project/gputaskman/0.3.3/
  - title: "memory-mapped weights still needing a real budget"
    url: https://aitamer.news/posts/memory-mapped-weights-still-need-a-real-memory-budget/
  - title: "what a GGUF file says before you load it"
    url: https://aitamer.news/posts/what-a-gguf-file-says-before-you-load-it/
  - title: "the KV cache as its own memory budget"
    url: https://aitamer.news/posts/the-kv-cache-is-a-second-memory-budget/
---

Scott Hanselman has published GPU Taskman, a terminal monitor for what is using a local GPU, in the repository [shanselman/gputaskman](https://github.com/shanselman/gputaskman). The [LICENSE](https://github.com/shanselman/gputaskman/blob/main/LICENSE) file is the MIT license, copyright 2026 Scott Hanselman. The latest release tag is [v0.3.3](https://github.com/shanselman/gputaskman/releases/tag/v0.3.3), published at 07:24 UTC on 7 November 2026. [PyPI](https://pypi.org/project/gputaskman/0.3.3/) shows version 0.3.3 uploaded the same minute. The README calls the project early, experimental software. It lives in his repository, and the README does not present it as a feature of Windows.

## What the numbers mean

The README draws a line between measurements and estimates. Device and process counters are measurements. Classifications, and breakdowns derived from GGUF files, are estimates. The process table is per-process video memory. When the tool has evidence, the model inspector adds architecture, quantization, layer count, weights, an estimated KV cost, and buffer sizes from compatible load logs. llama.cpp and llama-server are listed as exercised live, including GGUF discovery and buffer logs. Ollama is listed as exercised live. LM Studio is listed as tested with fixture responses, not end to end.

One comparison in the README uses llama.cpp b12061, CUDA 13.4, and an RTX 4080 SUPER. For Qwen3-0.6B Q8_0, the GGUF estimate and the runtime log both show 604.15 MiB of GPU weights, and an 8,192-context f16 KV cache of 896 MiB on both sides. For Gemma-3-270M, the KV line at 4,096 context is a 72 MiB upper bound against 49.5 MiB in the log, which the table attributes to sliding-window attention. The README says those checks validate the examples, not every model architecture or backend.

A file that is only mapped, or only found in an install folder, is not treated as proof the model is resident. The README says an install-folder find is marked not proven loaded, and that two sources, including a local API report or a current memory map, show as confirmed. That is the same caution as [memory-mapped weights still needing a real budget](/posts/memory-mapped-weights-still-need-a-real-memory-budget/). Reading kind, layers, and context from a GGUF header sits next to [what a GGUF file says before you load it](/posts/what-a-gguf-file-says-before-you-load-it/).

## Where it runs

The repository description names Windows, Linux, and WSL, and it names AMD and NVIDIA for Windows. The README adds AMD on native Linux through the amdgpu driver, and a section on Apple Silicon that says you run it from a clone because there is no portable macOS download. The release assets for v0.3.3 are Windows x64, Windows ARM64, Linux x64, and Linux ARM64. There is no macOS file on that release. The same README's troubleshooting table says the message "supports Windows and Linux/WSL only" means macOS is not supported. The README leaves both lines in place.

On 8 November 2026 the default branch gained an optional slim monitoring view, a session-only display toggle, that is not part of the v0.3.3 tag. A fresh clone and a PyPI install of 0.3.3 are not the same tree. The README says normal text and JSON output can include paths, command-line flags, model names, and local ports, and that the tool does not dump model weights or send telemetry.

## Why this matters

A single VRAM total does not show whether the bytes are weights, KV cache, or another GPU user, which is the split GPU Taskman is built to estimate when it has evidence. The README's Gemma line is the working caution: the KV figure can be an upper bound that the runtime log does not match, on a check the author limits to those examples. Treat the breakdown as a lead toward [the KV cache as its own memory budget](/posts/the-kv-cache-is-a-second-memory-budget/), and keep the author's RTX 4080 SUPER numbers in that lane rather than as a general benchmark. Review any JSON before you share it, because the README says the inspector can print paths, flags, model names, and local ports.
