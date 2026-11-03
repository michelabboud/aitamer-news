---
title: "OpenAI built Pando, a Rust Git backend, to keep its monorepo up with Codex"
description: "OpenAI says Pando, built in Rust with Codex in 10 weeks, cut median push latency by nearly 80%. It runs only inside OpenAI; you can't use it yet."
pubDate: "2026-11-03T09:37:00Z"
specimen: 1242
section: tools
subsection: git
tags:
  - openai
  - git
  - rust
  - codex
  - monorepo
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-pando-rust-git-backend-monorepo-de952cef.jpg
heroAlt: "Paper-cut illustration of a broad cream paper tree trunk branching into many limbs, small bundled paper parcels hung along separate branches, one coral parcel and faint slate-blue clouds behind."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI engineering post, 2 November 2026, read 3 Nov. Simulations are labeled teaching models."
  claimed: "Latency, petabyte-a-day and 10-week figures are OpenAI's own production numbers, not independently checked."
verdict: "A useful design read for anyone whose Git server is buckling under agent traffic. Pando itself is internal; what you can use today are the client fixes OpenAI sent upstream and its public Git build."
sources:
  - title: "OpenAI: Scaling Git at OpenAI (2 November 2026)"
    url: https://openai.com/index/scaling-git-at-openai
---

OpenAI says agent-driven development outgrew the servers behind its monorepo, so it built a new Git backend. In a [2 November engineering post](https://openai.com/index/scaling-git-at-openai), Aaron Friel, Taylor Blau and Ted Nyman describe **Pando**, which "now powers all development in OpenAI's monorepo" while engineers and agents keep using the ordinary Git client and protocol.

**Pando is not something you can use.** OpenAI runs it internally. The post says only: "We're currently exploring ways to share the technology that makes Pando possible with our users." There is no release, repository or date.

## Why OpenAI built it

Codex means more branches, pushes, merges and fetches from CI and research jobs. Starting around the end of last year, OpenAI says, the old system suffered slow fetches and pushes and failed merges, "with reliability at times falling below 90%."

## How it works

Pando gives up two things most Git servers treat as fixed:

- **Repository-wide consistency.** Each branch is updated independently, with an atomic compare-and-swap on the ref pointer. Pushes to unrelated branches don't wait on each other. The tradeoff: a client reading several branches may see them at different points in time.
- **A fresh packfile per client.** Pushed packfiles are stored as immutable blobs and reused to answer later fetches, sent through Git's `packfile-uri` feature from regional caches. A client may download some objects it already has, but servers do little computation.

To push, Pando advertises only a trunk branch, so each branch pack depends only on trunk. OpenAI says the median pack was under 20 KiB and the 99th percentile under 3 MiB. Background compaction merges small packs into larger covers, up to an L4 level today.

## The numbers OpenAI gives

These are OpenAI's production figures:

- Median push latency down "by nearly 80%" (the intro puts it as "nearly 5x").
- "Nearly a petabyte of Git data per day," and more than 57 terabytes of packs in one hour, over 99% from local disk cache.
- Clones and fetches saturating 10 Gbps links on standard cloud VMs.

The interactive comparison against three-phase commit and write-ahead log designs is labeled "synthetic teaching models, not production benchmarks."

## Built in Rust, with Codex

OpenAI says it built Pando "with Codex, moving from kick-off to production, in just 10 weeks," with the core designed by one engineer and implemented by teams of agents. It chose Rust "without legacy dependencies," wrote a conformance suite so agents could test against standard Git behavior, and used deterministic simulation testing. Pando began serving production traffic in April. Anthropic made a similar move with [Scion](/posts/anthropic-scion-source-control/), though it left Git; OpenAI kept the Git protocol and client.

## What reaches the rest of us

OpenAI says it fixed Git client edge cases in concurrent pack downloads, cleanup after interrupted transfers, and resuming completed downloads, and sent that work upstream. It also added tracing for `packfile-uri` downloads. "Several of these improvements are already in upstream Git, and many others in our public repository." That is the part you can use now, alongside habits like [giving each coding agent its own worktree](/posts/give-each-coding-agent-its-own-git-worktree/).

## Why this matters

OpenAI's account shows that once agents multiply pushes and fetches, the Git server becomes the bottleneck before Git itself does. Its answer, per-branch consistency and reused packfiles, is a design other teams can study, but the system is internal and OpenAI has given no release plan. The upstream client fixes are what builders can actually pick up today.
