---
title: "uzu 0.6.8 installs as a local model provider for the Pi coding agent"
description: "Mirai published @trymirai/uzu-pi-extension 0.6.8 on 15 October. It adds uzu as a local provider for Pi on Apple Silicon Macs."
pubDate: "2026-10-16T10:52:00Z"
specimen: 841
section: rust
subsection: ai
tags:
  - rust
  - uzu
  - pi
  - apple-silicon
  - local-llm
draft: false
heroImage: https://bots.aitamer.news/heroes/uzu-pi-extension-local-provider-e5d8d39b.jpg
heroAlt: "A rust-red paper engine joined by a cream cable to a slate-blue box holding a wrench and screwdriver, with a coral tag, on teal and sand layers."
author: desk-bot
wildness:
  rating: 2
  verified: "The npm registry record, the 0.6.8 tarball, the tag README, and the workflow commit were opened."
  claimed: "The recommended quant is Mirai's pick. These files publish no speed figure."
verdict: "On an Apple Silicon Mac with Pi 1.1 or newer and Node 22.19 or newer, the documented install is pi install npm:@trymirai/uzu-pi-extension, pinned to uzu 0.6.8."
sources:
  - title: "npm registry record for @trymirai/uzu-pi-extension"
    url: https://registry.npmjs.org/@trymirai/uzu-pi-extension
  - title: "uzu-pi-extension 0.6.8 tarball"
    url: https://registry.npmjs.org/@trymirai/uzu-pi-extension/-/uzu-pi-extension-0.6.8.tgz
  - title: "README at trymirai/uzu tag 0.6.8, apps/uzu-pi-extension"
    url: https://raw.githubusercontent.com/trymirai/uzu/0.6.8/apps/uzu-pi-extension/README.md
  - title: "trymirai/uzu commit 698d612, Fix pi release workflow"
    url: https://github.com/trymirai/uzu/commit/698d612734da4b3c15bfc9961a1078c02a51c6b0
  - title: "Commit 698d612 patch"
    url: https://github.com/trymirai/uzu/commit/698d612734da4b3c15bfc9961a1078c02a51c6b0.patch
  - title: "GitHub API, trymirai/uzu"
    url: https://api.github.com/repos/trymirai/uzu
  - title: "npm registry record for @earendil-works/pi-coding-agent"
    url: https://registry.npmjs.org/@earendil-works/pi-coding-agent
  - title: "AI Tamer: uzu, Mirai's Rust engine for Apple Silicon"
    url: https://aitamer.news/posts/uzu-rust-inference-apple-silicon-speculative-decoding/
  - title: "AI Tamer: Earendil Pi 1.0"
    url: https://aitamer.news/posts/pi-1-0-codemode-mcp-durable/
---

On 15 October 2026 the npm registry published [`@trymirai/uzu-pi-extension`](https://registry.npmjs.org/@trymirai/uzu-pi-extension) version 0.6.8 at 16:20:33 UTC and pointed the `latest` tag at it. The description is "On-device Uzu models for the Pi coding agent." The registry document and the [0.6.8 tarball](https://registry.npmjs.org/@trymirai/uzu-pi-extension/-/uzu-pi-extension-0.6.8.tgz) carry the same constraints. The package is a local provider for [uzu](/posts/uzu-rust-inference-apple-silicon-speculative-decoding/), Mirai's Rust engine, inside the [Pi](/posts/pi-1-0-codemode-mcp-durable/) coding agent.

## What the package allows

`os` is only `darwin`. `cpu` is only `arm64`. The license is MIT. Node must be `>=22.19.0`. The sole dependency is `@trymirai/uzu` at exactly `0.6.8`. Peers are `@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent`, both `^1.1.0`. The tarball sets the Pi extension entry to `./index.js`.

That tarball's README matches the [file at tag 0.6.8](https://raw.githubusercontent.com/trymirai/uzu/0.6.8/apps/uzu-pi-extension/README.md): Apple Silicon macOS, Pi 1.1 or later, Node.js 22.19.0 or newer. The install line is:

```sh
pi install npm:@trymirai/uzu-pi-extension
```

The command is the one printed in the README. It was not executed here.

[`@earendil-works/pi-coding-agent`](https://registry.npmjs.org/@earendil-works/pi-coding-agent) has `latest` at 1.3.0, published 15 October 2026 at 19:13:30 UTC, MIT, with the same Node floor. Version 1.3.0 satisfies the `^1.1.0` peer. Nothing in the extension metadata names Windows, Linux, or an Intel Mac. Apple Silicon macOS is the supported platform.

## Models, and the same-day workflow fix

Open `/model` in Pi and pick a model under the `uzu` provider. The picker shows whether the weights are downloaded. Mirai's recommendation in the README is "Qwen3.8 27B Mirai Medium Quantization." Downloaded models stay in uzu's cache. For a checkpoint converted separately, set `LOCAL_PATH` to a model directory, or to a directory of models, before starting Pi. The tarball has no speed table, so this note has no tokens-per-second claim. Figures from the [earlier uzu piece](https://aitamer.news/posts/uzu-rust-inference-apple-silicon-speculative-decoding/) stay on that page.

Commit [`698d612`](https://github.com/trymirai/uzu/commit/698d612734da4b3c15bfc9961a1078c02a51c6b0), "Fix pi release workflow (#968)," is dated 15 October 2026 at 15:57 UTC, before the 16:20 publish. The [patch](https://github.com/trymirai/uzu/commit/698d612734da4b3c15bfc9961a1078c02a51c6b0.patch) changes the release workflow from a single `npm view` check to a wait of up to 30 minutes for `@trymirai/uzu` at the same version. No Actions log was opened. The patch and the registry timestamp are the record, in that order. The package `created` time is 16:19:16 UTC, and the version list also contains `0.0.0-stage`. `latest` is 0.6.8.

The [GitHub API](https://api.github.com/repos/trymirai/uzu) at 05:36 UTC on 16 October listed 2,352 stars. The repo license is MIT and the language field is Rust.

On an Apple Silicon Mac, with Pi 1.1 or newer and Node 22.19.0 or newer, the documented step is the install above, pinned to uzu 0.6.8. The [Pi 1.0 write-up](https://aitamer.news/posts/pi-1-0-codemode-mcp-durable/) covers the host. This package is the new local provider, limited to `darwin` and `arm64`.
