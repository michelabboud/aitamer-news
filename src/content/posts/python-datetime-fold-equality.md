---
title: Two Python datetimes can compare equal an hour apart
description: During a repeated local hour, two timezone-aware Python datetimes can compare equal. Convert to UTC before comparing instants or calculating elapsed time.
pubDate: "2026-10-20T11:00:00Z"
specimen: 930
section: dev
tags:
  - python
  - datetime
  - time-zones
draft: false
heroImage: https://media.aitamer.news/heroes/python-datetime-fold-equality-22636f97.jpg
heroAlt: Two paper clocks show the same time above separate points on a blue timeline ribbon that folds back on itself.
author: ari
wildness:
  rating: 1
  verified: Python documents same-zone comparison rules and the Los Angeles repeated hour.
  claimed: Normalize completed instants to UTC for comparison and elapsed-duration calculations.
verdict: For elapsed time and ordering of instants, convert both aware datetimes to UTC before doing the operation.
sources:
  - title: "Python datetime: arithmetic, comparison, and conversion"
    url: https://docs.python.org/3/library/datetime.html
  - title: "Python zoneinfo: fold and timezone data"
    url: https://docs.python.org/3/library/zoneinfo.html
  - title: "PEP 495: local time disambiguation"
    url: https://peps.python.org/pep-0495/
---

A timezone-aware datetime carries more information than a bare clock reading. That still does not mean subtracting two aware datetimes always measures elapsed time. Python gives datetimes that share the same timezone object a particular comparison and arithmetic rule, and a repeated local hour exposes it.

The [datetime documentation](https://docs.python.org/3/library/datetime.html) says comparisons ignore `tzinfo` and `fold` when both aware operands share the same `tzinfo` attribute. Subtraction in that case also performs no timezone adjustment. Two occurrences of the same local clock reading can therefore compare equal while representing different instants.

## A repeated hour in executable form

This example uses the historical Los Angeles transition shown in [Python's zoneinfo documentation](https://docs.python.org/3/library/zoneinfo.html):

```python
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

zone = ZoneInfo('America/Los_Angeles')
first = datetime(2020, 11, 1, 1, 0, tzinfo=zone, fold=0)
second = first.replace(fold=1)

print(first.isoformat())
print(second.isoformat())
print(first == second)
print((second - first).total_seconds())

first_utc = first.astimezone(timezone.utc)
second_utc = second.astimezone(timezone.utc)
print(first_utc == second_utc)
print((second_utc - first_utc).total_seconds())
```

The outputs are:

```text
2020-11-01T01:00:00-07:00
2020-11-01T01:00:00-08:00
True
0.0
False
3600.0
```

The offsets distinguish the occurrences. Before conversion, the shared timezone object causes Python to compare their local components. After conversion to Coordinated Universal Time (UTC), the subtraction expresses the elapsed hour.

## What fold supplies

[PEP 495](https://peps.python.org/pep-0495/) defines a fold as the ambiguity created when clocks move backward. In a repeated interval, `fold=0` selects the earlier occurrence and `fold=1` selects the later occurrence. The proposal explicitly preserves comparison behavior within a zone and advises converting both sides to UTC when a comparison needs to account for the fold.

This matters when an application checks whether a recorded event happened before a deadline, orders events, or calculates a duration. If those values mean completed instants, normalize both to UTC for the operation. Keep local representations for display when they help the reader understand what happened.

Do not replace conversion with `replace(tzinfo=timezone.utc)`. The datetime documentation distinguishes replacing the timezone attribute from `astimezone`, which adjusts the representation while preserving the instant. Relabeling the local components would change their meaning.

## Input still needs a decision

A user entering a repeated local time has supplied an ambiguous value until the application chooses an occurrence. Ask for enough information to resolve it, or apply a clearly documented policy. Converting a guessed occurrence to UTC only preserves the guess.

Fold is also no general validity check. PEP 495 allows construction of invalid instances, including times in a forward clock gap. Treat missing local times as a separate input-validation case. ZoneInfo also needs system timezone data or the `tzdata` package; a deployment lacking both cannot construct the example's zone.

For a regression check, keep both occurrences in a fixture. Verify their distinct UTC values and elapsed duration. That small case exercises a boundary that ordinary midday timestamps leave untouched.
