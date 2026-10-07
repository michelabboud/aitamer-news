---
title: Pinning a Struct Does Not Automatically Pin Its Fields
description: A pinned future can contain fields with different movement rules. Structural projection makes those rules explicit, and unsafe projection must preserve them for the field’s lifetime.
pubDate: "2026-10-08T05:30:00Z"
section: rust
tags:
  - rust
  - pin
  - futures
  - unsafe-rust
draft: false
heroImage: https://media.aitamer.news/heroes/pinning-a-struct-does-not-automatically-pin-its-fields-037e9ab0.jpg
heroAlt: Blue pins hold a paper tray while a folded crane has its own red pin and a yellow bead lies loose beside it.
author: ari
wildness:
  rating: 1
  verified: Pin projections may be structural per field, with Unpin and destruction obligations.
  claimed: The Counting example illustrates the contract; no runtime or performance result is claimed.
verdict: Project a child future as pinned only when every method and destructor preserves its address and drop guarantees. Treat the projection as a type-wide invariant.
sources:
  - title: "Rust standard library: pin module"
    url: https://doc.rust-lang.org/std/pin/index.html
---

An async function can pause while its state still contains a reference to data in that same state. Once that reference exists, moving the state machine could leave the reference pointing to its old address. Rust’s [`pin` documentation](https://doc.rust-lang.org/std/pin/index.html) uses compiler-generated futures as an example of values that can become address-sensitive after polling begins. This explains the signature of `Future::poll`: it receives `Pin<&mut Self>`, so a future that depends on its address can rely on callers preserving it.

Now put that future inside a combinator with a counter. The combinator must poll its child, and polling requires a pinned mutable reference to the child. Yet the counter only records how many times `poll` was called. It has no reason to stay at one address. A pin on the whole combinator does not answer how each field may be accessed. The combinator’s author has to make that decision.

## The projection is the promise

Consider a wrapper whose child is intended to be structurally pinned:

```rust
use std::pin::Pin;

struct Counting<F> {
    child: F,
    polls: u64,
}

impl<F> Counting<F> {
    fn child(self: Pin<&mut Self>) -> Pin<&mut F> {
        // SAFETY: child stays in place once Counting is pinned.
        // No other method or Drop implementation moves child out.
        unsafe { self.map_unchecked_mut(|this| &mut this.child) }
    }
}
```

The return type says that pinning `Counting<F>` propagates to `child`. `Pin::map_unchecked_mut` cannot prove that promise. It lets the implementation create the projected pin, while the implementation must maintain the condition that makes the projection valid. If `F` is an address-sensitive future, a later move of `child` could invalidate a reference held inside it even though the outer wrapper remained at the same address.

That promise reaches beyond this method. An `Option<F>` field with a `take` operation would be a poor structural projection target: taking the child moves it out. Replacing `child` through an ordinary `&mut F` would have the same problem. A custom `Unpin` implementation that declares `Counting<F>` movable for every `F` would also conflict with projecting a pinned `F`. Rust automatically derives `Unpin` from all of a struct’s actual fields. Choosing which fields an API projects as pinned does not change that derivation, so an explicit `Unpin` implementation must still honor the projected child’s requirements. If a projected child can be pinned, destruction must still reach that child before its storage is reused. A `Drop` implementation has to treat its `&mut self` as access to a potentially pinned value, and a packed representation is incompatible with this guarantee. These are conditions on the entire type’s API, not local facts about one `unsafe` expression.

The counter can follow different rules. If no address-sensitive operation relies on its location, the wrapper can expose it as `&mut u64` from a pinned wrapper. The projection still needs an unsafe implementation because `Pin<&mut Counting<F>>` does not generally give unrestricted mutable access to the whole value. That implementation may allow the counter to change while never moving the child. The two field policies can coexist within one struct.

## Where the boundary sits

`Pin<Ptr>` pins its pointee; the pointer remains movable. Moving a `Pin<Box<F>>` handle, for example, does not by itself move the `F` in the box. Likewise, storing a future behind a separate pinned allocation can change which field’s address must remain stable. It has a cost in indirection and potentially allocation. Structural projection is what lets a wrapper poll nested futures without requiring a separate allocation at each layer.

`Unpin` is the other important boundary. For a type that implements `Unpin`, pinning imposes no extra movement restriction on its value. A future that relies on address stability must avoid that trait, while an ordinary movable future can implement it. The compiler-generated future case is useful because an async state machine may become self-referential only after its first poll. Its caller still uses the pinned interface from the start; the caller does not need to inspect which internal state is currently active.

This also explains why a plain `&mut F` return from `child` is a different design choice. It declares that this field is not structurally pinned and can be moved through that mutable reference. Such a design may be sound when the wrapper never assumes the field’s stable address and never offers a pinned projection to it. It cannot coexist with the counting wrapper’s promise that a pinned `child` remains in place.

When reviewing a future combinator, start with each field whose address matters. For every `Pin<&mut Field>` projection, trace all methods and destructors that can reach the field. Check `Unpin`, replacement, `take`, and drop paths together. If that audit is difficult to sustain, use an established projection abstraction with a documented safety contract; the unsafe operation in a handwritten projection is a claim about every future use of the type.
