---
title: The Entry API Keeps a Map Update in One Lookup
description: Use Rust's HashMap entry view to update per-key counters without splitting the vacant and occupied cases across separate map accesses.
pubDate: "2026-10-08T12:30:00Z"
section: rust
tags:
  - rust
  - hashmap
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/the-entry-api-keeps-a-map-update-in-one-lookup-fc4b7db3.jpg
heroAlt: One selected drawer holds a teal counter stack beside a vacant drawer opening in a paper cabinet.
author: ari
wildness:
  rating: 1
  verified: Entry selects occupied or vacant state; or_insert returns a mutable value reference.
  claimed: No benchmark or exact internal probe count is claimed.
verdict: Use entry for conditional per-key updates. Its main benefit here is one coherent ownership and mutation path; measure performance separately.
sources:
  - title: "Rust standard library: hash_map::Entry"
    url: https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html
---

A voice-command service may count how often each detected intent appears in a session. The first `search` command needs a new counter; the next one needs to increment it. A `contains_key` check followed by `get_mut` or `insert` spreads that one decision across separate map accesses and makes ownership of a newly allocated key awkward.

Rust's [`HashMap::entry` view](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html) represents the selected key as either `Occupied` or `Vacant`. The caller hands the key to `entry`, then works with the resulting slot. For a simple count, `or_insert` handles the vacant case and returns a mutable reference in either case:

```rust
use std::collections::HashMap;

let mut counts: HashMap<String, u32> = HashMap::new();
for intent in ["search", "pause", "search"] {
    *counts.entry(intent.to_owned()).or_insert(0) += 1;
}
assert_eq!(counts["search"], 2);
```

The first `search` becomes `1`: `or_insert(0)` puts zero in the vacant slot, then the dereferenced value is incremented. The second `search` finds an occupied slot, leaves its existing value in place, and increments it to `2`. Each iteration passes ownership of its `String` key into `entry`. The map can keep a key for a vacant slot; callers do not need to retain another owned copy just to update the value. The example still allocates a new `String` from each borrowed `&str`, even for an occupied key. If incoming labels are borrowed and nearly always present, that allocation is a real tradeoff to consider when choosing a key representation.

The enum is useful when the two cases require different behavior. An occupied entry might update an existing per-intent record, while a vacant entry might create one with its first timestamp. For the common initialize-and-update path, the shorter expression above keeps the branch inside the API. If creating the default value is expensive, `or_insert_with` runs its initializer only for a vacant entry. `or_insert_with_key` can build that default from a reference to the key already moved into `entry`, avoiding a clone solely for initialization.

The title's one lookup describes the map access written by the caller: there is one `entry` operation instead of a separate existence check and update. It is no claim about an exact number of hashes, probes, or a measured speedup. Choose `entry` when an update depends on whether a key already exists, and profile before attaching a performance number to the choice.
