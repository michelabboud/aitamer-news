---
title: "Rust 1.99: C variadics, Vec::into_parts, and a Cargo debug profile"
description: "Rust 1.99.0 shipped on 1 October 2026 with stabilized C variadics, standard-library allocation conveniences, a new Cargo debug profile, and upgrade notes worth a scan."
pubDate: "2026-10-03T02:30:00Z"
specimen: 173
section: rust
tags: [rust, releases, cargo, std]
draft: false
heroImage: https://media.aitamer.news/heroes/rust-1-99-review-2dbe4b98.jpg
heroAlt: "A layered paper-cut toolbox with four neatly arranged tools and a small upgrade path, in a calm blue, coral, cream, and sage palette."
author: mai
wildness:
  rating: 2
  verified: "Every feature and note traces to the official 1.99.0 release notes, which I read directly."
  claimed: "The framing of which changes matter most for real projects, which is my editorial judgment."
verdict: "A quiet, useful release: C variadics and allocation conveniences land, Cargo seeds a debug profile, and the upgrade notes are mostly deprecations worth a scan."
sources:
  - title: "Rust release notes, RELEASES.md, section 1.99.0"
    url: "https://github.com/rust-lang/rust/blob/master/RELEASES.md"
  - title: "Cargo 1.99 changelog"
    url: "https://doc.rust-lang.org/nightly/cargo/CHANGELOG.html#cargo-199-2026-10-01"
---

Rust 1.99.0 shipped on 1 October 2026 with stabilized C variadics, a set of allocation conveniences in the standard library, a new Cargo profile, and a handful of compatibility notes worth a scan before you bump your toolchain. This review covers the language, the standard library, Cargo, and the upgrade notes, based on the official release notes in `RELEASES.md`.

## Language

The headline change is the stabilization of C-variadic function definitions. Rust can now declare functions that take a C-style variadic argument list, and `#[unsafe(naked)]` functions can define them too. This helps FFI code that wraps C libraries which accept variable arguments.

Outlined modules (`mod foo;`) are now allowed anywhere in the body of a custom attribute or derive macro, which removes a real limitation for proc-macro and derive authors.

A new allow-by-default lint, `raw_borrows_via_references`, flags references that decay immediately into raw borrows. It is off by default, so it will not break your build.

Rust now guarantees that the contents of an `UnsafeCell` can be accessed without going through `get`, and the `invalid_reference_casting` lint was adjusted to match.

## Standard library

The most useful additions are allocation-adjacent. `Vec::into_parts` and `Vec::from_parts` decompose and rebuild a `Vec` from its raw pointer, length, and capacity. `Box::into_non_null` and `Box::from_non_null` do the same for boxes. `String::from_utf8_lossy_owned` returns an owned `String` from a lossy UTF-8 conversion.

`IntoIterator` is now implemented for `Box<[T; N]>` and its references. `VecDeque::retain_back` fills a gap in the deque API. `std::fs::set_times` and `std::fs::set_times_nofollow` let you set file timestamps.

## Cargo

Cargo gains a new built-in `debug` profile. It is currently identical to `dev`; the point is to prepare for a future where `dev` is reworked for faster iteration and `debug` becomes the place for actual debugging.

On edition 2024 and later, a workspace member can override an inherited dependency's `default-features`. So `serde = { workspace = true, default-features = false }` now actually turns off default features even when the workspace root enables them. On earlier editions the override is ignored with a warning.

## Performance and platforms

rustdoc's trait-impl filtering got smarter, with performance improvements of about 20 percent on average and up to 40 percent on some real-world crates. Documentation builds should get a little faster.

The `riscv64-unknown-linux-musl` target is promoted to Tier 2 with host tools.

`RangeInclusive` (`a..=b`) iteration is now optimized better in some circumstances. A side effect: the behavior of a `RangeInclusive` that has already been exhausted as an iterator changed. The `start()` and `end()` methods on such a range may return different values, and using such a range as a slice index may behave differently. These behaviors were never guaranteed stable, so the change is not treated as breaking.

## What to check before upgrading

The legacy integral modules are now fully deprecated. `std::i32::MAX` should be `i32::MAX`.

`no_mangle_generic_items` is now a hard error.

`Pin::new_unchecked` had its safety invariants changed slightly, so unsafe code that calls it deserves a re-read.

In Cargo, incremental compilation is now disabled by default when running in CI, which is detected via the `CI` environment variable.

The Rust Reference no longer recommends matching a union alongside another value in a single pattern, the pattern used in a manually-written tagged union. The compiler can read the union contents before checking the rest of the pattern, which can cause undefined behavior. This is guidance in the Reference, not a compiler change.

Internally, the compiler moved to LLVM 23. It is not visible in your code, but it can surface as a subtle codegen difference, so keep it in mind if a benchmark moves after upgrading.
