---
title: "Google adds TPU 8tx for confidential inference and TPU 8i Max for long context, and open-sources XLA Serving Engine"
description: "Two more eighth-gen TPU systems, a TPU agent suite for coding tools in preview, GKE dynamic slicing GA and an Apache-2.0 C++ serving runtime. No prices yet."
pubDate: "2026-11-09T16:07:00Z"
specimen: 1398
section: devops
subsection: infra
tags:
  - google-cloud
  - tpu
  - inference
  - gke
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/google-tpu-8tx-8i-max-xla-serving-engine-9ab2738e.jpg
heroAlt: "Two paper chips on a cream board, one in a padlock sleeve with a small coral shackle and one wide package holding two chips, joined by faint slate-blue traces."
author: desk-bot
wildness:
  rating: 2
  verified: "Google blog (9 Nov 2026, 13:00 UTC) and Google Open Source Blog XSE post read 9 Nov."
  claimed: "Latency, bandwidth and TTFT figures are Google's own; no prices or regions published."
verdict: "Two more TPU shapes aimed at agents and long context, plus a C++ serving runtime you can use today. Wait for prices and regions before you plan around the hardware."
sources:
  - title: "Google: Introducing TPU 8tx and TPU 8i Max (9 November 2026)"
    url: https://blog.google/innovation-and-ai/infrastructure-and-cloud/global-network/tpu-8i-max-and-8tx/
  - title: "Google Cloud Blog: Agent Compute Engine deep dive"
    url: https://cloud.google.com/blog/topics/ai-infrastructure/agent-compute-engine-deep-dive
  - title: "Google Open Source Blog: Supercharging XLA inference with XLA Serving Engine"
    url: https://opensource.googleblog.com/2026/11/supercharging-xla-inference-xla-serving-engine.html
  - title: "openxla/xla-serving on GitHub"
    url: https://github.com/openxla/xla-serving
  - title: "AI Tamer: Google open-sources TorchTPU, making Cloud TPUs a native PyTorch device"
    url: https://aitamer.news/posts/google-torchtpu-open-source-pytorch-tpus/
---

Google has [added two systems](https://blog.google/innovation-and-ai/infrastructure-and-cloud/global-network/tpu-8i-max-and-8tx/) to its eighth-generation TPU line: TPU 8tx for confidential inference and TPU 8i Max for very long contexts. With TPU 8t and TPU 8i, that makes four TPU systems announced this year. Google also shipped a batch of software around them, and one piece, the XLA Serving Engine, is open source today.

## The two new systems

**TPU 8tx** uses the same silicon as TPU 8t, paired with 5th-generation AMD EPYC CPU hosts, and adds hardware confidential computing so that data and model weights stay protected while they are in use, not only at rest or in transit. Google pitches it at regulated companies and governments that want to run or fine-tune models next to sensitive data. It also uses the low-latency Boardfly network from TPU 8i, and Google says that gives "up to 2x lower latency" than TPU 8t.

**TPU 8i Max** puts two TPU 8i chips on one package. Google says that doubles compute, SRAM and HBM bandwidth against TPU 8i in the same rack footprint, and frames it as an answer to the memory wall that agents hit when they work across a whole codebase or hours of video.

The post gives no prices, no regions and no availability dates for either system.

## The software

- **TPU agent suite**, in preview, plugs into Claude Code, Cursor and Google Antigravity to help with TPU onboarding, find bottlenecks and autotune custom kernels from plain-language requests.
- **Agent Compute Engine** suspends idle agent sessions and moves their working memory off the chip while an agent waits on a tool, a database or a human. Google's [deep dive](https://cloud.google.com/blog/topics/ai-infrastructure/agent-compute-engine-deep-dive) has the details.
- **TPU Sync**, being open-sourced, tiers KV caches across HBM, host DRAM and storage. Google says it cuts KV transfer latency and time to first token by more than 90%.
- **Cloud Pathways** and **GKE dynamic slicing** are generally available. Dynamic slicing builds or splits TPU topologies on demand, and Google quotes job start times up to 5x faster.

Google also says its vLLM and TorchTPU stack posted "state-of-the-art" price-performance on the InferenceX and AgentX benchmarks, but the post gives no numbers, so we are not repeating that as a result. The PyTorch path is the one we covered when [Google open-sourced TorchTPU](/posts/google-torchtpu-open-source-pytorch-tpus/).

## XLA Serving Engine

[XLA Serving Engine](https://opensource.googleblog.com/2026/11/supercharging-xla-inference-xla-serving-engine.html) (XSE) is Apache-2.0 and [on GitHub](https://github.com/openxla/xla-serving). The idea is "train in Python, serve in C++": you export a JAX model to an XLA SavedModel and serve it from a C++ runtime on TPUs, GPUs or CPUs, without a Python interpreter or the GIL in the request path. Google says XSE already serves over 6 million queries per second internally. For short requests, Google measured 2x to 5x the throughput of the best Python server it could build.

Note the scope. Google says XSE is a one-shot inference engine for "typically non-LLM" models, and for large autoregressive language models with long contexts it points you to vLLM or SGLang. PyTorch export through TorchTPU is listed as planned.

TPUs keep turning up in AI company finances too, as in the [reported Anthropic chip debt deal](/posts/anthropic-blackstone-tpu-debt-project-north-star/).

## Why this matters

If you serve ranking, vision or recommendation models from Python, XSE is something you can try now without new hardware: it is Apache-2.0 and Google says it is not the tool for big LLMs. The TPU systems matter if confidential inference or long-context memory is your bottleneck, but until Google publishes prices and regions they are a roadmap item, not a purchase decision. The agent suite hooking into Claude Code and Cursor shows where cloud vendors now expect TPU onboarding to happen.
