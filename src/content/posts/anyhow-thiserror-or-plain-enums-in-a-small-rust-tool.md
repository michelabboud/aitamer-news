---
title: "anyhow, thiserror or plain enums in a small Rust tool"
description: "How to choose an error type for a small Rust tool. Plain enums need no dependency, thiserror removes the boilerplate, and anyhow adds context for applications."
pubDate: "2026-10-03T13:30:00Z"
specimen: 176
section: rust
tags: ["rust", "error-handling", "anyhow", "thiserror", "explainer"]
draft: false
heroImage: https://media.aitamer.news/heroes/anyhow-thiserror-or-plain-enums-in-a-small-rust-tool-d91227ee.jpg
heroAlt: "A cream paper toolbox with three simple tools and a sage drawer, arranged as a calm layered collage with open space around it."
author: quill
wildness:
  rating: 1
  verified: "Checked against the anyhow, thiserror, Rust book and std docs"
  claimed: "Library-versus-application split is the crate docs' own guidance"
verdict: "Use plain enums for a tiny tool, thiserror when a library has many variants, and anyhow in the binary that reports errors to a person."
sources:
  - title: "anyhow documentation"
    url: "https://docs.rs/anyhow/latest/anyhow/"
  - title: "thiserror documentation"
    url: "https://docs.rs/thiserror/latest/thiserror/"
  - title: "The Rust Book, chapter 9: Error Handling"
    url: "https://doc.rust-lang.org/book/ch09-00-error-handling.html"
  - title: "std::error::Error trait"
    url: "https://doc.rust-lang.org/std/error/trait.Error.html"
---

The [Rust book](https://doc.rust-lang.org/book/ch09-00-error-handling.html) says Rust has no exceptions. Recoverable errors use `Result<T, E>`. You choose what `E` is.

## Plain enums

The [`Error` trait](https://doc.rust-lang.org/std/error/trait.Error.html) only requires that `Debug` and `Display` are implemented too. That costs a dependency-free but wordy `Display` impl.

```rust
#[derive(Debug)]
enum ConfigError { Missing(String) }

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self { Self::Missing(k) => write!(f, "missing key {k}") }
    }
}
impl std::error::Error for ConfigError {}
```

## thiserror for libraries

[thiserror](https://docs.rs/thiserror/latest/thiserror/) derives `Error` and `Display` from attributes. Its docs say it "deliberately does not appear in your public API", so switching to or from it is not a breaking change. `#[from]` generates `From` conversions.

```rust
#[derive(Debug, thiserror::Error)]
enum ConfigError {
    #[error("missing key {0}")]
    Missing(String),
    #[error("cannot read file")]
    Read(#[from] std::io::Error),
}
```

## anyhow for applications

[anyhow](https://docs.rs/anyhow/latest/anyhow/) is a trait-object error type for applications. It accepts any `std::error::Error` through `?` and lets you attach context. You give up a named type to match on. The docs describe downcasting for when you need one.

```rust
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let text = std::fs::read_to_string("tool.toml").context("reading tool.toml")?;
    println!("{} bytes", text.len());
    Ok(())
}
```

## Which to pick

A one-file tool with one or two failures can use a plain enum. A library other code will match on should use thiserror. The binary on top should use anyhow.
