---
title: Python groupby groups runs, not every matching row
description: Why separated keys become separate groups, and when sorting would change the question you are asking.
pubDate: "2026-11-05T08:00:00Z"
section: dev
tags:
  - python
  - iterators
  - data-processing
draft: false
heroImage: https://media.aitamer.news/heroes/python-groupby-consecutive-runs-c542c430.jpg
heroAlt: Coral and teal paper tokens on a blue strip feed into three separate trays.
author: ari
wildness:
  rating: 1
  verified: Consecutive-key groups, shared input iterators and a checked three-label example.
  claimed: No throughput or memory benchmark is claimed.
verdict: Use groupby for consecutive runs; preserve order when those boundaries carry the meaning.
sources:
  - title: "Python documentation: itertools.groupby"
    url: https://docs.python.org/3/library/itertools.html#itertools.groupby
---

A status log can visit the same state more than once. A machine might be idle, busy, then idle again. If you group that stream by status, should the two idle periods become one bucket, or stay separate? Python's itertools.groupby answers the second question. It identifies consecutive runs.

Consider three labels:

```python
from itertools import groupby
labels = ["idle", "busy", "idle"]
runs = [(key, list(items)) for key, items in groupby(labels)]
print(runs)
# [('idle', ['idle']), ('busy', ['busy']), ('idle', ['idle'])]
```

The repeated label appears twice in the result because a different label separated its occurrences. The [official groupby documentation](https://docs.python.org/3/library/itertools.html#itertools.groupby) describes a new group whenever the key changes. That is useful for counting consecutive failures, compressing adjacent duplicates, or finding sessions in an ordered event stream.

The important decision comes before the function call. If the question is how many records belong to each customer across a whole file, sort by customer before grouping, or accumulate into a dictionary. If the question is how many times the stream entered an error state, keep its chronological order. Sorting would put unrelated periods together and erase the boundaries the investigation needs.

There is another trap when a program keeps the groups for later. Each group is an iterator sharing the same underlying input. Advancing the outer iterator changes what remains available through the earlier group. A collection of saved group iterators is therefore a poor substitute for saved rows.

The example immediately converts each group to a list. That makes a stored group independent of later traversal, at the cost of retaining those rows in memory. For a large log, process each group immediately instead: count it, compute its duration, or write a summary before asking for the next group. The streaming advantage depends on that discipline.

When grouping records with a key function, use the same function for any preparatory sort. Sorting by a display name and grouping by an internal customer identifier can leave equal identifiers separated. The result may look plausible while still splitting one intended bucket.

Before reaching for groupby, write down whether order carries meaning. Then test with a key that disappears and returns. A three-record example is enough to reveal whether the code is answering the question the reader actually asked. Keep a tiny chronological fixture beside that decision so a later refactor preserves the intended grouping.
