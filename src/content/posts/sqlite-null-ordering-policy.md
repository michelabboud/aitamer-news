---
title: Put missing values where the reader expects them
description: Explicit NULL ordering makes a ranked list easier to understand and maintain.
pubDate: "2026-11-12T08:00:00Z"
specimen: 1297
section: dev
tags:
  - sql
  - sqlite
  - data-quality
draft: false
heroImage: https://media.aitamer.news/heroes/sqlite-null-ordering-policy-4d8620e5.jpg
heroAlt: Colored paper calendar cards stand before two empty frames while a hand places the final frame on the shelf.
author: ari
wildness:
  rating: 1
  verified: SQLite supports explicit NULL placement and subsequent ordering terms for ties.
  claimed: No production schema, query performance or cross-database portability is claimed.
verdict: Express missing-value placement and tie-breaking explicitly in the ordered query.
sources:
  - title: SQLite official documentation
    url: https://www.sqlite.org/lang_select.html#the_order_by_clause
---

A list ordered by a date can place undated records at the top even when the reader expects the earliest real date first. SQL NULL is not an ordinary date value. Its placement in an ordered result needs a deliberate choice.

In SQLite, make that choice visible:

```sql
WITH jobs(id, due) AS (VALUES (1, NULL), (2, '2026-11-05'))
SELECT id, due FROM jobs
ORDER BY due ASC NULLS LAST, id ASC;
-- the dated job appears before the undated job
```

The [SQLite ORDER BY reference](https://www.sqlite.org/lang_select.html#the_order_by_clause) explains its default NULL placement and the NULLS FIRST and NULLS LAST options. Explicit syntax lets a reviewer see the policy without mentally reconstructing the default.

For a task list, missing might mean no deadline, not urgent. For an exception report, missing might be the most urgent state because someone must supply a value. The same database representation can therefore belong at either end depending on the screen's purpose. Choose from the reader's task, then express that choice in the query.

Replacing NULL with a made-up far-future date can seem convenient. It also mixes the display policy with a value that may later be mistaken for a real deadline. If a sentinel value must exist for compatibility, document it and keep it from leaking into exports as though it were observed data. Ordering syntax can often avoid inventing such a date in the first place.

The final id ordering in the example resolves ties between records with the same due value. NULL placement and tie-breaking are separate decisions. If many records have no deadline, the screen should still have a predictable order inside that group. Choose a stable identifier or another explicit rule that fits the task.

Check the engine and version actually deployed before relying on syntax portability. This example names SQLite deliberately. A query copied into a different database may have a different default or require another expression to implement the same policy. The intended order should survive the port even if the spelling changes.

Tests should contain an undated row, an early date, a later date, and two equal dates. Check the whole order rather than asserting only which row is first. That catches both an accidental change to NULL placement and an incomplete tie-breaker.

A sorted list communicates priorities to people. Treat where missing information appears as part of that communication, rather than leaving it to a database default nobody meant to choose.
