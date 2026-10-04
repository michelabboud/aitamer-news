---
title: Skipping Locked Rows Changes What a Query Sees
description: SKIP LOCKED helps competing workers claim jobs without waiting. The same behavior can make an ordinary query silently omit rows it would otherwise find.
pubDate: "2026-10-06T12:30:00Z"
specimen: 313
section: general
tags:
  - postgresql
  - sql
  - concurrency
  - job-queues
draft: false
heroImage: https://media.aitamer.news/heroes/skipping-locked-rows-changes-what-a-query-sees-631dc6c0.jpg
heroAlt: Workers take available boxes from a row while two locked boxes remain unseen by a waiting observer.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL says SKIP LOCKED gives an inconsistent view suited to queue-like consumers.
  claimed: A lock can change a query result even while the skipped row still matches its filter.
verdict: Use SKIP LOCKED to claim available work. Use ordinary reads and suitable isolation for reports that must account for matching rows.
sources:
  - title: "PostgreSQL: SELECT"
    url: https://www.postgresql.org/docs/current/sql-select.html
  - title: "PostgreSQL: Transaction Isolation"
    url: https://www.postgresql.org/docs/current/transaction-iso.html
  - title: "PostgreSQL: Explicit Locking"
    url: https://www.postgresql.org/docs/current/explicit-locking.html
---

PostgreSQL lets a locking query use `SKIP LOCKED`. If the query cannot lock a selected row immediately, it skips that row and continues. PostgreSQL describes the result as an inconsistent view of the data. It identifies queue-like tables with multiple consumers as a suitable use for this option. [PostgreSQL’s SELECT documentation](https://www.postgresql.org/docs/current/sql-select.html) states both the behavior and its intended setting.

“Inconsistent” does not mean the query reads uncommitted changes. PostgreSQL uses snapshots to control which row versions a statement can see. At the default Read Committed isolation level, a plain `SELECT` sees data committed before that query began. `SKIP LOCKED` adds another condition to a locking query’s result: whether it can obtain a row lock at that moment. Those are different concerns. [PostgreSQL’s isolation documentation](https://www.postgresql.org/docs/current/transaction-iso.html) explains the snapshot; its [SELECT documentation](https://www.postgresql.org/docs/current/sql-select.html) explains the skip.

## A row lock changes the result

A plain read generally does not need to wait for a row-level lock. PostgreSQL says row-level locks block writers and other attempts to lock the same row, while ordinary data queries can proceed. A query with `FOR UPDATE` asks to lock the rows it selects. If another transaction holds a conflicting lock, that request ordinarily waits. Adding `SKIP LOCKED` tells PostgreSQL to pass over rows it cannot lock immediately. [The explicit-locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html) describes the conflict; the [SELECT documentation](https://www.postgresql.org/docs/current/sql-select.html) describes the skip.

Consider a table of ready jobs named `alpha` and `beta`. `alpha` sorts first. One worker starts a transaction and locks `alpha`, leaving its ready state unchanged for now. A second worker runs `SELECT id FROM jobs WHERE state = 'ready' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;`. If it cannot immediately lock `alpha`, it can move on to `beta`. The result depends on lock availability even though `alpha` still meets the stated filter. This example follows from PostgreSQL’s documented [locking and ordering rules](https://www.postgresql.org/docs/current/sql-select.html).

When the first transaction ends, its row lock is released. A later claim can consider `alpha` again if it remains ready. Seeing `beta` in the earlier result therefore says nothing about whether `alpha` existed or matched `WHERE state = 'ready'`. It says that the second worker obtained a different row at that moment. PostgreSQL documents both [lock release at transaction end](https://www.postgresql.org/docs/current/explicit-locking.html) and [skipping rows that cannot immediately be locked](https://www.postgresql.org/docs/current/sql-select.html).

## Competing workers can use the omission

A job worker needs a claim it can act on. If another worker is already claiming a row, waiting for that particular row may be unnecessary. Skipping it lets the worker seek another ready row. PostgreSQL explicitly cites avoiding contention among multiple consumers of a queue-like table as a use for `SKIP LOCKED`. [Its SELECT documentation](https://www.postgresql.org/docs/current/sql-select.html) makes that recommendation.

The claim should have a transaction boundary that matches the work being protected. A worker can select a ready row with `FOR UPDATE SKIP LOCKED`, record a claimed state while it holds the lock, and commit that change. Row locks last until transaction end, so the state change gives later workers a reason to exclude the job after the lock goes away. This is an application pattern derived from PostgreSQL’s [row-lock lifetime](https://www.postgresql.org/docs/current/explicit-locking.html) and [locking-query behavior](https://www.postgresql.org/docs/current/sql-select.html). The application still needs its own rules for completing or retrying a claimed job.

## Reports need a complete meaning

A report often asks a different question: which rows meet a filter? A locked row can still meet that filter. If the report uses `SKIP LOCKED`, its output instead contains rows that met the filter **and** could be locked immediately. An empty result can mean that matching rows were temporarily unavailable to the locking query. A count made from those returned rows would count that temporary subset. This consequence follows directly from PostgreSQL’s [skip rule](https://www.postgresql.org/docs/current/sql-select.html).

The distinction matters for dashboards, exports, and checks that drive business decisions. A plain `SELECT` at Read Committed uses a snapshot of committed data as of the query’s start, without requiring row locks for ordinary reading. If several statements must share one stable view, PostgreSQL’s Repeatable Read isolation level keeps a transaction snapshot across them. Stronger consistency requirements may call for Serializable transactions and retry handling. Choose the isolation level for the decision the application makes. [PostgreSQL’s transaction-isolation documentation](https://www.postgresql.org/docs/current/transaction-iso.html) sets out those guarantees and retry requirements.

## Ordering does not restore skipped rows

`ORDER BY` can define which available job comes first, and `LIMIT` can bound a worker’s claim. Neither makes a locked earlier row appear in the result. A later row can be returned while the earlier row is skipped. Without a unique ordering, PostgreSQL also warns that `LIMIT` can produce an unpredictable subset. Ordering helps choose among candidates; lock availability still changes the candidates a `SKIP LOCKED` query can return. [The SELECT documentation](https://www.postgresql.org/docs/current/sql-select.html) covers these rules.

`SKIP LOCKED` also applies to row-level locks only. The locking query still takes its required table-level lock in the ordinary way. It therefore should not be described as a guarantee that the statement never waits. For a row that cannot be locked immediately, PostgreSQL offers another choice: `NOWAIT` reports an error instead of skipping it. [PostgreSQL documents both limits](https://www.postgresql.org/docs/current/sql-select.html).

## What to do

1. Identify the query’s purpose. For a worker claiming one available job, use a ready-state filter, a defined order, a limit, and `FOR UPDATE SKIP LOCKED` inside a transaction. Record the claim before ending that transaction. [PostgreSQL’s locking rules](https://www.postgresql.org/docs/current/sql-select.html) and [lock-lifetime rules](https://www.postgresql.org/docs/current/explicit-locking.html) explain why those steps fit together.
2. For a report or completeness check, remove `SKIP LOCKED` and use an ordinary read. Select an isolation level that matches whether one statement’s snapshot or a stable view across several statements is needed. [PostgreSQL’s isolation documentation](https://www.postgresql.org/docs/current/transaction-iso.html) describes the difference.
3. Treat an empty worker result as no matching row that the query could claim immediately. Arrange another attempt if the worker should keep looking. Reserve `NOWAIT` for cases where an explicit lock error is useful. [The SELECT documentation](https://www.postgresql.org/docs/current/sql-select.html) defines what each option returns.
