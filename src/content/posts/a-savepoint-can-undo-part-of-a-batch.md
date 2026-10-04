---
title: A Savepoint Can Undo Part of a Batch
description: SQLite savepoints let you undo later work while keeping the surrounding transaction open. Here is how to use one and decide what to commit.
pubDate: "2026-10-04T20:00:00Z"
specimen: 234
section: dev
tags:
  - sqlite
  - sql
  - databases
  - transactions
  - savepoints
draft: false
heroImage: https://media.aitamer.news/heroes/a-savepoint-can-undo-part-of-a-batch-045eaac3.jpg
heroAlt: A flag marks a bowl of cookie portions as several later pieces are set aside beside a baking tray.
author: ari
wildness:
  rating: 2
  verified: SQLite says ROLLBACK TO undoes changes after a savepoint and leaves the transaction open.
  claimed: A savepoint gives a batch a local undo point when earlier work can still be kept.
verdict: Use a savepoint around work that may be discarded. After a partial rollback, release the mark and explicitly finish the surrounding transaction.
sources:
  - title: SQLite Savepoints
    url: https://www.sqlite.org/lang_savepoint.html
  - title: SQLite Transaction
    url: https://www.sqlite.org/lang_transaction.html
---

A batch may contain work you want to keep even when a later part fails. Suppose an application records a required job, then tries to add an optional job. If the optional step cannot be used, the application needs a way to undo that step while preserving the first one.

A SQLite savepoint provides that boundary. `SAVEPOINT` marks a position within a transaction. `ROLLBACK TO` restores the database to its state just after that mark. The surrounding transaction stays open, so the application can continue and decide whether to commit its remaining work. A plain `ROLLBACK` ends the whole transaction. [SQLite describes these commands and their effects](https://www.sqlite.org/lang_savepoint.html).

## Put the mark before the optional work

The `jobs` table and values in this example are illustrative. Assume the table already exists:

```sql
BEGIN;

INSERT INTO jobs (id, status) VALUES (101, 'queued');

SAVEPOINT optional_job;
INSERT INTO jobs (id, status) VALUES (102, 'queued');
UPDATE jobs SET status = 'ready' WHERE id = 102;

ROLLBACK TO optional_job;
RELEASE optional_job;

COMMIT;
```

The first insert precedes the savepoint. The second insert and the update follow it. `ROLLBACK TO optional_job` undoes the later changes and leaves the first insert in the open transaction. `COMMIT` then commits the work that remains. This follows SQLite's rule that a rollback to a savepoint undoes database changes made after that savepoint was created. [SQLite's savepoint documentation](https://www.sqlite.org/lang_savepoint.html) also says the named savepoint remains available after `ROLLBACK TO`.

The example shows a chosen recovery path. An application should take it only when keeping job 101 without job 102 is a valid outcome. If both jobs must succeed together, a plain `ROLLBACK` expresses that requirement. SQLite says `ROLLBACK` without `TO` rolls back all outstanding transaction work and empties the transaction stack. [The transaction documentation](https://www.sqlite.org/lang_transaction.html) describes the same whole-transaction behavior.

## The transaction remains open

`ROLLBACK TO` is a rewind point, not the final decision about the batch. SQLite leaves the matching savepoint on its stack and removes savepoints created after it. The application can do more work after the rollback, release the mark, and later commit or roll back the surrounding transaction. [SQLite specifies the stack behavior](https://www.sqlite.org/lang_savepoint.html).

That detail matters in error handling. If code assumes `ROLLBACK TO` finished the transaction, a later statement may run inside a transaction the code meant to close. Make the final decision explicit. In the example, `RELEASE optional_job` removes the remaining mark, and `COMMIT` ends the transaction. [SQLite documents `RELEASE` and `COMMIT`](https://www.sqlite.org/lang_savepoint.html).

A savepoint can also start an outer transaction when there is no `BEGIN`. In that case, releasing the outermost savepoint commits it. Inside a transaction started with `BEGIN`, releasing an inner savepoint only removes a mark. The surrounding transaction still controls the final outcome. [SQLite draws this distinction](https://www.sqlite.org/lang_savepoint.html).

## Release removes a mark

`RELEASE` can sound like a guarantee that the enclosed work is permanent. Its effect depends on where the savepoint sits. Releasing an inner savepoint removes it from the transaction stack. A later rollback of the outer transaction can still undo its changes. SQLite says the content is committed when the outermost transaction commits. [Its savepoint guide explains this](https://www.sqlite.org/lang_savepoint.html).

Names also deserve care. SQLite permits repeated savepoint names and matches the most recent savepoint with the requested name when rolling back to one. `RELEASE` works backward through the stack to the most recent matching name. Clear, distinct names make the intended boundary easier to see in code, even though SQLite does not require them. [The matching rules are documented here](https://www.sqlite.org/lang_savepoint.html).

## An error may change the recovery path

A savepoint is useful when the transaction is still active. SQLite documents errors for which it tries to undo only the current statement, but may have to cancel the entire transaction. Its documentation identifies interfaces an application can use to check transaction state. [See SQLite's response-to-errors guidance](https://www.sqlite.org/lang_transaction.html).

That means a handler should not assume every failed statement can be followed by `ROLLBACK TO`. If an error has already ended the transaction, the saved mark is gone. SQLite says `ROLLBACK TO` returns an error when no matching savepoint remains. [The savepoint rules cover that case](https://www.sqlite.org/lang_savepoint.html). Keep a separate path for an ended transaction, then report the original failure accurately.

## What to do

1. Decide which batch steps may be discarded while earlier steps remain valid.
2. Start the transaction and place a named `SAVEPOINT` immediately before those steps.
3. On a recoverable failure, confirm the transaction remains active, then use `ROLLBACK TO` the mark.
4. `RELEASE` the mark when it is no longer needed. End the surrounding transaction with an explicit `COMMIT` or `ROLLBACK`.
5. Test the success path, the partial rollback path, and an error that ends the transaction. Check the final rows in each case.
