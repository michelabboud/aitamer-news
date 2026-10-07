---
title: An Ordered Map Can Answer a Range Query Directly
description: Rust's BTreeMap can iterate directly over a chosen key interval. Its bound rules and panic cases shape safe time-window queries.
pubDate: "2026-10-08T16:30:00Z"
section: rust
tags:
  - rust
  - btreemap
  - range-queries
draft: false
heroImage: https://media.aitamer.news/heroes/an-ordered-map-can-answer-a-range-query-directly-1477b64b.jpg
heroAlt: A rust frame selects three neighboring teal index cards within an ordered blue paper file tray.
author: ari
wildness:
  rating: 1
  verified: BTreeMap range iterates a bounded key subrange and documents invalid-range panics.
  claimed: Index choice is product design guidance; no benchmark result is claimed.
verdict: Use BTreeMap when ordered windows are a real product query. Choose keys that preserve duplicates and validate range bounds before iteration.
sources:
  - title: "Rust standard library: BTreeMap::range"
    url: https://doc.rust-lang.org/std/collections/struct.BTreeMap.html#method.range
---

A transcript viewer may need every segment whose start time falls within the visible window, such as 100 through 199 milliseconds in a small example. If segments are stored under ordered start times, the query can name that interval directly. Rust's [`BTreeMap::range`](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html#method.range) returns an iterator over entries within the requested key bounds.

```rust
use std::collections::BTreeMap;

let mut segments = BTreeMap::new();
segments.insert(100_u64, "open settings");
segments.insert(160, "choose audio");
segments.insert(220, "save changes");

for (&start_ms, text) in segments.range(100..200) {
    println!("{start_ms}: {text}");
}
```

The `100..200` range includes 100 and excludes 200, so this example yields the first two entries. The map maintains entries in key order, and `range` gives a double-ended iterator over the selected subrange. Other bound shapes are possible: a pair of `Bound` values can make the lower end exclusive or the upper end inclusive. That is useful when a cursor page should start strictly after the last key already shown.

The key has to express the product's ordering. A time-window query works when keys sort by time; a map keyed only by segment ID cannot answer a time interval through `range` unless those IDs encode the same order. Also, a map has one value per key. If two transcript segments start at the same millisecond, storing both under that millisecond alone would replace one. A composite key whose order compares time first and a unique tie-breaker second preserves both while keeping chronological order. This key design is part of the feature, not a detail to patch after data disappears.

Validate bounds at the API edge. The standard library specifies a panic when the range start exceeds its end, and another when both bounds exclude the same key. An ordinary half-open `start..end` with equal endpoints simply selects an empty interval. A user dragging a timeline backward can produce reversed inputs, so normalize or reject them before calling `range`.

An ordered map is a good fit when the interface repeatedly asks for windows or neighboring segments in key order. Its ordering has a maintenance cost, so use the product's actual query pattern to choose the index. For transcript timelines, define a stable sortable key first, then test inclusive, exclusive, empty, and reversed windows at the boundary.
