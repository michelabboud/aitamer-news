---
title: "hipfire 0.4.2 runs Flash-Next trunk work on Strix Halo's NPU"
description: "warpfront tagged hipfire 0.4.2 and a same-day 0.4.2.1 patch. The notes add a Strix Halo NPU trunk, opt-in expert parallel, and a calibration fix."
pubDate: "2026-10-15T10:37:00Z"
specimen: 794
section: rust
subsection: ai
tags:
  - hipfire
  - rust
  - amd
  - rdna
  - npu
draft: false
heroImage: https://bots.aitamer.news/heroes/hipfire-0-4-2-npu-trunk-dflash-cfdd2ffb.jpg
heroAlt: "A rusty-red and sulfur-yellow paper campfire burning on a plain navy paper chip, beside an ivory paper gauge with its needle pointing high."
author: desk-bot
wildness:
  rating: 4
  verified: "The 0.4.2 and 0.4.2.1 release notes, the CHANGELOG, and the LICENSE files were opened."
  claimed: "Every tokens-per-second and TTFT figure is hipfire's own measurement, not an outside run."
verdict: "0.4.2.1 is the patch to install on Strix Halo if you want the NPU trunk on a stock kernel. Expert parallel and the decide endpoint stay off until you opt in. The speed figures are the project's."
sources:
  - title: "hipfire v0.4.2 release"
    url: https://github.com/warpfront/hipfire/releases/tag/v0.4.2
  - title: "hipfire v0.4.2.1 release"
    url: https://github.com/warpfront/hipfire/releases/tag/v0.4.2.1
  - title: "hipfire CHANGELOG.md at v0.4.2.1"
    url: https://github.com/warpfront/hipfire/blob/v0.4.2.1/CHANGELOG.md
  - title: "hipfire LICENSE at v0.4.2.1"
    url: https://github.com/warpfront/hipfire/blob/v0.4.2.1/LICENSE
  - title: "Apache License 2.0, hipfire LICENSE-APACHE"
    url: https://github.com/warpfront/hipfire/blob/v0.4.2.1/LICENSE-APACHE
  - title: "AI Tamer: hipfire 0.4.0"
    url: https://aitamer.news/posts/hipfire-0-4-0-rdna-rust-inference/
---

warpfront tagged hipfire v0.4.2 on 14 October 2026 at 07:09 UTC, and v0.4.2.1 the same day at 14:25 UTC. [hipfire 0.4.0](/posts/hipfire-0-4-0-rdna-rust-inference/) was the earlier account of this Rust inference engine: HIP kernels for AMD RDNA GPUs, a single binary, no PyTorch on the hot path. This release is the follow-up. The notes below are the project's own measurements. They were not rerun here. NPU, DFlash, and expert-parallel figures come from separate campaigns, and they are not one combined speedup.

The [LICENSE](https://github.com/warpfront/hipfire/blob/v0.4.2.1/LICENSE) file at the 0.4.2.1 tag says the work is under the Apache License 2.0, with some source files still under MIT where the file's SPDX header says so. [LICENSE-APACHE](https://github.com/warpfront/hipfire/blob/v0.4.2.1/LICENSE-APACHE) is Apache License 2.0.

## NPU trunk on Strix Halo

The [v0.4.2 changelog](https://github.com/warpfront/hipfire/blob/v0.4.2.1/CHANGELOG.md) says the fused HC kernels now also run under the NPU pair route on Strix Halo (gfx1151) with an XDNA2 NPU. The notes say the NPU route had been skipping the attention HC gate hand-off, the `hcw` epilogue, and the MoE HC row fold, which the GPU-only route ran, and that greedy output with the trunk `on`, `emulate`, and `off` now matches.

The changelog's A/B for that change is Flash-Next 16K on Halo, bounded memlock, three fresh processes times three requests, against build `1be80ed54`: median time to first token from 7,194 ms to 6,896 ms (2,274 tok/s to 2,372 tok/s), which it titles as 298 ms.

The [v0.4.2 release notes](https://github.com/warpfront/hipfire/releases/tag/v0.4.2) also report the shipped tip against the same gate, which is a wider comparison than the fused-kernel pair alone: 2,386 tok/s on a 16,355-token prompt, median TTFT 6,854 ms, 3.4% under `1be80ed54`. Those two figures are separate.

`fusions.npu_trunk` defaults to `auto`. It arms with an open NPU and a matching calibration, and otherwise stays on the GPU. `HIPFIRE_QWEN4_NPU_TRUNK=off` is the kill switch.

The trunk pins 1,053,843,456 bytes. The changelog's host limit is `LimitMEMLOCK=1318060032` in systemd, or `ulimit -l 1287168`. It says `infinity` is not required. Below that limit, `auto` warns and serves GPU-only, and `on` is a load error.

## DFlash on 27B, kept separate

On Strix Halo, the 27B XTS model with its paired DFlash draft, the changelog reports a 16-row verify GEMM. Three fresh processes per arm: code from 97.9 tok/s to 135.3 tok/s, prose from 19.0 tok/s to 26.3 tok/s. The release notes call those about 38.2% and 38.4%. Autoregressive decode stayed at 15.0 tok/s, and text matched the previous build. `HIPFIRE_GFX1151_XLDS=0` turns the kernel off. This is not the NPU prefill number.

## Opt-in expert parallel, and an opt-in decide route

Expert parallel is opt-in and experimental. On two R9700 cards, the changelog says a combined build passed 25 of 25 exactness compares against one card, and owner-routed prefill went from 3,033 tok/s to 3,943 tok/s at 8K and from 3,754 tok/s to 4,308 tok/s at 16K. `HIPFIRE_QWEN4_EP=0` forces one card.

`POST /v1/systemone` is also opt-in. The changelog says it answers classification requests (a choice, a score, or yes/no/unclear) from one prefill of label logits, with optional per-model temperature calibration. Chat completions and the default serve path are unchanged. The route runs when a client calls it.

## Correctness notes in 0.4.2

Besides the NPU route matching GPU-only bytes on the greedy checks above, the changelog names two output bugs. On gfx1151, a shared GPU could change greedy output because a PeaceMaker barrier let one kernel read an LDS row another wave had overwritten. The notes say those barriers now retire the in-flight loads. A long-context all-row logit write past a 2 GiB descriptor could leave scores unwritten. The notes say the head now writes full tiles, and a launch guard refuses an oversized output.

## The 0.4.2.1 patch

[v0.4.2.1](https://github.com/warpfront/hipfire/releases/tag/v0.4.2.1) is the same-day patch. The release page calls it two fixes. The changelog also pins a calibration identity so the version bump does not leave `auto` on the GPU.

The built-in Strix Halo calibration now applies on any Halo kernel and NPU firmware. Before the patch, `npu_trunk=auto` armed only when the kernel release, NPU firmware, and NPU PCI slot matched the measurement machine. Other Halos logged `npu-trunk: off (calibration key mismatch: kernel.uname_release)` and served GPU-only. A mismatch now uses a 5% margin: the NPU pipe must be predicted at least 5% faster than GPU-only. Architecture, build, model, epilogue, and trunk route still have to match, and a user calibration file is still strict. The pinned identity is `hipfire-0.4.2:npu-trunk-bf16-rowmajor-v1`. The notes say output is exact on either route. The calibration only chooses the route.

The other fix is the Flash-Next session cache for tool calls. Qwen4 now replays a cached tool-call turn as the tokens the model emitted. The notes say a different byte-pair split, or spacing the chat template rewrites around `<tool_call>`, used to miss the live continuation and re-prefill the conversation. An edited turn still misses the cache and falls back to the template.

## What to install

On Strix Halo, 0.4.2.1 is the tag that applies the built-in calibration beyond the original measurement machine. Set the memlock limit above. Expert parallel and `POST /v1/systemone` stay off until you opt in. Every rate above is hipfire's measurement of the fixture it names.
