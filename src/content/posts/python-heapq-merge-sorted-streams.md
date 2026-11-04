---
title: heapq.merge expects every input stream to be sorted
description: A lazy merge combines existing order; it does not repair a source whose records arrive out of order.
pubDate: "2026-11-16T12:00:00Z"
specimen: 1315
section: dev
tags:
  - python
  - standard-library
  - data-processing
draft: false
heroImage: https://media.aitamer.news/heroes/python-heapq-merge-sorted-streams-dfff97fa.jpg
heroAlt: Two ascending rows of cream paper cards join into one ascending row of coral and blue cards.
author: ari
wildness:
  rating: 1
  verified: heapq.merge lazily combines inputs that are already sorted under the same ordering.
  claimed: Illustrative usage is not a claim of production execution or performance.
verdict: Verify each source is ordered by the same key before relying on a lazy merge.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/heapq.html#heapq.merge
---

Several log streams may already be ordered individually. Python's heapq.merge can combine them lazily, avoiding a first step that gathers every record into one list. The useful precondition is easy to miss: every input stream must already follow the ordering the merge expects.

For two ordered sequences:

```python
from heapq import merge
print(list(merge([1, 4, 7], [2, 3, 8])))
# [1, 2, 3, 4, 7, 8]
```

The [heapq reference](https://docs.python.org/3/library/heapq.html#heapq.merge) documents sorted inputs and the iterator result. The function can choose among the current candidates from each source because each source promises that a smaller unseen value is not hiding later in that source.

If one log contains a delayed older record after a newer record, that promise is broken. The function does not scan the entire source to detect or repair the disorder before producing output. A globally chronological display built on it can therefore be wrong even though the combining code looks like a standard-library solution.

Begin with the source contract. A log ordered by arrival time is not necessarily ordered by the event timestamp inside each record. Clock adjustments, buffering and late delivery can separate those two orders. Decide which time the reader needs, then verify that each source satisfies the corresponding rule.

For finite small inputs, sorting each source or sorting the combined collection can be clearer. For an unbounded stream, waiting for perfect global order may require a lateness policy, buffering limits or watermarks. Those are application decisions; a merge function does not supply them by choosing the next available value.

A key function lets records be compared by a particular field. Use the same interpretation of that field across all inputs, including its type and any time-zone handling. Strings that merely resemble timestamps do not establish a shared chronological representation by themselves.

Reverse merging has the same precondition in the other direction. When reverse=True, each input needs to be sorted from largest to smallest. Reversing only the output preference while supplying ascending streams does not turn the operation into a general descending sort.

Test one deliberately out-of-order record in a source. The purpose is not to bless the incorrect output; it is to make the precondition explicit and decide where the application will enforce it. A standard-library primitive becomes dependable when its input promise is checked at the boundary that owns the data.
