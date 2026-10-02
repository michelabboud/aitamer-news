---
title: "chDB Durable Layer: flush, checkpoint, and object-storage agent memory"
description: "ClickHouse’s chDB Durable Layer (Sep 28, 2026): local MergeTree plus object storage via flush()/checkpoint(). chDB 4.4+ with chdb[durable]; chdb-core 26.7.3; single-writer. npm chdb@3.4.0 differs from the Python package."
pubDate: 2026-10-01T17:00:00Z
specimen: 117
section: devops
subsection: clickhouse
tags:
  - chdb
  - clickhouse
  - durable-layer
  - agent-memory
  - mergetree
  - object-storage
  - s3
  - embedded-olap
  - flush
  - checkpoint
  - devops
draft: false
heroImage: https://media.aitamer.news/heroes/chdb-durable-layer.jpg
heroAlt: "Paper-cut layers show a local memory stack flushing along ribbons into a remote object-storage shelf of cubes."
author: desk-bot
wildness:
  rating: 5
  verified: "Durable Layer Sep 28 2026; flush/checkpoint plus object storage; chDB 4.4+ durable; chdb-core 26.7.3; single-writer"
  claimed: "58× and compression sample = ClickHouse’s own experiment; ClickMem illustrative, not a product launch"
verdict: "Embedded OLAP agent memory that survives the host—flush/checkpoint recovery, single-writer, and pip chDB 4.4+ separate from npm chdb@3.4.0."
sources:
  - title: "chDB Durable Layer for agent memory — ClickHouse Blog"
    url: https://clickhouse.com/blog/chdb-durable-layer-for-agent-memory
---

ClickHouse published the **chDB Durable Layer** on **2026-09-28** (Changshuo Chen): an addressable, **single-writer**, recoverable embedded analytical object—local MergeTree as the working copy, authoritative state in **your** object storage—via app-controlled **`flush()`** and **`checkpoint()`** ([blog](https://clickhouse.com/blog/chdb-durable-layer-for-agent-memory)).

## What it solves

Embedded chDB agent memory is fast on one disk but tied to a local MergeTree directory; a full ClickHouse **server** restores portability at the cost of remote round trips on every recall. Durable Layer sits between those shapes: **no DB server, PVC, or Litestream-style sidecar on the hot path**—local working copy plus authoritative bucket copy (`s3://`, `gcs://`, `azure://`, or `local:` for dev) ([blog](https://clickhouse.com/blog/chdb-durable-layer-for-agent-memory)).

## flush / checkpoint / lease

- **`flush()`** — Writes stay local until flush; when it returns, the writes it covers have reached object storage (the app chooses the loss window).
- **`checkpoint()`** — Between checkpoints, state is base snapshot + WAL; checkpoint writes a new base so the next open need not replay a long log.
- **`head.json` + conditional/CAS writes** — Ownership fencing: **one writer per object name by design**. Wrong tool for a shared multi-writer team database ([blog](https://clickhouse.com/blog/chdb-durable-layer-for-agent-memory)).

## Versions

| Surface | As stated |
| --- | --- |
| **Python** | **chDB 4.4+** — `pip install "chdb[durable]"` (S3/boto3); GCS/Azure via `chdb[durable-gcs]` / `chdb[durable-azure]` |
| **Core** | Durable V1 in **`chdb-core` 26.7.3** |
| **Node** | npm **`chdb@3.4.0`** (same layout/lifecycle—**not** the Python version number) |
| **Go / Rust** | `chdb-go/v2@2.2.0` · `chdb-rust@2.0.0` |

Objects written in one binding are recoverable in another under the same Durable V1 contract ([blog](https://clickhouse.com/blog/chdb-durable-layer-for-agent-memory)).

## Vendor figures and examples

- **58×** local-vs-remote queries — ClickHouse’s own local-vs-remote experiment, not an aitamer measurement.
- Compression sample: **1.45 GB** / **213,721** rows Claude Code transcript → **521 MiB** ZSTD(3) or **991 MiB** LZ4 in MergeTree — “small local experiment” on the blog.
- **ClickMem**, Maple Local, ReplayHouse, vcfclick — **illustrative** shapes of the problem; not separate product launches. ClickMem is the clearest Durable use-case example (third shape between `~/.clickmem/data` and a ClickHouse server).
- V1 WAL is statement-replay: prefer deterministic statements (avoid `now()` in INSERT); not OLTP / not a Postgres replacement ([blog](https://clickhouse.com/blog/chdb-durable-layer-for-agent-memory)).

## Who should care

Teams embedding analytical agent memory who need recoverability without a full server on the hot path should start at the [ClickHouse Durable Layer post](https://clickhouse.com/blog/chdb-durable-layer-for-agent-memory)—lead with **flush/checkpoint**, keep the **single-writer** framing, and treat **pip 4.4+** as separate from **npm `chdb@3.4.0`**.
