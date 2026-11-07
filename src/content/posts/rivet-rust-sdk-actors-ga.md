---
title: "Rivet's Rust SDK for Actors is GA: stateful, hibernating actors with SQLite, for agents too"
description: "Rivet's open-source Durable Objects alternative now has a GA Rust SDK (rivetkit) with SQLite, WebSockets, cron, hibernation and a test harness."
pubDate: "2026-11-07T12:37:00Z"
section: rust
subsection: agents
tags:
  - rust
  - rivet
  - actors
  - durable-objects
  - agents
  - sqlite
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/rivet-rust-sdk-actors-ga-4e881b90.jpg
heroAlt: "Cream paper hedgehog asleep on a chest of drawers beside a coral acorn, faint slate-blue gear behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Rivet changelog of 6 Nov 2026, rivetkit on crates.io (3.0.6) and the Apache-2.0 rivet-dev/rivet repo."
  claimed: "Speed comparison with Durable Objects is Rivet's claim; we have not benchmarked it."
verdict: "A GA Rust path for one-actor-per-conversation agent state: SQLite per actor, sleep when idle, wake with state, self-hostable. Treat the speed pitch as unmeasured."
sources:
  - title: "Rivet changelog: Rust SDK for Rivet Actors is now generally available (6 November 2026)"
    url: https://rivet.dev/changelog/2026-11-06-rust-sdk-for-rivet-actors-is-now-generally-available/
  - title: "Rivet docs: Rust client"
    url: https://rivet.dev/actors/docs/clients/rust/
  - title: "crates.io: rivetkit"
    url: https://crates.io/crates/rivetkit
  - title: "GitHub: rivet-dev/rivet"
    url: https://github.com/rivet-dev/rivet
  - title: "AI Tamer: AWS and Berkeley open-source Infinity, a Rust agent runtime"
    url: https://aitamer.news/posts/aws-infinity-rust-agent-runtime-suspends-agents-at-tool-calls/
  - title: "AI Tamer: Cloudflare Containers rebuilt for agent sandboxes"
    url: https://aitamer.news/posts/cloudflare-faster-agent-sandboxes/
---

Rivet [announced on 6 November 2026](https://rivet.dev/changelog/2026-11-06-rust-sdk-for-rivet-actors-is-now-generally-available/) that the Rust SDK for Rivet Actors is generally available. Rivet describes itself as an open-source alternative to Cloudflare Durable Objects: long-lived actors that each own their state and are addressed by name. The Rust SDK went into beta in June; the crate is [`rivetkit`](https://crates.io/crates/rivetkit), at 3.0.6 on crates.io as of this writing, and the [repo](https://github.com/rivet-dev/rivet) is Apache-2.0.

## What is in the SDK

From the GA post:

- **Per-actor SQLite**, WebSockets and cron.
- **Hibernation**: actors sleep when idle and wake with their state intact.
- **End-to-end types**: clients share the actor's action and event types, so you do not redefine the actor on the client side, per the [Rust client docs](https://rivet.dev/actors/docs/clients/rust/).
- **OpenTelemetry** built in.
- **Mixed languages**: Rust and TypeScript actors can run side by side and call each other.
- **A test harness**: `rivetkit::test::setup` starts a local control plane so tests call typed actor handles directly.

Rivet pitches native speed against Durable Objects' WASM plus JavaScript glue for Rust code. That comparison is Rivet's; it did not publish numbers in the post.

## The agent example

The GA post's second example is a full AI agent: one actor per conversation, with message history in that actor's SQLite database so it survives sleep and restarts, and tokens streamed to connected clients as they arrive. The code saves the user's message before calling the model, so a restart mid-call does not lose the turn the model is answering.

## Why this matters

Conversational agents often sit idle between turns, and the hard part is keeping per-conversation state without paying for idle processes. Rivet's model, one actor per conversation that sleeps with its own SQLite, now has a GA Rust SDK and can run on Rivet Cloud or self-hosted, which suits Rust teams that do not want to target WASM on Workers. It sits next to other ways of parking idle agents we have covered, such as [AWS's Infinity runtime](/posts/aws-infinity-rust-agent-runtime-suspends-agents-at-tool-calls/) and [Cloudflare's agent sandboxes](/posts/cloudflare-faster-agent-sandboxes/), so compare wake latency and state limits on your own workload before choosing.
