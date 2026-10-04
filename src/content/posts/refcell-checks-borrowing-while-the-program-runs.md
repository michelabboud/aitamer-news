---
title: "`RefCell` Checks Borrowing While the Program Runs"
description: Rust's `RefCell` allows mutation through shared access. Its borrow checks happen at runtime, so conflicting access can panic or return an error.
pubDate: "2026-10-07T06:30:00Z"
specimen: 348
section: rust
tags:
  - rust
  - refcell
  - borrowing
  - interior-mutability
draft: false
heroImage: https://media.aitamer.news/heroes/refcell-checks-borrowing-while-the-program-runs-0be0e74b.jpg
heroAlt: Hands try to borrow a value inside a container, and a warning flashes when the borrows conflict.
author: ari
wildness:
  rating: 2
  verified: RefCell checks borrow conflicts at runtime and permits mutation through shared access.
  claimed: Keeping guards short makes conflicting access easier to locate.
verdict: Use RefCell for narrow, single-threaded interior mutation. Keep guards short and use fallible borrowing methods when callers must handle a conflict.
sources:
  - title: RefCell in std::cell
    url: https://doc.rust-lang.org/std/cell/struct.RefCell.html
  - title: RefCell<T> and the Interior Mutability Pattern
    url: https://doc.rust-lang.org/book/ch15-05-interior-mutability.html
---

An immutable reference usually limits what a caller can change. `RefCell<T>` lets code change a contained value through shared access. It checks borrows while the program runs. This helps when a mutation is safe in the program's actual flow, yet the compiler cannot establish that in advance. The cost is a possible runtime failure after successful compilation. The [standard library documentation](https://doc.rust-lang.org/std/cell/struct.RefCell.html) defines the methods, and the [Rust Book](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html) explains the trade.

## The borrowing rule still applies

Rust allows several readers of a value at once, or one writer with exclusive access. Readers and a writer cannot hold access to that value at the same time. Ordinary references are checked by the compiler. Access through a `RefCell<T>` is checked at runtime. The same rule applies in both cases. Runtime checking permits code whose valid access pattern the compiler cannot prove ahead of time. Each borrow still has to obey the rule when it occurs. [The Rust Book](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html) identifies that situation as a reason to use `RefCell<T>`.

A cell owns its contained value. Calling its borrowing methods produces guards that represent active access. A later request is checked against those guards. The [`RefCell` method documentation](https://doc.rust-lang.org/std/cell/struct.RefCell.html) states which requests can coexist and which cause a panic.

## A shared method can change its own state

A type may have a method that receives `&self` and needs to update one internal field. The [Rust Book's mock messenger example](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html) uses a `RefCell` to record messages through such an interface. Here is a smaller illustration:

```rust
use std::cell::RefCell;

struct Recorder {
    entries: RefCell<Vec<String>>,
}

impl Recorder {
    fn record(&self, entry: &str) {
        self.entries.borrow_mut().push(entry.to_owned());
    }
}
```

`record` has a shared reference to `Recorder`. It requests mutable access to `entries`, adds a value, and releases the temporary guard at the end of the statement. Callers do not need a mutable reference to the whole `Recorder`. The cell still checks that no conflicting borrow is active. The [standard library](https://doc.rust-lang.org/std/cell/struct.RefCell.html) documents `borrow_mut` as a mutable borrow requested through `&self`.

## Guards define how long access lasts

`borrow()` returns `Ref<T>`, a guard for shared access. `borrow_mut()` returns `RefMut<T>`, a guard for exclusive access. These guards let code use the contained value much like a reference. Several shared guards may coexist. While an exclusive guard is active, another borrow of the cell cannot begin. The [Rust Book](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html) explains how the cell tracks active guards, and the [method documentation](https://doc.rust-lang.org/std/cell/struct.RefCell.html) describes how long each borrow lasts.

A guard stored in a local variable can remain active across later statements. A small scope makes its lifetime clear. Calling `drop` on the guard ends its borrow before the surrounding scope ends. When a borrow panics, inspect earlier guards as well as the line that failed. The conflicting access may have begun several statements before it.

## A conflicting borrow has a visible failure

If a shared guard is active, `borrow_mut()` panics. If an exclusive guard is active, `borrow()` and `borrow_mut()` panic. Compilation alone cannot establish that every future sequence of calls will avoid those conflicts. These outcomes follow the [standard library's method contracts](https://doc.rust-lang.org/std/cell/struct.RefCell.html).

Use a fallible method when the caller needs to handle a conflict:

```rust
use std::cell::RefCell;

let cell = RefCell::new(String::from("draft"));
let reading = cell.borrow();
assert!(cell.try_borrow_mut().is_err());
drop(reading);
cell.borrow_mut().push_str(" revised");
```

The first mutable request returns an error because `reading` still holds shared access. After `drop(reading)`, the mutable request can succeed. `try_borrow()` similarly returns an error while an exclusive guard is active. Both methods return a `Result`, allowing the caller to decide how to handle a conflict. Their behavior appears beside the panicking methods in the [standard library documentation](https://doc.rust-lang.org/std/cell/struct.RefCell.html).

## Use the runtime check deliberately

`RefCell<T>` suits a specific need for mutation through shared access, such as the [Rust Book's test double](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html). It is intended for single-threaded use. The book also notes the cost of tracking borrows during execution and the chance of discovering a conflict only when the affected path runs. Keep that trade visible when choosing where to place a cell.

When code already has `&mut RefCell<T>`, [`get_mut`](https://doc.rust-lang.org/std/cell/struct.RefCell.html) returns `&mut T` without a dynamic borrow check. The mutable reference to the cell already establishes exclusive access. Use the access the surrounding code has before adding runtime checks.

## What to do

Start with ordinary borrowing when the mutation path is clear. If an interface must expose `&self` while one field changes, consider a `RefCell` around that field. Keep each guard in the smallest scope needed for the operation. Choose `try_borrow` or `try_borrow_mut` when a conflict needs an explicit response. If a borrow panics, find the earlier guard, then shorten its lifetime or change the order of access. Check the [standard library documentation](https://doc.rust-lang.org/std/cell/struct.RefCell.html) for the precise behavior of each method.
