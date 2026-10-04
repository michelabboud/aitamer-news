---
title: An Advisory Lock Works Only If Workers Cooperate
description: PostgreSQL can coordinate workers that request the same advisory lock. The application must decide where to request it and protect work that outlives the lock.
pubDate: "2026-10-05T03:00:00Z"
specimen: 248
section: dev
tags:
  - postgresql
  - advisory-locks
  - background-jobs
  - concurrency
draft: false
heroImage: https://media.aitamer.news/heroes/an-advisory-lock-works-only-if-workers-cooperate-66024b09.jpg
heroAlt: Three people connect to a locked database while a separate gear passes outside the lock.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL documents advisory lock conflicts, lifetimes, and voluntary use.
  claimed: Every competing worker must request the same key; other effects need separate protection.
verdict: Use advisory locks to coordinate workers that share a key. Put the request on every competing path, match the lock lifetime to the work, and enforce lasting data rules with constraints.
sources:
  - title: "PostgreSQL documentation: Advisory Locks"
    url: https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS
  - title: "PostgreSQL documentation: Advisory Lock Functions"
    url: https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS
  - title: "PostgreSQL documentation: pg_locks"
    url: https://www.postgresql.org/docs/current/view-pg-locks.html
  - title: "PostgreSQL documentation: Unique Constraints"
    url: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE
---

PostgreSQL advisory locks let an application give a lock key its own meaning. A worker can acquire a key before starting a job. Another worker asking for a conflicting lock on that key must wait or get a failed try result. PostgreSQL manages that conflict. It does not decide which jobs require the key. Its [locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS) says the system does not enforce use of advisory locks.

Imagine two workers preparing the same account report. Both request an exclusive advisory lock using the same key before they prepare it. They coordinate. A third path that prepares the report without requesting that key can still run. The lock protects the convention shared by the first two workers. It does not turn the report into a locked database object.

## The key names the work

An advisory key is an application-defined resource identifier. PostgreSQL accepts either one 64-bit value or a pair of 32-bit values. Those forms occupy separate key spaces. Locks also belong to a database: the same key in another database is separate. Shared requests can coexist with other shared requests; an exclusive request conflicts with them. These rules come from the [advisory lock functions](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS) and the [pg_locks reference](https://www.postgresql.org/docs/current/view-pg-locks.html).

For a job, choose a key that describes what must run alone. A key for an entire report type serializes every report of that type. A key derived from the report's account identifier allows different accounts to proceed independently. That follows from PostgreSQL comparing lock identifiers. Write down the key scheme and use it at every entry point for the same work. A change in the scheme can silently separate workers that used to coordinate.

## The lock's lifetime follows the session or transaction

A session-level lock lasts until its session explicitly releases it or the session ends. Rolling back a transaction does not release a session-level advisory lock acquired inside it. Repeated acquisition by the same session stacks; each acquisition needs a matching release. These details matter when a worker reuses a database connection. Returning that connection while it still owns a lock can leave later work holding a lock it did not request. See PostgreSQL's [lifetime rules](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS).

A transaction-level lock is released when its transaction ends and has no manual unlock function. It fits work whose protected database changes all happen inside one transaction. Keep the lock request, the work, and the commit on that transaction. Committing early also ends the lock early, even if application work continues afterward. A session-level lock can cover work across transactions, provided the worker keeps control of that session and releases the lock when finished. The [function reference](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS) distinguishes both lifetimes.

## Acquisition must change the worker's path

A worker that may skip a busy job can call:

```sql
BEGIN;
SELECT pg_try_advisory_xact_lock($1, $2) AS acquired;
```

The two parameters must identify the same logical work in every worker. If `acquired` is false, end the transaction and do not run that job. If true, do the protected database work in that transaction, then commit. PostgreSQL documents that this try function returns immediately with a Boolean result. The blocking `pg_advisory_xact_lock` waits instead. Choose one behavior deliberately and handle the outcome in code. [Both functions are documented here](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS).

A successful request also deserves care. A session that already holds an advisory lock can request it again successfully, even while other sessions wait. Therefore a second call from the same session cannot establish which job owns the connection or where the protected work begins. PostgreSQL describes this behavior in its [advisory lock rules](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS).

## The lock has a narrow guarantee

The database can arbitrate conflicting advisory requests. It cannot make a code path request one. It also cannot use an advisory lock to reject a direct insert that violates an application convention. If the durable requirement is one stored result per job, express that requirement with a suitable unique constraint as well. PostgreSQL [enforces unique constraints on stored rows](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE). The lock can reduce competing work; the constraint still checks writes that bypass the convention.

There is another boundary. A lock released at transaction end or session end cannot say whether an external effect completed. If a worker loses its session after sending a message, a later worker may obtain the key and send again. This follows from the documented lock lifetime, so treat external effects as a separate design problem. Give them a durable way to detect a repeated job when repetition would cause harm.

## Contention is visible

PostgreSQL exposes advisory locks through `pg_locks`. Its `locktype` identifies advisory entries, `granted` distinguishes held locks from waiting requests, and `pid` identifies the server process. The [view documentation](https://www.postgresql.org/docs/current/view-pg-locks.html) also explains that advisory keys are local to each database. Use this view when a job seems stuck. It can show a current holder or waiter. It cannot prove that every path which performs the job follows the lock convention.

## What to do

1. Name the exact work that must be serialized, then document a stable key scheme and the database where workers use it.
2. Put acquisition in the common entry path for every worker that performs that work. Make a failed try result skip the job, or use a blocking call when waiting is intended.
3. Choose transaction-level locking when all protected work stays in one transaction. Use session-level locking only when its longer lifetime is required, and pair each acquisition with release.
4. Check `pg_locks` during contention. Test two workers using the same key, then test a path that omits acquisition. The latter test exposes the convention's boundary.
5. Put lasting data rules in database constraints. Give external effects their own duplicate protection where needed.

PostgreSQL supplies the lock manager. The application supplies the rule that every competing worker must follow.
