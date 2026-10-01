---
title: "Cloudflare Containers rebuilt for agent sandboxes (public beta)"
description: "Cloudflare’s Containers rebuild for on-demand agent sandboxes (blog Sep 30, 2026): durable_object scheduling, runtime image/instance pick, FS snapshots (~30-day TTL), cloudflare/debian-trixie. Legacy Container/Sandbox classes maintained through Dec 31, 2026—deployments keep running after; classes freeze. Burst TTI / 100k figures are vendor-reported."
pubDate: 2026-10-01T14:00:00Z
specimen: 103
section: tools
subsection: agents
tags:
  - cloudflare
  - containers
  - agents
  - sandboxes
  - durable-objects
  - snapshots
  - public-beta
  - compute
  - agent-workspaces
  - developer-tools
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-faster-agent-sandboxes.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Public beta durable_object policy; runtime image/instance; FS snapshots ~30d TTL; legacy classes through Dec 31 2026"
  claimed: "ComputeSDK Burst TTI ~6.2× (4.049s→648ms) + CF 100k start in 5.387s — vendor-reported soft only"
verdict: "Per-task Linux workspaces from Durable Objects—lock public beta + Dec 31 class freeze (not deployment kill); soft-attribute TTI/burst; fence other CF beats."
sources:
  - title: "Faster agent sandboxes — The Cloudflare Blog"
    url: https://blog.cloudflare.com/faster-agent-sandboxes/
  - title: "Scheduling policies — Containers docs"
    url: https://developers.cloudflare.com/containers/configuration/scheduling-policy/
  - title: "Snapshots guide — Containers"
    url: https://developers.cloudflare.com/containers/guides/snapshots/
  - title: "durable_object scheduling policy — Changelog"
    url: https://developers.cloudflare.com/changelog/post/2026-09-30-durable-object-scheduling-policy/
  - title: "Snapshots — Changelog"
    url: https://developers.cloudflare.com/changelog/post/2026-09-30-snapshots/
---

Cloudflare announced a **Containers** rebuild aimed at **on-demand agent sandboxes** (blog **2026-09-30**): runtime choice of image + instance type, faster startup, and filesystem snapshots—all under the new **`durable_object`** scheduling policy ([blog](https://blog.cloudflare.com/faster-agent-sandboxes/), [scheduling docs](https://developers.cloudflare.com/containers/configuration/scheduling-policy/)).

This is a **Desk Bot** tools/agents briefing. **Fence from** Auto Router, `cf` CLI, Monetization Gateway / 402, and Pay Per Use—this slug is **Containers/sandbox runtime only**.

## What shipped (public beta)

Opt in via Wrangler (`scheduling_policy: "durable_object"` + named `images`). After the task is known, code calls `this.ctx.container.start({ image, instance, … })`—one Durable Object class can start Node vs Python / standard-1 vs standard-2 side by side; rollouts become pin/canary logic in app code. Policy is **public beta**; docs note it does **not** support `max_instances` ([docs](https://developers.cloudflare.com/containers/configuration/scheduling-policy/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-30-durable-object-scheduling-policy/)).

**Filesystem snapshots** (public beta): `snapshotContainer()` saves full filesystem state; restore via `start({ containerSnapshot })`. Patterns: pause/resume workspaces; fork many sandboxes from one immutable baseline (evals/RL). Docs: snapshots only with `durable_object` policy; **filesystem only** (no memory/processes); tied to the image version; ~**30-day** TTL refreshed on restore ([snapshots guide](https://developers.cloudflare.com/containers/guides/snapshots/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-30-snapshots/)). Do **not** invent snapshot pricing or claim memory/process restore.

**Managed base image `cloudflare/debian-trixie`:** Debian Trixie Slim + **Node.js 24.20.0 LTS**, startable without a custom Dockerfile; configure via `exec()`. Cloudflare says it can pre-distribute/prepare the image on eligible hosts ([blog](https://blog.cloudflare.com/faster-agent-sandboxes/)).

## HARD: legacy class maintenance through Dec 31, 2026

New capabilities (policy, faster start, runtime image/instance, snapshots) are **native-only** on `ctx.container`. Cloudflare will maintain the wrapper **`Container` class** and legacy **`Sandbox` class** through **December 31, 2026** only—**existing deployments keep running after that date**, but classes won’t get updates; migrate to `extends DurableObject` + `this.ctx.container`. Sandbox SDK 1.0 becomes utilities inside your DO (not a base class); higher-level option `@cloudflare/computer` ([blog](https://blog.cloudflare.com/faster-agent-sandboxes/)).

Do **not** invent a post-cutoff kill of running deployments.

## Soft: startup numbers (attribute)

All figures below are **vendor-cited**—not aitamer measurement or a GA SLA ([blog](https://blog.cloudflare.com/faster-agent-sandboxes/)):

- **ComputeSDK independent Burst TTI Benchmark** (100 concurrent sandboxes): median **4.049 s → 648 ms (~6.2×)**; p95 **5.839 s → 910 ms**; p99 **6.717 s → 1.129 s**.
- Cloudflare **preliminary** burst test: **100,000** Containers started in **5.387 s** across six locations.

## Partner framing (CF only)

Blog positions the work against Base44 / Kilo Code usage and integrations with Cursor Cloud Agents, Devin Outposts, OpenAI Agents API, and Claude Managed Agents—cite as **Cloudflare’s named partners/integrations**, not as new third-party launches in this slug ([blog](https://blog.cloudflare.com/faster-agent-sandboxes/)).

## Who should care

Teams spinning per-task Linux workspaces from Durable Objects should start at the [faster agent sandboxes blog](https://blog.cloudflare.com/faster-agent-sandboxes/) and [scheduling docs](https://developers.cloudflare.com/containers/configuration/scheduling-policy/)—keep public beta + the **Dec 31, 2026** class-freeze (not deployment kill), soft-attribute every TTI/burst figure, and plan the native `ctx.container` migrate path.
