---
title: "`Arc::clone` Did Not Copy Your Model"
description: Cloning an Arc shares the same model allocation. Arc::make_mut copies the model when another Arc still owns it.
pubDate: "2026-10-06T22:30:00Z"
specimen: 332
section: rust
tags:
  - rust
  - arc
  - ownership
  - clone-on-write
draft: false
heroImage: https://media.aitamer.news/heroes/arc-clone-did-not-copy-your-model-16b88a5a.jpg
heroAlt: Several hands hold handles attached to one house, while a separate house is being repainted.
author: ari
wildness:
  rating: 2
  verified: Arc::clone shares an allocation; Arc::make_mut clones the value when another Arc owns it.
  claimed: This distinction helps avoid model copies during shared reads.
verdict: Clone the Arc for shared reads. Expect an inner model clone when make_mut changes one of several strong owners.
sources:
  - title: Arc in std::sync — Rust standard library
    url: https://doc.rust-lang.org/std/sync/struct.Arc.html
---

## Cloning shares the model

An `Arc<Model>` lets several owners refer to one heap allocation. Calling `Arc::clone(&model)` creates another pointer to that allocation and increases its strong reference count. It does not clone the `Model` inside. The value remains alive until the last owning `Arc` is dropped. These are the [ownership rules in Rust’s Arc documentation](https://doc.rust-lang.org/std/sync/struct.Arc.html).

That distinction matters when several parts of a program need to read the same model. Each can own an `Arc<Model>` without making a separate model. The two pointers start out referring to the same allocation, which `Arc::ptr_eq` can check.

## Mutation can make a copy

Here is a small model with a cloneable list of parameters:

```rust
use std::sync::Arc;

#[derive(Clone)]
struct Model {
    parameters: Vec<i32>,
}

let mut current = Arc::new(Model {
    parameters: vec![10, 20],
});
let reader = Arc::clone(&current);
assert!(Arc::ptr_eq(&current, &reader));

Arc::make_mut(&mut current).parameters.push(30);
assert!(!Arc::ptr_eq(&current, &reader));
assert_eq!(reader.parameters, vec![10, 20]);
assert_eq!(current.parameters, vec![10, 20, 30]);
```

`reader` still owns the original model when `current` is changed. [Arc::make_mut](https://doc.rust-lang.org/std/sync/struct.Arc.html) therefore clones the inner value into a new allocation before returning mutable access. The two owners then have separate models. If no other `Arc` owns the allocation, `make_mut` can provide mutable access without cloning the inner value. Weak pointers add a detail: when only weak pointers remain alongside the `Arc` being changed, `make_mut` dissociates those pointers instead of cloning the value.

Shared ownership also does not make a model’s contents safe to mutate concurrently. The [Arc documentation](https://doc.rust-lang.org/std/sync/struct.Arc.html) points to synchronization types such as `Mutex` and `RwLock` for mutation through shared ownership.

## What to do

Use `Arc::clone` when owners need to share a model for reading. Use `Arc::make_mut` when an owner needs its own changed version, and account for a model clone if another `Arc` still owns the original. If you require mutation of one shared value, choose an appropriate synchronization type instead. For exclusive access without cloning, check whether `Arc::get_mut` fits: it returns mutable access only when no other `Arc` or weak pointer refers to the allocation.
