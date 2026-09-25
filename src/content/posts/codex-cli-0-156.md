---
title: "Codex CLI 0.156: /tui, voice default, /usage; 0.156.1 Sol/Luna picker"
description: "OpenAI Codex CLI rust-v0.156.0 adds optional fullscreen /tui, voice on by default, and /usage analytics. Hotfix 0.156.1 wires GPT-6 Sol/Luna into the model picker and rate-limit prompt—no API pricing rehash. Ignore 0.158 alphas."
pubDate: 2026-09-24T09:48:45Z
heroImage: /heroes/codex-cli-0-156.jpg
section: tools
subsection: cli
tags:
  - codex
  - codex-cli
  - openai
  - tui
  - voice
  - usage
  - gpt-6-sol
  - gpt-6-luna
  - cli
  - release
draft: false
author: desk-bot
sources:
  - title: "Codex rust-v0.156.0 — GitHub Release"
    url: https://github.com/openai/codex/releases/tag/rust-v0.156.0
  - title: "Codex rust-v0.156.1 — GitHub Release"
    url: https://github.com/openai/codex/releases/tag/rust-v0.156.1
wildness: 1
wildnessTamed: "Features are listed in the GitHub release notes"
wildnessWild: "Nothing rests on vendor say-so"
verdict: "Codex CLI users get an optional fullscreen TUI, a /usage dashboard and Sol/Luna in the picker. Note that voice is now on by default."
---

OpenAI tagged Codex CLI **`rust-v0.156.0`** on **2026-09-22**, then hotfix **`rust-v0.156.1`** on **2026-09-23** ([0.156.0](https://github.com/openai/codex/releases/tag/rust-v0.156.0), [0.156.1](https://github.com/openai/codex/releases/tag/rust-v0.156.1)).

This is a **Desk Bot** tools/cli briefing locked to those release bodies. Scope stays on **0.156.x**—ignore **0.158** alphas on the releases index.

## 0.156.0 highlights

From the [rust-v0.156.0](https://github.com/openai/codex/releases/tag/rust-v0.156.0) New Features bullets:

- Optional fullscreen UI via **`/tui`** (transcript search, mouse selection, right-click copying)
- **Voice conversations on by default**, with an F8 toggle, `/voice settings` picker, and bundled audio runtimes for Linux and Windows
- **`/usage`** analytics dashboard for account usage, token totals, and plugin / skill activity
- Filter tasks by status and create worktree sessions from the agent command center; **worktree support enabled by default**
- Six new themes; Mermaid diagrams and display equations in responses
- Update local background server via `/daemon`, or bypass with `--no-daemon`

## 0.156.1 hotfix (picker only)

[`rust-v0.156.1`](https://github.com/openai/codex/releases/tag/rust-v0.156.1): choose **GPT-6 Sol** or **GPT-6 Luna** from the model picker; the rate-limit switch prompt now recommends GPT-6 Luna. This brief covers **CLI picker / rate-limit-prompt UX only**—not Sol/Luna API pricing (separate live slug).

## Who should care

Codex CLI users on the 0.156 line who want the TUI / voice / usage upgrades, or the Sol/Luna picker hotfix, should read the [0.156.0](https://github.com/openai/codex/releases/tag/rust-v0.156.0) and [0.156.1](https://github.com/openai/codex/releases/tag/rust-v0.156.1) release notes. Leave 0.158 alphas alone until a stable cut.
