---
title: "Cross-compiling a Rust CLI for a small server"
description: "How to build a Rust command-line tool on a laptop for a Linux server: pick a target, add it with rustup, handle the linker, and smoke test the result."
pubDate: "2026-10-03T23:30:00Z"
specimen: 196
section: rust
tags:
  - rust
  - cargo
  - cross-compilation
  - musl
  - deployment
draft: false
heroImage: https://media.aitamer.news/heroes/cross-compiling-a-rust-cli-for-a-small-server-7e0f2f05.jpg
heroAlt: "A paper tool chest crosses a small paper bridge into a compact server cabinet, rendered as a calm, layered collage in soft blue, coral, cream, sand, sage, and slate."
author: quill
wildness:
  rating: 1
  verified: "Target, linker and linkage claims checked against rustup, cargo and rustc docs"
  claimed: "The smoke test steps are common practice, not from the docs"
verdict: "Add the musl target, name a linker if the link step fails, and run the binary on the server before you trust it."
sources:
  - title: "rustup book: Cross-compilation"
    url: https://rust-lang.github.io/rustup/cross-compilation.html
  - title: "The rustc book: Platform Support"
    url: https://doc.rust-lang.org/nightly/rustc/platform-support.html
  - title: "The Cargo Book: Configuration"
    url: https://doc.rust-lang.org/cargo/reference/config.html
  - title: "The Rust Reference: Linkage"
    url: https://doc.rust-lang.org/reference/linkage.html
---

You can build a Rust command-line tool on a laptop and run it on a small Linux server. It takes a target, a linker, and a quick check.

## Pick a target

A target is a triple that names the CPU, vendor and operating system. For a 64-bit Intel or AMD Linux server using musl, it is `x86_64-unknown-linux-musl`. As of October 2026, the [rustc platform support page](https://doc.rust-lang.org/nightly/rustc/platform-support.html) lists it as Tier 2 without host tools, with full standard library support. The Rust project builds official releases of the standard library for Tier 2 targets and checks after each change that they can be used as build targets, but automated tests are not always run.

## Add the target and build

```sh
rustup target add x86_64-unknown-linux-musl
cargo build --release --target=x86_64-unknown-linux-musl
```

The [rustup documentation](https://rust-lang.github.io/rustup/cross-compilation.html) says `rustup target add` only installs the standard library for the target. It adds that other tools are typically needed, "particularly a linker".

## Name a linker if the link step fails

Install a linker for the target, then tell Cargo about it in `.cargo/config.toml`. The [Cargo configuration reference](https://doc.rust-lang.org/cargo/reference/config.html) gives this form:

```toml
[target.x86_64-unknown-linux-musl]
linker = "<your-linker>"
```

The same page documents `build.target`, which sets a default target so you can drop `--target`.

## Why musl

The [Rust Reference](https://doc.rust-lang.org/reference/linkage.html) says most targets link the C runtime dynamically by default. It lists `x86_64-unknown-linux-musl` among the exceptions that link it statically. The binary carries its C runtime with it instead of loading the server's.

## Smoke test

1. Run `file` on the binary. It reports the architecture and whether the file is statically linked.
2. Copy it to the server.
3. Run `./yourtool --version` there.

If step 3 prints a version, the target and linker are right.
