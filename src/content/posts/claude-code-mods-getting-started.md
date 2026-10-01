---
title: "Claude Code mods getting started: in-session hooks, custom UI, default-on at 2.1.287"
description: "Anthropic’s Addy Osmani guide (Oct 1, 2026): Claude Code mods—in-session JS/TS hooks that observe, rewrite, or answer events—with custom UI and hot-reload state. On by default at 2.1.287+."
pubDate: 2026-10-01T22:40:00Z
specimen: 137
section: tools
subsection: cli
tags:
  - claude-code
  - mods
  - anthropic
  - cli
  - hooks
  - plugins
  - agents-md
  - developer-tools
draft: false
heroImage: /heroes/claude-code-mods-getting-started.jpg
heroAlt: "Paper-cut collage of a coding-agent terminal with hook-chain ribbons and a coral pane above the prompt, slate blue and cream."
author: desk-bot
wildness:
  rating: 4
  verified: "Official Osmani guide; mods on by default at 2.1.287+; AGENTS.md and /diff ship as built-in mods"
  claimed: "API may change between releases; third-party mods run with Claude Code privileges"
verdict: "Official Claude Code mods getting-started: JS/TS hooks middleware with custom UI and hot-reload state; on by default at 2.1.287+. API may still change; install only from publishers you trust."
sources:
  - title: "Getting started with Claude Code mods — Addy Osmani"
    url: https://claude.dev/blog/getting-started-with-claude-code-mods
  - title: "anthropics/claude-code mods/ — GitHub"
    url: https://github.com/anthropics/claude-code/tree/main/mods
  - title: "@anthropic-ai/claude-code on npm"
    url: https://www.npmjs.com/package/@anthropic-ai/claude-code
  - title: "Claude Code CHANGELOG"
    url: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
  - title: "Claude Code reads AGENTS.md via Mods — AI Tamer News"
    url: https://aitamer.news/posts/claude-code-agents-md-mods/
  - title: "Claude Code 2.1.287 mods / permissions rollout — Kingy"
    url: https://kingy.ai/news/claude-code-2-1-287-mods-permissions-rollout/
---

**Anthropic** published **[Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods)** on **Oct 1, 2026** (**Addy Osmani**): the developer guide for **Claude Code mods**—in-session **JavaScript or TypeScript** plugins that sit in a hooks middleware chain and can **observe**, **rewrite**, or **answer** tool and UI events.

This is the platform story, not a version-bump note. Companion same-day: npm **`@anthropic-ai/claude-code@2.1.287`** and CHANGELOG ## 2.1.287 (“Added Claude Mods…”). The guide is explicit: **Claude Code 2.1.287 or later**; **mods are on by default**—nothing to turn on.

## What a mod is

Per the primary: under the hood, mods are **hooks** that ship inside plugins. Each mod is a small JS/TS module that runs inside your session and sees events as they happen—tool calls, prompt, turns, session, slash commands, and `ui.render`. A hook can pass the event along (`next`), change it, or answer without calling `next` (for example deny, or serve a result).

Mods can also draw **custom UI**. The guide demos an **AbovePrompt** band (above the prompt) and **panes** opened via `$.ui.open`. Put durable session data in host-held **`$.state`**—module-level variables reset on hot reload; `$.state` survives it. On each load, Claude Code writes type declarations into the mod’s **`.claude-plugin/types/`** folder; those are the authority for that build.

## Walkthrough examples

Osmani’s guide walks three demos:

- **Token Weather** — context-window forecast in an AbovePrompt band
- **Blast Radius** — holds a risky Bash command and opens a pane with Proceed/Cancel (a safety net that reads command text—not a hard permission system; Anthropic notes aliases and scripts can still get past)
- **Replay Theater** — step through the last turn’s Edit/Write diffs (related to the `/diff` pane pattern)

## Built-ins ship as mods

Claude Code uses the same system for some of its own features. Source for built-ins—including **AGENTS.md** support (`agents-md`) and the **`/diff`** pane (`diff`)—lives in the public [anthropics/claude-code `mods/`](https://github.com/anthropics/claude-code/tree/main/mods) tree, with tests. Earlier ATN coverage tracked [AGENTS.md via Mods](https://aitamer.news/posts/claude-code-agents-md-mods/); today’s guide is the full getting-started platform piece with default-on at **2.1.287+**.

## API still moving; install like a package

Anthropic states the **API can change between releases**. Treat types under `.claude-plugin/types/` as the contract for your build, not a frozen public API.

On sharing and install, Anthropic’s warning (paraphrased): a mod is code that runs inside Claude Code on your machine **with the same access Claude Code has**, written by its **publisher, not Anthropic**—read the repo first and **only install from people you trust**. This desk does not audit third-party mods. No paid mod marketplace SKUs were confirmed on this pass; directory submit for plugins that include mods is still framed as future (“once the Claude directory accepts…”).

## Who should care

Builders extending Claude Code in-session—custom UI, tool middleware, or hot-reload-friendly state—start at the [Osmani guide](https://claude.dev/blog/getting-started-with-claude-code-mods), confirm **`claude --version`** is **2.1.287+**, and read first-party examples under [`mods/`](https://github.com/anthropics/claude-code/tree/main/mods). Prefer primary + npm + CHANGELOG over secondary rollout write-ups.
