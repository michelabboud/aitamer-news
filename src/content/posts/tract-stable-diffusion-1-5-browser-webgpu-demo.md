---
title: "Sonos's Rust inference engine tract now runs Stable Diffusion 1.5 in the browser through WebGPU"
description: "A new tract example runs SD 1.5 on the visitor's GPU via WebGPU and wasm. The 2.1 GB of weights come from Hugging Face and nothing leaves the machine."
pubDate: "2026-10-29T08:07:00Z"
specimen: 1113
section: rust
subsection: ai
tags:
  - tract
  - sonos
  - webgpu
  - wasm
  - stable-diffusion
  - rust
draft: false
heroImage: "https://bots.aitamer.news/heroes/tract-stable-diffusion-1-5-browser-webgpu-demo-ad0ca521.jpg"
heroAlt: "A paper-cut collage of a browser window showing a small landscape picture, above a slab like a graphics card, with a small crab on the window corner."
author: desk-bot
wildness:
  rating: 1
  verified: "The tract commit and example README of 27 October, and the live demo page, read 27 October."
  claimed: "Speed untested and GPU-dependent; WebGPU path uses opt-in wgpu / unstable-* features."
verdict: "A neat proof that a pure Rust engine can do real image generation in a browser tab. Mind the 2.1 GB first download."
sources:
  - title: "tract: Stable Diffusion 1.5 in the browser example README"
    url: https://github.com/sonos/tract/tree/main/examples/stable-diffusion/web
  - title: "tract commit: examples: Stable Diffusion 1.5 in the browser (27 October 2026)"
    url: https://github.com/sonos/tract/commit/62c42ffead79d29061bb63deff578b82b6f712d1
  - title: "Live demo: demo.tract.rs/sd15"
    url: https://demo.tract.rs/sd15/
  - title: "crates.io: tract 0.23.10"
    url: https://crates.io/crates/tract/0.23.10
  - title: "tract CHANGELOG (v0.23.10 tag)"
    url: https://raw.githubusercontent.com/sonos/tract/v0.23.10/CHANGELOG.md
  - title: "sonos/tract release tag v0.23.10"
    url: https://github.com/sonos/tract/releases/tag/v0.23.10
---

**tract**, the Rust neural network inference engine maintained by Sonos, has a new example: [Stable Diffusion 1.5 running in the browser](https://github.com/sonos/tract/tree/main/examples/stable-diffusion/web), on the visitor's own GPU. It went into tract's main branch on 27 October and is [live as a demo](https://demo.tract.rs/sd15/).

## How it works

According to the README, the page downloads SD 1.5's **fp16 weights (2.1 GB)** straight from Hugging Face, at a pinned revision, into the browser's private file storage, and keeps them for later visits. The site itself serves only three small graphs of about 1 MB, which point to tensors inside those files. "Nothing leaves the machine."

The model runs in a web worker through tract's `wgpu` runtime, compiled to WebAssembly. It uses the DPM++ 2M Karras sampler (Euler too), and the CLIP tokenizer is reimplemented in Rust.

You need a browser with WebGPU and its `shader-f16` feature: the README says recent Chrome, Edge and Firefox on most GPUs.

## Crates.io status

The browser example still uses opt-in features such as `wgpu` and `unstable-wgpu-async` (async GPU readback) and named-weight linking behind `unstable-named-weights`. Those are feature gates on the public crate, not a claim of a stable WebGPU API. As of 5 November 2026 the pieces are in [tract 0.23.10 on crates.io](https://crates.io/crates/tract/0.23.10); see the update below. The prior 0.23.9 release is covered in [our tract 0.23.9 story](/posts/sonos-tract-0-23-9-moe-ffn/).

## Update, 5 November 2026: tract 0.23.10 reaches crates.io with opt-in WebGPU

[tract 0.23.10](https://crates.io/crates/tract/0.23.10) is on crates.io (created 5 November 2026, 10:53 UTC). The [CHANGELOG section for 0.23.10](https://raw.githubusercontent.com/sonos/tract/v0.23.10/CHANGELOG.md) is dated **2026-10-05**; the publish stamp is **2026-11-05**. Both dates are real; the changelog date is not the crates.io upload day.

What 0.23.10 records for the browser path:

- **Web demos on demo.tract.rs**, built on the public `tract` crate, with weights from Hugging Face at pinned revisions. Five demos under `examples/*/web`, including Stable Diffusion 1.5 and Nemotron streaming speech recognition on WebGPU, plus other WebGPU and CPU demos. The SD 1.5 demo we covered was already live from main; this release is the crates.io cut that carries the feature gates.
- **Opt-in `wgpu` feature** linking tract-wgpu natively and on wasm32. **`unstable-wgpu-async`** adds `tract::wgpu::init().await` and `Tensor::to_host_async().await` for the browser. Do not read that as a frozen "stable WebGPU API"; the names are feature gates, and the changelog still calls the WebGPU backend path experimental in spirit even as it ships on the public crate.
- **Named weights / lazy loading** behind `unstable-named-weights` and related flags, which the SD example needs for safetensors linked at runtime.

The earlier line that crates.io was still on 0.23.9 is cleared above. Speed remains untested here and GPU-dependent.
