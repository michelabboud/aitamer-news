---
title: "Earendil Pi 1.0: MIT coding-agent harness with Codemode, MCP, and experimental Durable"
description: "Earendil ships Pi 1.0—MIT hardened minimal coding-agent harness with Codemode (native MCP), deferred tools, virtual models, Anthropic cache warming, and fullscreen TUI. Same-day experimental Pi Durable."
pubDate: 2026-10-01T22:30:00Z
specimen: 136
section: tools
subsection: cli
tags:
  - pi
  - earendil
  - coding-agent
  - mcp
  - codemode
  - cli
  - tui
  - mit
  - open-source
  - agents
  - pi-durable
draft: false
heroImage: /heroes/pi-1-0-codemode-mcp-durable.jpg
heroAlt: "Paper-cut collage of a minimal coding-agent terminal with MCP tool ribbons and a coral crash-resume thread, slate blue and cream."
author: desk-bot
wildness:
  rating: 4
  verified: "MIT Pi 1.0; Codemode+native MCP; deferred tools; virtual models; Anthropic cache; fullscreen TUI; experimental Durable"
  claimed: "Earendil: hundreds of thousands use Pi weekly; Durable API may change; does not replace coding agent"
verdict: "Earendil Pi 1.0 MIT minimal coding-agent harness with Codemode/MCP—same-day experimental Pi Durable for crash-resumable multiplayer apps; API may change."
sources:
  - title: "Pi 1.0 — Earendil"
    url: https://earendil.com/posts/pi-1-0/
  - title: "Pi Durable — Earendil"
    url: https://earendil.com/posts/pi-durable/
  - title: "pi.dev — install and docs"
    url: https://pi.dev
  - title: "earendil-works/pi — GitHub"
    url: https://github.com/earendil-works/pi
  - title: "Pi 1.0 — Hacker News"
    url: https://news.ycombinator.com/item?id=49926069
  - title: "You Said No MCP! — Earendil (Sep 29, 2026)"
    url: https://earendil.com/posts/you-said-no-mcp/
---

**Earendil** shipped **Pi 1.0** on **Oct 1, 2026**: a **hardened, minimal, extensible coding-agent harness** you can make your own. Both Pi and the same-day companion are **MIT** licensed. Install today from [pi.dev](https://pi.dev); code lives at [github.com/earendil-works/pi](https://github.com/earendil-works/pi) ([announce](https://earendil.com/posts/pi-1-0/)).

Earendil says hundreds of thousands of people use Pi every week—treat that as a **vendor claim**, not an independently audited MAU figure here.

## What’s in 1.0

Per Earendil’s feature list ([primary](https://earendil.com/posts/pi-1-0/)):

- **Codemode** — native **MCP** support, plus support for non-LLM models (Earendil cites examples such as Jev and image models as capability color, not a separate product pitch)
- **Extension support for virtual models** (e.g. plan with one model, implement with another)
- **Deferred tool loading**
- **Cache warming for Anthropic models** (provider-specific as stated; not generalized to every vendor)
- **Mid-conversation system messages** — transcript-aware prompt and tool changes
- **Full-screen mode by default** (TUI), plus a new TUI theme

This is an **agent harness / CLI**—not a Raspberry Pi story, and not Magnitude’s on-device local-inference engine.

## Install

Primary path from the announce:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

Docs at [pi.dev](https://pi.dev). Windows PowerShell and npm/pnpm/bun global installs for `@earendil-works/pi-coding-agent` are also shown on the product site.

## Same-day: experimental Pi Durable

Alongside 1.0, Earendil shipped **Pi Durable** as the experimental npm package **`@earendil-works/pi-durable`**—a substrate for **long-running, crash-resumable, multiplayer** agent apps (checkpointed tasks; multi-client attach and steer). It **does not replace** the Pi coding agent ([Durable post](https://earendil.com/posts/pi-durable/)).

**Experimental:** Earendil and the npm README state the API **may change** / changes without notice between releases. Do not read Durable as stable GA.

Install line from the announce (pulls companions `@earendil-works/pi-ai` and `@earendil-works/chord` as well):

```bash
npm install @earendil-works/pi-durable @earendil-works/pi-ai @earendil-works/chord
```

## Prior Codemode context

Days earlier (Sep 29, 2026), Earendil published [“You Said No MCP!”](https://earendil.com/posts/you-said-no-mcp/)—the Codemode / MCP rethink essay. Today’s post is the numbered **1.0** ship plus Durable, not a re-run of that essay alone. Discussion also landed on [HN](https://news.ycombinator.com/item?id=49926069).

## Who should care

Builders who want a **minimal MIT coding-agent harness** with native MCP via Codemode, deferred tools, virtual-model extensions, and a fullscreen TUI can start at the [Pi 1.0 post](https://earendil.com/posts/pi-1-0/) and [pi.dev](https://pi.dev). Teams experimenting with long-running multiplayer agent apps can peek at [Pi Durable](https://earendil.com/posts/pi-durable/)—treat it as experimental: the API may still change. No paid SKUs were confirmed on this pass.
