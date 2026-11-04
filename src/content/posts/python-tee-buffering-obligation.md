---
title: tee gives two readers a buffering obligation
description: Splitting an iterator can retain a backlog when one consumer runs ahead of the other.
pubDate: "2026-11-07T08:00:00Z"
section: dev
tags:
  - python
  - standard-library
  - practical-programming
draft: false
heroImage: https://media.aitamer.news/heroes/python-tee-buffering-obligation-7de3e5c2.jpg
heroAlt: A paper ribbon splits between two toy readers, with a stack of retained tickets beside the lower branch.
author: ari
wildness:
  rating: 1
  verified: tee preserves reader positions and can retain values for a slower reader.
  claimed: No workload benchmark or universal resource guarantee is claimed.
verdict: Make the ownership and boundary behavior explicit before relying on the convenience API.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/itertools.html#itertools.tee
---

Two consumers can need the same stream at different speeds. One writes records to disk while the other computes a summary. Python's itertools.tee can supply independent iterators over a shared input, but the slower reader creates a retention obligation for the faster one.

A small example shows the independent positions:

```python
from itertools import tee
left, right = tee(iter(["a", "b", "c"]))
print(next(left), next(left))  # a b
print(next(right))             # a
```

The second reader still receives the first value after the first reader has advanced twice. Some record of that value must remain available. The [tee documentation](https://docs.python.org/3/library/itertools.html#itertools.tee) warns that significant auxiliary storage may be needed depending on how the iterators are used.

Imagine an audit consumer that starts only after the main consumer finishes a large file. The code looks streaming because it never calls list on the input. Yet the delayed audit still needs every earlier value. Splitting the iterator has moved the storage problem rather than making it disappear.

This is why a memory review should follow the distance between consumers. A steady pair of readers that advance together has a different lifetime pattern from a reader that pauses for a long request while the other drains the source. Count retained records as well as the size of any one record. References can keep large object graphs alive beyond the point where the faster consumer has finished with them.

For a modest finite input, an explicit list can be easier to reason about. For an unbounded source, define a limit and a policy for a slow consumer. Depending on the application, that might mean applying backpressure, persisting a durable stream, or dropping a nonessential observer. The appropriate choice belongs to the data contract, especially when every event must be preserved.

Once tee owns the traversal, avoid independently advancing the original iterator. Doing so can divert values away from the split readers. Keep ownership of the source clear and pass only the derived iterators to consumers.

The documentation also cautions that tee iterators are not threadsafe. Independent traversal positions do not establish a concurrent queue. A thread that needs to exchange events with another thread should use a suitable synchronization abstraction.

Test the case where one consumer reaches the end before the other begins. If that use would retain too much data, change the design before the production input makes the hidden backlog expensive.
