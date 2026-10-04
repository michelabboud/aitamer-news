---
title: Vec::reserve Promises a Minimum Capacity
description: Rust's Vec may reserve more space than requested. The useful guarantee is a capacity floor based on the current length.
pubDate: "2026-10-07T14:30:00Z"
specimen: 364
section: rust
tags:
  - rust
  - vec
  - memory
  - capacity
draft: false
heroImage: https://media.aitamer.news/heroes/vec-reserve-promises-a-minimum-capacity-8ef31a28.jpg
heroAlt: A hand adds one cube to a storage chest with more room than the requested minimum.
author: ari
wildness:
  rating: 2
  verified: Rust documents a capacity floor and leaves Vec's growth strategy unspecified.
  claimed: The exact variant can still report more capacity than requested.
verdict: Treat the requested amount as a minimum for additional elements. Use capacity() for the current value.
sources:
  - title: "Rust Vec: capacity and reallocation"
    url: https://doc.rust-lang.org/std/vec/struct.Vec.html#capacity-and-reallocation
  - title: Rust Vec::reserve
    url: https://doc.rust-lang.org/std/vec/struct.Vec.html#method.reserve
  - title: Rust Vec guarantees
    url: https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees
  - title: Rust Vec::reserve_exact
    url: https://doc.rust-lang.org/std/vec/struct.Vec.html#method.reserve_exact
  - title: Rust Vec::capacity
    url: https://doc.rust-lang.org/std/vec/struct.Vec.html#method.capacity
---

## The guarantee is a floor

A vector’s length counts its elements. Its capacity counts how many elements it can hold without reallocating. Those values serve different purposes: spare capacity leaves room for future elements, while the length tells you which elements are already present. Rust documents this distinction in its [capacity and reallocation guide](https://doc.rust-lang.org/std/vec/struct.Vec.html#capacity-and-reallocation).

Calling [`vec.reserve(additional)`](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.reserve) ensures that the resulting capacity is at least `vec.len() + additional`. The argument describes room for *additional* elements, beyond the current length. It is not a target capacity. If the vector already has enough capacity, the call does nothing.

## Why the result may be larger

`reserve` may request extra space to avoid frequent reallocations as the vector grows. Rust does not guarantee a particular growth strategy. That means code should not depend on a fixed multiplier or an exact capacity after a reservation. The [Vec guarantees](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees) leave that strategy open while allowing callers to rely on the capacity the vector reports.

For example, Rust’s documentation starts with a vector containing one element, calls `reserve(10)`, and checks that its capacity is **at least** 11. It does not assert equality. That is the useful shape of a test for your own reservation: check the promised lower bound.

## What `reserve_exact` changes

[`reserve_exact`](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.reserve_exact) avoids deliberate extra allocation for anticipated growth. Its result still has the same lower-bound guarantee. The allocator may provide more space than requested, so even this method cannot promise a precisely minimal reported capacity. Rust recommends `reserve` when more insertions are expected.

## What to do

Use `reserve(additional)` when you know how many more elements you plan to add. Compare `capacity()` with `len() + additional` when checking the result. Read [`capacity()`](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.capacity) when you need to know the vector’s available room at that point. Choose `reserve_exact` only when avoiding deliberate extra reservation fits your use case, and still treat its capacity as a lower-bound result.
