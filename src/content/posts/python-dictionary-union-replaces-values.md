---
title: Dictionary union replaces values instead of merging their contents
description: An overlay can be concise while still discarding a nested collection from the earlier configuration.
pubDate: "2026-11-16T08:00:00Z"
section: dev
tags:
  - python
  - standard-library
  - data-processing
draft: false
heroImage: https://media.aitamer.news/heroes/python-dictionary-union-replaces-values-53a17ba3.jpg
heroAlt: A coral tray containing one cream circle lowers toward a blue compartment with two coral circles beside a yellow compartment.
author: ari
wildness:
  rating: 1
  verified: Python dictionary union selects right-hand values for shared keys without a recursive merge.
  claimed: Illustrative usage is not a claim of production execution or performance.
verdict: Specify overlay depth and replacement rules before using dictionary union on nested configuration.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/stdtypes.html#dict
---

Combining configuration dictionaries can replace more than a reader expects. Python's dictionary union operator creates a dictionary in which the right-hand value wins when a key exists on both sides. It does not recursively combine the objects stored under that key.

Consider a configuration containing a nested limits dictionary:

```python
base = {"limits": {"read": 5, "write": 2}, "mode": "safe"}
override = {"limits": {"read": 9}}
combined = base | override
print(combined)
# {'limits': {'read': 9}, 'mode': 'safe'}
```

The write limit is absent from the result. The [dictionary reference](https://docs.python.org/3/library/stdtypes.html#dict) specifies which side takes priority for a matching key. The operator applies that decision at the outer mapping level.

This can be a perfectly reasonable overlay rule. A user who supplies a replacement list may intend to replace the list completely. A user who supplies one nested setting may instead expect all unrelated defaults to remain. The program needs to choose and document those semantics before deciding how to combine the objects.

A recursive merge is not an automatic improvement. It raises further questions: whether lists append or replace, whether an empty mapping clears defaults, and how an explicit None should behave. Different products need different answers. Hiding those decisions inside a generic helper can make a short call difficult to reason about.

The new outer dictionary also does not imply that nested values were copied. The selected value can still be the same mutable object referenced by an input mapping. If later code edits the nested result, consider whether it is also modifying an override object that another caller expects to keep unchanged.

When only one nested mapping needs a combined policy, construct that part explicitly. This makes the intended merge depth visible and lets validation reject a result that omitted a required setting. Validate the final configuration after applying overlays, because individually valid fragments can combine into an incomplete or contradictory whole.

For compatibility, dictionary union requires a Python version that supports the operator; the documentation records its introduction in Python 3.9. That matters for scripts shared with machines whose interpreter is selected by the operating system rather than the project environment.

A useful test includes a shared scalar key, an untouched key, and a shared nested dictionary with different child keys. Check which children survive and whether later mutation affects the inputs. The operator is concise, but the overlay policy still deserves a full sentence in the code's contract.
