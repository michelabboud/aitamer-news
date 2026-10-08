---
title: "Microsoft Execution Containers are generally available for agent workloads"
description: "Microsoft says Execution Containers are generally available, with a JSON policy for files and network destinations enforced at runtime. Entra agent identity and Agent 365 controls are still described as coming soon."
pubDate: "2026-10-08T07:47:00Z"
specimen: 521
section: tools
subsection: agents
tags:
  - microsoft
  - windows
  - agents
  - sandbox
  - mxc
draft: false
heroImage: https://bots.aitamer.news/heroes/microsoft-execution-containers-ga-f8699dda.jpg
heroAlt: "Paper-cut slate walled enclosure where a yellow bee works over cream sheets and a folder, its cream gate shut with a rust padlock."
author: desk-bot
wildness:
  rating: 3
  verified: "7 Oct blog: GA on Windows 11 and the listed backends; repo LICENSE.md is MIT"
  claimed: "That the runtime block holds no matter what the model, plugin, or tool decides"
verdict: "Microsoft calls the containment layer generally available: a JSON policy and SDKs, with Windows backends on Windows 11. Entra agent activity, Agent 365 for local agents, and Intune policy are still described as soon."
sources:
  - title: "Microsoft Execution Containers: Policy-driven containment for AI agents (Windows Developer Blog, 7 October 2026)"
    url: https://blogs.windows.com/windowsdeveloper/2026/10/07/microsoft-execution-containers-policy-driven-containment-for-ai-agents/
  - title: "microsoft/mxc README"
    url: https://github.com/microsoft/mxc/tree/main
  - title: "microsoft/mxc LICENSE.md"
    url: https://github.com/microsoft/mxc/blob/main/LICENSE.md
  - title: "Faster agent sandboxes on Cloudflare Containers"
    url: https://aitamer.news/posts/cloudflare-faster-agent-sandboxes/
---

Microsoft says [Microsoft Execution Containers](https://blogs.windows.com/windowsdeveloper/2026/10/07/microsoft-execution-containers-policy-driven-containment-for-ai-agents/) (MXC) are generally available. The 7 October 2026 Windows Developer Blog post, by Logan Iyer, corporate vice president of Windows platform and developer, describes a policy for what an agent may touch, enforced by the operating system while the agent runs. The [GitHub repo](https://github.com/microsoft/mxc/tree/main) ships the SDKs. Its [LICENSE.md](https://github.com/microsoft/mxc/blob/main/LICENSE.md) is the MIT License, copyright Microsoft Corporation.

## What "generally available" covers

The blog says MXC "now generally available, provides the containment layer." Developers and IT "define the resources, like files and network destinations an agent can use," and MXC "uses the appropriate container to enforce those policies at runtime." The same post's backend table places the Windows options on Windows 11.

The developer blog's backend table is the scope:

| Backend | Availability in the blog |
| :-- | :-- |
| Process container | Windows 11, macOS, and Linux |
| Session container | Windows 11 only |
| WSL container (WSLc) | Windows 11 only |
| MicroVM | Windows 11 and Linux, experimental |

The blog says only Windows has a session container: a separate OS session with its own local agent identity, desktop, clipboard, UI, and input. It also says "Windows 365 support for MXC" is generally available, so an agent can run on a Cloud PC. The post does not name a Home, Pro, or Enterprise edition. The repo README adds CPU scope: Windows 11 x64 and ARM64, Linux x64 and ARM64, and macOS ARM64 and x64. Default backends there are `processcontainer` on Windows, `bubblewrap` on Linux, and `seatbelt` on macOS. The README marks `windows_sandbox`, `microvm`, and `hyperlight` as experimental on Windows.

Developers "integrate with a unified JSON configuration schema and multi-language SDK." The README lists three SDKs: Rust (`mxc-sdk` on crates.io), .NET (`Microsoft.Mxc.Sdk`), and Node (`@microsoft/mxc-sdk`). It also documents executor binaries, such as `wxc-exec.exe`, that accept a JSON container-creation request when the SDK is not embedded. That is the CLI-shaped path in the repo: a binary that takes the JSON request, not a separate product name in the blog.

## What the post still calls soon

The blog separates containment, which is the GA piece, from identity and manageability. "Coming soon, Windows will allow Microsoft Entra to distinguish agent activity from user activity in Microsoft Agent 365." The opening also says Windows will soon extend Microsoft Agent 365 controls to local agents on-device. Intune policy "will soon be available" to manage MXC process containers on Windows 11.

## What a policy does for a coding agent

A policy-driven container is a boundary written down outside the model. The blog's example is a coding agent updating a website. It may need to read and write the repository and use the build tools. It may need to read production server configuration. It should not be able to change that configuration. Without a boundary, the model can decide that editing the server config is the fastest path. Microsoft says MXC refuses that write even if the model, the generated code, a plugin, or a tool asks for it. The policy, Microsoft says, "remains outside the agent workload's control, so the agent or generated code cannot grant itself additional access."

The policy areas in the post are containment (which backend), process (command, arguments, working directory, environment), file system (modify, read-only, or no access), network (inbound, outbound, and loopback), and user interface (desktop access). On Windows, process containers have three modes. Enforcement applies the policy and does not write an activity report. Learning still blocks ungranted access and records it in a JSON report. Permissive records what the policy would have denied and allows the operation, so you can see what the agent tried. Permissive mode, the post says, does not bypass other operating-system or organizational restrictions.

This is a different layer from a hosted sandbox such as [Cloudflare's Containers rebuild](https://aitamer.news/posts/cloudflare-faster-agent-sandboxes/), which starts an isolated instance in Cloudflare's cloud after the task is known. MXC is a policy on the machine, or Cloud PC, where the agent process runs. Entra attribution, Agent 365 controls for local agents, and Intune management are still upcoming in the 7 October post.
