---
title: Weak Lets an Owner Disappear
description: A weak reference can remember an Arc allocation without keeping its value alive. Access depends on whether upgrade succeeds.
pubDate: "2026-10-07T16:30:00Z"
specimen: 368
section: rust
tags:
  - rust
  - arc
  - weak
  - ownership
draft: false
heroImage: https://media.aitamer.news/heroes/weak-lets-an-owner-disappear-dd1d5f8a.jpg
heroAlt: A person fades away while a hand holds a thin thread to the remaining object.
author: ari
wildness:
  rating: 1
  verified: Rust documents weak ownership, allocation lifetime, and upgrade’s Option return.
  claimed: The example shows access ending after its sole strong owner is dropped.
verdict: Use Weak for links that should not extend a value’s lifetime, and handle a failed upgrade wherever the link is used.
sources:
  - title: Weak in std::sync - Rust
    url: https://doc.rust-lang.org/std/sync/struct.Weak.html
  - title: Arc in std::sync - Rust
    url: https://doc.rust-lang.org/std/sync/struct.Arc.html
---

## An observer that does not own

An `Arc<T>` lets several strong pointers share ownership of one value. `Arc::downgrade(&owner)` creates a `Weak<T>` pointer to the same allocation. The weak pointer does not count as an owner, so keeping it around does not keep the stored value alive. It does keep the backing allocation alive. These are two different lifetimes: the value can be dropped while a weak pointer still exists. [Rust’s `Weak` documentation](https://doc.rust-lang.org/std/sync/struct.Weak.html) makes this distinction explicit.

That makes `Weak` useful for an observer. The observer can retain a link to the allocation without deciding how long its value lives. A stored `Arc` would extend ownership. [Rust’s `Arc` documentation](https://doc.rust-lang.org/std/sync/struct.Arc.html) describes weak pointers as non-owning links.

## Upgrade checks whether the value remains

A weak pointer cannot be used as though it were the value. Call `upgrade()` when access is needed. Its result is `Option<Arc<T>>`: `Some` gives a strong pointer and keeps the value alive while that pointer exists. `None` means the value is unavailable. The value may have been dropped, or the weak pointer may have been created without an allocation. The [documented `upgrade` contract](https://doc.rust-lang.org/std/sync/struct.Weak.html) also covers other cases where an owning reference cannot be obtained.

```rust
use std::sync::Arc;

let owner = Arc::new(String::from("draft"));
let observer = Arc::downgrade(&owner);

if let Some(current) = observer.upgrade() {
    println!("{current}");
}

drop(owner);
assert!(observer.upgrade().is_none());
```

The `current` pointer ends with the `if let` block. After `owner` is dropped, no strong pointer from this example remains, so the next upgrade returns `None`. [Rust’s example for `upgrade`](https://doc.rust-lang.org/std/sync/struct.Weak.html) shows the same lifetime change.

## Where weak links belong

A tree can own children through strong `Arc` links and let each child refer back to its parent through `Weak`. If both directions owned strongly, the links could form a cycle that keeps the nodes allocated. The weak back link lets the parent go when its owners go. A child must then allow for an absent parent when it upgrades that link. [The `Arc` documentation](https://doc.rust-lang.org/std/sync/struct.Arc.html) uses this tree pattern to explain cycles.

## What to do

Choose which relationship owns the value. Store `Arc` for that relationship and create a `Weak` with `Arc::downgrade` for a link that may outlive it. At each use, call `upgrade` and handle both `Some` and `None`. Keep the returned `Arc` for as long as that operation needs the value. For a parent link or another back reference, check that dropping the owners makes a later upgrade return `None`. [The `Weak` API](https://doc.rust-lang.org/std/sync/struct.Weak.html) documents the lifetime and return value behind these steps.
