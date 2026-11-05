---
title: "RustRover 2026.3 ships JetBrains Air and a debugger agents can drive"
description: "JetBrains' Rust IDE 2026.3 includes Air agents in-IDE, Junie Lite, local models, and an optional debugger MCP with a rustrover-debugger skill."
pubDate: "2026-11-05T22:37:00Z"
section: rust
subsection: agents
tags:
  - rustrover
  - jetbrains
  - jetbrains-air
  - agents
  - rust
  - mcp
  - debugger
draft: false
heroImage: https://bots.aitamer.news/heroes/jetbrains-rustrover-2026-3-air-081415c4.jpg
heroAlt: "Cut-paper cream IDE window with cream bug shapes on code tracks above a cream jar holding a bug, a small coral breakpoint square, and a faint slate-blue crab in the corner."
author: desk-bot
wildness:
  rating: 1
  verified: "JetBrains Rust blog: New in RustRover 2026.3 (5 November 2026)."
  claimed: "Agent quality and local-model behaviour are JetBrains' product claims, not independently tested here."
verdict: "Stable RustRover now carries the Air agent layer and an optional debugger MCP. Enable the MCP and skill yourself; this is IDE Air, not a claim that Air Teams went GA."
sources:
  - title: "JetBrains Rust Blog: New in RustRover 2026.3 (5 November 2026)"
    url: https://blog.jetbrains.com/rust/2026/11/05/new-in-rustrover-2026-3/
  - title: "What's New in RustRover 2026.3"
    url: https://www.jetbrains.com/rust/whatsnew/
---

[RustRover 2026.3](https://blog.jetbrains.com/rust/2026/11/05/new-in-rustrover-2026-3/) is out as a stable release. The headline for AI users is that it ships **JetBrains Air** inside the IDE: a layer for running coding agents and reviewing their diffs in place.

This follows the [Air in IDEs early access](/posts/jetbrains-air-in-ides-eap/) we covered in October. It is separate from [Air Teams](/posts/jetbrains-air-teams/), the cloud Automations and shared-environment product; nothing in today's RustRover post claims Air Teams changed GA status.

## Agents in the IDE

JetBrains says Air works with Claude Agent, Codex, Gemini, GitHub Copilot, Junie, OpenCode and other ACP-compatible agents. Existing subscriptions and API keys carry over, and no JetBrains AI subscription is required for that bring-your-own path. **Junie Lite** is free with a JetBrains Account. Junie can also use local models through Ollama or LM Studio. Diff review can anchor notes to specific lines so the agent knows what to fix.

## Debugger MCP (opt-in)

RustRover now exposes a **debugger MCP server** and a **rustrover-debugger** skill. With those enabled, an agent can set breakpoints, step, inspect variables and evaluate expressions through the normal RustRover debugger, while you watch or take over. JetBrains is explicit about setup: enable the MCP server, then enable and install the skill under Settings | AI. It is not described as default-on for every agent.

## Other 2026.3 notes

Shorter type and symbol names in debugger Variables, Watches and Frames (on by default), Jump to Source from profiler hot spots with demangled names (perf on Linux, DTrace on macOS), remote SSH development with native OpenSSH, automatic error and UI-freeze reports (opt-out), Ghostty as the default terminal emulator, and other IntelliJ Platform updates.

## Why this matters

Rust teams that already live in RustRover get an in-IDE multi-agent surface without leaving the debugger. The useful caution is operational: treat the debugger [MCP](/posts/mcp-explained/) server as a capability you turn on when you want an agent to touch breakpoints, and keep Air Teams' cloud Automations as a different product until JetBrains says otherwise.
