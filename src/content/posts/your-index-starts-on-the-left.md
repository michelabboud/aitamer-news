---
title: Your Index Starts on the Left
description: Column order changes how much of a multicolumn B-tree index PostgreSQL must scan. Match the leading columns to the conditions in your queries.
pubDate: "2026-10-06T13:00:00Z"
specimen: 314
section: dev
tags:
  - postgresql
  - indexes
  - sql
  - query-planning
draft: false
heroImage: https://media.aitamer.news/heroes/your-index-starts-on-the-left-adc14e74.jpg
heroAlt: A branching index tree highlights its leftmost path through a row of records.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL documents the leading-column scan rule and skip scan.
  claimed: The orders example illustrates the rule; it is not a measured plan.
verdict: Put equality conditions on leading index columns, then check representative query plans. A query missing the first column may still use the index, so verify the planner’s choice.
sources:
  - title: "PostgreSQL: Multicolumn Indexes"
    url: https://www.postgresql.org/docs/current/indexes-multicolumn.html
  - title: "PostgreSQL: Using EXPLAIN"
    url: https://www.postgresql.org/docs/current/using-explain.html
---

## The leading columns narrow the scan

A multicolumn B-tree index has a column order. Consider a hypothetical `orders` table with this index:

```sql
CREATE INDEX orders_account_created_idx
ON orders (account_id, created_at);
```

For a query with `WHERE account_id = $1 AND created_at >= $2`, the equality on the first column and the range on the next column limit the portion of the index PostgreSQL scans. That follows [PostgreSQL’s rule for multicolumn B-tree indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html): equalities on leading columns, followed by an inequality on the first column without an equality, narrow the scan. Conditions farther right can still be checked in the index, but they do not always reduce how much of it must be read.

Reverse the index columns and the starting point changes. For that same account-specific date query, a range on `created_at` comes first. The `account_id` condition to its right does not necessarily narrow the index scan. Choose the order from the conditions your queries use, rather than from the order in which the columns appear in the table. [The documented scan rule](https://www.postgresql.org/docs/current/indexes-multicolumn.html) explains the difference.

## A missing first column changes the choice

Suppose another query filters only on `created_at`. The `(account_id, created_at)` index is still eligible: PostgreSQL can use a multicolumn B-tree index with conditions on any subset of its columns. It may use *skip scan*, making repeated searches for possible leading-column values. PostgreSQL says this is generally attractive when the leading column has few distinct values. With many distinct values, scanning the index may cost too much, and the planner will often choose a table scan. [See the skip-scan explanation](https://www.postgresql.org/docs/current/indexes-multicolumn.html).

## What to do

1. List the queries you need to support. Mark their equality and range conditions.
2. For a candidate multicolumn B-tree index, put the columns constrained by equality at the left, then the first column constrained by a range. Treat later conditions as useful checks, without assuming they shorten the scan. [Check PostgreSQL’s rule](https://www.postgresql.org/docs/current/indexes-multicolumn.html).
3. Run `EXPLAIN` on representative queries to see the plan PostgreSQL chooses. Use `EXPLAIN ANALYZE` on a representative `SELECT` when you need actual row counts and run times; it executes the query. [PostgreSQL explains both commands](https://www.postgresql.org/docs/current/using-explain.html). Compare the plans before adding another index. PostgreSQL advises using multicolumn indexes sparingly because simpler indexes often save space and time. [See its guidance](https://www.postgresql.org/docs/current/indexes-multicolumn.html).
