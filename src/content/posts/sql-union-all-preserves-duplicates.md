---
title: UNION removes duplicate rows that UNION ALL preserves
description: Combining two result sets needs a decision about whether repeated values represent repeated events.
pubDate: "2026-11-13T08:00:00Z"
section: dev
tags:
  - sql
  - sqlite
  - data-quality
draft: false
heroImage: https://media.aitamer.news/heroes/sql-union-all-preserves-duplicates-fadab6bc.jpg
heroAlt: Two conveyor ribbons feed a guide pointing toward trays containing either two matching coral circles or one.
author: ari
wildness:
  rating: 1
  verified: SQLite UNION removes duplicate result rows, while UNION ALL preserves occurrences.
  claimed: No production schema, query performance or cross-database portability is claimed.
verdict: Choose whether repeated rows are distinct events before combining the results.
sources:
  - title: SQLite official documentation
    url: https://www.sqlite.org/lang_select.html#compound_select_statements
---

Two identical-looking records can represent two real events. Combining query results with UNION removes duplicate result rows, while UNION ALL preserves them. Picking the shorter operator without deciding what duplicates mean can change the count a report presents.

A small query makes the distinction visible:

```sql
SELECT 'retry' AS event
UNION
SELECT 'retry';
-- one row

SELECT 'retry' AS event
UNION ALL
SELECT 'retry';
-- two rows
```

The [SQLite compound-select reference](https://www.sqlite.org/lang_select.html#compound_select_statements) defines the difference. The duplicate test applies to the projected result row. That matters when the SELECT list leaves out fields that distinguish the underlying events.

Imagine merging messages from two import files. Each contains a retry event from a different time, but the query selects only the event label. UNION can collapse both into one row because the visible results match. Including a true event identifier changes what is considered a duplicate; choosing UNION ALL preserves repeated labels without requiring that change.

For a list of distinct customer names, eliminating repeats may be the intended result. For an activity stream, preserving every occurrence may be essential. A query should state which population it is constructing before any performance discussion starts. Faster execution of the wrong population is still the wrong report.

Do not rely on the order in which the two SELECT statements appear to define the final presentation order. Add an appropriate ORDER BY to the compound result when order matters. A deduplication choice and an ordering choice solve different problems and should remain visible as separate requirements.

The component queries must return compatible result shapes, including the same number of columns in SQLite. That is only a structural check. Two columns both containing text can still represent different concepts, such as an account identifier on one side and a display name on the other. Give the merged columns consistent meanings as well as consistent positions.

Use a fixture where one result appears on both sides, another appears twice within one side, and another is unique. Those cases show whether the application needs a set of values or a stream of occurrences. Check the selected columns too, so a later simplification cannot accidentally redefine which records count as duplicates.

Write the operator around the meaning of repetition. UNION ALL is often the clearest choice when every selected occurrence matters; UNION is appropriate when the result really is a distinct set.
