---
title: "Burn v0.22.0-pre.4 and CubeCL v0.11.0-pre.4: paired Tracel pre-releases"
description: "Tracel tagged Burn v0.22.0-pre.4 and CubeCL v0.11.0-pre.4 on the same day (2026-09-22). Pre-release only—not stable 0.22 / 0.11. LAMB, einsum, AMDGPU and CUDA-LLVM backends; dual MIT/Apache."
pubDate: 2026-09-24T09:15:12Z
heroImage: /heroes/burn-0-22-cubecl-0-11-pre4.jpg
section: rust
subsection: ai
tags:
  - rust
  - burn
  - cubecl
  - tracel
  - deep-learning
  - gpu-compute
  - pre-release
draft: false
author: desk-bot
sources:
  - title: "Burn v0.22.0-pre.4 — GitHub Release"
    url: https://github.com/tracel-ai/burn/releases/tag/v0.22.0-pre.4
  - title: "CubeCL v0.11.0-pre.4 — GitHub Release"
    url: https://github.com/tracel-ai/cubecl/releases/tag/v0.11.0-pre.4
  - title: "tracel-ai/burn — GitHub"
    url: https://github.com/tracel-ai/burn
  - title: "tracel-ai/cubecl — GitHub"
    url: https://github.com/tracel-ai/cubecl
---

On **2026-09-22**, Tracel tagged paired **pre-releases**: Burn [`v0.22.0-pre.4`](https://github.com/tracel-ai/burn/releases/tag/v0.22.0-pre.4) and CubeCL [`v0.11.0-pre.4`](https://github.com/tracel-ai/cubecl/releases/tag/v0.11.0-pre.4). Both GitHub releases are marked **Pre-release**—this is **not** stable Burn 0.22 or CubeCL 0.11.

This is a **Desk Bot** briefing from those release bodies and the project READMEs. Dual **MIT / Apache-2.0** as stated on the Burn and CubeCL READMEs. No invented speedups or GFLOPS.

## What they are

**Burn** is Tracel’s Rust tensor library and deep-learning framework. **CubeCL** is the multi-platform compute language / JIT / runtime behind Burn’s accelerated backends, and is usable standalone. CubeCL’s README still calls the project **alpha**, with a public API that can break between minor versions.

## Burn highlights (from the pre.4 body)

Changelog items locked to the [Burn tag](https://github.com/tracel-ai/burn/releases/tag/v0.22.0-pre.4) include:

- **LAMB** optimizer
- **einsum** with runtime and macro APIs
- Breaking extracts of tensor **linalg** and **signal** into `burn-linalg` / `burn-signal` extension crates
- Merge of `AutodiffModule` into `Module`; explicit autodiff conversions replacing `no_grad`; separate gradient control from module freezing
- Asymmetric padding in conv1d / conv2d
- Deprecation of the **burn-tch** (LibTorch) backend on the 0.22 train (no removal date stated here)
- Docs / migration guides for Burn 0.22 (#5762, #5768)
- Store/interop and dataset work (PyTorch reader extract, atomic safetensors writes, SqliteDataset on Turso)

Several entries carry `!:` breaking markers—treat migration cost as real and follow Tracel’s 0.22 migration docs rather than inventing steps.

## CubeCL highlights (from the pre.4 body)

The [CubeCL tag](https://github.com/tracel-ai/cubecl/releases/tag/v0.11.0-pre.4) (published ~5 minutes before Burn) centers on backends and tooling:

- **AMDGPU** backend (gated off macOS / default features in follow-ons)
- **CUDA via LLVM** backend and related LLVM / PTX / NVPTX fixes
- Device timing / profiling for HIP and CUDA
- IR and memory work (MemorySSA, uniformity analysis, physical card reporting, complex support, dp4a)
- CPU vectorized math approximations and layout / runtime refactors

## Who should care

Rust ML teams already on the Burn / CubeCL pre-release train who need the latest optimizer, tensor-API, and backend work should read both tags. Everyone else should wait for stable 0.22 / 0.11 unless they are deliberately tracking pre-releases.
