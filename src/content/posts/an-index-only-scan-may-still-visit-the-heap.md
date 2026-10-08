---
title: An Index-Only Scan May Still Visit the Heap
description: A covering PostgreSQL index can supply query columns, yet an index-only scan may still fetch table rows to check visibility. Learn when that happens and what to inspect.
pubDate: "2026-10-09T05:30:00Z"
section: dev
tags:
  - postgresql
  - index-only-scans
  - visibility-map
draft: false
heroImage: https://media.aitamer.news/heroes/an-index-only-scan-may-still-visit-the-heap-238f6feb.jpg
heroAlt: A blue paper bridge connects a covered-window index card to an underlying cream archive tray.
author: ari
wildness:
  rating: 1
  verified: Index-only scans check the visibility map and fetch the heap when a page is not all-visible.
  claimed: The transcript workload is illustrative; actual heap fetch counts require execution evidence.
verdict: Check heap fetches and table churn before paying for more covering-index payload.
sources:
  - title: PostgreSQL index-only scan documentation
    url: https://www.postgresql.org/docs/current/indexes-index-only-scans.html
  - title: PostgreSQL EXPLAIN guide
    url: https://www.postgresql.org/docs/current/using-explain.html
---

Suppose a voice transcription service shows the opening segments for a session. Each segment has a start time, a speaker label, and an identifier. A covering index looks attractive for the list view:

```sql
CREATE INDEX transcript_session_start
  ON transcript_segments (session_id, start_ms)
  INCLUDE (segment_id, speaker);

SELECT segment_id, start_ms, speaker
FROM transcript_segments
WHERE session_id = 42
ORDER BY start_ms
LIMIT 50;
```

The B-tree index can search by session and order by start time; the included columns supply the other selected values. That makes an index-only scan **possible**. It does not guarantee that PostgreSQL can return every matching row without touching the table. The [index-only scan documentation](https://www.postgresql.org/docs/current/indexes-index-only-scans.html) explains the missing piece: an index entry does not carry enough information to determine whether its row is visible to the current transaction's snapshot.

PostgreSQL keeps a visibility map with an all-visible bit for each heap page. When an index-only scan finds an entry, it checks the bit for that row's heap page. If the bit is set, the scan can return indexed values without fetching the heap tuple. If it is clear, PostgreSQL visits the heap to check visibility. The page can contain several rows, so the decision is tied to the page, not just the one indexed value.

That distinction matters for a transcription stream. Freshly inserted or edited segments are likely to be on pages that have not yet become all-visible. A historical transcript that changes rarely offers a better opportunity for heap-free reads. The plan node can still say `Index Only Scan` in either case. For a read-only SELECT, inspect `EXPLAIN (ANALYZE, BUFFERS)` and its `Heap Fetches` field; the [EXPLAIN guide](https://www.postgresql.org/docs/current/using-explain.html) shows that field on an index-only scan. `ANALYZE` executes the query, so inspect a representative SELECT in an appropriate environment.

Included columns also occupy index space. Wide payloads can bloat the index, and PostgreSQL warns that oversized index tuples can make inserts fail. Keep the index limited to columns the list actually needs. Before adding more payload columns to a busy transcript table, check whether its pages become all-visible often enough for the expected query to benefit; otherwise the extra index cost may buy little reduction in heap access.
