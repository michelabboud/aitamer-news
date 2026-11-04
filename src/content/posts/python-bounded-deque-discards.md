---
title: A bounded deque discards from the opposite end
description: A fixed-length recent-history buffer is useful precisely because it does not preserve every entry.
pubDate: "2026-11-07T12:00:00Z"
specimen: 1279
section: dev
tags:
  - python
  - standard-library
  - practical-programming
draft: false
heroImage: https://media.aitamer.news/heroes/python-bounded-deque-discards-95fb49a9.jpg
heroAlt: A coral paper card enters a three-slot frame as a blue card falls from the opposite end into a basket.
author: ari
wildness:
  rating: 1
  verified: Appending to a full bounded deque displaces an item from the opposite end.
  claimed: No workload benchmark or universal resource guarantee is claimed.
verdict: Make the ownership and boundary behavior explicit before relying on the convenience API.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/collections.html#collections.deque
---

A buffer can stay within its limit by forgetting data automatically. That is the purpose of a bounded collections.deque in Python: it can hold recent history without growing forever. It is a dangerous choice when a caller assumes that every appended item remains available until explicitly removed.

The simplest demonstration keeps two entries:

```python
from collections import deque
recent = deque(maxlen=2)
recent.append("first")
recent.append("second")
recent.append("third")
print(list(recent))  # ['second', 'third']
```

No separate removal call appears. Appending the third item displaced the oldest one. The [deque reference](https://docs.python.org/3/library/collections.html#collections.deque) describes this behavior for bounded deques, including extension at either end.

This fits a status screen that needs the most recent messages. It also fits a compact trail of context shown after an error. The limit communicates a retention policy: older context is allowed to disappear. Give that policy a name in the surrounding application, such as recent_messages, rather than a name that suggests a durable inbox.

The same behavior is unsuitable for a job queue whose entries represent promised work. If the queue fills, silent displacement loses a job before the worker sees it. Such a queue needs an explicit full-state outcome: wait, reject the new job, persist it elsewhere, or apply another documented policy. A length limit alone does not say which outcome is acceptable.

Read the individual operation's contract as well. Appending to a full bounded deque discards from the other end, while inserting an item into a full bounded deque raises IndexError. Treating every insertion-shaped operation as equivalent makes error handling depend on which method a later refactor happens to use.

A deque also does not copy appended objects. If a producer reuses and mutates the same dictionary for successive status updates, retained entries can refer to that same mutable object. Take a deliberate snapshot when historical state is what the screen should show.

Write tests for the first item beyond capacity. Many happy-path tests stop while the buffer still has space, which leaves the actual retention rule unexamined. Check which end is discarded, the order of remaining records, and whether any caller was relying on a displaced value.

A bounded deque is a good small history buffer when forgetting is intentional. Make that intention visible where data enters, so an operator can tell the difference between a successful append and a promise that the system retained everything.
