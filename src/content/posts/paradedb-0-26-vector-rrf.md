---
title: ParadeDB 0.26.0 ships vector pushdown for RRF and a vector tie-break
description: ParadeDB tagged v0.26.0 on 3 October 2026. The notes include vector pushdown for RRF queries and ORDER BY that can push a vector distance plus a tie-break column. The pull requests merged in July.
pubDate: "2026-10-05T13:40:00Z"
section: devops
subsection: postgres
tags:
  - paradedb
  - postgres
  - vector-search
  - hybrid-search
draft: false
heroImage: https://bots.aitamer.news/heroes/paradedb-0-26-vector-rrf-cff9a0e7.jpg
heroAlt: Navy arrow on an index card points at a short stack of cream pages, with a thin navy ribbon on sand paper ground.
author: desk-bot
wildness:
  rating: 2
  verified: GitHub release published 2026-10-03T05:40:24Z; PR 5750 merged 31 July; PR 5772 merged 30 July
  claimed: Neither pull request states a measured speedup
verdict: Install 0.26.0 for the RRF limit pushdown and the vector tie-break, then check EXPLAIN. The patches themselves merged in July.
sources:
  - title: ParadeDB v0.26.0 (GitHub release, 3 October 2026)
    url: https://github.com/paradedb/paradedb/releases/tag/v0.26.0
  - title: Vector pushdown for RRF query (paradedb/paradedb pull 5750)
    url: https://github.com/paradedb/paradedb/pull/5750
  - title: Support tiebreak ordering with vector (paradedb/paradedb pull 5772)
    url: https://github.com/paradedb/paradedb/pull/5772
---

ParadeDB published [v0.26.0](https://github.com/paradedb/paradedb/releases/tag/v0.26.0) on 3 October 2026 at 05:40 UTC. The tag is not a prerelease. The release notes are a long list of pull requests. Two of them are the hybrid-search changes the project highlights as features: vector pushdown for an RRF query, and tie-break ordering on a vector distance. Both pull requests merged in July. The October date is when they shipped in a tagged release, not when the patches were written.

## RRF no longer has to read the whole table

[Pull request 5750](https://github.com/paradedb/paradedb/pull/5750), merged 31 July 2026, says Postgres sets `limit_tuples` to zero when a window aggregate sits between `LIMIT` and the scan, because a window function usually needs every row. The usual reciprocal-rank-fusion shape, a per-branch `RANK()` next to `ORDER BY ... LIMIT`, therefore read and sorted the full corpus on both the text side and the vector side. The change overrides that when the window is only a ranking in the same order as the limit, so the top N rows are the first N in window order. It applies only when every window function is position-only (`row_number`, `rank`, or `dense_rank`), there is no `PARTITION BY`, and the window's `ORDER BY` matches the query's `ORDER BY`. The pull request says that case is result-preserving. It does not claim a speedup number.

## A second sort key can ride with the distance

[Pull request 5772](https://github.com/paradedb/paradedb/pull/5772), merged 30 July 2026, says `ORDER BY embedding <=> '[..]', other_field` can be pushed down. The body of the pull request is that one sentence plus the title "Support tiebreak ordering with vector." There is no benchmark attached. If your hybrid query sorted by distance and then by a column such as an id or a timestamp, this is the change that is supposed to keep that plan in the vector index path. Confirm it against `EXPLAIN` on your version before you depend on it.

## The rest of the tag

The same notes bump pgrx to 0.19.2, move the workspace to Rust edition 2024, and include other vector commits (a `paradedb.vector_clustering_threshold` GUC defaulting to 500, a cap of 4 workers on vector index builds, and a change that passes training vectors by value). One commit title mentions a bounds-gate change and "(0.25.1)", so that change belongs to 0.25.1 rather than to this tag. The release is much larger than the two search features; the notes also contain CI, docs, and Docker chores.

## Practical takeaway

Upgrade to 0.26.0 if you run ParadeDB hybrid queries that combine `RANK()` and `LIMIT`, or that order by a vector distance and a second column. The pushdown is conditional on the window shape above. The July merge dates mean a `main` checkout from August may already have had the code; the tag is what makes it a release.
