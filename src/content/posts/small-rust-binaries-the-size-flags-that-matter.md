---
title: "Small Rust binaries: the size flags that matter"
description: Rust release builds favor speed by default. Five Cargo profile settings can change binary size, while size-inspection and packing tools have separate tradeoffs worth checking.
pubDate: "2026-10-04T20:30:00Z"
specimen: 235
section: rust
tags:
  - rust
  - cargo
  - binary-size
  - release-profile
  - lto
draft: false
heroImage: https://media.aitamer.news/heroes/small-rust-binaries-the-size-flags-that-matter-30b51893.jpg
heroAlt: A coral paper crab carries a compact parcel past a larger backpack and size adjustment tools.
author: quill
wildness:
  rating: 1
  verified: Flag values and defaults read on the Cargo and rustc doc pages
  claimed: UPX 50-70% figure comes from the min-sized-rust guide, not measured
verdict: Measure the release binary first, then change one size setting at a time. Compare opt-level s and z, and use panic abort only after checking the behavior of the release build.
sources:
  - title: "The Cargo Book: Profiles"
    url: https://doc.rust-lang.org/cargo/reference/profiles.html
  - title: "The rustc Book: Codegen options"
    url: https://doc.rust-lang.org/rustc/codegen-options/index.html
  - title: "min-sized-rust: Minimizing Rust Binary Size"
    url: https://github.com/johnthagen/min-sized-rust
---

Rust release builds are tuned for speed. A few lines in `Cargo.toml` shift that toward size. This post covers the settings that matter, what the official docs say about each, and what each one costs.

## Start with a baseline

The [Cargo profiles reference](https://doc.rust-lang.org/cargo/reference/profiles.html) lists the release defaults: `opt-level = 3`, `lto = false`, `panic = 'unwind'`, `strip = "none"` and `codegen-units = 16`. Build once with these and write down the binary size. Keep each size change only if it improves the tradeoff you care about: measured size, runtime speed, build time and diagnostics.

## Strip symbols

`strip = true` is the same as `strip = "symbols"`. The [rustc codegen options](https://doc.rust-lang.org/rustc/codegen-options/index.html) say this removes debuginfo and the rest of the symbol table at link time. The [min-sized-rust guide](https://github.com/johnthagen/min-sized-rust) says symbol information is included by default on Linux and macOS and is not needed to run the binary. The cost is less information when you inspect the binary. The rustc docs also say stripping cannot be relied on as a security or obfuscation measure.

## Optimize for size

Cargo documents `opt-level = "s"` as optimizing for binary size. `"z"` does the same and also turns off loop vectorization. Neither is guaranteed to win. The Cargo reference says the `"s"` and `"z"` levels are not necessarily smaller, and the rustc docs say `z` often produces larger binaries than `s`. Try both and compare.

## Link-time optimization

`lto = true` runs fat LTO, which optimizes across all crates in the dependency graph. The min-sized-rust guide says this can remove dead code and often reduces size. `"thin"` takes substantially less time to run. The cost of either is a longer link step.

## Fewer codegen units

Release builds default to 16 codegen units. The guide says this speeds up compilation but prevents some optimizations. Setting `codegen-units = 1` gives the optimizer the whole crate at once, at the price of slower builds.

## Abort on panic

`panic = "abort"` ends the process on panic instead of unwinding the stack. The guide says this removes unwinding code but changes program behavior. The Cargo reference notes that tests, benchmarks, build scripts and proc macros ignore the setting. The rustc docs add that if any crate in the graph uses `abort`, the final binary must use it too.

## Tools beyond the profile

`cargo-bloat` shows what takes the most space in an executable. The guide also describes UPX, a language-agnostic packing tool that, per the guide, claims to typically reduce binary size by 50-70 percent, though the actual result depends on the executable. It also describes `build-std`, which rebuilds the standard library with your flags.

## What to do

1. Build in release mode and record the binary size.
2. Start with this profile and rebuild:

```toml
[profile.release]
strip = true
opt-level = "z"
lto = true
codegen-units = 1
```

3. Change `opt-level` to `"s"` and compare the two sizes. Keep the smaller one.
4. If you consider `panic = "abort"`, check whether callers or recovery paths rely on unwinding. Add it only after that review, then exercise the built release program’s panic behavior; Cargo’s normal tests ignore this profile setting.
5. If the binary is still large, run `cargo-bloat` to see which functions and crates take the space.
6. Keep a debug-capable build if you need readable backtraces from stripped release binaries.
