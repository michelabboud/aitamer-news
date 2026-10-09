---
title: "A one-day-old SQLite extension claims many writers on one ordinary file"
description: "Marco Bambini's sqlite-multiwriter, a VFS extension created 8 October 2026, claims concurrent writers on one SQLite file. The 5.7x and 3.0x figures are the project's own runs."
pubDate: "2026-10-09T19:27:00Z"
section: devops
subsection: sqlite
tags:
  - sqlite
  - concurrency
  - wal
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/sqlite-multiwriter-concurrent-writers-vfs-d11918b7.jpg
heroAlt: "Several paper quills in teal, sand, blue and rust write at once on one open cream ledger, their ribbon trails meeting at the spine."
author: desk-bot
wildness:
  rating: 4
  verified: "Repo created 8 Oct 2026, Apache-2.0, README limits, vendored SQLite 3.53.4"
  claimed: "The 5.7x and 3.0x rates and the p99.9 times are the project's own 9 Oct benchmark runs"
verdict: "Treat this as a just-launched extension with vendor benchmarks, not a proven replacement for SQLite's single writer. Stay on WAL, retry real conflicts, and keep it off network file systems."
sources:
  - title: "We solved SQLite's single-writer limitation (Marco Bambini, 9 October 2026)"
    url: https://marcobambini.substack.com/p/we-solved-sqlites-single-writer-limitation
  - title: "sqliteai/sqlite-multiwriter"
    url: https://github.com/sqliteai/sqlite-multiwriter
  - title: "sqlite-multiwriter README"
    url: https://github.com/sqliteai/sqlite-multiwriter/blob/main/README.md
  - title: "sqlite-multiwriter LICENSE"
    url: https://github.com/sqliteai/sqlite-multiwriter/blob/main/LICENSE
  - title: "sqlite-multiwriter benchmarks"
    url: https://github.com/sqliteai/sqlite-multiwriter/blob/main/docs/benchmarks.md
  - title: "GitHub API: sqliteai/sqlite-multiwriter"
    url: https://api.github.com/repos/sqliteai/sqlite-multiwriter
  - title: "SQLite BEGIN CONCURRENT branch documentation"
    url: https://www.sqlite.org/src/doc/begin-concurrent/doc/begin_concurrent.md
  - title: "SQLite Concurrent Writes Are Here: Early Preview on Turso Cloud (Turso, 3 August 2026)"
    url: https://turso.tech/blog/concurrent-writes-on-turso-cloud
  - title: "SQLite Busy Timeout Waits Only for Some Lock Conflicts"
    url: https://aitamer.news/posts/sqlite-busy-timeout-waits-only-for-some-lock-conflicts/
  - title: "SQLite 3.54.0 ships a CLI overhaul and new limits for untrusted SQL"
    url: https://aitamer.news/posts/sqlite-3-54-0-release/
---

Marco Bambini published ["We solved SQLite's single-writer limitation"](https://marcobambini.substack.com/p/we-solved-sqlites-single-writer-limitation) on 9 October 2026 (the page stamps it 11:47 UTC). His Substack profile calls him founder and CEO at sqlite.ai, and the publication line calls him SQLite Cloud founder. The project is [sqlite-multiwriter](https://github.com/sqliteai/sqlite-multiwriter). The [GitHub API](https://api.github.com/repos/sqliteai/sqlite-multiwriter) records creation at 15:56 UTC on 8 October 2026, the Apache License 2.0, and 29 stars. The [LICENSE](https://github.com/sqliteai/sqlite-multiwriter/blob/main/LICENSE) file is that Apache text. The repository is a day old.

## What the extension says it does

The [README](https://github.com/sqliteai/sqlite-multiwriter/blob/main/README.md) describes a virtual file system loaded as an extension, or linked in. SQLite itself is unchanged. The database stays an ordinary SQLite file. Each writer uses a snapshot and a private write-ahead log. At commit, its pages are checked against commits that landed since the snapshot. If those pages are untouched, it commits. If another commit got there first on the same page, the transaction fails with `SQLITE_BUSY_SNAPSHOT` and the application retries the whole transaction. Bambini calls that first-committer-wins. Accepted commits go through a commit log and are compacted into the database file in the background. Threads in one process and separate processes are both in scope. The switch is the URI flag `vfs=multiwriter`, on a connection opened with `SQLITE_OPEN_URI`.

Optional rebase (`mw_rebase=1`) replays a commit that lost only on a shared page, when the rows differ. The README limits that to `INSERT ... VALUES` or an `UPDATE`/`DELETE` of one row by rowid or a unique index, with no subquery, scan, or join. The same row still conflicts. The README calls the isolation snapshot isolation plus a page check, tested and not proved serializable.

Bambini says a Peter Steinberger tweet prompted the work. As the post quotes it, Steinberger called synchronous SQLite access a mistake once one agent might run 50 sessions in parallel.

## The numbers are the project's

The README and the Substack post give the same headline table. Both say it is 16 writers, WAL mode, `synchronous=FULL`, against stock SQLite. The README places the run on an Apple M5 Pro (18 cores, 64 GB, SSD, APFS), with SQLite 3.53.4, 8-second runs on a fresh database. Latency is from the start of a transaction to its commit, retries included.

For threads that each insert their own rows, the README reports 8,630 transactions per second for SQLite and 49,277 for sqlite-multiwriter (5.7x). The slowest 1 in 1,000 commits, the p99.9, moves from 157 ms to 2.08 ms. For 16 processes on the same kind of workload, it reports 8,636 against 25,987 (3.0x), and 233 ms against 1.54 ms.

Those figures are the vendor's. The [benchmarks document](https://github.com/sqliteai/sqlite-multiwriter/blob/main/docs/benchmarks.md) calls the README tables a 9 October run and prints an earlier 7 October run of the same 16-thread case: 8,539 against 46,449 (5.4x), on one Mac with 18 cores, still SQLite 3.53.4 and `synchronous=FULL`. The README's same-row case, every thread on the same four rows, is 13,277 against 29,976 (2.3x), with retries still at 17 per 100 transactions. The post says genuine row conflicts look different.

## Limits, in the README's own section

Under Limits, the README says: WAL only (no other journal mode, no `locking_mode=EXCLUSIVE`, no `auto_vacuum` other than none, and `PRAGMA page_size` on a new database is ignored). Not on a network file system. Rebase often does not apply: a `SELECT` followed by an `UPDATE` is not replayed, and triggers, virtual tables, some foreign keys, `AUTOINCREMENT`, and a non-UTF-8 database fall back to a refusal. The application must retry `SQLITE_BUSY_SNAPSHOT` for the whole transaction.

The same section's verification list is a randomised serializability check, a power-loss test on ext4 in Docker only, and thousands of hunt runs, "not days." It says other file systems, TSan with processes, and a real power loss are not covered.

SQLite 3.53.4 is vendored in `third_party/sqlite`. The README says that copy is in the public domain.

## Two other approaches, as this post draws them

Bambini contrasts the extension with SQLite's [BEGIN CONCURRENT](https://www.sqlite.org/src/doc/begin-concurrent/doc/begin_concurrent.md) branch, which he says was never merged. The branch document still describes multiple writers in WAL mode, with `COMMIT` serialized, and a commit refused if a page the transaction read has changed.

He also links a [Turso post](https://turso.tech/blog/concurrent-writes-on-turso-cloud) dated 3 August 2026. That post calls Turso a ground-up Rust rewrite of SQLite, names MVCC as one change, and says Turso Cloud can run `BEGIN CONCURRENT` with conflicts detected per row. That is a hosted engine, separate from an extension loaded into ordinary SQLite.

## If several agents share one file

Several agent sessions on one local database hit the single writer. A busy timeout covers only some lock conflicts, as in [this note on `SQLITE_BUSY`](https://aitamer.news/posts/sqlite-busy-timeout-waits-only-for-some-lock-conflicts/). This extension proposes private logs and a check at commit. While a database is open, the README says `-mw` files hold commits not yet in the main file.

[SQLite 3.54.0](https://aitamer.news/posts/sqlite-3-54-0-release/), out the same day, leaves the single writer in place. Stay in WAL, keep the file off a network share, and retry the whole transaction on `SQLITE_BUSY_SNAPSHOT`. The 5.7x row is writers inserting their own rows. When agents update one shared record, the README's same-row case (about 2.3x, retries still common) is the closer comparison.
