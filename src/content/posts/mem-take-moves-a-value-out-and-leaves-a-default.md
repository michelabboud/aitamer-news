---
title: mem::take Moves a Value Out and Leaves a Default
description: Use Rust's mem::take to move a value from a mutable field without cloning it. The field receives its type's default value.
pubDate: "2026-10-07T03:30:00Z"
specimen: 342
section: rust
tags:
  - rust
  - ownership
  - standard-library
  - default
draft: false
heroImage: https://media.aitamer.news/heroes/mem-take-moves-a-value-out-and-leaves-a-default-ff01caf0.jpg
heroAlt: A hand moves a colored disc from one container to another, leaving a plain disc in its place.
author: ari
wildness:
  rating: 2
  verified: Rust documents that take returns the old value and leaves a default.
  claimed: The outbox example moves a vector from a mutable field without cloning it.
verdict: Use mem::take when the field's default is the right state after the move. Use Option::take for an empty slot or mem::replace for a specific new value.
sources:
  - title: std::mem::take
    url: https://doc.rust-lang.org/std/mem/fn.take.html
  - title: Default trait
    url: https://doc.rust-lang.org/std/default/trait.Default.html
  - title: Option::take
    url: https://doc.rust-lang.org/std/option/enum.Option.html#method.take
  - title: std::mem::replace
    url: https://doc.rust-lang.org/std/mem/fn.replace.html
---

A method with `&mut self` can change a field, but returning a field's owned value directly can fail: the method would leave that field without a value. [`std::mem::take`](https://doc.rust-lang.org/std/mem/fn.take.html) solves this for fields whose types implement `Default`. It replaces the field with a default value and returns the old value. Its signature asks for `&mut T` and returns `T`. It has a `T: Default` bound and no `Clone` bound.

## Move a collection out of a field

Suppose an outbox holds messages until a caller is ready to process them. The caller needs ownership of the whole batch, while the outbox needs to remain usable. The [standard library's example](https://doc.rust-lang.org/std/mem/fn.take.html) uses `take` to return a vector from a mutable field and leave an empty vector behind. The same pattern works here:

```rust
struct Outbox {
    pending: Vec<String>,
}

impl Outbox {
    fn drain(&mut self) -> Vec<String> {
        std::mem::take(&mut self.pending)
    }
}

fn main() {
    let mut outbox = Outbox {
        pending: vec![String::from("ready")],
    };

    let batch = outbox.drain();
    assert_eq!(batch, vec![String::from("ready")]);
    assert!(outbox.pending.is_empty());

    outbox.pending.push(String::from("next"));
    assert_eq!(outbox.pending.len(), 1);
}
```

The returned `batch` owns the original vector. The outbox holds a new default vector, so it can accept another message. There is no call to `clone` in the method, and `take` does not require one. The value in the field changes even though the method never assigns to it explicitly: replacement is the operation that [`take` performs](https://doc.rust-lang.org/std/mem/fn.take.html). After the call, any code that reads `pending` sees the default vector, not the old batch.

## Default decides what remains

`Default` is part of the method's contract. The [trait defines](https://doc.rust-lang.org/std/default/trait.Default.html) a `default()` method that returns a useful default value for a type. `mem::take(&mut field)` uses that value as the field's replacement. For the vector example, the result is an empty vector, as the [`take` documentation demonstrates](https://doc.rust-lang.org/std/mem/fn.take.html).

That replacement should make sense for the surrounding struct. An empty pending list is useful because an outbox may have no messages. For another field, its type's default might be valid Rust yet unsuitable for the state the struct is meant to represent. Read the field's meaning before using `take`. If the replacement would make later methods misleading or invalid, choose a different representation or supply a deliberate replacement.

A custom field type must implement `Default` before it can be passed directly to `mem::take`. The [trait documentation](https://doc.rust-lang.org/std/default/trait.Default.html) shows both an implementation of `default()` and `#[derive(Default)]`. Deriving works when the type's fields implement `Default`. Either route makes the chosen default available wherever the type is used, so it deserves a meaningful value rather than one selected only to satisfy this call.

## Option can represent an empty slot

Some values have no sensible default of their own. A job, for example, may require a command and should never exist as an empty job. A field of type `Option<Job>` can represent either a present job or an empty slot. [`Option::take`](https://doc.rust-lang.org/std/option/enum.Option.html#method.take) moves the option's current value out and leaves `None` in its place:

```rust
struct Job {
    command: String,
}

struct Runner {
    current: Option<Job>,
}

impl Runner {
    fn finish(&mut self) -> Option<Job> {
        self.current.take()
    }
}
```

`Job` has no `Default` implementation here. The method returns `Some(job)` when a job was present and `None` when the slot was already empty. In both cases, the field ends as `None`, matching the behavior shown in the [`Option::take` examples](https://doc.rust-lang.org/std/option/enum.Option.html#method.take). The return type also makes the empty case visible to the caller. Use this shape when absence is a real state that callers should handle.

## Supply a replacement when the default is wrong

Sometimes a field must keep a specific value after the old one moves out. [`std::mem::replace`](https://doc.rust-lang.org/std/mem/fn.replace.html) takes both `&mut T` and a new `T`. It puts the supplied value in the field and returns the previous value. Its signature has no `Default` bound. For an outbox that should start its next batch with a marker, the operation could be `std::mem::replace(&mut self.pending, vec![String::from("start")])`.

That choice changes what future reads of the field observe. With `take`, they see the type's default. With `replace`, they see the value supplied by the caller. The [documentation for both functions](https://doc.rust-lang.org/std/mem/fn.take.html) describes that distinction. Select the replacement according to the state the object must have immediately after the move.

## What to do

1. Identify the field whose owned value the caller needs. Check what state its owner must hold after the call.
2. If the field's `Default` value is suitable, return `std::mem::take(&mut self.field)`. Confirm that the field's type implements [`Default`](https://doc.rust-lang.org/std/default/trait.Default.html).
3. If absence is meaningful, consider `Option<T>` and call [`Option::take`](https://doc.rust-lang.org/std/option/enum.Option.html#method.take). Handle the returned `None` case.
4. If the field needs a particular new value, pass it to [`std::mem::replace`](https://doc.rust-lang.org/std/mem/fn.replace.html). Check both the returned old value and the field's state after the call.
