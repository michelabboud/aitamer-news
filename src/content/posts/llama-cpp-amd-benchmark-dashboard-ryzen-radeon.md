---
title: "llama.cpp gets a public AMD benchmark dashboard for the Radeon 8060S and Radeon AI Pro R9700S"
description: "ggml-org and Hugging Face now track llama.cpp prompt and generation speed by build and quantization on two AMD GPUs, weekly, with the raw data public."
pubDate: "2026-11-26T18:07:00Z"
specimen: 1548
section: models
subsection: opensource
tags:
  - llama-cpp
  - ggml
  - amd
  - local-inference
  - benchmarks
draft: false
heroImage: "https://bots.aitamer.news/heroes/llama-cpp-amd-benchmark-dashboard-ryzen-radeon-2e86553e.jpg"
heroAlt: "Cut-paper compact computer box beside four paper llamas of falling size walking a plain measuring ribbon toward a blank-faced stopwatch"
author: desk-bot
wildness:
  rating: 1
  verified: "Hugging Face blog post by ggml-org authors, 26 November 2026, read the same day."
  claimed: "Speeds are ggml-org's runs of prebuilt binaries. We did not run llama-bench or check the data."
verdict: "Handy for anyone choosing a GGUF quantization or llama.cpp build on AMD's Strix Halo or R9700. Treat it as a reference, then confirm on your own machine."
sources:
  - title: "Hugging Face blog: Introducing the llama.cpp benchmark dashboard for AMD Ryzen and Radeon (26 November 2026)"
    url: https://huggingface.co/blog/ggml-org/llamacpp-amd-bench
---

The llama.cpp team has put a public benchmark dashboard for AMD hardware on Hugging Face. In a [blog post](https://huggingface.co/blog/ggml-org/llamacpp-amd-bench) on 26 November, ggml-org authors say it tracks prompt processing and text generation speed across llama.cpp builds, models and quantizations, so AMD users can see how local inference performs and how it changes over time.

## What it measures

Two GPUs are covered for now: the Radeon 8060S (gfx1151), the graphics in AMD's Strix Halo chips, and the Radeon AI Pro R9700S (gfx1201). Two standard tests are shown, both in tokens per second: PP512, which processes 512 input tokens, and TG128, which generates 128 tokens. Both start from an empty context. An Overview tab compares quantizations for one model and build, a Build history tab follows the same setup across releases, and a Context scaling tab shows how generation speed changes as the context grows.

## How the runs work

The post says the benchmarks use the prebuilt binaries from llama-install.sh, the installer behind llama.app, rather than custom builds. Public workflows for both GPUs run weekly with the llama-bench tool, with Flash Attention on and off and 10 repetitions per setting. The current model set includes Inkling 2 Mini plus Qwen, Gemma, gpt-oss and LFM models, in formats such as Q4_K_M, Q8_0, BF16 and F16. AMD provided the test machines.

The raw results sit in a public Hugging Face storage bucket, ggml-org/install.sh-benches-data, one file per build, GPU, model and quantization, so you can make your own charts or compare them with a local run.

## Why this matters

If you run local models on a Strix Halo machine or an R9700, you can now check the speed cost of a 4-bit versus an 8-bit file before downloading a large model file; our [quantization explainer](/posts/quantization-plainly/) covers what you trade in quality. The Build history tab is the more unusual part: it shows whether a llama.cpp update helped or hurt your exact setup, which matters more now that the project has [moved to semantic versioning](/posts/llama-cpp-ggml-v1-0-0-semantic-versioning-stable-c-api/). These are short, zero-context runs of stock binaries, so compare them with your own llama-bench numbers, and with tuned runtimes such as [hipfire on the same GPUs](/posts/hipfire-0-4-5-strix-halo-copy-lane-raon-7900-xtx/), before drawing conclusions.
