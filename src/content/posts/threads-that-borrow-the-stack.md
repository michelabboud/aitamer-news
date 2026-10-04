---
title: Threads That Borrow the Stack
description: Rust scoped threads can borrow local data because the scope joins them before returning. A small example shows where the borrowing boundary sits.
pubDate: "2026-10-07T13:30:00Z"
specimen: 362
section: rust
tags:
  - rust
  - concurrency
  - threads
  - borrowing
draft: false
heroImage: https://media.aitamer.news/heroes/threads-that-borrow-the-stack-0eefae54.jpg
heroAlt: Three birds holding threads tied to a stack of cards, illustrating threads borrowing stack space.
author: ari
wildness:
  rating: 2
  verified: Scoped threads may borrow local data and are joined before scope returns.
  claimed: A visible scope can make the lifetime of borrowed thread work easier to follow.
verdict: Use scoped threads when workers need to borrow local data for work that finishes within one call to `thread::scope`.
sources:
  - title: "Rust standard library: std::thread::scope"
    url: https://doc.rust-lang.org/std/thread/fn.scope.html
---

## The borrowed work

A thread can work with data its caller already owns. Rust’s `std::thread::scope` gives that work a clear boundary. It passes a `Scope` to a closure. Threads spawned through it may borrow local data, and the scope joins them before returning. [Rust’s `thread::scope` reference](https://doc.rust-lang.org/std/thread/fn.scope.html) describes these guarantees.

The borrowed data must live through the call to `scope`. Once the call returns, the caller can use it again. The reference shows a thread borrowing a vector and another changing a separate local variable. The caller uses both values after the scope ends.

## A small example

```rust
use std::thread;

let values = [1, 2, 3, 4];
let mut left = 0;
let mut right = 0;

thread::scope(|scope| {
    scope.spawn(|| left = values[..2].iter().sum());
    scope.spawn(|| right = values[2..].iter().sum());
});

assert_eq!(left + right, 10);
```

Both workers read the local array. Each writes to its own result variable. The caller reads those results after `scope` returns, when the scoped threads have been joined. This follows the borrowing pattern in [the standard library’s example](https://doc.rust-lang.org/std/thread/fn.scope.html).

The scope is also where an unhandled worker panic surfaces. If a scoped thread panics and has not been joined manually, `scope` panics. To handle that panic yourself, keep the thread’s handle and call `join` before the scope ends. The completion guarantee has one detail: joining waits for each thread’s main function, while thread-local destructors may still be running after `scope` returns. [The reference’s panic and completion sections](https://doc.rust-lang.org/std/thread/fn.scope.html) explain both cases.

## What to do

Start with one local input a worker needs to read. Put the work inside `thread::scope` and spawn the worker through the `Scope` passed to the closure. Give concurrent writes separate result variables, as in the example. Read the results after the scope returns. If a worker’s panic needs a specific response, save its handle and join it inside the scope. [Rust’s reference](https://doc.rust-lang.org/std/thread/fn.scope.html) shows the same borrowing and joining pattern.
