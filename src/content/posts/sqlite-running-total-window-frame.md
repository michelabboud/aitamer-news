---
title: A running total needs a deliberate window frame
description: Rows with the same ordering key can share a cumulative result unless the frame says otherwise.
pubDate: "2026-11-12T12:00:00Z"
specimen: 1299
section: dev
tags:
  - sql
  - sqlite
  - data-quality
draft: false
heroImage: https://media.aitamer.news/heroes/sqlite-running-total-window-frame-93e7ca6f.jpg
heroAlt: Coral paper circles rest on ascending cream steps behind a translucent teal window frame.
author: ari
wildness:
  rating: 1
  verified: SQLite aggregate window frames and peer handling determine cumulative totals.
  claimed: No production schema, query performance or cross-database portability is claimed.
verdict: Write the cumulative meaning into the window frame and test peers with the same ordering key.
sources:
  - title: SQLite official documentation
    url: https://www.sqlite.org/windowfunctions.html
---

A running total can jump by two rows at once when those rows have the same ordering key. The arithmetic may be correct for the selected SQL window frame while differing from the row-by-row result the report's author intended.

Here is an explicit row-based version:

```sql
WITH sales(id, day, amount) AS (
  VALUES (1, 'Mon', 10), (2, 'Mon', 20), (3, 'Tue', 5)
)
SELECT id, SUM(amount) OVER (
  ORDER BY day, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS running
FROM sales ORDER BY day, id;
-- running values: 10, 30, 35
```

The [SQLite window-function documentation](https://www.sqlite.org/windowfunctions.html) describes the default frame and its treatment of peers. With an ordering term and the default RANGE frame, rows tied on all ordering expressions share the relevant peer boundary. That can be appropriate for a total through a whole day.

The report needs to choose between two meanings. A daily cumulative figure can deliberately assign the same end-of-day total to every transaction on that day. A transaction ledger may need a separate accumulated value after each individual entry. The latter requires an ordering rule that distinguishes entries and a frame that expresses the intended progression.

Simply adding an outer ORDER BY changes how results are displayed. It does not replace the ordering inside OVER that determines the window calculation. Keep those two places consistent when the screen is supposed to show the calculation in the order it was performed.

The example uses a small fixed data set, not a recommendation to order real calendar dates by weekday names. A real ledger needs an appropriate date or timestamp representation and a tie-breaker whose meaning is stable. An import timestamp alone may not distinguish simultaneous entries.

Not every window function responds to frame clauses in the same way. This example concerns SUM as an aggregate window function. Read the documentation for a ranking or offset function before assuming that copying the frame clause changes its behavior too.

Test two records with the same primary ordering value. A fixture containing only distinct dates lets several different frame choices produce the same numbers, which conceals the decision. Also check that the final displayed order matches the sequence the reader uses to interpret those numbers.

A cumulative figure is an explanation of where a value came from. Writing the frame and tie-breaker explicitly keeps that explanation available when a later query edit adds a second transaction on the same day.
