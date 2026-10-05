---
title: "ClickHouse Managed Postgres: Direct I/O wal-g backups that spare the page cache"
description: "ClickHouse (Oct 2, 2026): Managed Postgres live wal-g backups use WALG_DIRECT_IO plus stripe-sized RAID0 NVMe reads to skip page-cache eviction. Vendor benches only; incremental still prototyping."
pubDate: 2026-10-02T19:10:00Z
specimen: 172
section: devops
subsection: postgres
tags:
  - clickhouse
  - managed-postgres
  - postgres
  - wal-g
  - direct-io
  - backups
  - nvme
  - raid0
draft: false
heroImage: https://media.aitamer.news/heroes/clickhouse-managed-postgres-direct-io-backups-69e1bf77.jpg
heroAlt: "Paper-cut collage of a Postgres spine beside a backup stream that bypasses a warm page-cache stack on striped NVMe shelves, one coral O_DIRECT accent on slate fabric."
author: desk-bot
wildness:
  rating: 3
  verified: "Oct 2: Managed Postgres wal-g Direct I/O (WALG_DIRECT_IO) + stripe-sized RAID0 NVMe reads; default new images"
  claimed: "ClickHouse: ~2/3 less latency hit; 0 vs 40 GiB warm eviction; 71s/467GB i8ge.12xlarge; incremental not GA"
verdict: "Managed Postgres backup I/O story: Direct I/O + stripe-sized wal-g reads protect OS cache during live backups. Figures are ClickHouse’s; incremental is not GA."
sources:
  - title: "What is direct I/O, and why does ClickHouse Managed Postgres use it for backups? — ClickHouse Blog"
    url: https://clickhouse.com/blog/direct-io-managed-postgres-backups
---

ClickHouse Engineering on **October 2, 2026** explains why **ClickHouse Managed Postgres** uses **Direct I/O** for live base backups ([blog](https://clickhouse.com/blog/direct-io-managed-postgres-backups), Kaushik Iska). The lead is **Managed Postgres + wal-g backup I/O, not a ClickHouse analytics-engine product launch.

## The problem Direct I/O targets

Base backups that share local **NVMe** with live queries can thrash the Linux **page cache**: one-shot backup reads pull cold pages through the cache and push out warm Postgres pages queries still need. ClickHouse configures **wal-g** with **`WALG_DIRECT_IO=true`** so those reads use **`O_DIRECT`** and **skip the page cache**, leaving warm OS-cache pages alone during the backup.

## Stripe-sized reads on RAID0

On multi-NVMe **RAID0**, Direct I/O also disables readahead, which can cut array throughput. ClickHouse’s answer: size each direct read to **span the whole RAID0 stripe** (`WALG_DIRECT_IO_BLOCK_COUNT` scaled with drive count, e.g. four drives → **4 MiB** reads) and scale disk-reader concurrency with the hardware (dense NVMe families can use full vCPU count). Config lands in `/etc/postgresql/wal-g.env`. ClickHouse says every Managed Postgres server ships with this path **by default** on the new machine image, according to ClickHouse.

Object storage still holds base backups plus archived WAL for PITR; the Direct I/O story is the **local NVMe hot path** into wal-g.

## ClickHouse's own benchmarks

All figures below are **ClickHouse-attributed** on stated hardware (including an **i8ge.12xlarge** / four-NVMe / **467 GB** pgbench setup). They are ClickHouse’s own measurements:

- Query **latency hit during backup** cut by about **two thirds** vs buffered
- Buffered arm **evicted 40 GiB** of a warm idle table; Direct I/O arms **evicted 0 GiB**
- Production knobs finished in **71 seconds** on that 467 GB database
- About **14%** less CPU called out in the short version

Treat those as engineering evidence from the post, not independent reproductions.

## What’s next (not GA)

ClickHouse says it is **prototyping incremental backups**: roadmap language only. That is not shipped incremental-backup GA.

## Who should care

Operators on **ClickHouse Managed Postgres**, or anyone running **wal-g** base backups on shared local NVMe, should read the [engineering post](https://clickhouse.com/blog/direct-io-managed-postgres-backups) for the Direct I/O + stripe-sizing rationale. Confirm defaults and escape hatches against current Managed Postgres docs before changing self-managed wal-g knobs to match.
