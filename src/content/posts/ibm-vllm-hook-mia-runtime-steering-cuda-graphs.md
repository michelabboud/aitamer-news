---
title: "IBM's vLLM-Hook MIA lets you read and steer model internals in vLLM without giving up CUDA graphs"
description: "IBM Research's vLLM-Hook MIA plugin captures attention and activations, and steers them, inside vLLM 0.29 with CUDA graphs left on. Overhead is a few percent."
pubDate: "2026-10-23T11:37:00Z"
section: devops
subsection: inference
tags:
  - ibm
  - vllm
  - interpretability
  - ai-safety
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/ibm-vllm-hook-mia-runtime-steering-cuda-graphs-9c09f2c1.jpg"
heroAlt: "Paper collage of a film strip looping through a paper projector, with a small coral hook clipped to one frame and a magnifying lens showing a web of nodes above it."
author: desk-bot
wildness:
  rating: 2
  verified: "IBM Research blog (21 October), the IBM/vLLM-Hook README and its performance table were read."
  claimed: "The 20x and 14x speedups and the 2% to 6% overheads are IBM's own measurements."
verdict: "Interesting if you run guardrails or steering experiments on vLLM and have been stuck in eager mode. It needs vLLM's V2 model runner, so check your stack first."
sources:
  - title: "Toward fast AI interpretability and control (IBM Research blog, 21 October 2026)"
    url: https://research.ibm.com/blog/fast-interpretability-plugin-vllm
  - title: "IBM/vLLM-Hook (GitHub)"
    url: https://github.com/IBM/vLLM-Hook
  - title: "MIA: Runtime-Reconfigurable Access to Model Internals in LLM Inference Engines (technical report)"
    url: https://github.com/IBM/vLLM-Hook/blob/main/docs/MIA_Arxiv_.pdf
---

IBM Research has [written up](https://research.ibm.com/blog/fast-interpretability-plugin-vllm) vLLM-Hook MIA, the latest version of its plugin library for looking inside, and changing, a model while vLLM serves it. The idea is to make runtime checks practical in production: declining a malicious prompt, flagging likely hallucinated facts, or nudging a response, without the usual slowdown.

## The problem it solves

vLLM gets much of its speed from graph capture and replay, typically with NVIDIA CUDA Graphs: repeated steps such as the decode forward pass are recorded once and replayed with one command. Many interpretability tools need to run Python code inside each model layer, which in vLLM has meant switching to slower "eager" mode.

MIA moves the work in front of the graph. IBM says GPU operators capture and steer model internals before the graph is recorded. A "scheduler" turns the developer's choices into routing entries at fixed GPU memory addresses that the replayed graph acts on, and a "courier" copies captured data to CPU memory to return with the output.

## What you can do with it

The [README](https://github.com/IBM/vLLM-Hook) lists inspecting attention patterns, attention heads and activations, plus custom interventions such as activation steering. Example applications are safety guardrails, reranking and better instruction following. It runs two ways: `MiaLLM` builds the engine in your own Python process for scripts and batch jobs, or MIA runs inside `vllm serve` with a `MiaClient`. It targets vLLM 0.29 and requires the V2 model runner.

## The numbers, as IBM reports them

The blog says MIA was up to 20 times faster than the first vLLM-Hook and up to 14 times faster than a comparable method that inserts code into the model. Steering small models (an 8B Llama and Qwen 1.5B) added as little as 2% in some cases, and about 6% on Llama 70B. The README's own table, measured on vLLM 0.29.0 against plain vLLM, shows per-token overheads of about 5% to 8% for hidden-state and Q/K capture and about 4% to 6% for steering, at 1 to 16 requests per second.

IBM compares MIA with the UK government's vLLM-Lens, which also uses Python hooks, and with EasySteer, which forks vLLM. These are IBM's measurements in its own technical report, not an independent benchmark.

## Why it matters

Runtime guardrails that read a model's internal state, such as IBM's attention-based prompt-injection tracker, have mostly lived in research code. If the overhead really is a few percent, they become something you can leave on in a serving stack.
