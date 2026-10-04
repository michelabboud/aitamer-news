---
title: Initialize the Model Client Once
description: Use Rust’s OnceLock to share a lazily initialized model client across threads. Learn what happens when initialization panics and when a failed result is stored.
pubDate: "2026-10-07T02:30:00Z"
specimen: 340
section: rust
tags:
  - rust
  - concurrency
  - oncelock
  - initialization
draft: false
heroImage: https://media.aitamer.news/heroes/initialize-the-model-client-once-2d3bdd39.jpg
heroAlt: Several people hold keys and envelopes that connect to one protected model under a shared roof.
author: ari
wildness:
  rating: 2
  verified: The initializer’s panic leaves OnceLock empty; it does not poison the cell.
  claimed: Storing Result in the cell retains an Err as the initialized value.
verdict: A compact pattern for sharing a client, with the key distinction between a panicking initializer and a stored error.
sources:
  - title: OnceLock in std::sync - Rust
    url: https://doc.rust-lang.org/std/sync/struct.OnceLock.html
  - title: Unrecoverable Errors with panic! - The Rust Programming Language
    url: https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html
---

## One shared client

When several parts of a program need the same model client, a `OnceLock` can hold the shared value. It starts empty, can be used in a static, and provides thread-safe initialization. Each caller receives a reference to the value once it is ready. [Rust’s `OnceLock` reference](https://doc.rust-lang.org/std/sync/struct.OnceLock.html) describes this behavior.

```rust
use std::sync::OnceLock;

struct ModelClient {
    model: &'static str,
}

static CLIENT: OnceLock<ModelClient> = OnceLock::new();

fn model_client() -> &'static ModelClient {
    CLIENT.get_or_init(|| ModelClient {
        model: "configured-model",
    })
}
```

The small struct stands in for a real client constructor. Put the configuration and construction your application needs inside the closure. Calls to `get_or_init` may arrive from many threads at once. Rust guarantees that only one initializer runs when that initializer completes without panicking. Later calls use the stored value. This lets callers use the same access function without coordinating construction themselves. [The method’s documented guarantee](https://doc.rust-lang.org/std/sync/struct.OnceLock.html) is conditional on the initializer completing.

## A panic leaves the slot empty

If the initializer panics, `get_or_init` propagates the panic to its caller and leaves the cell uninitialized. `OnceLock` is never poisoned by a panic. If the process continues, a later call can attempt initialization again. The cell does not hold a partly constructed client. These are properties of [`OnceLock`](https://doc.rust-lang.org/std/sync/struct.OnceLock.html); whether execution continues depends on how the program handles panics. Rust also permits a panic strategy that aborts the process. [The Rust book explains both panic strategies](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html).

A returned error has different consequences. If the cell’s type is `OnceLock<Result<ModelClient, Error>>`, the `Result` itself is the stored value. By implication, storing `Err` makes later callers receive that same error. Choose that shape only when retaining the first failure is the behavior you want. [`get_or_init` stores the value returned by its closure](https://doc.rust-lang.org/std/sync/struct.OnceLock.html).

## What to do

Create one `OnceLock` for a client you intend to share. Put construction behind a function that calls `get_or_init`, then make callers use that function. Decide what a constructor panic should mean for your application. Decide separately whether an ordinary initialization error should be retained or retried. Keep initialization from calling the same access function again: Rust documents reentrant initialization as an error with an unspecified outcome. [See the `get_or_init` contract](https://doc.rust-lang.org/std/sync/struct.OnceLock.html).
