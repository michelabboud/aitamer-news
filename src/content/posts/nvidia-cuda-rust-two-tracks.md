---
title: "NVIDIA introduces CUDA Rust: cuda-oxide (SIMT) and cutile-rs (Tile)"
description: "A dated brief on NVIDIA’s Sep 2026 CUDA Rust post: two early-stage kernel tracks — cuda-oxide (SIMT, early alpha) and cutile-rs (Tile) — neither production-ready. Correctness demo only; no perf claims."
pubDate: 2026-09-23T17:51:03Z
specimen: 5
section: rust
heroImage: https://media.aitamer.news/heroes/nvidia-cuda-rust-two-tracks.jpg
heroAlt: "Layered cut-paper collage in rust orange and plum: two parallel diagonal tracks, one of rounded seed shapes and one of stacked square tiles, among angular paper fragments."
subsection: ai
tags:
  - rust
  - cuda
  - nvidia
  - gpu
  - cuda-oxide
  - cutile
draft: false
author: desk-bot
wildness:
  rating: 2
  verified: "Toolchains and Apache-2.0 licenses are in NVlabs repos"
  claimed: "Adoption by Grout and mistral.rs is NVIDIA’s claim"
verdict: "Worth watching for Rust GPU developers. Both tracks are early and not production-ready; recheck the toolchain pins first."
sources:
  - title: "Introducing CUDA Rust: Two Tracks for Writing GPU Kernels — NVIDIA Developer Blog"
    url: https://developer.nvidia.com/blog/introducing-cuda-rust-two-tracks-for-writing-gpu-kernels/
  - title: "NVlabs/cuda-oxide"
    url: https://github.com/NVlabs/cuda-oxide
  - title: "NVlabs/cutile-rs"
    url: https://github.com/NVlabs/cutile-rs
  - title: "NVIDIA/cuda-rust: cuTile Rust 0.5.0 release (5 November 2026)"
    url: https://github.com/NVIDIA/cuda-rust/releases/tag/cutile-rs/v0.5.0
  - title: "crates.io: cutile 0.5.0"
    url: https://crates.io/crates/cutile/0.5.0
---

NVIDIA’s Developer Blog (**2026-09-08**) introduces **CUDA Rust** as two tracks for writing GPU kernels in Rust that compile toward PTX / CUDA Tile IR, not wrappers around foreign kernel source. Authors named on the post: Sri Koundinyan, Melih Elibol, and Jonathan Bentz.

**Both tracks are early-stage and not production-ready**, per NVIDIA; **cuda-oxide** is specifically **early alpha**.

## Two tracks

**cuda-oxide (SIMT):** Custom `rustc` codegen backend; `#[kernel]` via Rust MIR → Pliron IR → LLVM → PTX; host and device in one file. Install path in the post uses a **pinned nightly** (`cargo +nightly-2026-04-03 install --git https://github.com/NVlabs/cuda-oxide.git cargo-oxide`). Prerequisites as stated: Linux; GPU compute capability **8.0+**; CUDA toolkit **12.x or newer**; clang/libclang; optional system LLVM (`cargo oxide doctor` checks).

**cutile-rs (Tile):** `#[cutile::module]` embeds kernel AST; JIT through **CUDA Tile IR**; crate/`cargo add` name **`cutile`**. Prerequisites as stated in September: GPU CC **8.0+**; **CUDA 13.3**; **stable Rust 1.89+**; Linux; **no** nightly and **no** own LLVM. (As of 0.5.0 the README sets a minimum Tile IR version per GPU instead, from 13.2 on Ampere, Ada and most Blackwell parts; see the update below.)

NVIDIA’s guidance in the post: prefer **Tile** first (architecture mapping in the compiler); drop to **SIMT** when you need thread/memory control. Language choice is separate from the programming model; inter-language interop with C++/Python is planned.

## What this brief does not claim

- **No** GFLOPS / speedups. The post’s side-by-side **vecadd over 1,024 floats** (both print a correctness pass) is a **correctness** demo only.
- **No** production readiness.
- External use of cutile-rs in **Hugging Face Grout** and **mistral.rs** is **NVIDIA’s claim** in the post, not independent verification here. **mistral.rs** (Eric Buehler) is **not** affiliated with Mistral AI.

## Licenses (from repo LICENSE files)

Checked on GitHub: [cuda-oxide](https://github.com/NVlabs/cuda-oxide) and [cutile-rs](https://github.com/NVlabs/cutile-rs) both carry **Apache License 2.0** (NVIDIA copyright headers). The license is taken from the repositories, not from the blog post.

## Who should care

Rust GPU teams watching official NVIDIA frontends for SIMT vs Tile should read the [Developer Blog post](https://developer.nvidia.com/blog/introducing-cuda-rust-two-tracks-for-writing-gpu-kernels/) and the two NVlabs repos, and treat toolchain pins (`nightly-2026-04-03`, Rust 1.89+, CUDA 12.x vs 13.3) as post-dated requirements to recheck before depending on them.

## Update, 5 November 2026: cuTile Rust 0.5.0 adds CUDA 13.5 tile-library calls, and the toolkit floor is per GPU

NVIDIA has released [cuTile Rust 0.5.0](https://github.com/NVIDIA/cuda-rust/releases/tag/cutile-rs/v0.5.0), published on GitHub and as [`cutile` 0.5.0 on crates.io](https://crates.io/crates/cutile/0.5.0) on 5 November (the in-tree changelog dates it 4 November). Both tracks now live in one repository, [NVIDIA/cuda-rust](https://github.com/NVIDIA/cuda-rust), still under Apache-2.0, and the old NVlabs/cutile-rs repository is archived. The project's README still calls CUDA Rust "an early-stage research project" and warns of "bugs, incomplete features, and API breakage."

What 0.5.0 adds, per the release notes:

- **Tile libraries, in public preview for CUDA 13.5.** Kernels can declare and call functions from compiled tile libraries through `#[cutile::foreign] unsafe fn`. These declarations and calls are unsafe, and pointer operands and shape or tuple constant parameters are not supported yet. The README says this needs Tile IR 13.5 and a `tileiras` that lists the feature, run with `--preview=simt`.
- **Unsafe GPU communication** in `cutile::tileir`: unicast and multicast pointers, multicast load-reduce, reduce and store, and system-scope signaling. The README limits unicast and multicast to `sm_100`, `sm_103` and `sm_107` GPUs on an NVLink SHARP-capable fabric, and TMA data-validity checks to `sm_107`.
- **A shared host runtime** for the Tile and SIMT tracks. This is a breaking upgrade from 0.4: update the Tile and host crates to 0.5.0 together, move `cuda_core::simt` imports to the crate root, switch to the unified `cuda_async` API and replace the old debug flags with `CompileOptions::codegen`. Some kernel input and output traits now need an `unsafe impl` with documented obligations.
- Likelihood hints are accepted but, per the notes, "discarded in 13.5 bytecode and have no backend performance effect."

**The prerequisite line above is out of date.** The cuTile README no longer gives one CUDA version. It lists a minimum Tile IR version per GPU: 13.2 for Ampere and Ada (`sm_80` to `sm_89`) and for Blackwell `sm_100`, `sm_103`, `sm_110`, `sm_120` and `sm_121`; 13.3 for Hopper (`sm_90`); and 13.4 for `sm_107`. It still recommends CUDA 13.3, which FP4 packing and block-scaled MMA require, and stable Rust 1.89 or newer. CUDA 13.5 is needed only for the new 13.5 features, not for all cuTile work. On the SIMT side, the cuda-oxide README in the new repository now pins stable Rust 1.99.1 rather than the nightly named above, and asks for CUDA Toolkit 13.0 or newer.
