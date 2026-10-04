---
title: "`#[repr(C)]` Does Not Make Every C Enum Safe in Rust"
description: A C enum can carry a value with no matching Rust variant. Learn where that becomes undefined behavior and how to check values at the foreign function boundary.
pubDate: "2026-10-07T07:30:00Z"
specimen: 350
section: rust
tags:
  - rust
  - ffi
  - c
  - enums
  - unsafe
draft: false
heroImage: https://media.aitamer.news/heroes/repr-c-does-not-make-every-c-enum-safe-in-rust-608ea1cb.jpg
heroAlt: Values pass from one data layout through a narrow checked boundary into another layout.
author: ari
wildness:
  rating: 3
  verified: C enum objects can carry unnamed values; Rust enums require valid discriminants.
  claimed: A matching enum layout cannot validate every value returned across the boundary.
verdict: Use a Rust enum at the boundary only when the C contract guarantees its values and the ABI matches. Otherwise, receive a documented integer type and validate it before creating a Rust enum.
sources:
  - title: "The Rust Reference: Type layout"
    url: https://doc.rust-lang.org/stable/reference/type-layout.html
  - title: "The Rust Reference: Behavior considered undefined"
    url: https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html
  - title: "Rust standard library: c_int"
    url: https://doc.rust-lang.org/stable/std/ffi/type.c_int.html
  - title: "The Rust Reference: External blocks"
    url: https://doc.rust-lang.org/stable/reference/items/external-blocks.html
---

A foreign function declaration is a promise about the values foreign code will provide. A Rust enum marked `#[repr(C)]` can appear to match a C enum with the same named values. The promise fails if C supplies an integer with no corresponding Rust variant. The [Rust Reference warns about this exact case](https://doc.rust-lang.org/stable/reference/type-layout.html).

## C enum names do not bound the value

Consider a C API with two named status values:

```c
enum Status { READY = 0, BUSY = 1 };
enum Status current_status(void);
```

The names give callers meanings for `0` and `1`. They do not guarantee that every `enum Status` object contains one of those values. A C enum object can hold an unnamed integer value that its representation supports. C APIs also use enums for bitflags, where combinations may have no named enumerator. These differences are stated in the [Reference's section on fieldless `repr(C)` enums](https://doc.rust-lang.org/stable/reference/type-layout.html).

An unnamed value might come from a new library status, a flag combination, or a function whose contract permits other results. The key question for a Rust binding is what the C function **can return**, rather than which names appear in its enum declaration.

## `repr(C)` addresses representation

For a fieldless Rust enum, `#[repr(C)]` gives it the size and alignment of the target platform's default C enum representation. The Reference calls this a best guess because C enum representation is implementation defined and compiler flags can change it. It also notes that types with the same layout can differ in how they cross a function boundary. [Layout and calling convention need separate attention](https://doc.rust-lang.org/stable/reference/type-layout.html).

More importantly, representation does not expand a Rust enum's valid values. A fieldless Rust enum may legally hold only its declared discriminants. Changing the attribute to `#[repr(u32)]` selects an integer representation; it still does not create variants for every `u32` value. The [Reference describes both representation rules](https://doc.rust-lang.org/stable/reference/type-layout.html).

## An invalid return fails before a match

This binding makes the C return value a Rust `Status` immediately:

```rust
#[repr(C)]
enum Status {
    Ready = 0,
    Busy = 1,
}

unsafe extern "C" {
    fn current_status() -> Status;
}
```

Suppose `current_status` returns an unnamed value such as `7`, and that value is representable by the C enum on the target platform. Rust has no `Status` variant for it. The [Rust Reference says producing an invalid value is immediate undefined behavior](https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html). A value is produced when it is returned from a function, and a Rust enum must have a valid discriminant.

That timing matters. A later `match` arm for unexpected values cannot rescue the call: the invalid Rust enum value has already been produced. Nor does the `unsafe` call itself validate the result. `unsafe` places responsibility for upholding the type's requirements on the caller; it does not relax them. These conclusions follow from the [Reference's validity rules](https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html).

## Receive an integer, then classify it

When the C side exposes an actual function returning `int`, declare that function as returning `c_int`. Rust's [`c_int` is the type corresponding to C `int`](https://doc.rust-lang.org/stable/std/ffi/type.c_int.html). Keep the closed Rust enum inside the safe wrapper, after checking the integer:

```rust
use std::ffi::c_int;

#[derive(Debug, PartialEq, Eq)]
enum Status {
    Ready,
    Busy,
}

unsafe extern "C" {
    fn current_status_code() -> c_int;
}

fn status() -> Result<Status, c_int> {
    let raw = unsafe { current_status_code() };
    match raw {
        0 => Ok(Status::Ready),
        1 => Ok(Status::Busy),
        other => Err(other),
    }
}
```

Here every initialized `c_int` result can reach the `match` as an integer. Only recognized values become `Status`. The `Err` retains an unfamiliar value for the caller to handle or report. This follows the Reference's distinction between [initialized integer values and enum values with valid discriminants](https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html).

The declaration must match a real C function. If the library only provides `enum Status current_status(void)`, a C shim compiled against that library can expose `int current_status_code(void)` and convert the result. This example assumes the documented results fit in C `int`; an API with a wider range needs an explicitly chosen compatible type. Simply changing the Rust declaration of the original enum-returning function to `c_int` does not establish ABI compatibility. [External declarations are unchecked imports](https://doc.rust-lang.org/stable/reference/items/external-blocks.html), and the [layout rules caution that matching layouts alone do not settle function ABI compatibility](https://doc.rust-lang.org/stable/reference/type-layout.html).

## What to do

1. Read the C function's value contract, including unnamed values, flags, and future additions. Treat the enum's names as an incomplete list unless the contract guarantees otherwise.
2. Check the target's enum representation and calling convention against the C build. `#[repr(C)]` uses a best guess for C enum layout, especially when compiler flags differ. [The Reference documents that limit](https://doc.rust-lang.org/stable/reference/type-layout.html).
3. Where unknown values are possible, expose an integer-returning C entry point with a documented integer type. Match that exact signature in Rust, then convert known values in one wrapper.
4. Give unknown values an explicit outcome, such as an error carrying the raw integer. Never construct a Rust enum from unchecked foreign bytes or an unchecked integer cast: an enum with an invalid discriminant violates [Rust's value validity rule](https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html).
