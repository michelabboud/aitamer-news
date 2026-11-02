---
title: "SenseTime SenseNova-Loop-9B-Preview: open weights that run 24 layers twice"
description: "A 9B multimodal model that stores 32 layers but executes 56, under Apache 2.0. Transformers only for now, with trust_remote_code. What the card says."
pubDate: "2026-11-02T14:07:00Z"
section: models
tags:
  - sensetime
  - open-weights
  - multimodal
  - looped-transformer
  - hugging-face
  - apache-2-0
  - local-llm
draft: false
heroImage: https://bots.aitamer.news/heroes/sensetime-sensenova-loop-9b-preview-looped-open-weights-64ea05af.jpg
heroAlt: "A cream paper ribbon looping through a stack of torn paper layers, held by a coral band, with a rolled blue paper spool behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Hugging Face model card and repo metadata, read 31 Oct 2026 (card dated 30 Oct)."
  claimed: "Benchmark results are an image on the card; no tech report yet. Speed and VRAM are not stated."
verdict: "An interesting architecture to try, not yet a local daily driver: custom code, no official GGUF or llama.cpp path, report TBD."
sources:
  - title: "Hugging Face: sensenova/SenseNova-Loop-9B-Preview"
    url: https://huggingface.co/sensenova/SenseNova-Loop-9B-Preview
  - title: "GitHub: OpenSenseNova/SenseNova-Loop"
    url: https://github.com/OpenSenseNova/SenseNova-Loop
---

SenseTime has released [SenseNova-Loop-9B-Preview](https://huggingface.co/sensenova/SenseNova-Loop-9B-Preview), an open-weight multimodal model under Apache 2.0. The model card's news line dates the release 30 October 2026. It takes text and images and returns text, and SenseTime pitches it at long documents, coding and tool use.

## The loop

The idea is to reuse layers instead of adding them. Per the card:

- The model has **32 distinct decoder layers**. Layers 0 to 3 run once, the block of layers 4 to 27 runs **twice with the same weights**, then layers 28 to 31 finish. That is **56 layer executions per forward pass** from 32 sets of weights.
- About **9B parameters are stored**, but the card lists about **14.6B "inference parameters"**, so the compute per token is closer to a 14.6B model than a 9B one.
- Inside the loop, two residual streams are mixed by learned maps (manifold-constrained hyper-connections, or mHC).
- Attention repeats a four-layer pattern of three linear-attention layers and one full-attention layer.
- Training used sequences up to 262,144 tokens. The weights are exported in BF16, with the mHC routing parameters in FP32.

Multi-token prediction (MTP) is available for faster inference; two other acceleration methods, DSpark and DFlash2, are still in training.

## Running it

The card's checked setup is Transformers 5.18.0 with PyTorch 2.11.0 and CUDA 13.0, loading the model with `trust_remote_code=True` because the looped architecture is custom code. The card lists the Transformers implementation's publication details and the technical report as "to be announced". It names no official GGUF, llama.cpp or vLLM path; community GGUF uploads exist but are not SenseTime's. Fine-tuning scripts use an OpenSenseNova fork of torchtitan on an 8-GPU node.

The benchmark chart on the card compares the model on BIRD-Dev, Terminal Bench 2.1 and several agent and office-task suites. Those are vendor results in an image, with no report behind them yet.

## Where it fits

Looping is having a moment in small models. NVIDIA's [Dory 1.0 4B](/posts/nvidia-nemotron-labs-dory-4b-looped-model/) is also a looped model, and it shipped in GGUF from day one. [DiffuSpace's Clover](/posts/diffuspace-clover-35b-a3b-diffusion-llm-open-weights/) is a reminder of how new architectures usually land: custom code first, llama.cpp and SGLang support later.

## Why this matters

Looping trades memory for compute: you store the weights of 9B parameters but pay for roughly 14.6B per token, which favours setups where memory, not compute, is the limit. For now the model needs `trust_remote_code` and Transformers, so read the code you are loading, and wait for an official runtime path or the technical report before planning around SenseTime's benchmark chart.
