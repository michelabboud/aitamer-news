---
title: Catch undefined behavior in unsafe Rust with Miri
description: Run cargo miri test on a crate with unsafe code to catch out-of-bounds reads, use-after-free and aliasing violations that pass ordinary tests.
pubDate: "2026-10-14T09:30:00Z"
specimen: 771
section: rust
tags:
  - rust
  - miri
  - unsafe
  - undefined-behavior
  - testing
draft: false
heroImage: https://media.aitamer.news/heroes/miri-unsafe-rust-undefined-behavior-ba0c3bfa.jpg
heroAlt: A blue paper magnifying glass highlights a rust-colored block outside a navy tray of cream blocks.
author: quill
wildness:
  rating: 1
  verified: Install, run, flags and limits match the Miri README; the example's three UB cases are real.
  claimed: Aliasing checks under Stacked and Tree Borrows are experimental, per the README itself.
verdict: Essential for any crate with unsafe code. It catches real bugs ordinary tests miss, needs nightly and skips FFI and networking, and a clean run covers only the paths your tests reach.
sources:
  - title: Miri repository and README
    url: https://github.com/rust-lang/miri
---

Unsafe Rust can be wrong and still pass its tests. A read one element past the end of a buffer often returns whatever bytes sit there, and the test moves on. [Miri](https://github.com/rust-lang/miri) is the Rust project's tool for this class of bug. Its README describes it as "an Undefined Behavior detection tool for Rust". It interprets your program and checks operations as they run, using its own approximation of what counts as undefined behavior in Rust.

## The bugs ordinary tests miss

Here are three tests over small pieces of unsafe code. Each one contains undefined behavior. Undefined behavior has no obligation to crash, so all three can pass under `cargo test`.

```rust
pub fn read_at(v: &[u32], i: usize) -> u32 {
    // SAFETY: caller must keep i < v.len()
    unsafe { *v.as_ptr().add(i) }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_past_end() {
        let v = vec![1, 2, 3];
        let _ = read_at(&v, 3);
    }

    #[test]
    fn use_after_free() {
        let p = {
            let b = Box::new(7u32);
            &*b as *const u32
        };
        let _ = unsafe { *p };
    }

    #[test]
    fn invalid_aliasing() {
        let mut x = 5i32;
        let raw = &mut x as *mut i32;
        let r = &mut x;
        unsafe { *raw = 6 };
        *r += 1;
    }
}
```

The first reads past the end of a 3-element vector. The second reads through a pointer after the `Box` it points into was dropped. The third writes through a raw pointer after a new `&mut` borrow of the same value was created, which breaks Rust's aliasing rules.

## Install Miri and run the tests

Miri runs on the nightly toolchain. The README gives the install command:

```sh
rustup +nightly component add miri
```

Then run your test suite through it:

```sh
cargo +nightly miri test
```

The README notes that its commands assume nightly is pinned with `rustup override set nightly`, and that `cargo +nightly` works as an alternative. The first run does extra setup and asks for confirmation before installing what it needs. For a binary crate, `cargo miri run` runs the program instead.

An ordinary run stops at the first undefined-behavior error, so it does not report all three failures. Run each test separately to inspect each bug:

```sh
cargo +nightly miri test -- tests::reads_past_end --exact
cargo +nightly miri test -- tests::use_after_free --exact
cargo +nightly miri test -- tests::invalid_aliasing --exact
```

With Miri 0.1.0 from Rust nightly commit `6368fd52c` (2026-05-29), each separately filtered test above produced an `error: Undefined Behavior:` report pointing at the faulty operation. The out-of-bounds read was reported as a memory access at or beyond the end of the allocation. The use-after-free was reported as an access through a dangling pointer to a freed allocation. Diagnostic wording can change with the toolchain.

## What Miri checks

The README lists what Miri detects, including:

- out-of-bounds memory accesses and use-after-free
- invalid use of uninitialized data
- insufficiently aligned memory accesses and references
- violations of basic type invariants, such as a `bool` that is neither 0 nor 1, or an invalid enum discriminant
- data races, with emulation of some weak memory effects
- memory leaks, when memory is still allocated at program end and is not reachable from a global `static`
- experimental checks for aliasing violations under the Stacked Borrows and Tree Borrows models

## The aliasing checks are experimental

The third test above fails under Stacked Borrows, the aliasing model Miri uses by default. The README labels these checks experimental, and Miri's own message for this kind of error says the rules it violated "are still experimental". The README also offers Tree Borrows, an alternative model it calls "even more experimental", selected through `MIRIFLAGS`:

```sh
MIRIFLAGS="-Zmiri-tree-borrows" cargo +nightly miri test
```

If your code fails under one model, treat it as a strong signal to rework the pointer handling. Where the models disagree, the README does not tell you which one is right.

## Skip what Miri cannot run

The README says a program under Miri "has no access to most platform-specific APIs or FFI", and that "Miri currently does not support networking". Socket-based networking remains unsupported. Most FFI is unsupported too, although the experimental `-Zmiri-native-lib` flag permits some native-library calls on Unix. That mode has strict limitations and cannot fully check what the native code does. Miri sets `cfg(miri)` for interpreted code, so you can skip those tests:

```rust
#[test]
#[cfg_attr(miri, ignore)]
fn talks_to_the_network() { /* ... */ }
```

Keep the unsafe logic in functions that can be tested without I/O, so the important tests still run under Miri.

## Isolation, other targets and seeds

By default, Miri isolates the program from the host to keep execution deterministic. The README says to set `MIRIFLAGS="-Zmiri-disable-isolation"` when a test needs access to the real system APIs.

Miri can also interpret code for a target you do not own. The README's example runs the suite on a big-endian target:

```sh
cargo +nightly miri test --target s390x-unknown-linux-gnu
```

Because Miri tests one execution at a time, `-Zmiri-many-seeds` runs the program several times with different seeds for Miri's random number generator. The README warns that the default of 64 seeds "can be quite slow".

Running Miri through cargo-nextest (`cargo miri nextest run`) is supported. The README warns that nextest makes Miri recompile the test crate for each test, so a crate with N tests compiles N+1 times, which can cancel out the gain from running in parallel.

## What a clean run does not prove

The README is explicit about the limits. Miri "does not catch every violation of the Rust specification". It "tests one of many possible executions of your program", so it can miss bugs that only appear in another execution. It "fundamentally cannot ensure that your code is" sound. A clean Miri run means the executions your tests drove contained no undefined behavior that Miri knows how to detect. Write tests that hit the edges of your unsafe code, such as empty buffers, the last index and aliasing patterns, because Miri only checks the paths your tests reach.

A practical setup is a separate CI job on nightly that runs `cargo miri test` on the crates that contain `unsafe`, with I/O-heavy tests skipped through `cfg(miri)`.
