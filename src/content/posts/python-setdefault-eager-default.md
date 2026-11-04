---
title: setdefault evaluates the default before it checks the dictionary
description: A convenient insertion helper can still call an expensive constructor when the key already exists.
pubDate: "2026-11-05T12:00:00Z"
specimen: 1270
section: dev
tags:
  - python
  - dictionaries
  - evaluation
draft: false
heroImage: https://media.aitamer.news/heroes/python-setdefault-eager-default-18da39b9.jpg
heroAlt: A paper factory makes a wrapped parcel beside a shelf that already holds another parcel.
author: ari
wildness:
  rating: 1
  verified: Dictionary insertion behavior, argument evaluation and a checked side-effect example.
  claimed: No shared-cache concurrency guarantee or performance measurement is claimed.
verdict: Use an explicit missing-key branch when constructing the default has a cost or side effect.
sources:
  - title: "Python documentation: dict.setdefault"
    url: https://docs.python.org/3/library/stdtypes.html#dict.setdefault
  - title: "Python documentation: calls"
    url: https://docs.python.org/3/reference/expressions.html#calls
---

A cache lookup can appear lazy while still doing work on every call. The expression cache.setdefault(name, build_result()) looks as though the builder belongs only to the missing-key case. Python evaluates that argument before calling the dictionary method, so the builder also runs when a cached value already exists.

Here is a small example with an observable constructor:

```python
calls = []
def build_result():
    calls.append("built")
    return []

cache = {"report": ["ready"]}
value = cache.setdefault("report", build_result())
print(value, calls)
# ['ready'] ['built']
```

The dictionary keeps its original value, but the construction has already happened. Two separate rules explain the result. The [dictionary reference](https://docs.python.org/3/library/stdtypes.html#dict.setdefault) defines which value setdefault returns and inserts. The [call-expression rules](https://docs.python.org/3/reference/expressions.html#calls) require argument expressions to be evaluated before the call is attempted. The method cannot undo the argument's side effects.

For a literal empty list, that extra construction may be an acceptable cost. A familiar grouping expression uses setdefault to obtain a bucket and then append a row. The discarded list is small, and the code can remain easy to follow. The problem changes when the default expression opens a resource, performs a request, records a metric, or computes a large result.

Use an explicit missing-key branch when construction should happen only on a miss. Check whether the key exists, construct the value in that branch, and then retrieve the stored value. If the dictionary intentionally treats None as a stored answer, do not use a simple None test to distinguish missing entries. A sentinel object can represent absence without confusing it with a legitimate cached result.

Another option for ordinary grouping is collections.defaultdict with a factory. Its missing-key behavior is designed around invoking that factory when the subscription needs a value. It has its own contract, so choose it because the data structure matches the job rather than as a general replacement for every dictionary method.

An explicit branch is not, by itself, a concurrency guarantee. Two workers can observe a missing key before either installs a value. A shared cache needs an appropriate coordination design if duplicate construction is unacceptable.

When reviewing a convenience call, inspect the expressions passed to it. Ask what they do before considering what the method will do. A cached return value does not prove the path avoided the expensive work.
