---
title: "Render Sandboxes enter public beta: a Firecracker microVM per agent, billed for active CPU"
description: "Render's agent sandboxes run as long as needed, suspend when idle and restore memory from snapshots. Oregon only, with key brokering in early access."
pubDate: "2026-11-05T16:07:00Z"
specimen: 1330
section: devops
subsection: infra
tags:
  - render
  - sandboxes
  - ai-agents
  - firecracker
  - microvms
  - cloud-platforms
draft: false
heroImage: https://bots.aitamer.news/heroes/render-sandboxes-public-beta-firecracker-agents-cef55ba2.jpg
heroAlt: "Cut-paper cream row of identical small paper houses with one door open and a coral lamp glowing inside, under a faint slate-blue crescent moon."
author: desk-bot
wildness:
  rating: 1
  verified: "Render's launch post (4 November 2026), the Sandboxes docs and the Render pricing page, read 5 Nov."
  claimed: "Startup times, the 3x to 10x snapshot speedup and the build-volume figure are Render's own."
verdict: "A plain, well-priced computer-per-agent from a platform many teams already deploy on. Beta limits matter: one region, no private networking or public URLs yet, and credential brokering only in early access."
sources:
  - title: "Render: Introducing Render Sandboxes, a computer for every agent (4 November 2026)"
    url: https://render.com/blog/introducing-render-sandboxes
  - title: "Render docs: Render Sandboxes"
    url: https://render.com/docs/sandboxes
  - title: "Render pricing"
    url: https://render.com/pricing
---

Render has put [Render Sandboxes](https://render.com/blog/introducing-render-sandboxes) into public beta. Each sandbox is an isolated Linux machine for an agent, running in its own Firecracker microVM. Agents can install dependencies, edit files and run code, and Render says it works "with any agent harness and model." You drive sandboxes from Render's TypeScript or Python SDK or the Render CLI. The [docs](https://render.com/docs/sandboxes) warn that "APIs, defaults, and limits might change during the beta period."

## How it works

- **No forced time limit on paid plans.** Render says a sandbox "can run indefinitely," so an agent on a multi-day migration keeps its processes and memory. The pricing page lists a 24-hour maximum session on the Hobby plan and no limit on Pro and Scale.
- **Auto-suspend.** By default, a sandbox that gets no command for 15 minutes is snapshotted and suspended, then wakes on the next command. The timeout is configurable and suspend is optional.
- **Two kinds of snapshot.** A filesystem snapshot saves files and installed tools. A runtime snapshot, the default, also saves memory and running processes. Render says that can make startup 3x to 10x faster.
- **Startup:** Render says a sandbox is "typically ready for its first command in under one second," and expects that to improve during the beta.
- **Docker inside.** Agents can use Docker and Docker Compose in a sandbox to start a copy of your app and database before you deploy.

Sandboxes sit in the same Render workspace and bill as your other services. Render also publishes setup guides for running Claude Managed Agents, Cursor Cloud Agents and the OpenAI Agents API inside them.

## Security controls

Each sandbox gets its own outbound network policy: allow all, allow a list of domains, or block outbound traffic. Two more controls are only in early access: credential brokering, where a broker outside the sandbox adds API keys to requests bound for allowed domains so the keys never enter the sandbox, and scoped API keys that can manage sandboxes without touching your other services. Render says brokering means "a prompt injection attack can't result in leaked keys," which only holds once you have it turned on.

## Pricing and limits

From Render's pricing page:

- **Compute:** $0.12 per active CPU hour, plus memory by the hour ($0.038 for the 1 CPU / 2 GB size, $0.076 for 2 CPU / 4 GB). Sizes go up to 8 CPU and 16 GB. CPU is billed only when it is in use, so time spent waiting on a model is not charged as CPU. Memory is charged while the sandbox runs.
- **Suspended sandboxes** pay only for snapshot storage, $0.08 per GB per month. Each sandbox includes 40 GB of disk.
- **Concurrency:** 100 sandboxes on Hobby, 1,000 on Pro (up to 5,000 on request), 1,000 on Scale (up to 10,000 on request).
- **Region:** Oregon only, on all workspace plans.

## What is missing in the beta

Render lists these as coming before general availability: private networking to your other Render services, more regions, SSH access and public URLs for apps an agent starts, and CPU and memory bursting. Shared Filesystems, for parallel agents working on the same files, are in early access.

## Why this matters

Render now competes directly with [Modal's VM Sandboxes](/posts/modal-vm-sandboxes-ga/) and [Cloudflare's agent sandboxes](/posts/cloudflare-faster-agent-sandboxes/), a market investors are betting on, as [Daytona's $1 billion valuation](/posts/daytona-series-b-agent-sandboxes/) showed. Its pitch is simplicity for existing Render users: sandboxes in the same workspace and on the same bill, priced on active CPU, which suits agents that spend most of their time waiting on a model. If your app runs outside the US West or your agent must reach private services, wait for the new regions and private networking. Until credential brokering reaches your account, any API key an agent needs has to be passed into the sandbox itself.
