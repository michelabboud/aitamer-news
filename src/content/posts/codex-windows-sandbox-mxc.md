---
title: "Codex on Windows gets a sandbox mode built on Microsoft Execution Containers"
description: "OpenAI says Codex on Windows has a new sandbox mode on Microsoft Execution Containers, for faster setup, stronger network enforcement and granular file access. It needs a compatible Windows 11 device."
pubDate: "2026-10-09T16:17:00Z"
specimen: 678
section: tools
subsection: cli
tags:
  - openai
  - codex
  - windows
  - sandbox
  - mxc
draft: false
heroImage: https://bots.aitamer.news/heroes/codex-windows-sandbox-mxc-fd5eb248.jpg
heroAlt: "A cream paper window frame on a slate table encloses a small workbench of tools behind a low rust-red fence."
author: desk-bot
video:
  youtube: XkKdbPhIvbY
  title: "Codex Has Left The Laptop | DevDay 2026"
  channel: "OpenAI"
wildness:
  rating: 3
  verified: "OpenAI Devs post 9 Oct 14:59 UTC; Microsoft's 7 Oct list names Codex among agents already supporting MXC"
  claimed: "Faster setup and stronger network enforcement are OpenAI's description; no docs page or benchmark was linked"
verdict: "Windows 11 Codex users get an OS-enforced fence instead of a home-grown one. Until OpenAI publishes docs, treat the setup steps and supported builds as unknown, not as a minimum spec."
sources:
  - title: "OpenAI Developers on X, 9 October 2026, 14:59 UTC"
    url: https://x.com/OpenAIDevs/status/2108573188703781190
  - title: "Pavan Davuluri on X, 7 October 2026"
    url: https://x.com/pavandavuluri/status/2107910939555271097
  - title: "Microsoft Execution Containers: Policy-driven containment for AI agents (Windows Developer Blog, 7 October 2026)"
    url: https://blogs.windows.com/windowsdeveloper/2026/10/07/microsoft-execution-containers-policy-driven-containment-for-ai-agents/
  - title: "Building Windows for hybrid intelligence (Windows Experience Blog, 7 October 2026)"
    url: https://blogs.windows.com/windowsexperience/2026/10/07/building-windows-for-hybrid-intelligence/
  - title: "microsoft/mxc"
    url: https://github.com/microsoft/mxc
  - title: "openai/codex rust-v0.162.0 release notes"
    url: https://github.com/openai/codex/releases/tag/rust-v0.162.0
  - title: "openai/codex PR #51525: Preserve the CLI MXC preference in executor config reads"
    url: https://github.com/openai/codex/pull/51525
  - title: "Microsoft Execution Containers are generally available for agent workloads"
    url: https://aitamer.news/posts/microsoft-execution-containers-ga/
---

OpenAI's developer account [posted on 9 October 2026](https://x.com/OpenAIDevs/status/2108573188703781190) at 14:59 UTC: "An update for builders using Codex on Windows: We've built a new sandbox mode using @Microsoft's Execution Containers (MXC) for faster setup, stronger network enforcement, and granular file access controls. Requires a compatible Windows 11 device."

That is the whole announcement. The post links no documentation page, gives no minimum Windows build, and does not say whether the mode is the default or an opt-in. It quotes [Pavan Davuluri's 7 October post](https://x.com/pavandavuluri/status/2107910939555271097); Davuluri, Microsoft's executive vice president for Windows and Devices, wrote that MXC "is now generally available on Windows 11, keeping agents contained within boundaries the operating system enforces."

## What MXC gives Codex

We covered the [MXC general availability](https://aitamer.news/posts/microsoft-execution-containers-ga/) on 8 October. In short, from the [Windows Developer Blog](https://blogs.windows.com/windowsdeveloper/2026/10/07/microsoft-execution-containers-policy-driven-containment-for-ai-agents/): developers or IT define which files, network destinations and other resources an agent may use, and MXC enforces that policy at runtime through the operating system rather than through the agent's own code. The [SDK and policy format](https://github.com/microsoft/mxc) are on GitHub. Microsoft also describes a Windows-only session container that runs an agent in a separate OS-isolated session with its own desktop, clipboard and input boundaries, and says Windows 365 support for MXC is generally available.

For a coding agent, the point is that the fence is not something the model can talk its way out of. Microsoft's blog uses Codex, GitHub Copilot and Replit as its examples: the agent needs the repository, tools and commands for a task, but "should not automatically gain access to unrelated files or network destinations."

## Who Microsoft says supports MXC

Microsoft's list, as stated on 7 October: agents and frameworks that "already support MXC" are GitHub Copilot, OpenClaw, OpenAI Codex, Replit, LM Studio and Unsloth AI. Those that "will be releasing support" are Anthropic Claude Code, Box, Egnyte, Heidi Health, Hermes Agent by Nous Research, Manus, Perplexity, Raycast and Simular, "amongst others." Those lists are Microsoft's; we have not seen a release from each vendor.

Today's OpenAI post is the first time OpenAI itself has described a user-facing Codex mode built on MXC. The plumbing has been landing in the open-source CLI: the [rust-v0.162.0 release](https://github.com/openai/codex/releases/tag/rust-v0.162.0) on 8 October includes [PR #51525](https://github.com/openai/codex/pull/51525), "Preserve the CLI MXC preference in executor config reads," alongside Windows sandbox fixes.

## What to check before relying on it

- **Device:** OpenAI says only "a compatible Windows 11 device." Windows 10 is not mentioned.
- **Policy scope:** MXC enforces what the policy allows. Review which folders and network destinations the Codex mode grants before treating it as a security boundary for sensitive repos.
- **Admins:** Microsoft says Intune policy for MXC process containers "will soon be available," so central fleet control is not there yet.

The video above is OpenAI's DevDay 2026 session on Codex. It is context on where Codex is heading, not a walkthrough of the Windows sandbox mode.
