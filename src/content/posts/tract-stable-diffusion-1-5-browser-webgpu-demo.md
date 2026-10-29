---
title: "Sonos's Rust inference engine tract now runs Stable Diffusion 1.5 in the browser through WebGPU"
description: "A new tract example runs SD 1.5 on the visitor's GPU via WebGPU and wasm. The 2.1 GB of weights come from Hugging Face and nothing leaves the machine."
pubDate: "2026-10-29T08:07:00Z"
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
  claimed: "Speed untested and GPU-dependent; the features used are not in a crates.io release yet."
verdict: "A neat proof that a pure Rust engine can do real image generation in a browser tab. Mind the 2.1 GB first download."
sources:
  - title: "tract: Stable Diffusion 1.5 in the browser example README"
    url: https://github.com/sonos/tract/tree/main/examples/stable-diffusion/web
  - title: "tract commit: examples: Stable Diffusion 1.5 in the browser (27 October 2026)"
    url: https://github.com/sonos/tract/commit/62c42ffead79d29061bb63deff578b82b6f712d1
  - title: "Live demo: demo.tract.rs/sd15"
    url: https://demo.tract.rs/sd15/
---

**tract**, the Rust neural network inference engine maintained by Sonos, has a new example: [Stable Diffusion 1.5 running in the browser](https://github.com/sonos/tract/tree/main/examples/stable-diffusion/web), on the visitor's own GPU. It went into tract's main branch on 27 October and is [live as a demo](https://demo.tract.rs/sd15/).

## How it works

According to the README, the page downloads SD 1.5's **fp16 weights (2.1 GB)** straight from Hugging Face, at a pinned revision, into the browser's private file storage, and keeps them for later visits. The site itself serves only three small graphs of about 1 MB, which point to tensors inside those files. "Nothing leaves the machine."

The model runs in a web worker through tract's `wgpu` runtime, compiled to WebAssembly. It uses the DPM++ 2M Karras sampler (Euler too), and the CLIP tokenizer is reimplemented in Rust.

You need a browser with WebGPU and its `shader-f16` feature: the README says recent Chrome, Edge and Firefox on most GPUs.

## Not on crates.io yet

The example uses features flagged `unstable`, such as async GPU readback and linking named weights from safetensors files, and it builds against tract's main branch. The latest crates.io release is still 0.23.9, which we covered in [our tract 0.23.9 story](/posts/sonos-tract-0-23-9-moe-ffn/). Expect these pieces in a future release.
