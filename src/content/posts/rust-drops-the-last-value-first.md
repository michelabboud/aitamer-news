---
title: Rust Drops the Last Local Value First
description: Rust cleans up values when they leave scope. Dropping a lock guard early can make its mutex available sooner.
pubDate: "2026-10-07T09:30:00Z"
specimen: 354
section: rust
tags:
  - rust
  - drop
  - ownership
  - mutex
draft: false
heroImage: https://media.aitamer.news/heroes/rust-drops-the-last-value-first-cff5e30a.jpg
heroAlt: The top red block lifts away from a stack of three blocks, illustrating last-in-first-out cleanup.
author: ari
wildness:
  rating: 2
  verified: The Rust Book shows reverse drop order and early cleanup with drop(value).
  claimed: Dropping a mutex guard early releases its lock before the scope ends.
verdict: Use scope exit for routine cleanup. Drop a guard after its last use when later work in the same scope should run without holding the lock.
sources:
  - title: Running Code on Cleanup with the Drop Trait
    url: https://doc.rust-lang.org/book/ch15-03-drop.html
  - title: MutexGuard in std::sync
    url: https://doc.rust-lang.org/std/sync/struct.MutexGuard.html
  - title: drop in std::mem
    url: https://doc.rust-lang.org/std/mem/fn.drop.html
  - title: Drop trait and drop order — Rust standard library
    url: https://doc.rust-lang.org/std/ops/trait.Drop.html
---

## Cleanup follows scope

Rust calls a type's `Drop` implementation when a value goes out of scope. That method can release a resource, such as a file handle or a lock. In the [Rust Book's example](https://doc.rust-lang.org/book/ch15-03-drop.html), two values are created in sequence. Their cleanup messages appear in reverse order: the second value is dropped first. A later statement in the same scope runs before this automatic cleanup.

This reverse order applies to local variables. Struct fields drop in declaration order, as the [Drop trait documentation](https://doc.rust-lang.org/std/ops/trait.Drop.html) specifies. The local order matters when a resource has work to do at the end of its lifetime. You can rely on scope exit for routine cleanup. You can also choose an earlier end to the lifetime when work no longer needs the resource. The key is to identify which value holds it. For a mutex lock, that value is the guard.

## The guard decides when the lock opens

A [`MutexGuard`](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html) unlocks its mutex when it is dropped. Holding the guard through unrelated work therefore keeps the mutex locked through that work. To end that hold sooner, pass the guard to [`std::mem::drop`](https://doc.rust-lang.org/std/mem/fn.drop.html). The function takes ownership of its argument; the guard is dropped before the call returns.

```rust
use std::sync::Mutex;

fn main() {
    let counter = Mutex::new(0);
    let mut guard = counter.lock().unwrap();
    *guard += 1;

    drop(guard); // Unlock before the next operation.

    let current = *counter.lock().unwrap();
    println!("{current}");
}
```

The first guard protects the increment. `drop(guard)` releases its lock before the second `lock` call. The second lock creates a new guard for the read. The first guard cannot be used again after it has been moved into `drop`. [Rust's explanation of early cleanup](https://doc.rust-lang.org/book/ch15-03-drop.html) uses this pattern for locks: release one while the surrounding scope continues.

## What to do

First, find the variable that holds the resource you want to release. Check whether later statements still need access through that variable. If they do, keep it alive until those uses finish. If they do not, put the resource work in a smaller scope or call `drop(guard)` immediately after its last use. Prefer the smaller scope when it makes the lifetime clear. Use the explicit call when the surrounding scope needs to continue and the release point deserves attention. Do not call the `Drop` trait method directly: [the Rust Book](https://doc.rust-lang.org/book/ch15-03-drop.html) shows that Rust rejects it.
