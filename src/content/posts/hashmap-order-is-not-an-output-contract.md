---
title: HashMap Order Is Not an Output Contract
description: Rust’s HashMap iterates in arbitrary order. Sort entries before producing snapshots or other output that needs a stable order.
pubDate: "2026-10-07T01:30:00Z"
specimen: 338
section: rust
tags:
  - rust
  - hashmap
  - snapshots
  - deterministic-output
draft: false
heroImage: https://media.aitamer.news/heroes/hashmap-order-is-not-an-output-contract-afaca433.jpg
heroAlt: A jumble of shape cards becomes an ordered stack of cards beside a sorting tray.
author: ari
wildness:
  rating: 2
  verified: Rust documents arbitrary HashMap iteration and key-ordered BTreeMap iteration.
  claimed: Sorting map entries before printing gives the example a stable key order.
verdict: A practical explanation of why snapshots need an explicit ordering rule, with a short Rust example and two documented ways to apply one.
sources:
  - title: HashMap in std::collections - Rust
    url: https://doc.rust-lang.org/std/collections/struct.HashMap.html
  - title: BTreeMap in std::collections - Rust
    url: https://doc.rust-lang.org/std/collections/struct.BTreeMap.html
---

## Where the order goes

A `HashMap` stores key-value pairs, but its iterator visits those pairs in an arbitrary order. The [Rust documentation for `HashMap::iter`](https://doc.rust-lang.org/std/collections/struct.HashMap.html) states that directly. The map's default hashing is also randomly seeded, and each instance uses a different seed. A loop that prints entries in iterator order therefore leaves the order of its lines outside the output contract.

That matters when a test saves the whole output as a snapshot. If the same pairs appear in a different order, the snapshot changes even though the underlying data has not. A passing run does not prove that the next map instance will yield the same order. The documentation's own examples collect keys or values into a vector and sort them before comparing them with an ordered array.

## Put the order at the output boundary

For a report or snapshot, choose a rule readers can understand, such as ascending key order. Keep each key with its value while sorting. Sorting keys alone can work if you then look up each value by key. Sorting values separately loses the relationship between a value and its key.

```rust
use std::collections::HashMap;

let map = HashMap::from([("beta", 2), ("alpha", 1)]);
let mut entries: Vec<_> = map.iter().collect();
entries.sort_by(|(left, _), (right, _)| left.cmp(right));

for (key, value) in entries {
    println!("{key}: {value}");
}
```

This prints `alpha: 1` before `beta: 2` because the pairs are sorted before printing. The ordering decision is visible next to the output code, so a later change to the map's storage need not change the report's order.

If ordered traversal is useful throughout the program, [the `BTreeMap` documentation](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html) says its iterators produce entries in key order. Its keys must implement `Ord`. That is a different collection choice, with an order built into iteration.

## What to do

Find every place where map iteration feeds a snapshot, generated file, log meant for comparison, or user-facing list. Pick and document the desired order. Sort complete entries at the output boundary, or use `BTreeMap` where key order belongs in the collection itself. Then test the ordered result with deliberately out-of-order input.
