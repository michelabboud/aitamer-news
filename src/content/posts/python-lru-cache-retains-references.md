---
title: lru_cache keeps arguments and return values alive
description: Memoization changes object lifetime as well as how often a function runs.
pubDate: "2026-11-08T08:00:00Z"
section: dev
tags:
  - python
  - standard-library
  - practical-programming
draft: false
heroImage: https://media.aitamer.news/heroes/python-lru-cache-retains-references-8b6a31da.jpg
heroAlt: An open paper drawer holds parcels and keys, with a cord keeping another key tethered beside a hovering hand.
author: ari
wildness:
  rating: 1
  verified: lru_cache retains argument and result references and can reuse mutable return values.
  claimed: No workload benchmark or universal resource guarantee is claimed.
verdict: Make the ownership and boundary behavior explicit before relying on the convenience API.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/functools.html#functools.lru_cache
---

Caching a function changes more than its call count. Python's functools.lru_cache keeps references to the arguments and results represented by its entries. A function that returns a large object can therefore keep that object alive after the immediate caller has finished with it.

This example also exposes another consequence: callers can receive the same mutable object.

```python
from functools import lru_cache
@lru_cache(maxsize=2)
def labels(name):
    return [name]

first = labels("report")
first.append("changed")
print(labels("report"))  # ['report', 'changed']
```

The cached list was modified. A cache hit does not construct an independent result for the next caller. The [lru_cache documentation](https://docs.python.org/3/library/functools.html#functools.lru_cache) explains entry retention and warns against caching functions that need distinct mutable objects on each call.

Think about lifetime before adding the decorator to a method. The instance becomes part of a cached method call's arguments, so a cache entry can retain that instance. If the instance owns more data, the retained graph can be much larger than the small result visible at the call site. A cache size measured in entries is not a byte budget.

For immutable results, reuse can be the intended design. A parsed configuration represented by immutable values can be shared without letting one reader modify another reader's view. If a caller needs its own editable list, return or construct that copy deliberately instead of relying on the decorator to isolate it.

Freshness is a separate question. A cached function that reads a file does not automatically notice that the file's contents changed. Choose keys and invalidation rules around the external state the result depends on. Clearing entries can release retained references, but it also removes the work-saving benefit those entries provided.

Use cache_info to inspect hit, miss and size information, then measure the workload that matters. An impressive hit rate does not prove the retained memory is acceptable or that callers are receiving current data. Conversely, a small cache can be perfectly reasonable when results are stable and cheap to retain.

Do not assume the decorator means that each key is computed exactly once under concurrent calls. Its coherent cache data structure is a different guarantee from preventing duplicate work while a result is still being computed.

Before decorating a function, write down what it returns, what remains reachable through its arguments, and when its answer becomes stale. Those three questions reveal costs that a shorter implementation can otherwise hide.
