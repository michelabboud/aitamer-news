---
title: COUNT(column) skips rows whose value is NULL
description: A dashboard count needs to say whether it measures records or populated fields.
pubDate: "2026-11-11T12:00:00Z"
specimen: 1295
section: dev
tags:
  - sql
  - sqlite
  - data-quality
draft: false
heroImage: https://media.aitamer.news/heroes/sql-count-column-skips-null-4e5f677a.jpg
heroAlt: Three paper tickets, one with a hole, feed separate trays containing three tickets and two teal circles.
author: ari
wildness:
  rating: 1
  verified: SQLite COUNT(*) counts rows; COUNT(expression) excludes NULL expression results.
  claimed: No production schema, query performance or cross-database portability is claimed.
verdict: Name whether the metric counts rows, populated values or distinct values, and test missing data.
sources:
  - title: SQLite official documentation
    url: https://www.sqlite.org/lang_aggfunc.html#count
---

A dashboard can lose records without deleting anything. If its query changes from COUNT(*) to COUNT(optional_field), rows whose field is NULL stop contributing to the total. Both queries can be correct, but they answer different questions.

Use a tiny data set to make the distinction visible:

```sql
WITH tickets(owner) AS (VALUES ('Ada'), (NULL), (''))
SELECT COUNT(*), COUNT(owner) FROM tickets;
-- 3 | 2
```

The empty string contributes to the populated-value count; the NULL does not. The [SQLite aggregate reference](https://www.sqlite.org/lang_aggfunc.html#count) defines these two forms directly. The star form counts rows, while the expression form counts non-null results of that expression.

For a queue, total tickets and tickets with an assigned owner are useful measures. Label them differently. Calling both values total makes a later query cleanup look like a production incident, or hides a genuine drop in assigned work behind an innocent-looking display.

Expressions deserve the same care as plain columns. If an expression can produce NULL for a row, COUNT of that expression excludes it. A query reviewer should therefore read the expression's possible results instead of treating the aggregate as a generic way to count whatever the FROM clause found.

Joins add another layer. An outer join can preserve a row from one table while supplying NULLs for a missing match on the other side. Counting a non-null identifier from the matched side can measure the matches; counting every joined row can measure something else. Write a fixture with a parent that has no children before deciding which count belongs on the screen.

Avoid changing an expression to a constant merely to make the number larger. First identify what the metric is meant to mean. If the product asks how many tickets exist, count the rows in the intended population. If it asks how many have owners, count the populated owner values and define how empty strings are handled.

COUNT(DISTINCT owner) answers yet another question: how many different non-null owner values occur. It does not count assigned tickets when one owner has several. Similar-looking query fragments can thus produce three sensible figures from the same data.

Keep examples with missing and repeated values near the metric's definition. A table in which every row has a different populated owner makes all three counts agree, which hides the distinction entirely. Useful tests force the totals apart and check the label alongside the number.
