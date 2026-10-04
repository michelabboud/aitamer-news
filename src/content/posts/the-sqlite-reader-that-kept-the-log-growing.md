---
title: The SQLite Reader That Kept the Log Growing
description: An open read transaction can keep SQLite’s write-ahead log growing even while automatic checkpoints run. Here is why, and how to find the cause.
pubDate: "2026-10-05T20:30:00Z"
specimen: 282
section: devops
tags:
  - sqlite
  - wal
  - checkpointing
  - databases
draft: false
heroImage: https://media.aitamer.news/heroes/the-sqlite-reader-that-kept-the-log-growing-10b092ce.jpg
heroAlt: A seated paper reader holds a book while a long stream of pages accumulates beside a waterwheel.
author: ari
wildness:
  rating: 2
  verified: SQLite documents how active readers limit checkpoints and WAL resets.
  claimed: The title describes a possible failure pattern, not a reported incident.
verdict: A growing WAL can be a sign of read transactions holding old snapshots. Check checkpoint progress, shorten those transactions, and give checkpoints a chance to finish.
sources:
  - title: SQLite Write-Ahead Logging
    url: https://www.sqlite.org/wal.html
  - title: SQLite PRAGMA Statements
    url: https://www.sqlite.org/pragma.html
---

## A reader holds a place in the log

In write-ahead log (WAL) mode, SQLite appends changes to a separate file. A reader can continue using its view of the database while a writer commits new changes. When a read transaction begins, SQLite records an *end mark* in the log. That mark stays fixed until the transaction ends, so the reader sees a consistent snapshot. Meanwhile, writers can keep appending changes beyond it. [SQLite explains this sequence in its WAL guide](https://www.sqlite.org/wal.html).

## The checkpoint reaches a limit

A checkpoint copies changes from the WAL into the main database file. It can run while readers are active, but it must stop before copying a page beyond any current reader’s end mark. A long read transaction can therefore hold back checkpoint progress. SQLite remembers how far the checkpoint got and tries again later. [The WAL guide describes this limit](https://www.sqlite.org/wal.html).

SQLite normally starts automatic checkpoints when the log reaches its configured threshold. Those checkpoints use **PASSIVE** mode, which does as much work as it can without waiting for readers or writers. If readers keep overlapping so that at least one is always using the WAL, checkpoints may never finish and reset it. The file can keep growing even though checkpoint attempts continue. [SQLite calls this checkpoint starvation](https://www.sqlite.org/wal.html).

## What to do

1. Check whether automatic checkpointing is enabled. `PRAGMA wal_autocheckpoint;` returns its page threshold; zero or a negative value means it is disabled. [SQLite documents the setting](https://www.sqlite.org/pragma.html).
2. Inspect checkpoint progress with `PRAGMA wal_checkpoint(NOOP);`. It returns the number of pages in the log and the number already copied to the database, without running a checkpoint. Compare results over time, then look for application read transactions that stay open while writes continue. [SQLite documents the returned values](https://www.sqlite.org/pragma.html).
3. End read transactions promptly and allow gaps between readers. If a manual reset is needed, `PRAGMA wal_checkpoint(RESTART);` waits for readers to finish using the log; `TRUNCATE` also shrinks the file after a successful checkpoint. These modes can block concurrent work. [SQLite describes the modes and their trade-off](https://www.sqlite.org/pragma.html).

Keep the WAL with its database. SQLite warns that separating them can lose committed transactions or corrupt the database. [Let SQLite manage the file](https://www.sqlite.org/wal.html).
