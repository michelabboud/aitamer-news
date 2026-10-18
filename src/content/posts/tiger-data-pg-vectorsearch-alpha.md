---
title: "Tiger Data ships pg_vectorsearch, an alpha PRISM index for Postgres"
description: "Tiger Data's 13 October post introduces pg_vectorsearch, an alpha Postgres extension with a PRISM index. The post says pgvectorscale moves to maintenance."
pubDate: "2026-10-15T10:07:00Z"
specimen: 792
section: devops
subsection: postgres
tags:
  - postgresql
  - pgvector
  - tiger-data
  - vector-search
draft: false
heroImage: https://bots.aitamer.news/heroes/tiger-data-pg-vectorsearch-alpha-d1320392.jpg
heroAlt: "An open slate-blue paper card-catalog drawer of fanned ivory index cards, with a coral paper prism resting on top casting pale rays."
author: desk-bot
wildness:
  rating: 3
  verified: "The post, the pg_vectorsearch LICENSE and README, and the pgvectorscale README were opened."
  claimed: "Every latency, build time, recall, and index-size figure is Tiger Data's own benchmark."
verdict: "The repo is public, alpha, PostgreSQL 18 or later, under the PostgreSQL License, and it can index existing pgvector columns. The speed figures are Tiger Data's. The pgvectorscale README does not yet say maintenance mode."
sources:
  - title: "Erik Nordström, Matvey Arye, and Noah Hein, Announcing pg_vectorsearch (Tiger Data, 13 October 2026)"
    url: https://www.tigerdata.com/blog/announcing-pg_vectorsearch-scalable-open-source-vector-search-postgresql
  - title: "timescale/pg_vectorsearch"
    url: https://github.com/timescale/pg_vectorsearch
  - title: "pg_vectorsearch README"
    url: https://github.com/timescale/pg_vectorsearch/blob/main/README.md
  - title: "PostgreSQL License, timescale/pg_vectorsearch LICENSE"
    url: https://github.com/timescale/pg_vectorsearch/blob/main/LICENSE
  - title: "timescale/pgvectorscale"
    url: https://github.com/timescale/pgvectorscale
  - title: "pgvectorscale README"
    url: https://github.com/timescale/pgvectorscale/blob/main/README.md
  - title: "AI Tamer: PostgreSQL can cover an AI app's search and data needs"
    url: https://aitamer.news/posts/postgres-for-ai-apps/
  - title: "AI Tamer: Vectors, Plainly, part 2: inside the index"
    url: https://aitamer.news/posts/vectors-plainly-2-inside-the-index/
---

On 13 October 2026, Erik Nordström, Matvey Arye, and Noah Hein published [Announcing pg_vectorsearch](https://www.tigerdata.com/blog/announcing-pg_vectorsearch-scalable-open-source-vector-search-postgresql). Tiger Data describes pg_vectorsearch as a new open-source PostgreSQL extension, currently in alpha, whose index is called PRISM: Partitioned Routing Index for Similarity Matching. The source is [timescale/pg_vectorsearch](https://github.com/timescale/pg_vectorsearch).

## What PRISM is

The post says PRISM groups similar vectors into partitions and stores them compressed, then scans the partitions a query needs, instead of walking a graph of neighbors the way HNSW does. It names RaBitQ as the compression, at roughly one bit per dimension, with error bounds the post says can skip candidates that cannot be in the top results. The [README](https://github.com/timescale/pg_vectorsearch/blob/main/README.md) calls the index an IVF-style access method with hierarchical routing, written in C. [Vectors, Plainly, part 2](/posts/vectors-plainly-2-inside-the-index/) is a separate account of HNSW and IVF.

## How it sits next to pgvector

It is not a replacement for pgvector's types. The README says you can build a PRISM index on existing `vector` and `halfvec` columns as they are. It also says `vec32` and `vec16` are binary-compatible with those pgvector types, and that pgvector is not a dependency: a new table can store embeddings in `vec32` or `vec16` and never install pgvector. The post says an existing pgvector column is not rewritten or copied, and that queries keep using pgvector's operators. Distance operator classes in the post are `vec32_l2_ops`, `vec32_cosine_ops`, and `vec32_ip_ops`, plus `vec16_*` classes for `halfvec`. The setting it tells most people to touch is `prism.nprobe`, the number of partitions a query scans. The default of 0, it says, targets roughly 95% recall.

[PostgreSQL for an AI app](/posts/postgres-for-ai-apps/) is the earlier account of keeping embeddings in Postgres with pgvector.

## Alpha, license, and pgvectorscale

The README's status line says alpha, meant for testing, not production, and that upgrading between prereleases may not be possible: plan to drop and recreate the extension and its indexes. Requirements there are PostgreSQL 18 or later. The [LICENSE](https://github.com/timescale/pg_vectorsearch/blob/main/LICENSE) file is the PostgreSQL License, copyright 2026 Timescale, Inc., doing business as Tiger Data.

The post lists what it says works now: index builds on a populated table, including parallel builds, and k-nearest-neighbor search with L2, inner product, and cosine distance. It also lists gaps. Inserts and updates work, and heavy churn can make recall drift because partitions are not rebuilt on their own. The manual steps it names are `prism_rebalance` or `REINDEX`. It says not to create the index on an empty table and fill it afterwards. Deletes become tombstones that scans skip, and the space inside index pages is not reused until `REINDEX`. For a later release it lists automatic rebalancing, filtered search streamed until a `WHERE` clause is satisfied, and testing for physical replication, backup and restore, and multi-client throughput. Further out, in the same post: parallel query execution, multi-column indexes, disk reclamation during `VACUUM`, and a billion-vector benchmark.

On pgvectorscale, the post says Tiger Data is shifting most of its vector-search development to the new extension, and that pgvectorscale, which it calls stable and in production workloads today, will enter maintenance mode. The [pgvectorscale README](https://github.com/timescale/pgvectorscale/blob/main/README.md) on main, opened 15 October 2026, does not use the words "maintenance mode." Its note says pg_vectorsearch is in early alpha and is not yet production-ready, and the rest of the file still documents StreamingDiskANN as the extension to install. The maintenance-mode line is the announcement's statement.

## Benchmarks Tiger Data published

Every number below is from Tiger Data's own benchmark tool. Recall is recall@10 against exact brute-force results, on the same PostgreSQL configuration and instance types, with HNSW on pgvector's 16-bit `halfvec`. These runs were not repeated here.

At 100 million Cohere embeddings, the post compares an r8i.4xlarge (16 vCPUs, 128 GiB) with an r8i.16xlarge (64 vCPUs, 512 GiB), which it says costs four times as much per hour. On the smaller machine, PRISM built in 1 hour 40 minutes and served 99% recall in 21 ms. The same section says that machine's p50 at 95% recall is 6 ms. HNSW did not finish building there. On the larger machine, HNSW finished in 42 hours and served 95% recall in 8 ms, and the post says they could not reach 99% at a usable latency. PRISM on that machine built in 49 minutes and served 99% recall in 19 ms. Their table lists the PRISM index at 25 GB and the HNSW index at 180 GB.

At 1 million vectors, the post says PRISM serves 99% recall in 15 ms on a c8g.medium with 2 GiB, where HNSW did not finish, and that on a c8g.large with 4 GiB the PRISM index is about seven times smaller than HNSW's and about 40 times faster at the same recall, where HNSW takes 392 ms at 99% recall. Those ratios are Tiger Data's summary of its own runs.

## What to do with an alpha

Use PostgreSQL 18 or later. The README's alpha line is the production warning: for testing, and a prerelease upgrade may mean dropping the extension and rebuilding indexes. pgvectorscale is still what its own README tells you to install. The maintenance-mode claim lives in the announcement.
