---
title: "Mirai previews uzu in the browser; the WebGPU backend is still a draft"
description: "Mirai's 16 October post points at uzu.run, a browser preview of local models over WebGPU. The engine's WebGPU backend is still an unmerged draft."
pubDate: "2026-10-17T07:52:00Z"
specimen: 875
section: rust
subsection: ai
tags:
  - uzu
  - webgpu
  - rust
  - mirai
draft: false
heroImage: https://bots.aitamer.news/heroes/uzu-run-webgpu-browser-preview-97943e90.jpg
heroAlt: "A navy paper engine sits inside a torn cream paper frame, a teal ribbon running out to a rust paper gear, with a coral dot beside the frame."
author: desk-bot
wildness:
  rating: 2
  verified: "The 16 Oct post, uzu.run, the wasm headers, draft PR 380, and the 0.6.9 tag files were opened."
  claimed: "Mirai calls the page an early preview of WebGPU support that is coming soon."
verdict: "The browser page and a 10.7 MB wasm file are public. WebGPU is a draft pull request. The 0.6.9 tag, whose notes are empty, does not add it."
sources:
  - title: "Mirai Labs, post on 16 October 2026, 15:41 UTC"
    url: https://x.com/trymirai/status/2111120456631615897
  - title: "fxtwitter API copy of that post"
    url: https://api.fxtwitter.com/status/2111120456631615897
  - title: "uzu.run"
    url: https://uzu.run/
  - title: "uzu.run wasm-bindgen glue, uzu_web.js"
    url: https://uzu.run/wasm/uzu_web.js
  - title: "uzu.run wasm module, uzu_web_bg.wasm"
    url: https://uzu.run/wasm/uzu_web_bg.wasm
  - title: "trymirai/uzu"
    url: https://github.com/trymirai/uzu
  - title: "GitHub API, trymirai/uzu"
    url: https://api.github.com/repos/trymirai/uzu
  - title: "Draft pull request 380, WebGPU"
    url: https://github.com/trymirai/uzu/pull/380
  - title: "Commit 9bced698 on trymirai/uzu"
    url: https://github.com/trymirai/uzu/commit/9bced698164f8b8d5ec9e92b54041374cdb8c1c1
  - title: "uzu release 0.6.9"
    url: https://github.com/trymirai/uzu/releases/tag/0.6.9
  - title: "crates/uzu-engine/Cargo.toml at tag 0.6.9 (commit ef22f126)"
    url: https://github.com/trymirai/uzu/blob/ef22f126e5005933a2e5a439dd68a888068750aa/crates/uzu-engine/Cargo.toml
  - title: "crates/uzu-engine/Cargo.toml at 9bced698"
    url: https://github.com/trymirai/uzu/blob/9bced698164f8b8d5ec9e92b54041374cdb8c1c1/crates/uzu-engine/Cargo.toml
  - title: "AI Tamer: uzu, Mirai's Rust engine for Apple Silicon"
    url: https://aitamer.news/posts/uzu-rust-inference-apple-silicon-speculative-decoding/
  - title: "AI Tamer: uzu 0.6.8 as a local provider for Pi"
    url: https://aitamer.news/posts/uzu-pi-extension-local-provider/
---

On 16 October 2026 at 15:41 UTC, Mirai Labs ([@trymirai](https://x.com/trymirai/status/2111120456631615897)) posted that it was showing [uzu.run](https://uzu.run/), an "early preview of WebGPU support coming into uzu soon." The text was read through the fxtwitter API. A screenshot is attached.

On 17 October the page is a short HTML document titled Mirai, loading a hashed script under `/releases/`. The response sent `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. The bundle's error strings require cross-origin isolation, name those two headers, require WebGPU to be enabled, and require HTTPS or localhost. One string reads "Private AI, running locally in your browser."

The screenshot shows a panel labeled "WebGPU early preview," a row "Qwen3.5 0.8B" with "Mirai" under the name, "Model will be downloaded and cached locally," and "Runs on your device." That is the model name in the promo. No model was run for this account. The post, the 0.6.9 notes, and the pull request body publish no speed.

## The file the page loads

The engine worker imports `/releases/<build>/wasm/uzu_web.js`. [uzu_web.js](https://uzu.run/wasm/uzu_web.js) at the site root is the same length, 34,387 bytes. Both are wasm-bindgen glue, and the default module is `uzu_web_bg.wasm` beside the script. Root and release-path copies of that wasm file each returned 10,680,561 bytes, about 10.7 MB. The release-path copy was last modified 16 October 2026 at 17:14 GMT.

The glue starts with `@ts-self-types="./uzu_web.d.ts"`, imports an `uzu-web` snippet and an `uzu-engine` webgpu bridge, and says `createSession` belongs in a dedicated worker on a cross-origin-isolated page. The page bundle includes `react-dom`. [uzu on Apple Silicon](/posts/uzu-rust-inference-apple-silicon-speculative-decoding/) and the [Pi extension](/posts/uzu-pi-extension-local-provider/) are the Metal path. This page is the browser preview.

## Draft pull request, empty 0.6.9 notes

[trymirai/uzu](https://github.com/trymirai/uzu) is MIT, and GitHub's language field is Rust. [Release 0.6.9](https://github.com/trymirai/uzu/releases/tag/0.6.9) was published 16 October 2026 at 17:33 UTC with an empty body. The tag is commit `ef22f126`. Its `crates/uzu-engine/Cargo.toml` defaults to `cpu`, `metal`, and `grammar`, and it has no `webgpu` feature. The 0.6.9 tag does not include the WebGPU backend.

[Pull request 380](https://github.com/trymirai/uzu/pull/380), "WebGPU," opened 29 April 2026 by `uuuvn`. On 17 October it was still an open draft, not merged, with one commit, [`9bced698`](https://github.com/trymirai/uzu/commit/9bced698164f8b8d5ec9e92b54041374cdb8c1c1). The pull request updated at 01:55 UTC on 17 October. The commit author date is 2 August 2026 at 09:35 UTC. The committer date is 17 October 2026 at 01:55:19 UTC. The author date is August.

The commit changes 117 files (5,855 additions, 84 deletions). It adds `crates/uzu-engine/src/backends/webgpu/` and 59 `.slang` files under `crates/uzu-engine/src/backends/slang/`. That commit's workspace manifest pins `wgpu` 30.0.1, `naga` 30.0.1, and `shader-slang` from the slang-rs repository. Engine default features there are `metal`, `webgpu`, `cpu`, and `grammar`. The `webgpu` feature enables `shader-slang`, `shader-slang-sys`, `naga`, and `wgpu`. The kernels are Slang, compiled through slang-rs and naga.

That same manifest sets the package version to 0.6.9. The string is the draft commit's file. The tagged 0.6.9 SHA is different, and its engine manifest does not add `webgpu`.

The pull request file list has no `uzu-web` crate. The live glue imports one. `bindgen_file.rs` in the pull request is an engine build script, not the wasm-bindgen glue the site serves.

The page and the 10.7 MB wasm file are public. WebGPU in the engine is the open draft. Mirai's wording is an early preview of support coming soon.
