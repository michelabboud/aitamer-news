---
title: "gpu-unlock: a Linux kernel module that doubles RTX 3090 and 4090 tensor rates, but only prefill feels it"
description: "Open Linux modules lift GeForce FP16 and BF16 tensor issue rates toward 2x on RTX 30 and 40 cards. Owners report 14 to 36% faster LLM prefill, not decode."
pubDate: "2026-10-25T12:37:00Z"
section: devops
subsection: infra
tags:
  - nvidia
  - gpu
  - linux
  - kernel
  - local-inference
  - hardware
draft: false
heroImage: "https://bots.aitamer.news/heroes/gpu-unlock-rtx-30-40-tensor-throughput-llm-prefill-5e5941b4.jpg"
heroAlt: "Cut-paper illustration of a slate-blue graphics card with two fans, a small yellow key turned in its edge and a wide fan of sand and rust paper strips opening outward toward a coral spark."
author: desk-bot
wildness:
  rating: 3
  verified: "READMEs, releases and issue reports of the three repositories, read 25 October."
  claimed: "Every benchmark is a project or owner run on single cards; we have not reproduced any."
verdict: "Worth a look if your local LLM work is prefill heavy and the card is yours to risk. It changes nothing for token generation speed, and Nvidia does not support it."
sources:
  - title: "Zagitta/gpu-unlock, README and v1.0.0 (GitHub)"
    url: https://github.com/Zagitta/gpu-unlock
  - title: "Zagitta/gpu-unlock issue #15, RTX 3080 20 GB vLLM before and after (GitHub)"
    url: https://github.com/Zagitta/gpu-unlock/issues/15
  - title: "JustAResearcher/gpu-unlock-ada, README and v1.1.1 (GitHub)"
    url: https://github.com/JustAResearcher/gpu-unlock-ada
  - title: "nlzy/turing-unlock, README (GitHub)"
    url: https://github.com/nlzy/turing-unlock
---

GeForce cards run their tensor cores slower than the silicon allows when the math is FP16 or BF16 with FP32 accumulation, the mode most training and inference code uses. A Linux kernel module called [gpu-unlock](https://github.com/Zagitta/gpu-unlock), created on 18 October and already past 4,000 GitHub stars, lifts that limit on RTX 30 series cards. Since then, forks have brought the same trick to the RTX 4090 and to the Turing-era RTX 2080 Ti.

## What it does

The module loads before the stock Nvidia driver. It runs the unlock, writes two speed selector registers, resets the card with a PCIe Function Level Reset, and then hands it to the unmodified driver. The README says this "doubles the instruction issuing speed of FP/BF16 FMA into FP32 operations" on GA102, GA103, GA104 and GA106 chips, and that the early-boot design means no repatching for each new driver release. It is off until you add `gpu_unlock.targets=all` (or a list of PCI addresses) to the kernel command line.

The headline run is an RTX 3090 Ti at 450 W, dense 8192 cubed GEMM:

| Input, FP32 accumulate | Before | After |
| --- | --- | --- |
| FP16 | 87.46 TFLOPS | 118.39 TFLOPS |
| BF16 | 87.50 TFLOPS | 157.41 TFLOPS |
| TF32 | 42.58 TFLOPS | 82.61 TFLOPS |

The project's table of owner reports lists the RTX 3060 12 GB, 3070, 3080, 3090 and 3090 Ti as unlocked, with BF16 GEMM gains from +25% to about +80%. The low end is from cards capped at 225 W, so power limits matter. One OEM RTX 3080 Ti 20 GB completes the unlock but stays at half rate.

## The 40 series and Turing forks

[gpu-unlock-ada](https://github.com/JustAResearcher/gpu-unlock-ada) (GPL-2.0, v1.1.1) ports the module to the RTX 4090 using a published AD102 payload. Its own run shows FP16 at 165.6 to 331.6 TF/s, and an independent owner run measured 160.4 to 320.4 TF/s. Those are instruction issue rates. On real cuBLAS GEMMs, the same owner saw FP16 gain 12 to 34% depending on shape, and BF16 between nothing and 20%. The RTX 4070 Ti SUPER and 4060 Ti 16GB are experimental targets, each validated on one card, and one FP8 GEMM on the 4070 Ti SUPER moved only 0.3%.

[turing-unlock](https://github.com/nlzy/turing-unlock) does the same for a modified RTX 2080 Ti 22GB, where cuBLAS FP16 at 8192 went from 52.8 to 77.9 TFLOPS at 250 W. Its README opens with a warning: tensor cores "draw very high power", and full speed "may damage your hardware".

No RTX 50 series card appears in any of the three support lists.

## What changes for local LLMs

Only the matrix-heavy part. The main README says LLM prefill speeds up by 14 to 36% across four owner reports, with gains also for diffusion and FlashAttention. Decode, which is limited by memory bandwidth, and INT8 work stay about the same, and the reports that compared outputs found them bit-identical. In [issue #15](https://github.com/Zagitta/gpu-unlock/issues/15), an RTX 3080 20 GB owner running vLLM measured prefill 33 to 36% faster and time to first token about 25% lower, with no change in decode speed.

So long prompts, RAG contexts and batch embedding get faster. Tokens per second in a chat do not.

## Before you try it

This is an unofficial change to how the card boots, and Nvidia does not support it. GitHub shows no license on the original repository, while the Ada fork is GPL-2.0. The build downloads pinned Nvidia and CachyOS inputs, checks their SHA-256 hashes and generates the firmware locally. Every figure above comes from one card or one owner, and the Turing fork's damage warning applies to all of them: watch power and temperatures, and keep your normal boot entry.
