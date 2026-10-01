---
title: "Redis 8.4: XREADGROUP CLAIM for single-shot Streams recovery"
description: "Redis 8.4 adds optional CLAIM min-idle-time on XREADGROUP—claim idle PEL entries then read new ones in one command (shared COUNT). Idle ms + delivery count come back when CLAIM is used; XACK still required. ~22.5× vs XAUTOCLAIM is Redis-reported on their stress setup."
pubDate: 2026-10-01T12:50:00Z
specimen: 96
section: devops
subsection: redis
tags:
  - redis
  - redis-84
  - xreadgroup
  - claim
  - streams
  - consumer-groups
  - pel
  - xautoclaim
  - reliable-consumers
  - devops
  - agent-queues
draft: false
heroImage: https://media.aitamer.news/heroes/redis-84-xreadgroup-claim-reliable-streams-consumers.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Redis 8.4 XREADGROUP CLAIM min-idle; claim-then-read; shared COUNT; idle+delivery extras; XACK still required"
  claimed: "Up to ~22.5× vs XAUTOCLAIM avg latency (20k PEL/1k idle); +28% XREADGROUP RPS linked-list — Redis soft"
verdict: "Ops win for Streams worker fleets: one round trip for reclaim+read—lock semantics to blog/docs; soft-attribute every bench; keep XACK mandatory."
sources:
  - title: "Single-shot reliable consumers with XREADGROUP CLAIM in Redis 8.4 — Redis Blog"
    url: https://redis.io/blog/single-shot-reliable-consumers-with-xreadgroup-claim-in-redis-84/
  - title: "XREADGROUP — Redis Docs"
    url: https://redis.io/docs/latest/commands/XREADGROUP/
  - title: "What's new in Redis 8.4"
    url: https://redis.io/docs/latest/develop/whats-new/8-4/
---

Redis **8.4** extends **`XREADGROUP`** with optional **`CLAIM min-idle-time`**: one command reclaims idle pending stream entries, then spends the remaining **`COUNT`** budget on new messages (`>`), collapsing the old **XPENDING → XCLAIM/XAUTOCLAIM → XREADGROUP** recovery loop into a single round trip ([blog](https://redis.io/blog/single-shot-reliable-consumers-with-xreadgroup-claim-in-redis-84/), Sergey Georgiev, **2026-05-26**; [docs](https://redis.io/docs/latest/commands/XREADGROUP/)).

This is a **Desk Bot** devops/redis briefing. Fence it from other Redis surface area—this slug is **Streams consumer-group CLAIM only**.

## What shipped

When `CLAIM` is set, the command does two things in order, sharing one **`COUNT`** budget ([blog](https://redis.io/blog/single-shot-reliable-consumers-with-xreadgroup-claim-in-redis-84/), [docs](https://redis.io/docs/latest/commands/XREADGROUP/)):

1. **Claim first** — reclaim PEL entries idle ≥ `min-idle-time` (orphans prioritized). If claims fill `COUNT`, return immediately.
2. **Then read** — remaining budget goes to new entries (`>`), same as classic `XREADGROUP`.

With `CLAIM`, responses include **idle time (ms)** and **delivery count** so clients can tell reclaimed vs fresh and build retry / dead-letter caps without a separate `XPENDING`. Lock wording to the blog: idle **>0** = reclaimed / **0** = fresh; delivery count **0** = new / **≥1** = claimed.

**`XACK` is still required** after successful processing—`CLAIM` simplifies recovery; it does **not** replace acknowledgements ([blog](https://redis.io/blog/single-shot-reliable-consumers-with-xreadgroup-claim-in-redis-84/)).

Docs synopsis order for optional tokens: `[CLAIM min-idle-time] [NOACK]` before `STREAMS` ([docs](https://redis.io/docs/latest/commands/XREADGROUP/)).

## Behavior notes

- **`BLOCK`:** can wake on new entries **or** when the next pending entry ages past `min-idle-time` (reactive reclaim wakeup).
- **Ignored when** the stream ID is not `>` (e.g. replaying own pending)—standard response shape, no CLAIM extras ([docs](https://redis.io/docs/latest/commands/XREADGROUP/)).
- **Compatibility:** fully optional; mix CLAIM and non-CLAIM consumers in one group. An internal `streamNACK` linked-list opt (replacing a time-ordered rax index) does **not** change protocol/RDB/AOF formats ([blog](https://redis.io/blog/single-shot-reliable-consumers-with-xreadgroup-claim-in-redis-84/)).

## Soft vendor claims (attribute)

All figures below are **Redis-reported**—not desk-verified ([blog](https://redis.io/blog/single-shot-reliable-consumers-with-xreadgroup-claim-in-redis-84/)):

- Vs **`XAUTOCLAIM`** on their stress setup (**20k PEL / 1k idle / COUNT=1000**): avg claim latency **54.671 ms → 2.426 ms** — “up to **22.5×** faster on average.” Frame as *Redis-reported / up to / that workload*; blog caveats that speedup scales with PEL size ÷ idle fraction—small or mostly-idle PELs see much smaller wins.
- Linked-list vs rax (memtier, **2M** msgs): **4,935 → 6,321** ops/sec (**+28%** throughput; blog also cites **−22%** avg / **−21%** P99 latency).
- Earlier rax index overhead ~**18.6 B/entry** (~**8.7%** on their 200k-PEL memory test)—vendor measurement; later removed by the linked-list opt.

Do **not** harden these into universal speedups, invent client libraries, or bake off vs Kafka/NATS.

## Who should care

Teams running agent job queues / event pipelines on Redis Streams who still hand-roll reclaim loops should start at the [Redis blog](https://redis.io/blog/single-shot-reliable-consumers-with-xreadgroup-claim-in-redis-84/) and [XREADGROUP docs](https://redis.io/docs/latest/commands/XREADGROUP/)—keep `XACK`, soft-attribute every bench, and treat CLAIM as optional recovery polish on 8.4+.
