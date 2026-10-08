---
title: A Serializable Transaction Can Still Ask You to Retry
description: PostgreSQL prevents certain cross-row anomalies by aborting a Serializable transaction. Applications must replay the entire decision, including its reads.
pubDate: "2026-10-09T04:30:00Z"
specimen: 558
section: dev
tags:
  - postgresql
  - transactions
  - concurrency
draft: false
heroImage: https://media.aitamer.news/heroes/a-serializable-transaction-can-still-ask-you-to-retry-fa4a4c1e.jpg
heroAlt: A rust return arrow loops a blue decision packet back toward two observation cards on a cream circular paper track.
author: ari
wildness:
  rating: 1
  verified: Serializable detects nonserial outcomes and returns SQLSTATE 40001 for serialization failures.
  claimed: The reviewer scenario and retry pseudocode illustrate an application design, not a measured workload.
verdict: On SQLSTATE 40001, start a new transaction and repeat every read and decision. Keep external effects behind the commit boundary.
sources:
  - title: PostgreSQL transaction isolation documentation
    url: https://www.postgresql.org/docs/current/transaction-iso.html#XACT-SERIALIZABLE
---

A moderation service requires at least one active human reviewer for an AI agent's queued actions. Two reviewers, Ada and Bo, are active. Ada requests time off while Bo does the same. Each request reads a count of two, then marks its own reviewer inactive. Each update touches a different row, so a simple row conflict does not explain the problem. If both decisions commit from the same old view, the service has no active reviewer.

This is write skew: the writes are separate, but each decision depends on a fact that the other write changes. PostgreSQL's [transaction isolation documentation](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-SERIALIZABLE) explains that its Repeatable Read level provides a stable snapshot yet still permits serialization anomalies. Under Serializable, the database checks whether the committed outcome could be explained by some one-at-a-time order. In this example, whichever request runs second in a serial order should see only one active reviewer and refuse to deactivate. An outcome with zero active reviewers has no valid serial order.

The query's predicate matters. It reads the set of active reviewers for one team, including rows another transaction might change. PostgreSQL uses predicate locking to identify when a concurrent write would have changed an earlier read's result. Those tracking locks do not block the write. Both requests can therefore run while the database still rejects a commit that would complete an impossible combination. The application's error handler must remain active through COMMIT. A successful count query alone says nothing about whether the final decision can commit.

The decision belongs inside one transaction. The application can express its logic this way:

~~~sql
BEGIN ISOLATION LEVEL SERIALIZABLE;

SELECT count(*) AS active_reviewers
FROM reviewers
WHERE team_id = $1 AND active;

-- Only if active_reviewers > 1:
UPDATE reviewers
SET active = false
WHERE team_id = $1 AND reviewer_id = $2 AND active;

COMMIT;
~~~

The comment represents application control flow, not a SQL condition that runs automatically. The service should also check that the UPDATE affected the intended row and that the caller is authorized. Both requests must participate in the same invariant, and the transaction must include the read that justifies the write. If concurrent Serializable transactions attempt the unsafe outcome, PostgreSQL can reject one with a serialization failure, SQLSTATE 40001. A statement that previously returned “two” does not become a valid decision merely because it ran successfully. A transaction's read is usable for a committed decision only after the transaction commits.

A retry must reopen the transaction and repeat the count, authorization-sensitive reads, decision, update, and commit. Retrying only the UPDATE would reuse the stale conclusion that two reviewers were available. On the new snapshot, the losing request sees one active reviewer and should return a business result such as “the last reviewer must remain active.” That is a successful retry of the workflow even though the requested state change is refused.

In pseudocode, the retry boundary surrounds the whole unit:

~~~text
for attempt in bounded_attempts:
    begin_serializable()
    try:
        count = read_active_reviewers(team)
        if count <= 1:
            rollback()
            return last_reviewer_must_remain
        update_requested_reviewer(team, reviewer)
        commit()
        return deactivated
    except database_error as error:
        rollback_if_open()
        if error.sqlstate != "40001":
            raise
        wait_with_jitter(attempt)
return temporary_contention_error
~~~

This sketch leaves authorization and affected-row checks to the application. In production, place them inside the transaction where they can influence the decision. A bounded retry with jitter keeps hot teams from spinning forever; exhausted retries need a visible transient error or a queued retry policy. Do not classify every database error as serialization contention. A unique violation, a permission failure, or a bad statement calls for a different response. PostgreSQL also notes that overlapping Serializable transactions can produce a unique violation in some key-generation patterns even after a preflight absence check; a broad blind retry loop would conceal that design problem.

Serializable has a cost. PostgreSQL tracks read/write dependencies using predicate locks. These locks identify dangerous combinations without blocking writes. The tracking they require and any resulting transaction restarts can consume resources, especially as concurrency grows. Keep transactions as short as integrity allows, limit connection pressure, and measure retry rates in the actual workload. If another path changes reviewer status without the same invariant discipline, review that path as part of the design. A database can only protect the decisions represented by the transactions it sees.

Finally, a rollback cannot unsend a notification or reverse a call to an external AI service. Publish an event after successful commit, or use a transactional outbox with idempotent delivery when that event must survive a process crash. This is an application design consequence of retries, not a feature that Serializable supplies by itself.

The practical contract is simple: write the business decision as one transaction, treat SQLSTATE 40001 as a request to recompute it from the beginning, and expose a clear result when the retry changes the answer. Serializable protects committed database outcomes; the caller still has to handle an aborted attempt.
