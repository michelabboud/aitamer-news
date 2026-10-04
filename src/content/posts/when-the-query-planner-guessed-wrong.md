---
title: When the Query Planner Guessed Wrong
description: Compare PostgreSQL’s estimated and observed row counts before changing an index. The first useful clue is often where the counts diverge.
pubDate: "2026-10-06T08:00:00Z"
specimen: 304
section: dev
tags:
  - postgresql
  - query-planning
  - explain
  - database-performance
draft: false
heroImage: https://media.aitamer.news/heroes/when-the-query-planner-guessed-wrong-bc2f2f90.jpg
heroAlt: A magnifier compares an estimated small result with a much larger query result.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL documents estimated and actual rows, loops, statistics, and EXPLAIN caveats.
  claimed: Compare the first meaningful row-count gap before changing an index.
verdict: Find where estimated and observed rows part company. Check execution loops and statistics before deciding whether the index needs to change.
sources:
  - title: "PostgreSQL: Using EXPLAIN"
    url: https://www.postgresql.org/docs/current/using-explain.html
  - title: "PostgreSQL: EXPLAIN"
    url: https://www.postgresql.org/docs/current/sql-explain.html
  - title: "PostgreSQL: Statistics Used by the Planner"
    url: https://www.postgresql.org/docs/current/planner-stats.html
  - title: "PostgreSQL: ANALYZE"
    url: https://www.postgresql.org/docs/current/sql-analyze.html
---

A slow query can make an index look like the obvious fix. First, find out what PostgreSQL expected the query to return. The planner chooses a path using estimates about table size and how many rows each condition will match. If those estimates are far from the rows produced during execution, an index change may leave the underlying problem untouched. PostgreSQL’s [EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html) puts row estimates beside observed counts so you can locate that gap.

## Run the query and capture its plan

Start with the query and parameter values that showed the problem. Plain `EXPLAIN` shows the chosen plan and its estimates. Add `ANALYZE` to execute the statement and show observed rows and times. `BUFFERS` shows block usage alongside the plan:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM tenk1 WHERE unique1 < 100;
```

The query uses a table and condition from the [documentation’s examples](https://www.postgresql.org/docs/current/using-explain.html). Substitute your own query when investigating an application. **`ANALYZE` runs the statement.** A data-changing statement has its usual effects even though EXPLAIN displays a plan instead of its output. PostgreSQL’s [EXPLAIN reference](https://www.postgresql.org/docs/current/sql-explain.html) shows how to wrap such a statement in a transaction and roll it back when appropriate.

## Compare rows at each node

Read the plan from its indented scan nodes upward. Each node reports an estimated `rows` value. With `ANALYZE`, it also reports `actual ... rows`. These counts describe rows **emitted** by the node, which can be fewer than the rows it scanned. A filter may discard rows after a table or index scan has fetched them. The [EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html) distinguishes those emitted rows from rows visited during the scan.

Look for the earliest meaningful gap between estimate and observation. If a scan already emits far more rows than expected, inspect its condition and the statistics for that table. If the scan counts are close and a later node diverges, inspect the operation at that node. This is a way to narrow the investigation; a row-count gap alone does not establish why a query is slow. PostgreSQL says the key comparison is whether estimated row counts are reasonably close to reality ([EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html)).

## Account for repeated work

A nested loop can run its inner node once for every row supplied by the outer node. In PostgreSQL’s [worked example](https://www.postgresql.org/docs/current/using-explain.html), the inner index scan shows `rows=1.00 loops=10`. The observed row count is an average for each execution. Multiply it by `loops` when you need the total rows emitted across those executions. Read the estimated count at that node on the same per-execution basis before calling it a bad estimate.

Repeated execution matters even when each inner scan returns the expected number of rows. Follow the plan tree to see which parent requests that work and how many times it happens. The node’s actual time is also reported per execution, so `loops` matters when interpreting that figure ([EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html)).

## Check whether the gap is real

A large difference can reflect how the plan is displayed. Under `LIMIT`, a parent may stop requesting rows before its child finishes. The child’s estimate assumes a complete run, while its observed count reflects the early stop. PostgreSQL’s [caveats](https://www.postgresql.org/docs/current/using-explain.html) also describe cases involving merge joins and bitmap combination nodes that need care when reading actual counts.

Keep cost and time separate. Estimated costs use planner units; actual times use milliseconds. A cost value cannot be read as a promised runtime. `EXPLAIN ANALYZE` also adds measurement overhead and does not send result rows to the client. Its runtime can therefore differ from an ordinary application request ([EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html)). Use the plan to investigate the work performed, then check the application’s timing for the user-facing result.

## Inspect the information behind the estimate

PostgreSQL stores approximate table and index row counts in `pg_class`. Those values are updated by operations including `VACUUM` and `ANALYZE`, rather than after every change. For column-level selectivity, inspect the readable `pg_stats` view. The [planner statistics guide](https://www.postgresql.org/docs/current/planner-stats.html) explains both sources and warns that statistics remain approximate even after collection.

If the table has changed substantially, collecting fresh statistics with [ANALYZE](https://www.postgresql.org/docs/current/sql-analyze.html) is a grounded next step. Then capture the plan again and compare the same node. Fresh statistics can change estimates without guaranteeing an exact count, because collection uses a sample ([planner statistics guide](https://www.postgresql.org/docs/current/planner-stats.html)).

Predicates on correlated columns deserve a closer look. PostgreSQL normally estimates multiple conditions as though they were independent. Its [extended statistics](https://www.postgresql.org/docs/current/planner-stats.html) can describe selected relationships across columns in one table. They require a statistics object and an `ANALYZE` run to collect data. Choose them for a demonstrated relationship and check their documented limits for the condition you are investigating.

## Decide whether an index helps

A sequential scan is a choice, not a diagnosis. PostgreSQL’s [EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html) shows a query whose less selective condition uses a sequential scan and a more selective condition that uses an index. An index path still has costs, including fetching matching table rows. The useful question is whether the corrected row estimate and the query’s access pattern support a different path.

Look at `Index Cond` and `Filter` in the plan. An `Index Cond` identifies work applied through the index; a separate `Filter` is checked against rows retrieved by the node. The guide’s example shows a second predicate reducing output rows while leaving the same index lookup in place. That distinction gives you a concrete reason to consider an index change, after the estimate has been examined ([EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html)).

## What to do

1. Capture `EXPLAIN (ANALYZE, BUFFERS)` for the affected query and record the parameter values. Use care with data-changing statements because `ANALYZE` executes them ([EXPLAIN reference](https://www.postgresql.org/docs/current/sql-explain.html)).
2. Compare estimated and observed rows from the scan nodes upward. Read `loops` before comparing a node that runs repeatedly, and check for an early stop caused by `LIMIT` ([EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html)).
3. Inspect the relevant table and column statistics. Run `ANALYZE` when fresh statistics are needed, then capture the plan again ([planner statistics guide](https://www.postgresql.org/docs/current/planner-stats.html); [ANALYZE reference](https://www.postgresql.org/docs/current/sql-analyze.html)).
4. Consider an index change only after identifying what work the existing path performs. Compare the resulting plan and application timing against the original query ([EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html)).
