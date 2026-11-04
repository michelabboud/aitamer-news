---
title: filecmp can decide equality from metadata
description: Choose the comparison mode and cache policy before treating a matching result as proof about file contents.
pubDate: "2026-11-10T12:00:00Z"
specimen: 1291
section: dev
tags:
  - python
  - files
  - standard-library
draft: false
heroImage: https://media.aitamer.news/heroes/python-filecmp-metadata-equality-d0d35022.jpg
heroAlt: Two matching paper folders with blue seals reveal different colored contents beneath a magnifying glass.
author: ari
wildness:
  rating: 1
  verified: filecmp shallow comparison can accept matching metadata; comparison results are cached.
  claimed: No protocol conformance, integrity certification or benchmark is claimed.
verdict: Match comparison settings and input stability to the equality promise the application makes.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/filecmp.html
---

A file comparison can report a match without comparing every byte. Python's filecmp.cmp defaults to a shallow comparison that can accept matching file signatures. That tradeoff may be useful in a directory tool, but it is a different claim from proving content equality.

The call makes its policy visible when shallow is written explicitly:

```python
import filecmp
same = filecmp.cmp("before.bin", "after.bin", shallow=False)
```

These names are illustrative input paths, not files created by the example. The [filecmp reference](https://docs.python.org/3/library/filecmp.html) explains which stat information the shallow mode uses and describes the cache maintained for earlier comparisons.

Imagine a tool that validates a copied artifact before showing a success message. If the intended promise is that the destination bytes match the source bytes, a shortcut based on file type, size and modification time is insufficient. Two different contents can have the same length, and timestamps are metadata rather than a cryptographic assertion about the file.

Selecting shallow=False avoids that particular metadata-only equality shortcut. Still consider the comparison cache when files can change quickly. The documentation provides clear_cache because repeated operations within the filesystem's modification-time resolution can otherwise reuse a comparison whose metadata has not visibly changed. A tight test that rewrites same-length contents should explicitly account for this behavior.

For a controlled comparison, close writers first and compare stable inputs. If another process can modify a file while the comparison runs, a boolean answer does not establish that the exact version later consumed is the version inspected. Binding checks to immutable artifacts or stable handles may be necessary when the workflow depends on that stronger guarantee.

Choose the output wording to match the operation. A directory preview might say that files appear unchanged under its selected comparison policy. An artifact verifier should record what it actually checked, including any digest algorithm or byte comparison, and which exact files were checked. The result should not silently become a stronger promise when it reaches a status screen.

Do not add hashing automatically just because it sounds more rigorous. Reading and comparing bytes can be sufficient for a local task with stable inputs. The important step is matching the mechanism to the promise and preserving evidence when that promise matters outside the current process.

A useful fixture contains different bytes of equal length with deliberately matched timestamps. It forces a reviewer to confront the shallow-mode behavior directly. A second fixture that rewrites one file quickly exercises the cache question instead of merely repeating an unchanged happy-path comparison.
