---
title: "Olmo-core 3: Ai2 open MoE training stack (not a chat-model GA)"
description: "Ai2 released Olmo-core 3 on Oct 1, 2026: an open MoE training stack (DDP experts, MXFP8, trillion-scale benches) under Apache-2.0. Training infra only—not a new public Olmo chat model."
pubDate: 2026-10-01T20:00:00Z
specimen: 124
section: models
subsection: opensource
tags:
  - ai2
  - olmo-core
  - olmo-core-3
  - moe
  - training
  - opensource
  - apache-2
  - huggingface
  - mxfp8
  - nvidia-b300
draft: false
heroImage: /heroes/ai2-olmo-core-3.jpg
heroAlt: "Paper-cut collage of layered expert blocks routing token ribbons across a GPU cluster shelf, coral accent on one active path."
author: desk-bot
wildness:
  rating: 4
  verified: "Olmo-core 3 released Oct 1 2026; open MoE training stack; Apache-2.0 on allenai/OLMo-core; not chat-model GA"
  claimed: "~2.7× tps, MXFP8 ~21%, 858 TFLOP/s/GPU, 1.2T/2.38T benches = Ai2 preliminary/vendor only"
verdict: "Open MoE training infra ship—attribute Ai2 throughput/TFLOP benches; Apache-2.0 code; not a public Olmo chat GA."
sources:
  - title: "Introducing Olmo-core 3 — Ai2 / Hugging Face Blog"
    url: https://huggingface.co/blog/allenai/olmocore3
  - title: "allenai/OLMo-core — GitHub"
    url: https://github.com/allenai/OLMo-core
---

Ai2 released **Olmo-core 3** on **2026-10-01**: a significant upgrade to its framework for developing large language models, featuring a redesigned **open mixture-of-experts (MoE) training system** aimed at scaling MoE training into the trillion-parameter range ([HF blog](https://huggingface.co/blog/allenai/olmocore3)).

This is **training infrastructure**, not a new public Olmo chat or instruct model. Ai2 frames Olmo-core 3 as the foundation for a next-generation MoE Olmo it aims to make its most capable yet—with **no ship date or public weights announced** in this post ([HF blog](https://huggingface.co/blog/allenai/olmocore3)).

## What changed in the stack

Earlier Olmo-core MoE training used **FSDP** (gather and reshard weights per small batch). Olmo-core 3 switches to a **DDP**-based path that keeps experts **resident on GPUs** and routes data to them ([HF blog](https://huggingface.co/blog/allenai/olmocore3)).

Ai2 also describes expert parallelism, pipeline parallelism, a distributed optimizer, rowwise expert parallelism, GPU-resident routing, grouped GEMM, and **MXFP8** support—as systems features of the open stack ([HF blog](https://huggingface.co/blog/allenai/olmocore3)).

## Throughput and scale (Ai2 benches)

All figures below are **Ai2-stated vendor benches** on stated NVIDIA B300 configs—not independent newsroom measurements ([HF blog](https://huggingface.co/blog/allenai/olmocore3)):

| Claim | As Ai2 states |
| --- | --- |
| Prior MoE path vs new stack | Preliminary test, **47B** MoE on **8× B300**: **52,000** vs **19,400** tok/s/GPU ≈ **~2.7×** |
| MXFP8 vs BF16 | Controlled bench on **4× B300**: throughput ~**21%** higher; peak active memory **103 → 95 GiB** |
| Trillion-scale demo | **1.2T** total params, **58.36B** active/token, **512** GPUs; peak **858 TFLOP/s/GPU**; **random routing** to measure system performance, not trained-model quality |
| DeepEP v2 experiment | Configuration with **2.38T** total params—a **short-capacity test**, not a full training run |

## License and where to get it

Code on GitHub [`allenai/OLMo-core`](https://github.com/allenai/OLMo-core) is **Apache-2.0**. This brief covers the open training stack with attribution; it does not redistribute code or grant licenses. Ai2 also links a technical report and interactive walkthrough from the blog—deep-link those rather than rehosting figures ([HF blog](https://huggingface.co/blog/allenai/olmocore3), [GitHub](https://github.com/allenai/OLMo-core)).

## Who should care

Labs and researchers who want an **open MoE training stack** with Ai2’s DDP expert-resident redesign should start at the [Olmo-core 3 post](https://huggingface.co/blog/allenai/olmocore3) and [GitHub repo](https://github.com/allenai/OLMo-core)—and treat every TFLOP/throughput number as Ai2’s preliminary or controlled bench, not a chat-model launch.
