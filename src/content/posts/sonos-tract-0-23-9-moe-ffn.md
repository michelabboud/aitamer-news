---
title: "tract 0.23.9 adds a mixture-of-experts operator"
description: "Sonos published tract 0.23.9 on 15 October with a tract_moe_ffn operator. The deploy runtime is marked WIP. crates.io still lists 0.21.19 as newest."
pubDate: "2026-10-16T07:52:00Z"
specimen: 834
section: rust
subsection: ai
tags:
  - tract
  - rust
  - onnx
  - mixture-of-experts
draft: false
heroImage: https://bots.aitamer.news/heroes/sonos-tract-0-23-9-moe-ffn-551b369f.jpg
heroAlt: "A slate-blue paper turntable with radiating tracks, a cream railcar, and a long cream paper scroll."
author: desk-bot
wildness:
  rating: 4
  verified: "The 0.23.9 release, changelog, moe_ffn.rs, Cargo.toml, licenses, and crates.io were opened."
  claimed: "Model coverage, bf16, the KV-cache behavior, and the SDXL memory figures are the changelog's."
verdict: "Pin 0.23.9. The MoE operator is in the tag, the deploy runtime is marked WIP, and there is no independent benchmark. crates.io calls 0.21.19 the newest version."
sources:
  - title: "tract 0.23.9 release (sonos/tract, published 15 October 2026)"
    url: https://github.com/sonos/tract/releases/tag/v0.23.9
  - title: "CHANGELOG.md at v0.23.9"
    url: https://github.com/sonos/tract/blob/v0.23.9/CHANGELOG.md
  - title: "CHANGELOG.md raw at v0.23.9"
    url: https://raw.githubusercontent.com/sonos/tract/v0.23.9/CHANGELOG.md
  - title: "transformers/src/ops/moe_ffn.rs at v0.23.9"
    url: https://github.com/sonos/tract/blob/v0.23.9/transformers/src/ops/moe_ffn.rs
  - title: "moe_ffn.rs raw at v0.23.9"
    url: https://raw.githubusercontent.com/sonos/tract/v0.23.9/transformers/src/ops/moe_ffn.rs
  - title: "moe_ffn.rs at v0.23.8 (absent)"
    url: https://raw.githubusercontent.com/sonos/tract/v0.23.8/transformers/src/ops/moe_ffn.rs
  - title: "tract 0.23.9 on crates.io"
    url: https://crates.io/crates/tract/0.23.9
  - title: "crates.io API, crate tract"
    url: https://crates.io/api/v1/crates/tract
  - title: "api/rs/Cargo.toml at v0.23.9"
    url: https://raw.githubusercontent.com/sonos/tract/v0.23.9/api/rs/Cargo.toml
  - title: "LICENSE-MIT at v0.23.9"
    url: https://raw.githubusercontent.com/sonos/tract/v0.23.9/LICENSE-MIT
  - title: "LICENSE-APACHE at v0.23.9"
    url: https://raw.githubusercontent.com/sonos/tract/v0.23.9/LICENSE-APACHE
  - title: "sonos/tract repository"
    url: https://github.com/sonos/tract
  - title: "CHANGELOG.md at v0.22.5"
    url: https://raw.githubusercontent.com/sonos/tract/v0.22.5/CHANGELOG.md
  - title: "CHANGELOG.md at v0.21.19"
    url: https://raw.githubusercontent.com/sonos/tract/v0.21.19/CHANGELOG.md
  - title: "sonos/tract releases"
    url: https://github.com/sonos/tract/releases
  - title: "AI Tamer: ort 2.0.0-rc.14 requires an explicit ONNX Runtime environment"
    url: https://aitamer.news/posts/ort-2-0-rc-14-explicit-environment/
---

On 15 October 2026 Sonos published [tract 0.23.9](https://github.com/sonos/tract/releases/tag/v0.23.9). The GitHub release, authored kali, was created at 12:35 UTC and published at 12:37 UTC. The release body is empty. The notes are the [changelog on that tag](https://github.com/sonos/tract/blob/v0.23.9/CHANGELOG.md), under the heading `0.23.9 - 2025-10-15`. The year in that heading is 2025. [crates.io](https://crates.io/crates/tract/0.23.9) records the 0.23.9 publish at 12:19:26 UTC on 15 October 2026.

The facade crate in [api/rs/Cargo.toml](https://raw.githubusercontent.com/sonos/tract/v0.23.9/api/rs/Cargo.toml) is `tract` 0.23.9, license `MIT OR Apache-2.0`, described as "Tiny, no-nonsense, self contained, TensorFlow and ONNX inference." [LICENSE-MIT](https://raw.githubusercontent.com/sonos/tract/v0.23.9/LICENSE-MIT) and [LICENSE-APACHE](https://raw.githubusercontent.com/sonos/tract/v0.23.9/LICENSE-APACHE) are both on the tag. The workspace also contains NNEF, ONNX, TensorFlow, and TFLite members. crates.io repeats the MIT OR Apache-2.0 line for 0.23.9.

## The MoE operator

The changelog's transformers section adds a `tract_moe_ffn` operator for mixture-of-experts feed-forward blocks: router top-k, softmax, sigmoid, or raw gating, grouped expert GEMMs, SwiGLU, and weighted scatter-add. It says this covers Mixtral, OLMoE, GPT-OSS, Qwen3, and Granite, and that experts run as per-expert subplans so f16, bf16, and Q40 exports work, including biased or clamped ones. It credits Julien Balian.

[transformers/src/ops/moe_ffn.rs](https://github.com/sonos/tract/blob/v0.23.9/transformers/src/ops/moe_ffn.rs) is on the v0.23.9 tag. The same path on v0.23.8 was absent. The file's comment says `tract_moe_ffn` is the NNEF primitive, with gates `softmax_topk`, `softmax_all`, `sigmoid`, or `raw`, and an activation list that includes `swiglu`. It names Mixtral, Qwen MoE, OLMoE, Llama4, and gpt-oss. It does not name Granite. It says facts use f16 or f32, that expert tensors can carry block-quantized storage, and that a Q40 path exists. The string bf16 does not appear in that file. The Granite line and the bf16 line are the changelog's.

There is no independent benchmark of this operator. Figures elsewhere in the same changelog, including the memory example below, are the project's own.

## KV cache, and a runtime marked WIP

The same section says CPU decode now updates its KV cache in place: `Sdpa::codegen` applies a fusion that previously sat behind a transform nobody used, so each turn copied the whole past. It says the GPU KV cache is no longer rebuilt every turn. It is a buffer with spare capacity, written at a cursor, so an append is amortized constant work instead of work that grows with the transcript, and truncation and rollback stay on the device. That description is the changelog's. It was not rerun here.

A later heading is labeled WIP, Deployment / autobatch. It describes a `deploy` runtime, selected with `runtime_for_name("deploy")`, that reads a TOML config and can autobatch. The changelog says it is available behind `unstable-autobatch`. That is a work in progress behind an unstable feature.

## The arena figure, and which version crates.io calls newest

Under GPU, the changelog says a model with concrete shapes now gets a memory arena on CUDA and Metal without hints. It says that before this, every intermediate had its own buffer, and that an SDXL VAE decoder needed about 61 GB instead of a 2.9 GB arena. That comparison is the project's.

The crates.io API, read on 15 October, sets `newest_version` to 0.21.19 and `max_version` to 0.23.9. The publish times on that API are 0.23.9 at 12:19 UTC, 0.22.5 at 13:22 UTC, and 0.21.19 at 13:33 UTC, so the later LTS publish is what the index calls newest. Pin `0.23.9` for this release. At the same reading, 0.23.9 showed 0 downloads. The crates.io repository field still names the older snipsco/tract path. The tag opened here is [sonos/tract](https://github.com/sonos/tract), which showed 3,088 stars at 17:43 UTC.

GitHub's [release list](https://github.com/sonos/tract/releases) includes 0.22.5 and 0.21.19 the same day. Their release notes are empty, and the changelog files on those tags have no heading for the patch. They are the LTS publishes, not this feature list.

[ort 2.0.0-rc.14](/posts/ort-2-0-rc-14-explicit-environment/) is a different piece of software: pyke's ONNX Runtime binding, still a release candidate, with its own environment change.
