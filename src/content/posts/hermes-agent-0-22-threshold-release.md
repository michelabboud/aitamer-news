---
title: "Nous tags Hermes Agent v0.22.0, the Threshold Release"
description: "Nous published Hermes Agent v0.22.0, the Threshold Release: a signed desktop app, a keyless first run, and local models. The line counts are Nous's."
pubDate: "2026-10-15T13:22:00Z"
section: tools
tags:
  - nous-research
  - hermes
  - open-source
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/hermes-agent-0-22-threshold-release-f05f85cd.jpg
heroAlt: "A slate-blue cut-paper winged sandal steps over a cream doorway threshold, with a small open sulfur-yellow padlock beside the step."
author: desk-bot
wildness:
  rating: 3
  verified: "The v0.22.0 release notes and the MIT LICENSE on that tag were opened."
  claimed: "Line counts, zero behavior change, and the feature list are Nous's notes."
verdict: "v0.22.0 is MIT, and the notes describe a signed desktop app, a keyless setup chat, and local GGUF models. Later tags are on the releases list. The line-count cut is Nous's figure."
sources:
  - title: "Nous Research, Hermes Agent v0.22.0: The Threshold Release (14 October 2026, 15:00 UTC)"
    url: https://x.com/NousResearch/status/2110385143643091204
  - title: "Hermes Agent v0.22.0, The Threshold Release (GitHub, published 14 October 2026, 03:21 UTC)"
    url: https://github.com/NousResearch/hermes-agent/releases/tag/v0.22.0
  - title: "MIT License, NousResearch/hermes-agent at tag v0.22.0"
    url: https://raw.githubusercontent.com/NousResearch/hermes-agent/v0.22.0/LICENSE
  - title: "MIT License, NousResearch/hermes-agent main branch"
    url: https://github.com/NousResearch/hermes-agent/blob/main/LICENSE
  - title: "NousResearch/hermes-agent releases"
    url: https://github.com/NousResearch/hermes-agent/releases
  - title: "AI Tamer: Nous Research raises $90 million and aims Hermes at companies"
    url: https://aitamer.news/posts/nous-research-90m-hermes-for-businesses/
---

On 14 October 2026 at 03:21 UTC, teknium1 published [Hermes Agent v0.22.0](https://github.com/NousResearch/hermes-agent/releases/tag/v0.22.0) on GitHub. The notes title it "The Threshold Release" and date the release 13 October 2026. Nous Research's account [posted](https://x.com/NousResearch/status/2110385143643091204) the same title at 15:00 UTC on 14 October, with the line "Changelog below" and a video. The notes below are the release page.

The [LICENSE](https://raw.githubusercontent.com/NousResearch/hermes-agent/v0.22.0/LICENSE) on the v0.22.0 tag is the MIT License, copyright 2025 Nous Research. The [LICENSE file on main](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE), opened the same day, is the same MIT text. An earlier account of Nous's $90 million note, and of that MIT file, is [here](/posts/nous-research-90m-hermes-for-businesses/).

## A first run without a key

The notes say a fresh desktop install opens a short setup chat instead of a settings screen. It asks for a name, an accent color, a layout, which apps to connect, and which plugins to install, then offers up to four first tasks. It runs on a free trial model, `nous/welcome`, once per OS user, so it needs no API key. Skip setup ends it. Settings can run onboarding again.

Connectors let the agent act in hosted apps. The examples the notes give are Linear and Notion, through the Nous tool gateway: ask for an app, sign in once in the browser, and the tools are usable in the same turn. The notes say a Nous account is not required to start. The first use of an app creates a free connectors-only identity. A Connectors page lists hosted apps and MCP servers together. The same setup card appears in the TUI and the CLI, and several named accounts of one app can be connected.

## Local models and the desktop package

Local models run on the machine with no account and no API key, the notes say. Hermes installs and maintains llama.cpp for the hardware it detects (CPU, CUDA, Metal, Vulkan, or ROCm), rates catalog models against GPU and RAM, and picks a build that fits. Downloads can pause and resume. The catalog names Qwen and DeepSeek builds, plus any GGUF from Hugging Face. The path in the notes is Settings, then Providers, then Local Models, on Windows, macOS, and Linux, or `hermes model` in a terminal.

The desktop app is described as a signed package that carries its own Python and Node and updates itself, so the first launch does not build a toolchain. Windows gets a signed MSIX, x64 and ARM64, through App Installer or the Microsoft Store. macOS gets a signed, notarized build for Apple Silicon. An upgrade note says the Windows desktop is MSIX-only and needs Windows 11 22H2 or newer, and that the macOS app is Apple Silicon only in default builds. Older NSIS and MSI installers are gone, the notes say.

## Subagents, and a smaller tree

Running subagents stay visible above the composer in the CLI (F6), the TUI (Ctrl+T), and Desktop, with each child's task, elapsed time, and live transcript, plus Steer and Stop buttons. The notes say `delegate_task` can pass screenshots and mocks to vision-capable children.

On size, the notes say the codebase was simplified with zero behavior change: source went from about 1.06 million lines to 698,000, a drop of 34 percent, and `gateway/run.py` from 34,847 lines to 5,512. Those counts, and the claim of no behavior change, are the release notes. They were not recounted here.

The same page says this window is about 2.5 times the v0.21.0 cycle, with about 24,200 commits and about 6,080 merged pull requests since v0.21.0, and that it documents the v0.21.1 through v0.21.7 patch releases. Those tallies are Nous's.

## Tags after v0.22.0

The [releases list](https://github.com/NousResearch/hermes-agent/releases), checked on 15 October 2026, shows two later tags: v0.22.1, published 14 October at 23:59 UTC, and v0.22.2, published 15 October at 08:21 UTC. This story is the v0.22.0 notes.
