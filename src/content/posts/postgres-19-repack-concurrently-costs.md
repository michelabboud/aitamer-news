---
title: "PostgreSQL 19 REPACK (CONCURRENTLY): what Marek’s benches cost"
description: "Radim Marek (boringSQL, Sep 28) benches PostgreSQL 19beta4 core REPACK (CONCURRENTLY) vs pg_repack/pg_squeeze: WAL, disk, cluster-wide VACUUM hold-back, ~105M change ceiling, and MVCC caveats—author benches only."
pubDate: 2026-10-01T22:00:00Z
section: devops
subsection: postgres
tags:
  - postgresql
  - postgres-19
  - repack
  - concurrently
  - pg-repack
  - pg-squeeze
  - wal
  - vacuum
  - devops
  - postgres
draft: false
heroImage: /heroes/postgres-19-repack-concurrently-costs.jpg
heroAlt: "Paper-cut collage of a database slab being copied beside a thin coral lock bar at the end, with faded vacuum marks across stacked shelves."
author: desk-bot
wildness:
  rating: 4
  verified: "boringSQL/Marek PG19beta4 benches; REPACK≠extensions; slot VACUUM all-DBs; ~105M upd+del ceiling; not MVCC-safe"
  claimed: "“Best for most of us” / managed-Postgres pitch = author opinion; PG20 fix aims are author expectation only"
verdict: "Core online REPACK in PG19beta4 is real—size WAL, cluster VACUUM hold-back, and the ~105M change ceiling from Marek’s benches before you schedule it."
sources:
  - title: "What REPACK (CONCURRENTLY) costs while it runs — boringSQL"
    url: https://boringsql.com/posts/repack-concurrently-costs/
---

**Radim Marek** published measured costs for PostgreSQL **19**’s core **`REPACK (CONCURRENTLY)`** on **boringSQL** (**2026-09-28**). All WAL, disk, duration, swap-stall, dead-row, and memory-ceiling figures below are **his benches on PostgreSQL 19beta4** (Hetzner ccx33 and GCE n2-standard-4; single test table)—not aitamer measurements and not official PostgreSQL.org numbers ([boringSQL](https://boringsql.com/posts/repack-concurrently-costs/)).

This is **core** SQL, not an extension: no `shared_preload_libraries`, distinct from **pg_repack** (trigger + log table) and **pg_squeeze** (slot-based extension that REPACK was derived from).

## How the online rewrite works

`REPACK` unifies `VACUUM FULL` and `CLUSTER`. With **`(CONCURRENTLY)`**, the rewrite stays online via **logical decoding**: a temporary replication slot gives a snapshot, a worker collects WAL changes while live rows are copied and indexes rebuilt, then catch-up runs. The table stays usable during the copy. **Only the final swap** takes **`ACCESS EXCLUSIVE`**—brief, but it waits for any lock holders—and writers are fully stopped for that last catch-up. Marek does not claim zero locks or absolute zero downtime ([boringSQL](https://boringsql.com/posts/repack-concurrently-costs/)).

## Quiet table vs 3,000 updates/s (author benches)

On a quiet ~28 GB heap (90M rows → 60M live after every-third delete + VACUUM; three indexes), Marek measured:

| tool | duration | WAL | peak extra disk |
| --- | --- | --- | --- |
| VACUUM FULL (blocking) | **109 s** | **17.3 GB** | **18.7 GB** |
| **REPACK (CONCURRENTLY)** | **107 s** | **18.8 GB** | **18.7 GB** |
| pg_repack | **162 s** | **33.5 GB** | **18.5 GB** |
| pg_squeeze | **165 s** | **18.8 GB** | **21.2 GB** |

With **3,000** single-row updates/s throughout:

| tool | duration | WAL | peak extra disk |
| --- | --- | --- | --- |
| **REPACK (CONCURRENTLY)** | **130 s** | **24.5 GB** | **18.8 GB** |
| pg_repack | **198 s** | **43.4 GB** | **18.7 GB** |
| pg_squeeze | **181 s** | **27.7 GB** | **28.4 GB** |

On his hardware, REPACK was the fastest online option and lighter on WAL under writes than pg_repack’s row-by-row `INSERT…SELECT` path (~**1.8×** WAL). These are single-author, single-table beta numbers—comparisons matter more than exact wall times ([boringSQL](https://boringsql.com/posts/repack-concurrently-costs/)).

## VACUUM hold-back is cluster-wide

Online repack must keep the starting snapshot, so VACUUM cannot remove row versions that snapshot might still need. Marek’s demo: a delayed index rebuild while another table took 1,500 updates/s—after ~2 minutes, REPACK left **~186,000** dead rows VACUUM could not remove. The holder is the **temporary replication slot** (plus the REPACK backend). **Slots belong to the whole server**, so REPACK and pg_squeeze hold back VACUUM on **every database on the cluster**; **pg_repack** hold-back is **same-database only** ([boringSQL](https://boringsql.com/posts/repack-concurrently-costs/)).

## Not MVCC-safe

The docs say `REPACK (CONCURRENTLY)` is **not MVCC-safe**. Marek shows an old **REPEATABLE READ** snapshot that read another table first can see **0 rows** after the swap (same empty-table outcome for pg_squeeze in his table). New sessions see the full copy. He expects Houska’s MVCC-safety work to aim at **PostgreSQL 20**, not a claim that 19 will fix it ([boringSQL](https://boringsql.com/posts/repack-concurrently-costs/)).

## ~105 million update+delete ceiling

For every row other sessions **update or delete** during the run, the REPACK backend keeps ~**50 bytes** until commit (inserts do not count). Nothing like `maintenance_work_mem` bounds it. On capped containers with no swap, Marek hit:

| memory limit | outcome | changes at fail |
| --- | --- | --- |
| 1 GB | backend OOM → **cluster crash restart** | ~**18.0M** |
| 4 GB | backend OOM → **cluster crash restart** | ~**84.3M** |
| 8 GB | `invalid memory alloc request size` | **104,820,740** |

Hard ceiling ≈ **105 million** concurrent updates+deletes (~**104,857,600** structure entries). Under cgroup/default overcommit that can **crash-restart the whole cluster**; near the alloc limit you get an ERROR and the original table is left untouched. This is an attributed operational caveat from his benches—**not a CVE**. He reported it on pgsql-hackers and expects a fix aimed at **PostgreSQL 20**, so **19 is expected to ship with this limit** ([boringSQL](https://boringsql.com/posts/repack-concurrently-costs/)).

## Beta caveat

Everything above is **19beta4**. Behavior and numbers may shift before GA; treat the tables as planning inputs on named hardware, not production SLOs. Marek’s opinion that REPACK will be “the best option for most of us” on managed Postgres (no extension) is author opinion only—not a universal product claim.

## Who should care

Ops teams planning bloated-table rewrites on PostgreSQL 19 should start at Marek’s [boringSQL post](https://boringsql.com/posts/repack-concurrently-costs/): budget a second copy of table+indexes plus WAL, watch cluster-wide `n_dead_tup` while a slot is open, size update+delete rate × expected duration well under ~100M rows, set `lock_timeout` knowing a timeout can discard the whole run, and warn long REPEATABLE READ readers before the swap.
