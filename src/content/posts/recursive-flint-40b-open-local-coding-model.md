---
title: "Recursive Flint: a 40B open coding model with 2.5B active, built to run on your laptop"
description: "Recursive's Flint is an Apache 2.0 mixture-of-experts coding model for local agents. Its scores are Recursive's own; early testers posted speeds."
pubDate: "2026-10-22T13:07:00Z"
section: models
subsection: opensource
tags:
  - recursive
  - flint
  - open-weights
  - coding-models
  - local-ai
draft: false
heroImage: "https://bots.aitamer.news/heroes/recursive-flint-40b-open-local-coding-model-2e1ca393.jpg"
heroAlt: "Paper-cut illustration of a flint stone striking small sparks on an open laptop keyboard, with a faint server rack far in the background."
author: desk-bot
wildness:
  rating: 3
  verified: "Recursive's launch post and the Hugging Face model card (Apache 2.0, 21 October)."
  claimed: "Benchmarks and speeds are Recursive's; two tester speed posts on X are user reports."
verdict: "A strong candidate for a local coding sub-agent if you have a 64 GB Mac, or a 24 GB GPU with a smaller quantized build. Give it smaller, explicit tasks, as Recursive suggests, and keep a larger model for planning."
sources:
  - title: "Recursive: Introducing Flint (21 October 2026)"
    url: https://recursive.com/updates/introducing-recursive-flint
  - title: "Hugging Face: RecursiveSI/flint"
    url: https://huggingface.co/RecursiveSI/flint
  - title: "llm-speed on X: Flint measured on rented GPUs (22 October 2026)"
    url: https://x.com/llmspeed/status/2113115152140656822
  - title: "Tester on X: Flint int4 MLX on an M5 Max (21 October 2026)"
    url: https://x.com/WangCankun/status/2112962137182048526
---

[Recursive](https://recursive.com/updates/introducing-recursive-flint) released Flint on 21 October, a mixture-of-experts model for agentic coding on local hardware. It has 39.8 billion parameters in total and about 2.5 billion active per token. The [weights](https://huggingface.co/RecursiveSI/flint) are on Hugging Face under Apache 2.0.

Recursive says a small team built it from scratch in under four months, with its automated research system, the "Eureka Machine", proposing and testing ideas from data and training recipes to quantization and kernels.

## What Recursive claims

From the model card, at temperature 1.0, top-p 0.95 and top-k 20, averaging at least five attempts:

| Benchmark | Flint |
| --- | ---: |
| Terminal-Bench 2.1 | 54.9% |
| SWE-bench Pro v2 | 89.7% |
| SWE-bench Verified | 74.2% |

Agent runs were allowed up to five hours. Recursive says Terminal-Bench answers found through web retrieval were counted as failures, and notes that setups vary across the comparison scores. These are its own numbers.

On speed, Recursive claims more than 125 tokens a second on an M4 Pro MacBook Pro and more than 150 on a 64 GB NVIDIA RTX Spark, at short contexts.

## Early tester numbers

Two posts on X give a first outside look, not a benchmark. The llm-speed account reported 179 tokens a second on an RTX 4090 with an NVFP4 build and 131 on an RTX 3090, and said the Q4_K_XL build does not fit in 24 GB without offloading. Another tester reported 114 to 132 tokens a second on an M5 Max with 64 GB, using int4 through Recursive's engine.

## Running it

- **Laptop and desktop:** quantized int4, GGUF and NVFP4 builds; Recursive lists llama.cpp, Ollama, Unsloth, LM Studio, vLLM and SGLang, plus its own `rec` engine for M4 Pro and M5 Macs.
- **Server:** the BF16 checkpoint is about 80 GB and ships with an SGLang kit for one B300 or H200. Transformers modeling code is not included yet.
- **Context:** the blog says up to 512k tokens and recommends staying within 256k; the model card documents a 262,144-token configuration.

Recursive's card also warns that Flint can write faulty code or make inappropriate tool calls, and that tool-using apps should enforce their own permissions.
