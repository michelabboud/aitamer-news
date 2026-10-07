---
title: PhantomData Changes a Type That Stores No Value
description: PhantomData occupies no storage, yet its chosen type tells Rust about logical ownership, lifetimes, variance, and auto traits. Pick the marker that matches the actual relationship.
pubDate: "2026-10-08T06:30:00Z"
section: rust
tags:
  - rust
  - phantomdata
  - lifetimes
  - unsafe-rust
draft: false
heroImage: https://media.aitamer.news/heroes/phantomdata-changes-a-type-that-stores-no-value-effd90a9.jpg
heroAlt: An empty blue key stencil on cream paper connects by a red thread to a folded blue sleeve.
author: ari
wildness:
  rating: 1
  verified: PhantomData models ownership or borrowing for variance, auto traits, and drop analysis.
  claimed: The cursor is illustrative; no claim is made that the marker alone validates its raw pointers.
verdict: Use a borrowed marker for a view and an ownership marker for a true owner. Match the marker to the pointer and destructor invariants; it does not enforce them alone.
sources:
  - title: "The Rustonomicon: PhantomData"
    url: https://doc.rust-lang.org/nomicon/phantom-data.html
---

A raw pointer can identify an element without saying how long that element remains alive. Imagine a cursor that holds two `*const T` pointers into a borrowed slice: one points to the next element and one marks the end. The cursor’s fields store addresses, yet the cursor logically borrows the slice. If its type carries a lifetime parameter, that lifetime needs to appear in a field so Rust can reason about it. The [Rustonomicon’s `PhantomData` chapter](https://doc.rust-lang.org/nomicon/phantom-data.html) uses essentially this iterator shape to explain why a marker belongs in the definition.

```rust
use std::marker::PhantomData;

struct BorrowedCursor<'a, T> {
    next: *const T,
    end: *const T,
    _borrow: PhantomData<&'a T>,
}
```

`_borrow` stores no `T` and no reference. It tells static analysis to treat the type as if it contained an `&'a T` for the relevant lifetime and type relationships. A constructor still has to tie `'a` to a real slice, and any unsafe pointer traversal still has to stay within that slice. The marker cannot make a fabricated pointer valid. Its job is to describe a relationship that the implementation already maintains.

## Choose the relationship, then the marker

The spelling inside `PhantomData<...>` matters. `PhantomData<&'a T>` models shared borrowing. It connects the cursor’s validity to `'a`, and it gives the type the variance associated with a shared reference: covariance in the lifetime and in `T`. In practical terms, a value tied to a longer valid lifetime can be used where a shorter borrow is expected, subject to the rest of the type. This is the useful flexibility of a read-only view.

`PhantomData<T>` communicates a different fact: the enclosing type behaves as though it owns a `T` for static analysis. It is covariant in `T` and participates in auto-trait and drop checking according to that owned relationship. A collection that stores its elements in a raw allocation may need to express that it owns those elements even though its struct fields contain only a pointer, length, and capacity. The marker does not allocate an element or run any destructor by itself. The collection implementation must still initialize, access, and eventually drop real elements correctly.

A borrowed cursor should not use `PhantomData<T>` merely to silence an unused-parameter error. That would describe ownership the cursor does not have and can impose lifetime and drop-check constraints that do not fit a view. Conversely, an owner should not use a borrowed marker to represent elements it is responsible for destroying. The type parameter is a statement about obligations, not a label attached to an address.

For exclusive borrowing, `PhantomData<&'a mut T>` expresses still another relationship. The Nomicon’s table shows covariance in `'a` but invariance in `T`. That difference matters when an API relies on exclusive access to values with nested lifetimes: allowing an inappropriate type substitution could make a write possible through a view whose lifetime assumptions no longer match. Choose shared or exclusive borrowing according to the actual API, rather than selecting whichever form happens to compile.

## What drop checking does and does not infer

There is a historical trap in this subject. Older guidance said an owning raw-pointer collection always needed `PhantomData<T>` to inform drop checking. The Nomicon now explains the qualification: a `Drop` implementation itself tells Rust that the destructor may use values of `T`, so adding an ownership marker can be superfluous for that particular drop-check purpose. It can still affect variance and auto traits. The standard library’s `Vec` has a more specialized case involving the unstable `#[may_dangle]` attribute, where an ownership marker remains significant because elements with drop glue must still be handled. That exception is a reason to inspect the actual destructor design, not a recipe to copy unstable internals into a new container.

Markers also influence auto traits. A field that is `PhantomData<T>` asks the compiler to account for `T` in traits such as `Send` and `Sync`; a borrowed marker follows the traits of the simulated reference. Raw pointer fields have their own auto-trait behavior, so adding a marker does not magically turn a pointer-based cursor into a thread-safe abstraction. Soundness of thread transfer still depends on the actual pointer and ownership rules.

When defining a pointer-backed type, write down who owns the pointee, who may borrow it, and what the destructor may touch. Encode that relationship in the marker, then review variance, auto traits, and drop behavior with the real fields and implementations in view. `PhantomData` is valuable precisely because it makes an otherwise invisible contract visible to the compiler.
