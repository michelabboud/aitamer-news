---
title: A Partial Index Needs a Matching Query
description: A partial index over pending jobs helps only when PostgreSQL can tell that the query asks for rows covered by the index.
pubDate: "2026-10-04T16:00:00Z"
specimen: 227
section: dev
tags:
  - postgresql
  - sql
  - indexes
  - query-planning
draft: false
heroImage: https://media.aitamer.news/heroes/a-partial-index-needs-a-matching-query-8301b352.jpg
heroAlt: A magnifying glass selects coral folders with gear symbols from a larger file cabinet.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL requires a query condition that implies the partial-index predicate.
  claimed: A pending-jobs query illustrates the documented matching rule.
verdict: Use a pending-only index when the query states the pending condition, then inspect the chosen plan with EXPLAIN.
sources:
  - title: "PostgreSQL Documentation: Partial Indexes"
    url: https://www.postgresql.org/docs/current/indexes-partial.html
  - title: "PostgreSQL Documentation: Using EXPLAIN"
    url: https://www.postgresql.org/docs/current/using-explain.html
  - title: "PostgreSQL Documentation: PREPARE"
    url: https://www.postgresql.org/docs/current/sql-prepare.html
---

## The index covers pending rows

A partial index contains entries for rows that satisfy its `WHERE` condition, called its predicate. Consider a `jobs` table where workers look for pending jobs by `run_at`. This index contains `run_at` entries only for pending jobs:

```sql
CREATE INDEX jobs_pending_run_at_idx ON jobs (run_at)
WHERE status = 'pending';
```

If pending jobs are a small part of the table, excluding other statuses can reduce the index’s size and the work needed for some updates. That is one reason the [PostgreSQL partial-index documentation](https://www.postgresql.org/docs/current/indexes-partial.html) gives for indexing a subset of rows. The benefit depends on the data and the queries that use it.

## The query must imply the predicate

A query can use this index only when PostgreSQL recognizes that its conditions imply `status = 'pending'`. This query supplies the same condition:

```sql
SELECT id, run_at
FROM jobs
WHERE status = 'pending'
ORDER BY run_at
LIMIT 20;
```

The index is eligible for this query. Eligibility does not promise an index scan: PostgreSQL still chooses a plan for the query. The `run_at` column also matches the requested order, which can make an index scan useful for an ordered result. [PostgreSQL’s EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html) shows how to inspect the plan the planner chose.

Now remove the status condition. A query for jobs ordered by `run_at` could return jobs with any status. PostgreSQL cannot use an index containing only pending jobs to answer that query. The indexed column and the predicate column need not be the same, but the query still has to establish the predicate, as the [partial-index documentation](https://www.postgresql.org/docs/current/indexes-partial.html) explains.

## A parameter can change the plan

A generic plan for `WHERE status = $1` must work for every parameter value. It cannot assume that `$1` is `pending`, so it cannot use the pending-only index on that basis. [PostgreSQL's partial-index guide](https://www.postgresql.org/docs/current/indexes-partial.html) warns that a parameterized condition does not establish the predicate for such a plan.

A prepared statement can also receive a custom plan built for the value supplied at execution. That plan may recognize `status = 'pending'` and consider the partial index. PostgreSQL can choose between generic and custom plans as a statement is reused. [Its PREPARE documentation](https://www.postgresql.org/docs/current/sql-prepare.html) explains the choice and shows how to inspect the selected plan with `EXPLAIN EXECUTE`. Do not infer the plan from the presence of `$1` alone.

## What to do

1. Write the predicate around the rows the query actually seeks.
2. Put a matching condition in the query’s `WHERE` clause. If the query uses a parameter, inspect the actual prepared plan with `EXPLAIN EXECUTE`, because generic and custom plans can differ.
3. Run `EXPLAIN` on the query you intend to use. Check whether its plan uses the index, then judge the index against your data and workload. The [EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html) describes how to read the selected plan.
