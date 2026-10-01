---
title: "hipfire 0.4.0: RDNA-native Rust/HIP LLM inference, Flash-Next 262K"
description: "warpfront tagged hipfire v0.4.0 (2026-09-30): Rust LLM inference over HIP kernels for AMD RDNA. Self-reported ≈5,120 tok/s pp8192 on R9700; Qwen3.8-Flash-Next full 262K on one R9700. Serve defaults to 127.0.0.1. Apache-2.0 (residual MIT files)."
pubDate: 2026-10-01
section: rust
subsection: ai
tags:
  - rust
  - hipfire
  - amd
  - rdna
  - hip
  - rocm
  - inference
  - qwen
  - flash-next
  - speculative-decode
draft: false
heroImage: /heroes/hipfire-0-4-0-rdna-rust-inference.jpg
author: desk-bot
sources:
  - title: "hipfire v0.4.0 — GitHub Release"
    url: https://github.com/warpfront/hipfire/releases/tag/v0.4.0
  - title: "hipfire.dev"
    url: https://hipfire.dev/
---

warpfront tagged **hipfire v0.4.0** on **2026-09-30**: a Rust LLM inference engine over hand-written **HIP** kernels for AMD **RDNA** GPUs—“no PyTorch / no Python in the hot path / single binary” ([release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0), [hipfire.dev](https://hipfire.dev/)).

This is a **Desk Bot** rust/ai briefing locked to the release body. Every tok/s figure below is **project self-reported** (fresh-process A/B unless noted)—not independently reproduced. Prefer release numbers over undated homepage snapshots. License: **Apache-2.0** for the work as a whole, with **residual MIT** files per SPDX headers—not a simple dual MIT/Apache claim ([release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0)).

## Prefill, decode, and Flash-Next

Fixtures (unless a row says otherwise): **H2** = `qwen3.8:27b-mq4-xts`; cards **R9700**=gfx1201, **XTX**=7900 XTX, **Halo**=Strix Halo; stack **ROCm 10.0 (HIP 7.15)** ([release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0)).

On R9700, the project reports pp8192 **≈5,120 tok/s** on H2 with native fp8 KV default, and long-prompt rates of **4,464 / 3,804 / 2,940** tok/s at 32K / 64K / 128K. gfx11 prefill: pp8192 ≈**2,985** (XTX) / **1,141** (Halo). FA2 past 32K: 65K prompt times **103→38 s** (XTX) and **241→90 s** (Halo). Decode keeps Retained Redline PM4 as default on gfx1201—~**40.3** tok/s tg128 at 8K on R9700; XTX **51.2 / 49.3 / 46.0** at 512 / 8K / 32K—with byte-identical output claimed ([release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0)).

**Qwen3.8-Flash-Next** at full **262,144**-token context on a **single R9700** (tp=1, host-mapped experts) is a headline fixture in the notes—not generalized to multi-GPU. Speculative decode: MTP on by default when the head is present (Qwen3.8-27B); VerifyAttn speeds DFlash/MTP at long context ([release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0)).

## Breaking defaults that matter

| Change | What it means |
| --- | --- |
| **Serve bind** | `hipfire serve` defaults to **`127.0.0.1`** (was `0.0.0.0`) |
| **KV backend** | **VMM** is default; `contiguous` → `legacy` |
| **Kernel packs** | Prebuilt packs enable compiler-free installs; cache ABI 4→5 |

Also: Qwen default KV `auto` uses native fp8 KV + fp8 flash attention on exact gfx1201 for the stated single-GPU geometry; `hardware.devices` / `HIPFIRE_DEVICES` mean physical cards (PCI-sorted), not ROCr ordinals; request pull/arbitrary paths stay locked down unless opted in ([release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0)).

Known soft limits from the project: multi-slot ≥4 can diverge from serial greedy text; fp8 KV is **gfx1201-only**; Flash-Next has **no KLD reference yet**; greedy MTP text can differ from greedy AR ([release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0)).

## Who should care

AMD RDNA builders who want a single-binary Rust/HIP inference path should start at the [v0.4.0 release](https://github.com/warpfront/hipfire/releases/tag/v0.4.0)—treat benches as project measurements, and note the localhost serve default before exposing anything on a LAN. Cadence after 0.4.0: weekly alternating Tue/Sun; **0.4.1** targeted **Tuesday 2026-10-06**.
