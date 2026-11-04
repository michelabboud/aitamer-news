---
title: A tied ORDER BY still leaves part of the order unspecified
description: A stable list needs a final ordering key that distinguishes otherwise equal rows.
pubDate: "2026-11-13T12:00:00Z"
section: dev
tags:
  - sql
  - sqlite
  - data-quality
draft: false
heroImage: https://media.aitamer.news/heroes/sql-order-by-stable-tiebreaker-6d9349eb.jpg
heroAlt: Three equal-height teal cards have differently shaped yellow bases aligned beneath a coral sorting guide.
author: ari
wildness:
  rating: 1
  verified: SQLite leaves rows tied on every ORDER BY expression without a defined relative order.
  claimed: No production schema, query performance or cross-database portability is claimed.
verdict: Complete the ordering rule with a stable tie-breaker, then separately address changing data.
sources:
  - title: SQLite official documentation
    url: https://www.sqlite.org/lang_select.html#the_order_by_clause
---

A query can contain ORDER BY and still leave two records free to exchange places. If every ordering expression ties for those records, the database has no further rule to apply. A list that appeared stable during testing can shift after an index or data change.

For a work queue, make the tie-breaker explicit:

```sql
SELECT id, created_at, summary
FROM jobs
ORDER BY created_at ASC, id ASC;
```

This is a query pattern for an application table, not a complete schema. If id uniquely distinguishes each row, it completes the order among jobs with the same creation time. The [SQLite ordering documentation](https://www.sqlite.org/lang_select.html#the_order_by_clause) states that ordering remains undefined for rows tied on every ORDER BY expression.

The practical symptom is often a flickering page. Several events share a timestamp because the source clock has limited resolution or the import assigned one timestamp to a whole batch. The interface displays only a small subset, and records near the boundary appear to move between requests.

Adding an identifier does not choose the right business priority automatically. A support queue may need severity first, then creation time, then an identifier. A sports table may intentionally display equal ranks while still needing a repeatable row order. Separate the visible ranking rule from the final presentation tie-breaker so users are not told an arbitrary identifier has competitive meaning.

Stable ordering also does not freeze the data. A newly inserted earlier row can move later rows between offset-based pages even when the sort is fully specified. A pagination design may need a snapshot or a cursor policy in addition to deterministic comparisons. Do not describe a tie-breaker as solving every consistency problem in a changing list.

For string keys, consider the comparison rules in use. A collation can treat values as equal for ordering purposes even when their byte representations differ. The last ordering expression should distinguish rows under the actual comparison semantics, not merely look unique to a person reading a few samples.

A useful test deliberately creates equal primary sort values. Reverse the insertion order or vary the query plan where a controlled test permits it, then assert the promised final ordering. A fixture with a fresh timestamp for every row never exercises the reason the tie-breaker exists.

When the interface promises a stable sequence, write the full sequence rule in the query. An ORDER BY clause is the beginning of that contract; the last unresolved tie is where the contract still needs work.
