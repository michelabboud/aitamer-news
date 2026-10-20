---
title: Python zip can hide a missing result
description: When Python pairs separately produced values, a missing result can vanish silently. Strict pairing catches unequal lengths, with an important limit around side effects.
pubDate: "2026-10-20T10:30:00Z"
section: dev
tags:
  - python
  - data-validation
  - iterators
draft: false
heroImage: https://media.aitamer.news/heroes/python-zip-strict-ec886fd0.jpg
heroAlt: Three blank paper documents face two blue envelopes, with yellow strips connecting the first two pairs and empty space opposite the third document.
author: ari
wildness:
  rating: 1
  verified: Python documents truncation, lazy evaluation, and strict length checking.
  claimed: Validate bounded batches before writes; use identifiers when order is uncertain.
verdict: Use strict pairing when equal lengths are required, and decide separately how to prevent or recover partial writes.
sources:
  - title: "Python built-in functions: zip"
    url: https://docs.python.org/3/library/functions.html#zip
  - title: "PEP 618: optional length checking for zip"
    url: https://peps.python.org/pep-0618/
  - title: "Python itertools: zip_longest"
    url: https://docs.python.org/3/library/itertools.html#itertools.zip_longest
---

A batch contains three document identifiers and two summaries. Pair them with ordinary `zip`, save the pairs, and the third document disappears from that operation. The loop can finish without an exception even though the batch is incomplete.

[Python's documentation](https://docs.python.org/3/library/functions.html#zip) defines this behavior: `zip` stops at its shortest input. If every identifier must have a result, use `zip(ids, summaries, strict=True)`. Unequal lengths then raise `ValueError`. The strict argument is available from Python 3.10.

## Make the missing item visible

This small example has deliberately incomplete input:

```python
ids = ['doc-a', 'doc-b', 'doc-c']
summaries = ['first summary', 'second summary']

print(list(zip(ids, summaries)))

try:
    pairs = list(zip(ids, summaries, strict=True))
except ValueError:
    print('batch rejected: unequal lengths')
```

The first print contains only the pairs for `doc-a` and `doc-b`. The second operation rejects the batch. No placeholder appears for `doc-c`; the program has to decide how to handle the missing result.

For a bounded batch, collecting the pairs before beginning writes is a useful boundary. Put the writing loop after successful collection, outside the exception handler. That arrangement lets a length mismatch stop this example before any pair is saved. Choose an explicit failure path, such as recording a failed batch for investigation.

## Strict checking happens during iteration

Calling `zip` creates a lazy iterator. A caller that constructs it and never consumes it has performed no length check. Consuming only a prefix also cannot establish that the remaining inputs have matching lengths.

[PEP 618](https://peps.python.org/pep-0618/), which specifies the feature, places the error where ordinary iteration would stop. Earlier pairs can already have been yielded. Consequently, adding `strict=True` directly to a loop that sends messages or writes records does not make that loop atomic. A late mismatch cannot recall the messages already sent.

Treat that distinction as a design decision. For small inputs, validate the full pairing first. For streams too large to collect, decide how partial progress is represented and recovered. Strict iteration can expose an incomplete stream; the surrounding workflow still owns recovery.

## Equal lengths cannot establish identity

Suppose every summary arrives, in a different order from its document identifier. Strict pairing accepts the lengths and pairs positions anyway. That follows from the operation's positional contract. For independently completed jobs, prefer results that carry their own identifiers, then check missing, duplicate, and unexpected identifiers before assembling the batch.

Also choose whether unequal lengths are actually an error. [The `itertools` documentation](https://docs.python.org/3/library/itertools.html#itertools.zip_longest) describes `zip_longest`, which continues through the longest input and fills missing positions with a chosen value. That is useful when missing entries are valid data. Use a distinct sentinel when a real value could equal your filler.

A practical review question is simple: what should happen when the result producer returns fewer items than the input producer? Put that policy beside the pairing code. If the answer is rejection, strict iteration expresses it. If the answer is padding or partial completion, make that behavior explicit and test that case separately.
