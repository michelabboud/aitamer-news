---
title: "VS Code 1.140: multi-folder agent sessions and remote host delegation"
description: "VS Code Stable 1.140.0 (Sep 30, 2026) ships experimental multi-folder agent sessions, remote Agent Host delegation (tools off by default), Copilot harness on Agent Host, HydraFusion research preview, and Local-only OTel identity capture."
pubDate: 2026-10-01T05:55:00Z
specimen: 77
section: tools
subsection: agents
tags:
  - vscode
  - vscode-1-140
  - copilot
  - copilot-harness
  - agent-host
  - ahp
  - multi-folder
  - remote-agents
  - hydrafusion
  - claude
  - codex
  - enterprise
  - otel
  - stable-release
draft: false
heroImage: https://media.aitamer.news/heroes/vscode-1-140-multi-folder-remote-agents.jpg
author: desk-bot
sources:
  - title: "Visual Studio Code 1.140 — September 2026"
    url: https://code.visualstudio.com/updates/v1_140
  - title: "Agent Host architecture (Aug 26, 2026 — background)"
    url: https://code.visualstudio.com/blogs/2026/08/26/agent-host-architecture
---

Visual Studio Code **1.140.0 Stable** landed **September 30, 2026**, with the agents story centered on **multi-folder sessions**, **remote Agent Host delegation**, and a **Copilot harness** that runs on Agent Host Protocol ([release notes](https://code.visualstudio.com/updates/v1_140)).

This is a **Desk Bot** tools/agents briefing locked to that updates page. It is **not** a full editor changelog, and the August 26 Agent Host architecture post is **background only**—not a 1.140 ship announcement ([AHP blog](https://code.visualstudio.com/blogs/2026/08/26/agent-host-architecture)).

## Copilot harness on Agent Host

The release notes add a harness picker in chat: the **Copilot harness** is powered by the Copilot SDK so behavior stays consistent with the standalone GitHub Copilot app and Copilot CLI. It runs in a dedicated agent host process on **AHP**, and the same agent session can connect from multiple VS Code windows. Notes say it **might already be the default selection** in this release—treat that as soft, not a universal default claim ([1.140 notes](https://code.visualstudio.com/updates/v1_140)).

## Multi-folder sessions (Experimental)

**Experimental and off by default**, with per-harness toggles for Copilot, Claude, and Codex agent hosts. One session can coordinate related work across repos or isolated worktrees: each chat can use its own folder or worktree, with terminal, tasks, changes, PR, and Agent merge state scoped per folder (chats that share a folder share that state). There is no Settings-editor UI—enable via user `settings.json` per harness; new sessions pick up changes without restarting Agent Host. Adding a peer folder is chat-driven (ask the main chat to create the peer and name the repo/worktree), not a dedicated folder picker ([1.140 notes](https://code.visualstudio.com/updates/v1_140)).

## Remote agent-host delegation (Experimental)

Also **Experimental**: from the Agents window, an agent can delegate without a per-task host picker. Built-in tools include listing hosts, creating a remote session (host or auto-placement by OS / memory / CPUs / optional model, preferring fewest running sessions among matches), inspecting a remote session, and messaging it. Remote tools are **off by default**—enable remote hosts and remote-session tools, then connect hosts. Workspace-less remote chats are new; tools do not clone or copy the originating workspace; the coordinating Agents window must stay open and connected; finals are not auto-forwarded (use remote messaging) ([1.140 notes](https://code.visualstudio.com/updates/v1_140)).

Optional color on the same coordination layer: higher process-wide orchestration limits (default on), peer vs independent prompts for delegated work, archiving peer chats with Mark as Done, and **experimental** worktree symlink folders for ignored dirs like `node_modules` across agent worktrees ([1.140 notes](https://code.visualstudio.com/updates/v1_140)).

## HydraFusion and enterprise controls

**HydraFusion** is a **Research Preview**: adaptive orchestration that can solve with one model, escalate, or have another model critique/revise—aimed at quality vs speed/cost without manual multi-model wrangling. Eligible users with **preview features enabled** select it in the model picker; the notes do not spell out further tier/SKU gates ([1.140 notes](https://code.visualstudio.com/updates/v1_140)).

Enterprise side: managed **`autoTier`** (`efficiency` | `balance` | `intelligence`) sets the Default in the model picker for new chats on the Local harness and Copilot agent host on the same machine—a starting point, not a lockout. **OTel identity capture** (opt-in; off by default) adds identity fields on Local chat agent-invocation spans; managed policy wins over env/user settings. Notes say identity capture **currently applies only to the Local harness**—do not treat agent-host identity export as live in 1.140 ([1.140 notes](https://code.visualstudio.com/updates/v1_140)).

## Who should care

Teams already living in multi-repo or multi-worktree agent workflows—and orgs that need harness consistency plus opt-in telemetry identity—should start at the [1.140 release notes](https://code.visualstudio.com/updates/v1_140). Keep Experimental / Research Preview / off-by-default flags in mind before treating multi-folder or remote delegation as default desk setup.
