---
title: A Compile-Fail Example Can Pass for the Wrong Error
description: Rust doctests can demonstrate forbidden API use, but compile_fail only checks that compilation fails. A misspelled import can make the lesson appear tested.
pubDate: "2026-10-09T02:30:00Z"
section: rust
tags:
  - rust
  - documentation
  - testing
  - api-design
draft: false
heroImage: https://media.aitamer.news/heroes/a-compile-fail-example-can-pass-for-the-wrong-error-d5f6bef9.jpg
heroAlt: A booklet cart is stopped by a buckled paper rail before it reaches a still-locked gate.
author: ari
wildness:
  rating: 1
  verified: compile_fail checks failure; nightly can require an error number.
  claimed: The API example is illustrative; no compiler run is claimed.
verdict: Treat a passing compile_fail doctest as proof of compilation failure only. Pair it with a working example and inspect or assert the intended diagnostic when the restriction matters.
sources:
  - title: "Rustdoc Book: Documentation tests"
    url: https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html
  - title: "Rustdoc Book: Unstable features"
    url: https://doc.rust-lang.org/nightly/rustdoc/unstable-features.html
---

A voice application might expose a `SafeTranscript` type whose private field prevents callers from constructing one before a review step. Its documentation can show the forbidden construction with a Rust `compile_fail` code block. That looks like a test of the safety boundary. It is only a test that the entire example fails to compile.

The [rustdoc documentation test guide](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html) says a `compile_fail` example succeeds when compilation fails and fails when compilation succeeds. It does not require a particular diagnostic. Imagine this documentation beside a public tuple struct with a private field:

```rust
/// ```compile_fail
/// let raw = String::from("unreviewed speech");
/// let item = speech_api::SafeTranscript(raw);
/// ```
pub struct SafeTranscript(String);
```

The intended error is that external callers cannot use the private tuple constructor. If the crate is actually named `voice_api`, however, the unresolved `speech_api` path also makes the doctest pass. A reader sees an example apparently proving the constructor is restricted, while the test never reached that constructor. A missing import, misspelled method, or syntax error can create the same false confidence.

Rustdoc also transforms examples before compilation: it may inject a crate import, add common lint allowances, and wrap code without `main` in a function. Lines prefixed with `#` can provide hidden setup that still compiles. Those conveniences make short examples useful, but they make it especially important to inspect the diagnostic when a negative example first lands or after an API rename.

One practical pattern is to place a normal compiling example nearby that imports the same public type and shows the permitted review path. That catches a broken path in the positive example, though it cannot prove the negative example failed for the intended reason. For a restriction whose exact failure matters, add a separate compiler-facing test that checks the expected diagnostic. Rustdoc's [nightly-only error-number annotation](https://doc.rust-lang.org/nightly/rustdoc/unstable-features.html) can check that a specified error code appears, but the same fence is treated as plain text on stable, and the annotation does not assert that no other errors occurred.

Use `compile_fail` to teach the boundary and catch accidental acceptance. Check the compiler output, plus a working public-API example, before treating the doctest as evidence of why the boundary holds.
