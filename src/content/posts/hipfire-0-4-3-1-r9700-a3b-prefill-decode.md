---
title: "hipfire 0.4.3 and 0.4.3.1: up to 9.5x A3B prefill on the Radeon R9700, then a patch for 27B MTP and faster decode"
description: "hipfire 0.4.3 adds a new mq4rs quant for Qwen3.6-35B-A3B with much faster prefill on gfx1201. 0.4.3.1 fixes a 27B MTP load bug and lifts decode about 48%."
pubDate: "2026-10-25T08:37:00Z"
specimen: 1041
section: rust
subsection: ai
tags:
  - hipfire
  - rust
  - amd
  - rocm
  - local-inference
  - qwen
draft: false
heroImage: "https://bots.aitamer.news/heroes/hipfire-0-4-3-1-r9700-a3b-prefill-decode-8da9d303.jpg"
heroAlt: "Cut-paper graphics card with three pinwheel fans, a wide burst of yellow and rust paper flames streaming from its edge and narrowing to a coral spark."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub release notes for v0.4.3 and v0.4.3.1 (both 24 October), read 25 October."
  claimed: "All speed figures are the project's own R9700 runs; we have not reproduced them."
verdict: "If you run Qwen3.6-35B-A3B on a Radeon AI PRO R9700, install 0.4.3.1 and pull the mq4rs file. On any other AMD card, most of the headline gains do not apply."
sources:
  - title: "hipfire v0.4.3 release notes (GitHub, 24 October 2026)"
    url: https://github.com/warpfront/hipfire/releases/tag/v0.4.3
  - title: "hipfire v0.4.3.1 release notes (GitHub, 24 October 2026)"
    url: https://github.com/warpfront/hipfire/releases/tag/v0.4.3.1
  - title: "GitHub: hipfire v0.4.4 release (27 October 2026)"
    url: https://github.com/warpfront/hipfire/releases/tag/v0.4.4
---

hipfire, the Rust inference engine for AMD GPUs, shipped two releases on 24 October. [v0.4.3](https://github.com/warpfront/hipfire/releases/tag/v0.4.3) went out at 05:24 UTC and the [v0.4.3.1](https://github.com/warpfront/hipfire/releases/tag/v0.4.3.1) patch followed at 20:37 UTC. Install the patch, not 0.4.3.

## 0.4.3: the new mq4rs file does most of the work

The headline is prefill on the Radeon AI PRO R9700 (gfx1201) for Qwen3.6-35B-A3B, a mixture-of-experts model. The project's table compares 0.4.2.1 on the old `mq4r` file with 0.4.3 on the new `qwen3.6:35b-a3b-mq4rs` file:

| Prefill tok/s | 0.4.2 (mq4r) | 0.4.3 (mq4r) | 0.4.3 (mq4rs) |
|---|---:|---:|---:|
| pp512 | 3,292 | 3,332 | 11,589 |
| pp4096 | 2,886 | 3,737 | 19,828 |
| pp16384 | 1,957 | 3,561 | 18,545 |

That is 3.5x at 512 tokens and 9.5x at 16,384. The notes are careful about what this means. Most of the gain comes from the new quant file, not the engine. The two versions ran their own default configs, which differ in KV cache format and prefill chunk size, so the middle column is "what a user gets from upgrading without changing the model file". And **fast mq4rs prefill is gfx1201 only**: on other GPUs the file needs `HIPFIRE_MOE_SYM_IU4=0`, which the notes say is about 5x slower. Users on the old mq4r file are told to pull mq4rs.

0.4.3 also lists the first Flash-Next sub-4-bit tiers, LFM2 support and new kernel-authoring tools.

## 0.4.3.1: one regression fixed, one decode speedup

The patch fixes a load failure: Qwen3.8-27B with `--spec mtp` "failed to load on v0.4.3", because the sealed 27B plan missed the MTP head. The notes trace it to a commit in the 0.4.3 cycle and the fix to another.

It also moves A3B mq4rs decode on gfx1201 to the PM4 replay route by default, with output "bit-exact against the HIP route":

| Decode tok/s, R9700 | 0.4.3 | 0.4.3.1 | Change |
|---|---:|---:|---:|
| tg128, ctx 128 | 157 | 232 | +48% |
| tg128, ctx 8K | 146.6 | 217.0 | +48% |
| 1024-token reasoning run | 154 | 225.0 | +46% |

Prefill is unchanged, and again this does not apply to other GPUs. `replay.backend = "hip"` turns it off. A third fix makes a failed verified-artifact cache write print one warning instead of silently re-hashing the model on every request.

To pin the patch:

```bash
curl -fsSL https://hipfire.dev/install.sh | bash -s -- --tag v0.4.3.1
```

## Why it matters

Local inference on AMD cards still depends on engines tuned per chip, and hipfire's notes show both sides of that: large gains on one card and one quant, and an explicit warning that other cards do not get them. All numbers are the project's own runs on its test cards. Our earlier coverage: [hipfire 0.4.2](/posts/hipfire-0-4-2-npu-trunk-dflash/) and [0.4.0](/posts/hipfire-0-4-0-rdna-rust-inference/).

## Update, 27 October 2026: hipfire 0.4.4 brings a Strix Halo wave and faster image turns

hipfire shipped [v0.4.4](https://github.com/warpfront/hipfire/releases/tag/v0.4.4) on 27 October. The notes lead with speculative-decode speed on the 7900 XTX, generic tensor parallelism as the default dense route, vision on by default and batched prefill for every LLaMA-architecture model. As before, the notes flag where each number comes from, and "contributor-measured" means the merge gate ran build, CPU tests and a smoke on a different card, "not the contributor's benchmark on the contributor's card".

Rows that stand out, all the project's own runs:

| Change | Before | After | Provenance |
|---|---:|---:|---|
| Strix Halo, Qwen3-8B DFlash, 7,741-token prompt | 538 s | 13.1 s | contributor-measured |
| Strix Halo, 9B DFlash, 2K | 45.7 tok/s | 59.6 tok/s | contributor-measured, "shared box (indicative)" |
| R9700, 27B vision, 1024x1024 image TTFT | 37.3 s | 0.51 s | release notes |
| Llama-3.2-1B batched prefill | 463 tok/s | 8,130 tok/s | gate run |

The new generic tensor-parallel route is faster on long prompts (TP2 pp2048 +22.3%) but slightly slower on very short ones (pp16 -3.3%, pp32 -2.5%), and `HIPFIRE_DENSE_TP_ROUTE=hand` rolls it back. Several speedups are marked "NUMERIC, not byte-identical", so greedy output can differ from the previous build. Check your own prompts before relying on exact reproducibility.
