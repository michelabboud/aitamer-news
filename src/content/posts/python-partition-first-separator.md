---
title: partition preserves the first separator as a result
description: A fixed three-part result makes a missing delimiter explicit without splitting the rest of the value.
pubDate: "2026-11-10T08:00:00Z"
specimen: 1289
section: dev
tags:
  - python
  - text-processing
  - standard-library
draft: false
heroImage: https://media.aitamer.news/heroes/python-partition-first-separator-85a94c99.jpg
heroAlt: A teal paper cord passes through a coral ring and remains together inside a cream tray containing another ring.
author: ari
wildness:
  rating: 1
  verified: str.partition returns the first separator and distinguishes its absence from an empty value.
  claimed: No protocol conformance, integrity certification or benchmark is claimed.
verdict: Use the separator result to distinguish a missing delimiter from an empty value.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/stdtypes.html#str.partition
---

A setting can contain the delimiter used to separate its name from its value. Splitting every occurrence and expecting exactly two pieces makes an ordinary value look malformed. Python's str.partition can express a more precise rule: find the first separator, and leave everything after it together.

Consider a value that itself contains an equals sign:

```python
line = "query=name=ada"
key, separator, value = line.partition("=")
print(key, separator, value)
# query = name=ada
```

The separator is part of the result. That is useful because a parser can distinguish a missing separator from an explicitly empty value. The [partition reference](https://docs.python.org/3/library/stdtypes.html#str.partition) specifies a three-element tuple for both outcomes.

For example, the line name= contains a separator and an empty value, while the line name contains no separator at all. A format might permit the first case and reject the second. Checking the separator variable states that requirement directly. Checking only whether the value is empty merges two different cases and can produce the wrong error message.

This is a small parsing aid, rather than a complete configuration-file grammar. It does not decide how comments, escaping, quoting, duplicate keys or multiline values work. If the application consumes a documented format such as TOML, use that format's parser. A familiar string method should not become an excuse to implement only the easiest part of a richer grammar.

Whitespace deserves a separate decision too. Stripping a key can be sensible when the format allows surrounding spaces. Stripping a value might remove meaningful content. In a command whose value is a literal prefix or a replacement string, those spaces may be the very data the user meant to supply. Preserve them unless the contract says otherwise.

If the rightmost delimiter defines the boundary, rpartition provides the corresponding operation. That does not make either method the correct tool for every filename, address or identifier. First write down which delimiter occurrence the input format actually means and what an absent delimiter should do.

Test the first delimiter, a second delimiter inside the value, no delimiter, and an empty value. These cases make the grammar visible without needing a large fixture. A test that contains only one simple name-value pair cannot distinguish partition from several less precise implementations.

A three-part result can keep ordinary parsing code pleasantly small. Its real benefit is the explicit distinction between a boundary that was present and one the parser merely hoped to find.
