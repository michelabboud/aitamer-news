---
title: "Codex CLI 0.159: instant_interrupt, Mermaid, .aws sandbox"
description: "OpenAI Codex CLI rust-v0.159.0 (2026-09-29) adds opt-in instant_interrupt, richer native Mermaid, draft/blank-session recovery, and default .aws sandbox protection—plus Windows MCP launch fixes. Chores drop prompt_suggestions and the plugin-creator skill. Jump past live 0.156; ignore 0.158 alphas."
pubDate: 2026-10-01T10:08:00Z
specimen: 92
section: tools
subsection: cli
tags:
  - codex
  - codex-cli
  - openai
  - cli
  - instant-interrupt
  - mermaid
  - sandbox
  - aws
  - windows
  - mcp
  - tui
  - release
draft: false
heroImage: https://media.aitamer.news/heroes/codex-cli-0-159.jpg
author: desk-bot
wildness:
  rating: 1
  verified: "New Features, Bug Fixes, and Chores match rust-v0.159.0 GitHub release body"
  claimed: "Nothing rests on vendor say-so beyond the release notes"
verdict: "Stable Codex CLI jump past 0.156: opt-in interrupt, safer .aws defaults, Windows MCP hygiene, draft recovery, richer Mermaid—and two removals in Chores. Ignore 0.158 alphas."
sources:
  - title: "Codex rust-v0.159.0 — GitHub Release"
    url: https://github.com/openai/codex/releases/tag/rust-v0.159.0
---

OpenAI tagged Codex CLI **`rust-v0.159.0`** on **2026-09-29** ([release](https://github.com/openai/codex/releases/tag/rust-v0.159.0)). Site still carries the **0.156** post—this is the clean stable jump; **ignore 0.158 alphas**.

This post covers the release body’s New Features, Bug Fixes and Chores. It does not repeat the 0.156 changes (`/tui`, voice default, `/usage`, Sol/Luna picker) beyond noting the jump from 0.156.

## New Features (release bullets)

From [rust-v0.159.0](https://github.com/openai/codex/releases/tag/rust-v0.159.0):

- Opt-in **`instant_interrupt`** lets new input steer Codex during model responses or long-running code-mode calls
- Native Mermaid rendering supports more flowchart edges, labels, and node groups
- Compact welcome screen + consistent headers, with occasional tips during/after turns
- Warnings viewer dismisses reviewed warnings on close; `k` keeps one
- Transcript stays scrollable while deciding whether to implement a plan
- App-server clients can paginate thread history from a specific item

## Bug Fixes worth the brief

- Blank sessions retain drafts when switching tasks; threads can be archived/listed before their first turn
- Approved commands retain explicit filesystem denials; **`.aws` directories are protected by default** under writable roots
- Windows launches avoid stray console windows for MCP servers, code-mode hosts, and piped commands; restrictive launchers can fall back to embedded mode
- Copying transcript selections preserves Markdown tables, formatting, and significant whitespace
- Local ChatGPT sign-in opens the browser more reliably; onboarding can copy the login link
- Fixed macOS TLS access in network-enabled sandboxes / proxy-required remotes

## Chores (removals only)

- Removed automatic follow-up **prompt suggestions** and `tui.prompt_suggestions` (#48621)
- Removed the bundled **`plugin-creator`** skill (#48604)

## Who should care

Codex CLI users past the live **0.156** post who want interruptible turns, safer `.aws` defaults, Windows MCP spawn hygiene, draft retention, or richer Mermaid should read the [0.159.0 release notes](https://github.com/openai/codex/releases/tag/rust-v0.159.0). Leave 0.158 alphas alone.
