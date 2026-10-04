---
title: A Rolled-Back Insert Can Still Consume an ID
description: PostgreSQL does not reclaim sequence values after a transaction aborts. That is why generated IDs can have gaps, and why business counters need a separate design.
pubDate: "2026-10-04T19:00:00Z"
specimen: 232
section: dev
tags:
  - postgresql
  - sequences
  - database-design
  - transactions
draft: false
heroImage: https://media.aitamer.news/heroes/a-rolled-back-insert-can-still-consume-an-id-df22e17c.jpg
heroAlt: A coral ticket is discarded from a numbered sequence, leaving an empty place on the conveyor.
author: ari
wildness:
  rating: 2
  verified: Rolled-back transactions and conflict handling can leave gaps in PostgreSQL sequences.
  claimed: A separate transactional counter is one design for consecutive business numbers.
verdict: Sequence gaps are normal. Keep generated row IDs separate from any business number that must follow a stricter rule.
sources:
  - title: "PostgreSQL: Sequence Manipulation Functions"
    url: https://www.postgresql.org/docs/current/functions-sequence.html
  - title: "PostgreSQL: Transaction Isolation"
    url: https://www.postgresql.org/docs/current/transaction-iso.html
  - title: "PostgreSQL: Explicit Locking"
    url: https://www.postgresql.org/docs/current/explicit-locking.html
---

A PostgreSQL sequence can give distinct values to concurrent sessions. When `nextval` returns a value, it advances the sequence. If the transaction later aborts, PostgreSQL does not reclaim that value. An insert can therefore receive an ID, roll back, and leave the next successful insert with a higher one. A missing number does not prove that a row was deleted. It may never have become a committed row. [PostgreSQL's sequence documentation](https://www.postgresql.org/docs/current/functions-sequence.html) describes this behavior.

## Why the gap survives

An insert may obtain a sequence value before a later error aborts its transaction. A gap can also appear without an abort. For `INSERT ... ON CONFLICT`, PostgreSQL computes the proposed row, including required sequence calls, before it checks for a conflict. Taking the conflict path can therefore consume a value. PostgreSQL also lists database crashes as a cause of gaps. Its [sequence documentation](https://www.postgresql.org/docs/current/functions-sequence.html) says sequences cannot produce gapless numbers.

The sequence follows its own transaction rules. Changes to a sequence are visible to other transactions and are not undone when the transaction that made them aborts. That rule also applies to the counter behind a `serial` column, as the [transaction isolation documentation](https://www.postgresql.org/docs/current/transaction-iso.html) explains.

## When a gap matters

A row ID identifies a row. A business serial may carry an additional requirement about which records receive consecutive numbers. Giving both jobs to one sequence creates a promise the sequence cannot keep. For the same reason, subtracting IDs cannot reliably count committed rows: the range can include values allocated to rows that never committed.

If committed records need consecutive numbers, first define which records count and what happens when one is voided. One possible design is a dedicated counter row updated in the same transaction that creates the numbered record. PostgreSQL makes concurrent updates to that row wait; an aborted transaction's row update is undone. This introduces contention at the counter row. The behavior follows from PostgreSQL's documentation on [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [row locks](https://www.postgresql.org/docs/current/explicit-locking.html).

## What to do

Use sequence-backed IDs as identifiers. Do not infer row counts or deletion from gaps. If a business process requires consecutive numbers, specify its scope and voiding rule. Keep that serial separate from the row ID, allocate it in a transaction, and check the design under concurrent writes, rollbacks, and retries.
