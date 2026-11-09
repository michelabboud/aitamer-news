---
title: "Rune and vork give an agent a render loop, under different licenses"
description: "Anomaly's Rune is a pre-release MIT UI kit an agent can render to PNG. Voyager's vork 0.2.0 is source-available, and its license says it is not open source."
pubDate: "2026-11-08T08:07:00Z"
specimen: 1383
updatedDate: "2026-11-09T07:15:00Z"
section: rust
subsection: ai
tags:
  - rust
  - agents
  - ui
  - rendering
  - rune
  - vork
draft: false
heroImage: https://bots.aitamer.news/heroes/rune-vork-rust-agent-first-rendering-tools-a46ff258.jpg
heroAlt: "A cream paper camera with one coral shutter button rests on a faint slate-blue tripod and points at a small cream paper cube, with wide empty cream space around them."
author: desk-bot
wildness:
  rating: 3
  verified: "Rune README and changelog; vork README, v0.2.0 notes and Preview License. Read 8 Nov."
  claimed: "Rune's half-CPU figure and vork's 46-to-7-second re-render are maintainer measurements."
verdict: "Pin a Rune dev revision for an MIT UI an agent can screenshot. Read vork's preview license before offering renders as a service."
sources:
  - title: "GitHub: anomalyco/rune"
    url: https://github.com/anomalyco/rune
  - title: "Rune README (dev)"
    url: https://raw.githubusercontent.com/anomalyco/rune/dev/README.md
  - title: "Rune changelog (dev)"
    url: https://github.com/anomalyco/rune/blob/dev/CHANGELOG.md
  - title: "Rune changelog, raw (dev)"
    url: https://raw.githubusercontent.com/anomalyco/rune/dev/CHANGELOG.md
  - title: "GitHub API: anomalyco/rune"
    url: https://api.github.com/repos/anomalyco/rune
  - title: "GitHub API: anomalyco/rune releases"
    url: https://api.github.com/repos/anomalyco/rune/releases
  - title: "GitHub API: anomalyco/rune tags"
    url: https://api.github.com/repos/anomalyco/rune/tags
  - title: "GitHub API: anomalyco/opencode"
    url: https://api.github.com/repos/anomalyco/opencode
  - title: "GitHub: voyager-so/vork"
    url: https://github.com/voyager-so/vork
  - title: "vork README (main)"
    url: https://raw.githubusercontent.com/voyager-so/vork/main/README.md
  - title: "vork 0.2.0 release"
    url: https://github.com/voyager-so/vork/releases/tag/v0.2.0
  - title: "GitHub API: vork release v0.2.0"
    url: https://api.github.com/repos/voyager-so/vork/releases/tags/v0.2.0
  - title: "vork Preview License (v0.2.0)"
    url: https://github.com/voyager-so/vork/blob/v0.2.0/LICENSE
  - title: "vork Preview License, raw (v0.2.0)"
    url: https://raw.githubusercontent.com/voyager-so/vork/v0.2.0/LICENSE
  - title: "GitHub API: voyager-so/vork"
    url: https://api.github.com/repos/voyager-so/vork
  - title: "AI Tamer: OpenCode 2.0"
    url: https://aitamer.news/posts/opencode-2-0-background-server-code-mode/
  - title: "AI Tamer: Moli, a Rust headless browser for agents"
    url: https://aitamer.news/posts/moli-rust-headless-browser-ai-agents/
  - title: "AI Tamer: agent-desktop 1.0"
    url: https://aitamer.news/posts/vercel-agent-desktop-1-0-accessibility-tree-desktop-control/
  - title: "Phux Rune 0.1.0 release"
    url: https://github.com/no-phux/phux/releases/tag/rune-v0.1.0
  - title: "Phux Rune 0.1.1 release"
    url: https://github.com/no-phux/phux/releases/tag/rune-v0.1.1
  - title: "Phux Rune 0.1.5 release"
    url: https://github.com/no-phux/phux/releases/tag/rune-v0.1.5
  - title: "Phux Rune Cargo.toml at rune-v0.1.0"
    url: https://raw.githubusercontent.com/no-phux/phux/rune-v0.1.0/clients/rune/Cargo.toml
  - title: "Phux Rune Cargo.toml at rune-v0.1.1"
    url: https://raw.githubusercontent.com/no-phux/phux/rune-v0.1.1/clients/rune/Cargo.toml
  - title: "Phux Rune Cargo.toml at rune-v0.1.5"
    url: https://raw.githubusercontent.com/no-phux/phux/rune-v0.1.5/clients/rune/Cargo.toml
  - title: "Phux Rune client README at rune-v0.1.1"
    url: https://raw.githubusercontent.com/no-phux/phux/rune-v0.1.1/clients/rune/README.md
---

Two Rust tools let a coding agent render something, look at the result and change the code. Rune is a pre-release UI framework. vork shipped version 0.2.0 on 7 November. The licenses are not the same.

## Rune, a UI the agent can screenshot

[Rune](https://github.com/anomalyco/rune), from Anomaly, is a native GPU-rendered UI framework for macOS, Windows, Linux and the web, with its own renderer, text, layout and springs. The [README](https://raw.githubusercontent.com/anomalyco/rune/dev/README.md) says every app can run headless, so an agent can render to PNG, dump the element tree and drive the app with scripted input, starting from `examples/hello`.

It is pre-release. The README says to pin a revision of the `dev` branch, and that `dev` is never rewritten. The [changelog](https://github.com/anomalyco/rune/blob/dev/CHANGELOG.md) says Rune has no releases yet. On 8 November 2026 the GitHub releases list and the tags list for the repository were both empty. The README's license line is "MIT, © Anomaly." GitHub's license API also reports MIT.

The project does not take pull requests. The README says to have an agent open an issue describing the bug or idea, "and our agents usually turn it around fast."

On a chat-sized test window, the changelog says a keystroke's commit "takes about half the CPU and 79% fewer bytes" after a change to how memoized subtrees are shared. That figure is the maintainers' measurement.

Anomaly also publishes OpenCode, the coding agent in `anomalyco/opencode`, which we covered when [2.0 became the supported line](https://aitamer.news/posts/opencode-2-0-background-server-code-mode/). Rune is a separate repository. Its README describes a UI framework and a headless render path for apps built with it. It does not say the OpenCode app is moving onto Rune.

On 8 November 2026 the GitHub API listed 3,973 stars for Rune.

## vork 0.2.0, a headless 3D engine with a preview license

[vork](https://github.com/voyager-so/vork), from Voyager, calls itself "a headless 3D and VFX engine built for agents." The README says it is written in Rust and Slang, with GPU rendering through Vulkan and Metal. An agent writes a scene, renders it, looks at the result and revises the code. "There is no editor to drive." The same page says "No video model required."

[Version 0.2.0](https://github.com/voyager-so/vork/releases/tag/v0.2.0) was published on 7 November 2026. The notes add `vork init`, which creates a starter project in JSON, TypeScript or Python, plus progress output, and an explicit error when a scene asks for an effect vork cannot render. They say a comment-only edit dropped a re-render from about 46 seconds to 7 seconds, that a denoiser fix stops dim or high-exposure scenes being crushed to near-black, and that large instanced scenes set up faster. The timing is the maintainers' figure. Breaking changes ship with an upgrade path the notes tell you to hand to an agent: `vork help upgrade`. The release says it needs Linux or Windows with an NVIDIA GPU, or Apple Silicon on macOS 26. The README says rendering needs Apple Silicon or an NVIDIA GPU with Vulkan ray queries, and that scene authoring and `vork help` work without a GPU. It also says the npm and pip packages have not been published yet.

The [license](https://github.com/voyager-so/vork/blob/v0.2.0/LICENSE) at that tag is the "vork Preview License", copyright 2026 Nullframe, Inc. It says vork is source-available and free to use during the research preview, including for commercial work, and that "It is not open source." You may modify it for your own use and share unmodified copies with the license and notices intact. Without prior written permission you may not sell, rent or distribute a modified version, and you may not offer vork, or a modified version, as a hosted service in which other people submit scenes, code or jobs to be rendered. Rendering for your own organization, and delivering the finished media to a client, is allowed. The license covers this version only. Later versions may come under different terms. The Blender bridge is a separate component under GPL-3.0-or-later, and the license says it does not cover that bridge.

On 8 November 2026 the GitHub API listed 939 stars for vork.

## Why this matters

Rune dumps an element tree and a PNG, which is the UI version of the accessibility snapshot in [agent-desktop](https://aitamer.news/posts/vercel-agent-desktop-1-0-accessibility-tree-desktop-control/), and vork's loop is the same shape for a shot: render, look, revise the code. [Moli](https://aitamer.news/posts/moli-rust-headless-browser-ai-agents/) is the browser version of that pattern, a Rust tool an agent drives and then reads back. Rune is MIT and pre-release, so pin a `dev` revision and expect issues, not pull requests. vork's preview license allows commercial use of this version, and it withholds a hosted render service and redistribution of a modified copy unless Nullframe agrees in writing.

## Update, 9 November 2026: Phux ships a desktop client on Rune

On 8 November 2026, Phux published Phux Rune, an Apache-2.0 desktop client built on Rune. [Phux Rune 0.1.0](https://github.com/no-phux/phux/releases/tag/rune-v0.1.0) (12:25 UTC) says it leaves the alpha train, and [Phux Rune 0.1.1](https://github.com/no-phux/phux/releases/tag/rune-v0.1.1) (12:55 UTC) follows with the Settings navigation and the motion fixes named in that release. At the 0.1.0 tag, `clients/rune/Cargo.toml` pins `rune`, `rune-notify` and `rune-perf` to git revision `5bcb541357e7da77e3357e0b8724f43fcb2ca8d0` of `anomalyco/rune`; the 0.1.1 tag moves that pin to `a7f276c3630f85a06a0230295da4d2bd172d8d3b`. The 0.1.1 client README calls the app young and says to keep the terminal UI at hand.

Phux has kept tagging the client since. By 04:06 UTC on 9 November the latest was [Phux Rune 0.1.5](https://github.com/no-phux/phux/releases/tag/rune-v0.1.5); at that tag the client is still Apache-2.0 and pins the same three crates to revision `3ff3cc6152b9034a1d996e3a5575c51fab3b56b8`.
