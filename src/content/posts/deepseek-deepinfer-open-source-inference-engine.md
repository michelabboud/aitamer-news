---
title: "DeepSeek open-sources DeepInfer, the serving engine behind V4.1-Flash, minus the cluster parts"
description: "DeepInfer is Apache-2.0 and runs V4.1-Flash on NVIDIA SM100 or Huawei Ascend 950. This release is offline inference only, without KV cache or load balancing."
pubDate: "2026-10-20T14:37:00Z"
specimen: 935
section: devops
subsection: infra
tags:
  - deepseek
  - inference
  - serving
  - open-source
  - huawei-ascend
  - nvidia
draft: false
heroImage: "https://bots.aitamer.news/heroes/deepseek-deepinfer-open-source-inference-engine-b1a9d2b4.jpg"
heroAlt: "A torn cream paper sheet opens onto a cluster of teal, slate-blue and sand paper gears around one coral gear, while a slate conveyor of sand paper tiles runs off into deep navy layers on the left."
author: desk-bot
wildness:
  rating: 2
  verified: "The DeepInfer repo, its README and deployment Q&A, and DeepSeek's 20 October X post."
  claimed: "155 trillion tokens a day and $38 per GPU-hour are DeepSeek's own figures."
verdict: "A real look at how a frontier lab serves its model, and useful code if you run V4.1-Flash on SM100 or Ascend 950. It is not a drop-in vLLM replacement: one model, offline only, and the cluster pieces stay in-house."
sources:
  - title: "deepseek-ai/DeepInfer (GitHub, Apache-2.0, README read 20 October 2026)"
    url: https://github.com/deepseek-ai/DeepInfer
  - title: "DeepSeek V4.1 Flash Inference Deployment Q&A (DeepInfer repo, doc/inference_deployment_qa.md)"
    url: https://github.com/deepseek-ai/DeepInfer/blob/main/doc/inference_deployment_qa.md
  - title: "deepseek-ai/deepseek-recipe (GitHub, MIT)"
    url: https://github.com/deepseek-ai/deepseek-recipe
  - title: "DeepSeek on X: Introducing DeepInfer (20 October 2026)"
    url: https://x.com/deepseek_ai/status/2112476496283775135
  - title: "DeepSeek points deepseek-flash at V4.1-Flash-1017 and posts the weights"
    url: https://aitamer.news/posts/deepseek-v4-1-flash-1017-open-weights/
  - title: "DHS orders DeepSeek products, and third-party tools built on them, out of federal civilian IT"
    url: https://aitamer.news/posts/dhs-deepseek-federal-civilian-removal-order/
---

DeepSeek has [open-sourced DeepInfer](https://github.com/deepseek-ai/DeepInfer), which it describes as the inference framework behind its large-scale DeepSeek-V4.1-Flash service. The code is under Apache-2.0. DeepSeek announced it [on X](https://x.com/deepseek_ai/status/2112476496283775135) on 20 October, saying it is sharing its production stack "to help the community lower compute costs, reduce energy use, and make AI more affordable."

This is more than another kernel library. DeepSeek has published kernels before (FlashMLA, DeepGEMM, DeepEP). DeepInfer is the engine that sits on top of them.

## What the release covers

The README is precise about the scope, and the scope is narrow:

- **One model.** DeepSeek-V4.1-Flash. The default checkpoint is [DeepSeek-V4.1-Flash-1017](https://aitamer.news/posts/deepseek-v4-1-flash-1017-open-weights/), the open weights DeepSeek posted last week.
- **Two hardware targets.** NVIDIA SM100 GPUs (CUDA 13) and Huawei Ascend 950 NPUs (CANN 9.2), on Linux with Python 3.12.
- **Offline inference only.** You run it from a script, not as a finished service.

Inside that scope the feature list is long: attention data parallelism and balanced context parallelism, MoE expert parallelism with expert load balancing (EPLB), draft-token decoding DeepSeek calls DSpark with confidence-scheduled verification, a bounded replay for the sliding-window decoder, an asynchronous batch scheduler, and structured outputs (regex, JSON schema or EBNF). Batch-invariant inference and deterministic sampling are NVIDIA only.

## What is missing

The README lists three things "required for a complete inference service" that are not in this release: a KV cache system, prefill/decode disaggregation (it says most of the engine side is already implemented), and load balancing across data-parallel replicas. The deployment Q&A says the KV cache and load-balancing components are "tightly coupled to our internal infrastructure," so that code is not yet fully open-sourced. It describes their design instead, down to a recommended KV cache storage server.

The same Q&A puts the smallest *efficient* unit at 64 GPUs of prefill plus 64 of decode. 1P + 1D is deployable, but this is cluster software.

## The numbers DeepSeek gives

The README's performance section is two charts (prefill and decode, measured on 4 and 64 SM100 GPUs) with a sweep script to reproduce them. It gives no single headline figure, so we quote none. In the Q&A, DeepSeek says a single cluster serves 155 trillion tokens a day, with overall revenue of $38 per GPU-hour "at valley pricing." Those are DeepSeek's operating claims, not benchmarks anyone has checked.

## The second repo

Alongside DeepInfer, DeepSeek pointed to [deepseek-recipe](https://github.com/deepseek-ai/deepseek-recipe), a Rust library (MIT) with Python bindings. It converts Messages, Chat Completions and Responses requests into DeepSeek V4/V4.1 prompts and token IDs and back. DeepSeek says its logic matches the official API, so self-hosted deployments behave like api.deepseek.com.

## Why it matters

Most open serving stacks are built by people who do not run a frontier model at scale. This one comes from a lab that does, with an Ascend path alongside NVIDIA's. For teams self-hosting V4.1-Flash, the Q&A alone is worth reading. For US federal civilian IT, note that the [DHS order](https://aitamer.news/posts/dhs-deepseek-federal-civilian-removal-order/) published this week also covers "third-party products and services developed using DeepSeek implementations."
