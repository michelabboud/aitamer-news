---
title: islice moves the iterator even across skipped items
description: A slice of a stream consumes its source; a second reader starts after that work.
pubDate: "2026-11-06T12:00:00Z"
section: dev
tags:
  - python
  - standard-library
  - practical-programming
draft: false
heroImage: https://media.aitamer.news/heroes/python-islice-consumes-skipped-items-218c9600.jpg
heroAlt: A blue paper ticket roll passes through a frame while earlier cream tickets fall into a tray.
author: ari
wildness:
  rating: 1
  verified: islice consumes the source values needed to reach its selected positions.
  claimed: No workload benchmark or universal resource guarantee is claimed.
verdict: Treat iterator previews as consumption and deliberately preserve any prefix the next reader needs.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/itertools.html#itertools.islice
---

A stream preview often looks harmless. Ask for a few records from an iterator, display them, and then hand the iterator to the real processing loop. The preview has already moved the stream. Python's itertools.islice returns selected elements while consuming the input needed to reach them.

The distinction is easy to see with numbers:

```python
from itertools import islice
source = iter(range(10))
print(list(islice(source, 2, 5)))  # [2, 3, 4]
print(next(source))               # 5
```

The skipped values were consumed too. A later consumer does not begin at zero, and it cannot recover the earlier records by asking the same iterator again. The [islice documentation](https://docs.python.org/3/library/itertools.html#itertools.islice) describes how its starting position, stopping position and step select from the underlying iterable.

This matters in import tools. Suppose a validation screen samples the first rows of an uploaded file and then passes its iterator to an importer. Unless the design deliberately replays or retains those rows, the import starts after the sample. A feature meant to make the operation safer can therefore hide missing data.

The useful question is whether the program holds a reusable collection or a one-way traversal. Calling iter on a list creates a new iterator, so separate traversals can begin independently. Calling iter on an existing iterator usually returns that iterator. Giving the object a new variable name does not rewind it or create another traversal.

For a small input, materialize the records once and validate the resulting list before processing it. For a large stream, retain the sampled prefix and explicitly feed it back before the remaining iterator. The implementation should make the replay visible. A second open of an external source also needs care because the contents may have changed between reads.

Selection is lazy: constructing the islice object does not by itself walk through the selected range. Consumption happens as the caller asks for results. That can make the bug appear far away from the line that created the preview object.

A good regression fixture checks the complete sequence received by the final consumer, including the sampled prefix. Checking only the number of rows shown in the preview proves the wrong part of the contract. Treat a preview of an iterator as a read with consequences, and decide deliberately how the next reader gets its starting point.
