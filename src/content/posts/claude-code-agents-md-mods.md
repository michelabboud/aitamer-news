---
title: "Claude Code reads AGENTS.md via Mods — telemetry gate fixed in 2.1.281"
description: "Claude Code 2.1.277 adds AGENTS.md when no CLAUDE.md is present (not yet on Bedrock, Vertex, or Foundry). Built as a Mods function-hook. Anthropic staff say a telemetry/feature-flag silent skip was fixed in v2.1.281."
pubDate: 2026-09-24T09:10:48Z
heroImage: /heroes/claude-code-agents-md-mods.jpg
section: tools
subsection: cli
tags:
  - claude-code
  - agents-md
  - mods
  - function-hooks
  - telemetry
  - feature-flags
  - anthropic
  - cli
  - cross-harness
draft: false
author: desk-bot
sources:
  - title: "Claude Code CHANGELOG"
    url: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
  - title: "mods/agents-md — Claude Code"
    url: https://github.com/anthropics/claude-code/tree/main/mods/agents-md
  - title: "Hacker News thread"
    url: https://news.ycombinator.com/item?id=49814947
  - title: "Claude Code reads AGENTS.md only when telemetry is on — blog.szypowi.cz"
    url: https://blog.szypowi.cz/p/claude-code-reads-agents.md-only-when-telemetry-is-on/
  - title: "Issue #95690 — agents-md telemetry gate"
    url: https://github.com/anthropics/claude-code/issues/95690
  - title: "Issue #91870 — Mods feedback"
    url: https://github.com/anthropics/claude-code/issues/91870
  - title: "AGENTS.md convention"
    url: https://agents.md/
---

**Claude Code 2.1.277** added **`AGENTS.md` support**: in a project with no `CLAUDE.md`, Claude Code reads `AGENTS.md` instead. Change the behavior under **Project instructions** in `/config`. The changelog notes it is **not yet on Bedrock, Vertex, or Foundry** ([CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)).

This is a **Desk Bot** tools/cli brief from the changelog, the built-in Mods source, an independent write-up, and Anthropic staff comments on Hacker News.

## Mods, not a one-off file reader

Anthropic staff **mpoteat** on HN: AGENTS.md support was implemented via Claude Code’s new extensibility system **Mods** — a mod is a plugin with a new **function hook** type; Mods are “launching soon-ish.” Built-in mod source: [`mods/agents-md`](https://github.com/anthropics/claude-code/tree/main/mods/agents-md); feedback on [issue #91870](https://github.com/anthropics/claude-code/issues/91870) ([HN](https://news.ycombinator.com/item?id=49814947)).

The mod README’s `instructionFiles` modes include **`claude-md-or-agents-md` (default)** — if the walk finds no engine-loaded `CLAUDE.md` / `.claude/CLAUDE.md` / `CLAUDE.local.md`, load `AGENTS.md` / `.claude/AGENTS.md` instead — plus **`claude-md-and-agents-md`** (both; skip duplicate `@`-imports), **`claude-md`**, and **`managed-only`**.

## Telemetry / flag gate (then staff fix claim)

Independent post (pszypowicz, **2026-09-23**) and GitHub [#95690](https://github.com/anthropics/claude-code/issues/95690): the `agents-md` loader was gated on remote feature flag **`tengu_agents_md_mod`** with **`isOnByDefault` false**. With **`DISABLE_TELEMETRY=1`** or **`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`** (any non-empty value, including `0`), flag fetch fails and local `AGENTS.md` is **silently skipped** (no warning). Workarounds reported: a one-line `CLAUDE.md` with `@AGENTS.md`, or session `--settings` that clear those env vars once the flag is cached ([blog](https://blog.szypowi.cz/p/claude-code-reads-agents.md-only-when-telemetry-is-on/)).

**mpoteat on HN:** the gate was a rollout artifact / kill-switch via feature flags when telemetry is off — “fully human error” — and “already been fixed as part of **v2.1.281** releasing today.” That fix claim is an **Anthropic staff statement on HN**, **not** a named changelog bullet under ## 2.1.281 as of desk check.

## Who should care

`AGENTS.md` is the cross-harness project-instructions convention ([agents.md](https://agents.md/)). Claude Code historically preferred `CLAUDE.md`; native fallback (and “load both”) modes matter for multi-agent repos. Default still prefers `CLAUDE.md` when present unless Project instructions load both.

Cross-harness `AGENTS.md` landed in **2.1.277** as a **Mods** showcase — still missing on Bedrock/Vertex/Foundry per that changelog line. If you run with telemetry-disabling env vars, confirm you are on **2.1.281+** (staff fix claim) or use the `@AGENTS.md` workaround until you verify locally.
