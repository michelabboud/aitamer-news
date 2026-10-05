---
title: Cloudflare's Agents SDK adds PiHarness so a Pi Durable agent can pause mid-turn
description: The Agents SDK changelog of 2 October 2026 adds PiHarness so a Pi 1.0 agent can keep a turn on a Durable Object. Cloudflare calls the API beta and says Pi Durable is still experimental.
pubDate: "2026-10-05T10:20:00Z"
section: dev
subsection: agents
tags:
  - cloudflare
  - agents-sdk
  - pi
  - durable-objects
  - earendil
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-agents-sdk-pi-harness-a5ef929f.jpg
heroAlt: Hooded paper figure walks a tan path that rises from an open notebook, against muted teal torn-paper mountains.
author: desk-bot
wildness:
  rating: 4
  verified: 2 Oct changelog names PiHarness, the packages, and the beta label
  claimed: Durability across crashes is Cloudflare's description of the Lifecycle, not a test we ran
verdict: A beta adapter, not a stable harness API. Pin agents and the two Pi packages, and expect the class to change.
sources:
  - title: Run the Pi Durable harness on Cloudflare with the Agents SDK (changelog, 2 October 2026)
    url: https://developers.cloudflare.com/changelog/post/2026-10-02-pi-harness/
---

Cloudflare's [2 October 2026 changelog](https://developers.cloudflare.com/changelog/post/2026-10-02-pi-harness/) says the Agents SDK now has first-class support for the Pi harness. The new piece is a `PiHarness` class. Combined with Pi 1.0 and Pi Durable, it is meant to keep an agent's work on a Durable Object when a turn is interrupted. Cloudflare calls this its first step toward first-class support for third-party agent harnesses, built with Earendil. It is a Cloudflare integration on top of Pi, not a new release of the Pi harness itself.

## What is beta

The post labels `PiHarness` beta in the body. It says Pi Durable is a new, experimental package, and that the `PiHarness` API will likely change as Pi Durable matures. `PiHarness` is described as a "Lifecycle capability". Pi Durable supplies the agent harness. The Lifecycle's job is to keep that work running inside the Durable Object across restarts, crashes, and network failures. Cloudflare says it will explain Lifecycle capabilities more later.

## How the sample is wired

Install, per the changelog, is `agents@latest` plus the optional peer dependencies `@earendil-works/pi-durable` and `@earendil-works/pi-ai`. They are optional peers, so a project that does not use Pi does not need them. The sample builds models with `createModels()` from `@earendil-works/pi-ai/models`, opens a `Harness` from `@earendil-works/pi-durable` against the Durable Object storage, and registers `new PiHarness(...)` with `this.lifecycle.use(this.harness)`. The default model in the sample is `this.ai("@cf/moonshotai/kimi-k2.7-code")`, reached through `agents/models/pi-ai`, which the post says supports AI Gateway and Workers AI.

Tools and system-prompt sections go in through extensions. The sample registers a `word_count` tool with `replay: "safe"` and installs a skills bundle with `registry.install(await skills(sources))` from `agents/harness/pi`. A prompt returns `{ text }` from `this.harness.prompt(prompt)`. The changelog links a fuller example with WebSockets, a browser UI, and a `@cloudflare/computer` Workspace.

## Practical takeaway

If you already run an Agent on Cloudflare and want Pi's harness, the supported path in this changelog is `PiHarness` plus the two Earendil packages, with the harness opened on the Durable Object's storage. Plan for API changes: both the Cloudflare label and the Earendil package are marked experimental. Pin versions, and do not treat the sample model id as a requirement.
