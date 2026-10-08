---
title: SQLite Busy Timeout Waits Only for Some Lock Conflicts
description: SQLite busy timeout can wait for a lock to clear, but it may return SQLITE_BUSY immediately when waiting would preserve a transaction deadlock. Design retries around the whole transaction.
pubDate: "2026-10-09T06:00:00Z"
section: dev
tags:
  - sqlite
  - busy-timeout
  - transactions
draft: false
heroImage: https://media.aitamer.news/heroes/sqlite-busy-timeout-waits-only-for-some-lock-conflicts-7e5db577.jpg
heroAlt: Interlocked blue and cream paper arms form a waiting cycle beside a rust hourglass.
author: ari
wildness:
  rating: 1
  verified: SQLite may bypass a busy handler when waiting would cause a lock deadlock.
  claimed: Voice worker workflow is illustrative; no contention timing was measured.
verdict: Treat SQLITE_BUSY as a transaction-level retry signal; a longer timeout cannot resolve every lock cycle.
sources:
  - title: SQLite busy timeout API
    url: https://www.sqlite.org/c3ref/busy_timeout.html
  - title: SQLite busy handler API
    url: https://www.sqlite.org/c3ref/busy_handler.html
  - title: SQLite transaction documentation
    url: https://www.sqlite.org/lang_transaction.html
  - title: SQLite write-ahead logging documentation
    url: https://www.sqlite.org/wal.html
---

A voice application stores queued audio clips in SQLite. A worker starts a deferred transaction, reads a clip's state, then marks it claimed. Meanwhile, another connection is writing. It is tempting to set a long busy timeout and assume the worker's update will wait for its turn. That assumption fails for some lock conflicts.

`sqlite3_busy_timeout(db, milliseconds)` installs a busy handler on **one connection**. On eligible contention, the handler sleeps and retries until its accumulated sleep reaches the configured threshold; then `sqlite3_step()` returns `SQLITE_BUSY`. A value at or below zero disables busy handlers. Only one busy handler can exist per connection, so setting the timeout replaces a handler installed earlier. These details are in the [busy timeout API](https://www.sqlite.org/c3ref/busy_timeout.html).

The crucial exception comes from the [busy handler API](https://www.sqlite.org/c3ref/busy_handler.html): SQLite may skip the handler when waiting would create a deadlock. In the documented rollback-journal example, connection A holds a read lock and tries to promote it to a reserved lock. Connection B already holds a reserved lock and needs an exclusive lock to finish. A waits for B's reserved lock; B waits for A's read lock. More sleep cannot release either lock, so SQLite can return `SQLITE_BUSY` immediately to A. An immediate busy result therefore does not prove the timeout setting was ignored.

The [transaction documentation](https://www.sqlite.org/lang_transaction.html) explains why the voice worker can reach this point: a deferred transaction whose first statement is a `SELECT` starts as a read transaction, and a later write attempts an upgrade. SQLite permits one simultaneous write transaction. If the workflow knows it will write, `BEGIN IMMEDIATE` requests the write transaction at the start. That can itself return `SQLITE_BUSY`, but it avoids discovering a read-to-write upgrade conflict after the worker has already made decisions from a snapshot.

For this worker, keep the transaction short and handle `SQLITE_BUSY` at the transaction boundary. Release the read transaction, then retry the **whole** claim decision so the clip state is read again. Retrying only the failed `UPDATE` inside the old transaction can preserve a stale decision. A timeout is useful for transient waits; transaction ordering and bounded retries are still part of the application design. The lock-cycle example describes rollback-journal behavior; [write-ahead logging](https://www.sqlite.org/wal.html) has different concurrency details and should be evaluated separately.
